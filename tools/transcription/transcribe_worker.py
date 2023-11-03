#!python

import argparse
import glob
import json
import os
import random
import re
import subprocess
import logging
import sys
import datetime
import time
 
WORKING_DIR='/workspace/transcribe'

def ensure_environment():
    # Ensure there's a working directory.
    os.makedirs(WORKING_DIR, exist_ok=True)

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    else:
        logging.getLogger().setLevel(logging.INFO)

def get_vid_list():
    """Gets a list of cloud storage paths with the audio to transcribe

    Returns: [ 'gs://sps-by-the-numbers.appspot.com/transcription/seattle-city-council/z/zzjAhUGVrf8.mp4', ... ]
    """
    if args.files:
        with open(args.files, "r") as f:
            return json.load(f)
    else:
        new_downloads = subprocess.run(
                ["gcloud", "storage", "ls", ("%s/**/*.mp4.new_download" % args.bucket)],
                capture_output = True,
                text = True)
        if new_downloads.stderr:
            logging.error(new_download.stderr)
        return [ re.sub(r'.new_download', '', x) for x in new_downloads.stdout.split('\n') ]

def process_vids(vid_list):
    for vid in vid_list:
        logging.info("Clearing working dir at %s", WORKING_DIR);
        subprocess.run(["rm", "-rf", os.path.join(WORKING_DIR, '*')])
        os.chdir(WORKING_DIR)

        # Get the video
        subprocess.run(["gcloud", "storage", "cp", vid, '.'])

        # Extract all the path names.
        vid_path = os.path.basename(vid)
        gs_path = os.path.dirname(vid)

        name = os.path.splitext(vid_path)[0]

        # Do the transcription
        start = time.time()
        result = subprocess.run([
            "conda",
            "run",
            "--name",
            "whisperx",
            "whisperx",
            "--model",
            "large-v2",
            "--language=en",
            "--thread=%d" % args.threads,
            "--hf_token",
            "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",
            "--diarize",
            "--output_dir",
            WORKING_DIR,
            "--",
            vid_path])
        end = time.time()
        logging.info("Whisper took: %d seconds" % (end - start))

        if result.returncode == 0:
            logging.info("Uploading results")
            result = subprocess.run([
                "gcloud",
                "storage",
                "cp",
                "%s.json" % name,
                "%s.srt" % name,
                "%s.tsv" % name,
                "%s.txt" % name,
                "%s.vtt" % name,
                gs_path])

        if result.returncode == 0:
            logging.info("Marking as processed")
            subprocess.run([
                "gcloud",
                "storage",
                "rm",
                "%s.new_download" % vid])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
            prog='WhisperX transcription worker.',
            description='Downloads audio from google cloud bucket tree and runs WhisperX on it')
    parser.add_argument('-b', '--bucket', dest='bucket', metavar='BUCKET',
                        help='URL of the cloud storage BUCKET path to use. Should be of the form gs://something/local/dir', required=True)
    parser.add_argument('-f', '--files', dest='files', metavar='FILES',
                        help='JSON file with array of cloud storage URLs to process. If omitted, script will search the bucket any [file].mp4 that also has a [file].new_download next to it and process those. This can be a race with multiple workers, but since transcription is idempotent, it is safe.')
    parser.add_argument('-k', '--keyfile', dest='keyfile', metavar="KEYFILE",
                        help='path to the gcloud service account credential json',
                        required=True)
    parser.add_argument('-t', '--threads', dest='threads', metavar="NUM_THREADS", type=int,
                        help='number of threads to run',
                        required=True)
    parser.add_argument('-d', '--debug', dest='debug', help='Enable debug logging', action=argparse.BooleanOptionalAction)

    args = parser.parse_args()
    ensure_environment()
    vid_list = get_vid_list()
    random.shuffle(vid_list)  # poorman race reduction between workers.
    process_vids(vid_list)
