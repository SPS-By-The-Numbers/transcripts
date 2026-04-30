#!python

import argparse
import datetime
import json
import os
import pathlib
import random
import requests
import subprocess
import logging
import time
import yt_dlp


logger = logging.getLogger(__name__)

AUTH_PARAMS = {
    'user_id': os.environ['CONTAINER_ID'],
    'auth_code': os.environ['API_PASSWORD'],
}


def download_audio(vid_id):
    """
    Downloads a video using yt-dlp with specific options.
    """
    info_dict = {}
    filename = ""

    def progress_hook(d):
        nonlocal info_dict
        nonlocal filename
        if d['status'] == 'finished':
            filename = d['filename']
            info_dict = d['info_dict']

    ydl_opts = {
        'format': 'bestaudio',
        'outtmpl': '/workspace/tmp/%(id)s.%(ext)s',  # Output filename template
        'progress_hooks': [progress_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([vid_id])
    logger.info(f"Downloaded to {filename}")
    return (filename, info_dict)


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


def get_publish_date(vid_info):
    upload_date = vid_info.get('upload_date', '')
    if upload_date:
        return datetime.datetime.strptime(upload_date, "%Y%m%d").isoformat()
    return datetime.now().isoformat()


def process_vids(vid_list, args):
    transcription_error_count = 0

    for category, video_id in vid_list:
        try:
            if transcription_error_count > 3:
                # Something is wedged. Stop here before burning more cpu.
                logger.error("Too many errors in transcription. Bailing.")
                break

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

            whisper_out_filename = args.workdir.joinpath(f"{video_id}.json")

            logger.info(f"Leased {category} {video_id}. Downloading audio")

            # Download the audio file.
            (audio_filename, vid_info) = download_audio(video_id)

            # Run whisper for transcription
            if not (args.cache and os.path.exists(whisper_out_filename)):
                start = time.time()
                logger.info(f"Starting Whisper at {start} on {audio_filename} "
                            f"writing to {args.workdir}")
                subprocess.run([
                    "whisperx",
                    f"--model={args.model}",
                    f"--compute_type={args.compute_type}",
                    "--language=en",
                    "--initial_prompt='Avoid using all capitals'",
                    f"--thread={args.threads}",
                    f"--hf_token={args.hf_token}",
                    "--diarize",
                    "--output_format=json",
                    f"--output_dir={str(args.workdir)}",
                    "--",
                    audio_filename])
                end = time.time()
                logger.info("Whisper took: %d seconds" % (end - start))

            # Upload json transcript.
            with open(args.workdir.joinpath(f"{video_id}.json")) as f:
                transcript_obj = json.load(f)

            logger.info("Uploading transcript")
            logger.debug({
                **AUTH_PARAMS,
                'category': category,
                'transcripts': {transcript_obj["language"]:
                                transcript_obj},
                'video_id': video_id,
                'metadata': {
                    'title': vid_info.get('title', 'missing title'),
                    'video_id': video_id,
                    'description': vid_info.get('description', ''),
                    'channel_id': vid_info.get('channel_id', ''),
                    'publish_date': get_publish_date(vid_info),
                }
            })
            response = requests.put(
                make_endpoint_url("transcript"),
                json={
                    **AUTH_PARAMS,
                    'category': category,
                    'transcripts': {transcript_obj["language"]:
                                    transcript_obj},
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
            transcription_error_count += 1
            logger.exception("Transcribe failed for " + video_id)
            jitter_s = random.randint(2, 10)
            logger.info(f"Jittering by {jitter_s} seconds")
            time.sleep(jitter_s)


def process_category(category, videos, args):
    logger.info(f"Found {len(videos)} videos")
    logger.debug(videos)

    vids_to_process = [(category, v) for v in videos]
    if args.shuffle:
        random.shuffle(vids_to_process)
    process_vids(vids_to_process, args)


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
                        help='The compute type to use', default="float32")
    parser.add_argument('-s', '--shuffle', dest='shuffle',
                        help='Shuffle video list as poorman race reduction',
                        action=argparse.BooleanOptionalAction)
    parser.add_argument('-c', '--cache', dest='cache',
                        help='Do not redownload files if they are there',
                        action=argparse.BooleanOptionalAction)

    args = parser.parse_args()
    init_app(args)

    vid_list = get_vid_list()

    # Do SPS First
    process_category('sps-board', vid_list['sps-board'], args)
    for (category, vids) in vid_list.items():
        if category == 'sps-board':
            continue
        process_category(category, vids, args)


if __name__ == "__main__":
    main()
