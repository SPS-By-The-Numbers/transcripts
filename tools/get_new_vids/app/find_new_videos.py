import json

from download_yt_audio import get_videos
from vast_manager import find_instance

import firebase_manager

class VastParseError(Exception):
    def __init__(self, message, out, err):
        super().__init__(message)
        self.out = out
        self.err = err

def main():
    videos = get_videos("https://www.youtube.com/c/seattlepublicschoolsboardmeetings")
    firebase_manager.queue_video_data(videos)

if __name__ == "__main__":
    main()
