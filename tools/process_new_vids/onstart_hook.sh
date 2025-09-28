#!/bin/bash

source /workspace/app/cuda_path

export PATH=${HOME}/.local/share/fnm:$PATH

eval "$(fnm env --use-on-cd --shell bash)"
fnm use lts/latest

cd /workspace/app

# Default to giving 10 mins on failure.
./lysine_protocol.sh "${4-:30}" &

# Always get the latest pytubefix cause youtube is always changing.
pip install pytubefix --upgrade

# Do transcription
python transcribe_worker.py -w /tmp/transcribe -t "${1:-4}" -x "$2" -y "$3" -m large-v3-turbo -c -s

./lysine_protocol.sh "${5:-10}"
