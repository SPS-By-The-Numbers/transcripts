#!/bin/bash

cd /workspace/app

# Default to giving 10 mins on failure.
./lysine_protocol.sh "${4-:30}" &

# Always get the latest pytubefix cause youtube is always changing.
pip install yt-dlp --upgrade

# Do transcription
python transcribe_worker.py -w /tmp/transcribe -t "${1:-4}" -x "$2" -m large-v3-turbo -c -s

./lysine_protocol.sh "${5:-10}"
