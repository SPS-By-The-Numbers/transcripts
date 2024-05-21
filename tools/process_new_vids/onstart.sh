#!/bin/bash

/workspace/app/lysine_protocol.sh $1 & python /workspace/app/transcribe_worker.py -w /tmp/transcribe -t $2 -x $3 -m large-v3 -c; /workspace/app/lysine_protocol.sh 0
