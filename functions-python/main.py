from firebase_functions import pubsub_fn
from firebase_admin import initialize_app, db

app = initialize_app()

@pubsub_fn.on_message_published(topic="start_transcribe")
def start_transcribe(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """Start the vast.ai instance which queries the new videos"""
    print("Ugh")
    # Get list of videos.
    for category in ["sps-board"]:
      new_vids_queue = db.reference(f"/transcripts/private/{category}-board/new_vids").get(False, True)
      if len(new_vids_queue):
        # Start Vast.ai instance.
