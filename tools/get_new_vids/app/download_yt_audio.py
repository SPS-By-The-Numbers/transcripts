#!/usr/bin/python

# Downloads metadata from youtube into a directory structure.
#
# currently just downloads the most recen three videos from a channel
#
# metadata is downloaded into files by the name:
#
#  [video_id].metadata.json
#
# The metadata is written last as a way of marking completion. If it is a
# parsable json file, then download was complete.
#
# On download, an empty file named
#  [video_id].new_download

#for testing, I used the command line call
#py download_yt_audio.py -o "C:\Users\Joseph\Documents\test_out" -u "https://www.youtube.com/user/wanderbots/"
#note the user/ instead of @, since @wanderbots would break with pytube

# List the same URL structure regex that pytube uses for checking if a url
# is a channel or a playlist.
CHANNEL_URL_PATTERNS = [
    r"(?:\/(c)\/([%\d\w_\-]+)(\/.*)?)",
    r"(?:\/(channel)\/([%\w\d_\-]+)(\/.*)?)",
    r"(?:\/(u)\/([%\d\w_\-]+)(\/.*)?)",
    r"(?:\/(user)\/([%\w\d_\-]+)(\/.*)?)"
]
CHANNEL_URL_REGEXP = re.compile('|'.join(CHANNEL_URL_PATTERNS))

from pytube import YouTube
from pytube import Playlist
from pytube import Channel
from random import randint
from time import sleep

import argparse
import json
import logging
import os
import re
import sys
import traceback

def get_outfile_base(outdir, video_id):
    """Returns the output file path for video_id without extension"""
    return os.path.join(outdir, video_id[0], video_id)


def get_videos(url) -> str:
    videos = get_video_urls(url)
    vid_ids = [vid.split('=')[1] for vid in videos]
    return vid_ids


def get_video_urls(url):
    if CHANNEL_URL_REGEXP.match(url):
        return Channel(url).video_urls
    return Playlist(url).videos


if(__name__ == "__main__"):
    main()


