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
import whisper

def ensure_environment():
    # Ensure there's a working directory.
    os.makedirs(WORKING_DIR, exist_ok=True)


def get_vid_list():
    """Gets a list of cloud storage paths with the audio to transcribe
    
    Returns: [ 'gs://sps-by-the-numbers.appspot.com/transcription/seattle-city-council/z/zzjAhUGVrf8.mp4', ... ]
    """
    #I'm hardcoding local files for testing
    """if args.files:
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
    """
    return ['audio.wav']

def process_vids(vid_list):
    for vid in vid_list:
        #logging.info("Clearing working dir at %s", WORKING_DIR);
        #subprocess.run(["rm", "-rf", os.path.join(WORKING_DIR, '*')])
        #os.chdir(WORKING_DIR)

        # Get the video
        #subprocess.run(["gcloud", "storage", "cp", vid, '.'])

        # Extract all the path names.
        vid_path = os.path.basename(vid)
        gs_path = os.path.dirname(vid)

        #name = os.path.splitext(vid_path)[0]

        # Do the transcription
        start = time.time()
        #I'm using the python library for now instead of command line
        """result = subprocess.run([
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
        """
        model = whisper.load_model("tiny.en")
        result = model.transcribe(vid)
        print(result["text"])
        
        end = time.time()
        logging.info("Whisper took: %d seconds" % (end - start))

if __name__ == "__main__":
    
    logging.getLogger().setLevel(logging.DEBUG)

    #I don't need to do this if I'm not saving the file
    #ensure_environment()
    vid_list = get_vid_list()
    #I don't need this for only one file
    #random.shuffle(vid_list)  # poorman race reduction between workers.
    process_vids(vid_list)
