#!/usr/bin/python

import re
from datetime import datetime, timezone

from pytube import Playlist
from pytube import Channel

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# List the same URL structure regex that pytube uses for checking if a url
# is a channel or a playlist.
CHANNEL_URL_PATTERNS = [
    r"(?:\/(c)\/([%\d\w_\-]+)(\/.*)?)",
    r"(?:\/(channel)\/([%\w\d_\-]+)(\/.*)?)",
    r"(?:\/(u)\/([%\d\w_\-]+)(\/.*)?)",
    r"(?:\/(user)\/([%\w\d_\-]+)(\/.*)?)"
]
CHANNEL_URL_REGEXP = re.compile('|'.join(CHANNEL_URL_PATTERNS))

class VastParseError(Exception):
    def __init__(self, message, out, err):
        super().__init__(message)
        self.out = out
        self.err = err


def get_video_ids(url):
    """Return all video ids for a Youtube channel or playlist url"""
    if CHANNEL_URL_REGEXP.search(url):
        video_urls = Channel(url).video_urls
    else:
        video_urls = Playlist(url).videos

    return [vid_url.split('=')[1] for vid_url in video_urls]


def scrape_new_vids_for_channel(channel):
    private_channel_ref = db.reference(f'/transcripts/private/{channel}');
    public_channel_ref = db.reference(f'/transcripts/public/{channel}');

    existing_vid_ids = set(public_channel_ref.child('metadata').get(shallow=True).keys())
    channel_url = public_channel_ref.child('channel_url').get()

    all_video_ids = get_video_ids(channel_url)


    # Get now in ISO8601 format that uses the "Z" timeszone like JS does.
    # Code from https://stackoverflow.com/a/63731605. 
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    # Create the queue update.
    new_video_ids = {vid: {'add': now, 'start': ''} for vid in all_video_ids if vid not in existing_vid_ids}

    # Queue them.
    new_vid_queue = private_channel_ref.child('new_vids')
    new_vid_queue.update(new_video_ids)


def main():
    # Initialize app from environment.
    cred = credentials.Certificate('/Users/albert/src/transcriptions-merge/tools/get_new_vids/sps-by-the-numbers-firebase-adminsdk-kll3x-adac023dbf.json')
    firebase_admin.initialize_app(cred, { 'databaseURL': 'https://sps-by-the-numbers-default-rtdb.firebaseio.com/'})

    # Start by terminating all existing vast.ai instances that have not
    # reported an new transcription within the last few hours.

    new_video_ids = None # scrape_new_vids_for_channel('sps-board')
    if new_video_ids:
        start_trasncriptions()


if __name__ == "__main__":
    main()
