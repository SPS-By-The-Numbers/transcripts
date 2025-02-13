#!/bin/bash

export PATH=${HOME}/.local/share/fnm:$PATH

eval "$(fnm env --use-on-cd --shell bash)"
fnm use lts/latest

# Default to giving 10 mins on failure.
/workspace/app/lysine_protocol.sh "${4-:30}" & python /workspace/app/transcribe_worker.py -w /tmp/transcribe -t "${1:-4}" -x "$2" -y "$3" -m large-v3-turbo -c -s; /workspace/app/lysine_protocol.sh "${5:-10}"
