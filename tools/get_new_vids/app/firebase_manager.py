import os

import firebase_admin
from firebase_admin import db

# Initialize app from environment.
firebase_admin.initialize_app()

# As an admin, the app has access to read and write all data, regradless of Security Rules
new_vid_q = db.reference('/private/transcripts/new-vid-q');

def queue_video_data(videos):
    completed = get_completed()
    for vid in videos:
        queueRef.child(vid).set({'started':0, 'id':0})

def queue_failed_tasks():
    completed = completedRef.get().keys()
    queue = queueRef.get().keys()
    processing = processingRef.get().keys()
    for vid in processing:
        if not(vid in queue or vid in completed):
            queueRef.child(vid).set({'started':0, 'id':0})
        processing.getChild(vid).remove()
    
