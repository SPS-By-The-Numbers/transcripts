#!/usr/bin/python

# Downloads audio and metadata from youtube into a directory structure.
#
# Audio from videos as well as metadata are downloaded into files by the name:
#
#  [video_id].mp4
#  [video_id].metadata.json
#
# The metadata is written last as a way of marking completion. If it is a
# parsable json file, then download was complete.
#
# On download, an empty file named
#  [video_id].new_download
#
# Is also created to allow for quick searches of new videos in the processing
# pipeline.
#
# Because there may be thousands of files, they are downloaded into a
# 1-level directory prefix tree based on the first character of the videoid.
# Since videoIds are base64 encoded, this gives a 64x reduction in directory
# entries. So abcde.mp4, ab123.mp4, -1abd.mp4 would be store as
#
# /mount_point/a/abcde.mp4
# /mount_point/a/ab123.mp4
# /mount_point/-/-1abd.mp4

from pytube import YouTube
from pytube import Playlist
from random import randint
from time import sleep

import argparse
import json
import logging
import os
import sys
import traceback

def get_outfile_base(outdir, video_id):
    """Returns the output file path for video_id without extension"""
    return os.path.join(args.outdir, video_id[0], video_id)


def is_json_file(path):
    """Returns True if path exists and can be loaded as JSON."""
    try:
        with open(path, "r") as f:
            json.load(f)
            return True
    except:
            return False

# Get city council videos from the Seattle Channel's playlist.
#playlist = Playlist("https://www.youtube.com/playlist?list=PLhfhh0Ed-ZC2d0zuuzyCf1gaPaKfH4k4f")

parser = argparse.ArgumentParser(
        prog='Youtube Audio Download',
        description='Downloads audio from youtube videos in a channel or playlist')
parser.add_argument('-o', '--outdir', dest='outdir', metavar='OUTDIR',
                    help='write files in structure under OUTDIR', required=True)
parser.add_argument('-p', '--playlist', dest='playlist', metavar="PLAYLIST",
                    help='URL of PLAYLIST to download from', required=True)
parser.add_argument('-d', '--debug', dest='debug', help='Enable debug logging', action=argparse.BooleanOptionalAction)
parser.add_argument('-s', '--skip-existing', dest='skip', help='Skip download of existing audio files. Only update metadata.', action=argparse.BooleanOptionalAction)

args = parser.parse_args()
if not args.playlist or not args.outdir:
    parser.print_help()
    sys.exit(1)

if args.debug:
    logging.getLogger().setLevel(logging.DEBUG)
else:
    logging.getLogger().setLevel(logging.INFO)



playlist = Playlist(args.playlist)
for v in playlist.videos:
    # Check if json file exists for video and is parseable.
    video_id = v.video_id
    outfile_base = get_outfile_base(args.outdir, video_id)
    metadata_path = '%s.metadata.json' % outfile_base
    logging.debug("Metadatafile: %s" % metadata_path)
    if is_json_file(metadata_path):
        logging.info("Skipping %s" % video_id)
    else:
        logging.info("Downloading %s" % video_id)

        try:
            # Ensure the files are there.
            outfile_name = '%s.mp4' % video_id
            outfile_dir = os.path.dirname(outfile_base)
            if not os.path.exists(outfile_dir):
                os.makedirs(outfile_dir)

            # Do the download, always overwriting. The parseable metadata file is the
            # completion flag.
            audio_streams = v.streams.filter(only_audio=True).order_by('abr')
            audio_streams.first().download(
                    output_path=outfile_dir,
                    filename=outfile_name,
                    max_retries=5,
                    skip_existing=args.skip)

            # Download completed. Time to write metadata.
            with open(metadata_path, "w") as f:
                metadata = {
                    'title': v.title,
                    'video_id': v.video_id,
                    'channel_id': v.channel_id,
                    'description': v.description,
                    'publish_date': v.publish_date.isoformat(),
                }
                print(metadata)
                json.dump(metadata, f)
            logging.info("Done Downloading %s" % video_id)
        except Exception as e:
            print("Download of %s Failed with exception %s" % (video_id, e))
            traceback.print_exc()
    logging.info("Done Downloading %s" % video_id)
    pause_secs = randint(1,5)
    logging.info("Pausing %d" % pause_secs)
    sleep(pause_secs)




