# Transcription tools
This is a set of tools to download audio from videos on a
Youtube channel and transcribe them.

There are 2 components:
  1. `download_yt_audio.py` - Downloads audio from a channel into a local filesystem
  2. `transcribe_worker.py` - Transcribes audio data into a .json file in a local filesystem.

The `download_yt_audio.py` script is best run on a machine with a fast FUSE
filesystem that mounts a cloud storage filesystem. For example, it would be
sensible to run it on a micro GCE instance in the same region as the Google
Cloud Storage cluster holding the data.

The `transcribe_worker.py` script can also work on a FUSE filesystem but
it is meant to run on a machine with GPU resources.  Note that diarization
is actually more CPU intensive than GPU so you want a machine with lots
of cores (16+) and a lot of ram (16Gb+) or it will be very very very
slow. 

Perf:
Cuda 11
NVIDIA GeForce RTX 2080.
First GPU intensive work done in ~4m. 7:31 start, 7:35 end
Model uses 6.3GB of video ram at peak.  7:31am

Second GPU intensive work done in ~2m. 7:35 start
Model uses 6.3GB of video ram at peak.  7:31am

