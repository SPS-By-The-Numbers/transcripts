from pytube import YouTube
import json
import os
from random import randint
from time import sleep
from pathlib import Path

meeting = 'https://www.youtube.com/watch?v=ZA2VWHITcV0'

with open('schoolboard_videos.json') as f:
    all_urls = json.load(f)
    for url in all_urls:
        try:
          print ("Downloading %s" % url)
          yt = YouTube(url)
          out_dir = os.path.join('board-meetings', yt.video_id)
          done_file = Path(os.path.join(out_dir, 'done'))
          if not done_file.is_file():
            audio_streams = yt.streams.filter(only_audio=True).order_by('abr')
            audio_streams.first().download(out_dir)
            Path(done_file).touch()
            sleep(randint(3,10))
            print ("   Done Downloading %s" % url)
          else:
            print ("   Skipping %s" % url)
        except Exception as e:
          print("Failed with exception %s" % e)


#    for s in video.streams:
#        print( s)
#    for u in all_urls:
