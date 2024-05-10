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

WORKING_DIR='/usr/src/transcribe'
args = {}

def ensure_environment():
    # Ensure there's a working directory.
    os.makedirs(WORKING_DIR, exist_ok=True)
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    else:
        logging.getLogger().setLevel(logging.INFO)


def get_vid_list():
    #I'm hardcoding local files for testing
    return ['/usr/src/audio.wav']

def process_vids(vid_list):
    for vid in vid_list:
        logging.info("Clearing working dir at %s", WORKING_DIR);
        subprocess.run(["rm", "-rf", os.path.join(WORKING_DIR, '*')])
        os.chdir(WORKING_DIR)

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
            "tiny.en",
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
        
        #I don't need to toush gcloud in this script for now, so I'll just print the output
        """
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
        """

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
            prog='WhisperX transcription worker.',
            description='Downloads audio from google cloud bucket tree and runs WhisperX on it')
    parser.add_argument('-t', '--threads', dest='threads', metavar="NUM_THREADS", type=int,
                        help='number of threads to run',
                        required=True)
    parser.add_argument('-d', '--debug', dest='debug', help='Enable debug logging', action=argparse.BooleanOptionalAction)

    args = parser.parse_args()
    ensure_environment()
    vid_list = get_vid_list()
    #random.shuffle(vid_list)  # poorman race reduction between workers.
    process_vids(vid_list)
