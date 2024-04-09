# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import signal
import sys
import os
import json
from types import FrameType

from flask import Flask

from utils.logging import logger

from download_yt_audio import get_videos as print_video_data

app = Flask(__name__)
#change this to True if this will be run on gcs so the logs will be formatted correctly
onGcs = False


@app.route("/getData")
def testScript() -> str:
    defLog("the script was run")
    
    return "the script has been run"


@app.route("/")
def hello() -> str:
    # Use basic logging with custom fields
    #logger.info(logField="custom-entry", arbitraryField="custom-entry")
    
    # https://cloud.google.com/run/docs/logging#correlate-logs
    #logger.info("Child logger with trace Id.")
    
           
    #making and outputting a test log
    defLog("servive was visited")
    
    
    
    return "Hello Web!" + print_video_data("https://www.youtube.com/user/wanderbots/", "/usr/src/app/data")
    

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


def shutdown_handler(signal_int: int, frame: FrameType) -> None:
    logger.info(f"Caught Signal {signal.strsignal(signal_int)}")
    
    from utils.logging import flush
    
    flush()
    
    # Safely exit program
    sys.exit(0)


if __name__ == "__main__":
    # Running application locally, outside of a Google Cloud Environment
    
    # handles Ctrl-C termination
    signal.signal(signal.SIGINT, shutdown_handler)
    print("running!")
    
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
else:
    # handles Cloud Run container termination
    signal.signal(signal.SIGTERM, shutdown_handler)
