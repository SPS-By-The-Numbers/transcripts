from pytube import YouTube
import json
import os

meeting = 'https://www.youtube.com/watch?v=ZA2VWHITcV0'

with open('schoolboard_videos.json') as f:
#    all_urls = json.load(f)
#    for url in all_urls:
#        yt = YouTube(all_urls[0])
        yt = YouTube(meeting)
        audio_streams = yt.streams.filter(only_audio=True).order_by('abr')
#        audio_streams.first().download(os.path.join('wat/board-meetings', yt.video_id))
        audio_streams.first().download(os.path.join('board-meetings', yt.video_id))
#    for s in video.streams:
#        print( s)
#    for u in all_urls:
