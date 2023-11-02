#!python

import glob
import json
import os
import subprocess
import sys
import datetime
import time
 
# Opening JSON file
with open(sys.argv[1], "r") as f:
    videos = json.load(f)

WORKING_DIR='/workspace/transcribe'

os.makedirs(WORKING_DIR, exist_ok=True)

for vid in videos:
    utc_time = datetime.datetime.utcnow()
    print(utc_time.strftime("%Y-%m-%d %H:%M:%S"))
    subprocess.run(["rm", "-rf", os.path.join(WORKING_DIR, '*')])
    os.chdir(WORKING_DIR)

    with open('trans_done', "w") as f:
        f.write("trans_done")
    subprocess.run(["gcloud", "storage", "cp", vid, '.'])
    vid_path = os.path.basename(vid)
    name = os.path.splitext(vid_path)[0]
    gs_path = os.path.dirname(vid)
    start = time.time()
    result = subprocess.run([
        "whisperx",
        "--model",
        "large-v2",
        "--language=en",
        "--thread=%d" % int(sys.argv[2]), 
        "--hf_token",
        "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",
        "--diarize",
        "--print_progress",
        "True",
        "--output_dir",
        WORKING_DIR,
        vid_path])
    end = time.time()
    print("Whisper took: %d seconds" % (end - start))
    if result.returncode == 0:
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
        subprocess.run([
            "gcloud",
            "storage",
            "cp",
            "trans_done",
            gs_path])
