import unittest
from pytubefix import YouTube
import transcribe_worker

class TestTranscribeWorker(unittest.TestCase):
    def test_transcribe_worker(self):
        BOARD_MEETING_MAY_13_2025 = 'cIVuHr9ub-Y'
        video = YouTube(f"https://www.youtube.com/watch?v={BOARD_MEETING_MAY_13_2025}")
        desc = transcribe_worker.get_description(video)
        self.assertEqual(desc, "Seattle Public Schools")
