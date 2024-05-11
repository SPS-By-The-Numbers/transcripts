import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Fetch the service account key JSON file contents
cred = credentials.Certificate('/usr/src/app/hello-web-410622-firebase-adminsdk-85y84-be3b1fe5be.json')
database = {'databaseURL': 'https://hello-web-410622-default-rtdb.firebaseio.com'}

# Initialize the app with a service account, granting admin privileges
firebase_admin.initialize_app(cred, database)

# As an admin, the app has access to read and write all data, regradless of Security Rules
queueRef = db.reference('/transcripts/queue')
completedRef = db.reference('/transcripts/completed')
processingRef = db.reference('/transcripts/processing')

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
    
