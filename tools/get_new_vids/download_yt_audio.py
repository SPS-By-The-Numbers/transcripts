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


def is_json_file(path):
    """Returns True if path exists and can be loaded as JSON."""
    try:
        with open(path, "r") as f:
            json.load(f)
            return True
    except:
            return False

def get_videos(url) -> str:
    
    if not url:
        sys.exit(1)
    
    videos = get_video_urls(url)
    vidIDs = [vid.split('=')[1] for vid in videos]
    return vidIDs

def get_video_urls(url):
    # Check URL structure against the smae regex pytube uses for checking if a url is a channel, otherwise, assume it's a playlist
    patterns = [
        r"(?:\/(c)\/([%\d\w_\-]+)(\/.*)?)",
        r"(?:\/(channel)\/([%\w\d_\-]+)(\/.*)?)",
        r"(?:\/(u)\/([%\d\w_\-]+)(\/.*)?)",
        r"(?:\/(user)\/([%\w\d_\-]+)(\/.*)?)"
    ]
    isChannelURL = False;
    for pattern in patterns:
        regex = re.compile(pattern)
        function_match = regex.search(url)
        if function_match:
            isChannelURL = True;
            break
    if isChannelURL:
        videos = Channel(url).video_urls
    else:
        videos = Playlist(url).videos
    
    return videos

if(__name__ == "__main__"):
    main()


