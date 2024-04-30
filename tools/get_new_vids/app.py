
import json
from vast_manager import find_instance

from download_yt_audio import get_videos
import firebase_manager

#change this to True if this will be run on gcs so the logs will be formatted correctly
onGcs = True

def main():
    videos = get_videos("https://www.youtube.com/c/braintruffle")
    firebase_manager.queue_failed_tasks()
    firebase_manager.queue_video_data(videos)

def defLog(messageText):
    global_log_fields = get_global_log_fields()
    entry = dict(
        severity="NOTICE",
        message=messageText,
        # Log viewer accesses 'component' as jsonPayload.component'.
        component="arbitrary-property",
        **global_log_fields,
    )
    
    if(onGcs):
        print(json.dumps(entry))
    else:
        print(messageText)

def get_global_log_fields():
    PROJECT = 'infra-memento-419521'
    global_log_fields = {}
    
    request_is_defined = "request" in globals() or "request" in locals()
    if request_is_defined and request:
        trace_header = request.headers.get("X-Cloud-Trace-Context")
    
        if trace_header and PROJECT:
            trace = trace_header.split("/")
            global_log_fields[
                "logging.googleapis.com/trace"
            ] = f"projects/{PROJECT}/traces/{trace[0]}"
    
    return global_log_fields


if __name__ == "__main__":
    print("running!")
    main()
