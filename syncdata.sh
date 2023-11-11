#!/bin/bash

gcloud storage rsync --recursive --checksums-only --exclude '.*\.mp4|.*\.txt|.*\.vtt|.*\.tsv|.*\.srt' gs://sps-by-the-numbers.appspot.com/transcription ./data/transcripts
