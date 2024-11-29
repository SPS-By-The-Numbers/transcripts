#!python

from pytubefix import YouTube

import argparse
import json
import os
import pathlib
import random
import requests
import subprocess
import logging
import time

logger = logging.getLogger(__name__)

WORKING_DIR = '/tmp/workspace/app/transcribe'
AUTH_PARAMS = {
    'user_id': os.environ['CONTAINER_ID'],
    'auth_code': os.environ['API_PASSWORD'],
}


def make_endpoint_url(endpoint):
    api_url = os.environ['API_BASE_URL']
    return f"https://{endpoint}-{api_url}"


def init_app(args):
    # Ensure there's a working directory.
    args.workdir.mkdir(parents=True, exist_ok=True)

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    else:
        logging.getLogger().setLevel(logging.INFO)


def get_vid_list():
    response = requests.get(make_endpoint_url("video-queue"),
                            params=AUTH_PARAMS)

    if response.status_code != 200:
        raise Exception(response.text)
    return response.json()['data']


def process_vids(vid_list, args):
    for category, video_id in vid_list:
        try:
            logger.info(f"Processing {category} {video_id}")

            # Mark us as starting work on this video. Failure okay as
            # transcription is semantically idempotent and this is just an
            # advisory lease.
            response = requests.patch(
                make_endpoint_url("video-queue"),
                json={**AUTH_PARAMS, 'category': category,
                      'video_ids': [video_id]})

            if response.status_code != 200:
                logger.error(f"{response.status_code} {response.text}: "
                             "Server did not allow start. Someone else might "
                             "have gotten to it first. Skip.")
                continue

            logger.info(f"Leased {category} {video_id}. Downloading audio")

            # Download the audio file.
            outfile_name = f"{video_id}.mp4"
            video = YouTube.from_id(video_id)
            audio_streams = video.streams.filter(
                only_audio=True).order_by('abr')
            audio_streams.first().download(
                output_path=str(args.workdir),
                filename=outfile_name,
                max_retries=5,
                skip_existing=args.cache)

            # Run whisper for transcription
            start = time.time()
            logger.info(f"Starting Whisper at {start} on {outfile_name} "
                        f"writing to {args.workdir}")
            subprocess.run([
                "whisperx",
                f"--model={args.model}",
                f"--compute_type={args.compute_type}",
                "--language=en",
                f"--thread={args.threads}",
                f"--hf_token={args.hf_token}",
                "--diarize",
                "--output_format=json",
                f"--output_dir={str(args.workdir)}",
                "--",
                str(args.workdir.joinpath(outfile_name))])
            end = time.time()
            logger.info("Whisper took: %d seconds" % (end - start))

            # Upload json transcript.
            metadata = {
                'title': video.title,
                'video_id': video.video_id,
                'channel_id': video.channel_id,
                'description': video.description,
                'publish_date': video.publish_date.isoformat(),
            }

            with open(args.workdir.joinpath(f"{video_id}.json")) as f:
                transcript_obj = json.load(f)

            logger.info("Uploading transcript")
            response = requests.put(
                make_endpoint_url("transcript"),
                json={
                    **AUTH_PARAMS,
                    'category': category,
                    'transcripts': {transcript_obj["language"]:
                                    transcript_obj},
                    'metadata': metadata,
                    'video_id': video_id
                })

            if response.status_code != 200:
                logger.error("Unable to upload transcript", response.json())
                continue

            logger.info("Deleting video from queue")
            response = requests.delete(
                make_endpoint_url("video-queue"),
                json={**AUTH_PARAMS, 'category': category,
                      'video_ids': [video_id]})
            if response.status_code != 200:
                logger.error("Unable to delete queue item", response.json())
                continue
        except Exception:
            logger.exception("Transcribe failed for " + video_id)


def main():
    parser = argparse.ArgumentParser(
        prog='WhisperX transcription worker.',
        description=('Downloads audio from google cloud bucket tree and runs '
                     'WhisperX on it'))
    parser.add_argument('-d', '--debug', dest='debug',
                        help='Enable debug logging',
                        action=argparse.BooleanOptionalAction)
    parser.add_argument('-w', '--workdir', dest='workdir', metavar="WORK_DIR",
                        type=pathlib.Path,
                        help='working directory for temp files',
                        required=True)
    parser.add_argument('-t', '--threads', dest='threads',
                        metavar="NUM_THREADS", type=int,
                        help='number of threads to run',
                        required=True)
    parser.add_argument('-x', '--hf_token', dest='hf_token',
                        metavar="HF_TOKEN", type=str,
                        help='Hugging Face token',
                        required=True)
    parser.add_argument('-m', '--model', dest='model', metavar="MODEL",
                        type=str, help='Downloads whisper MODEL',
                        default="large-v3")
    parser.add_argument('--compute_type', dest='compute_type',
                        metavar="COMPUTE_TYPE", type=str,
                        help='The compute type to use', default="float16")
    parser.add_argument('-s', '--shuffle', dest='shuffle',
                        help='Shuffle video list as poorman race reduction',
                        action=argparse.BooleanOptionalAction)
    parser.add_argument('-c', '--cache', dest='cache',
                        help='Do not redownload files if they are there',
                        action=argparse.BooleanOptionalAction)

    args = parser.parse_args()
    init_app(args)
    vid_list = [(category_tuple[0], vid) for category_tuple
                in get_vid_list().items() for vid in category_tuple[1]]

    # Poorman race reduction between workers.
    if args.shuffle:
        random.shuffle(vid_list)
    logger.info(f"Found {len(vid_list)} videos")
    logger.debug(vid_list)

    process_vids(vid_list, args)


if __name__ == "__main__":
    main()
