import { speakerinfo } from './speakerinfo.js';
import { metadata, transcript } from './transcript.js';
import { video_queue, vast } from './video_queue.js';

import { initializeFirebase } from './firebase_utils.js';

initializeFirebase();

export { speakerinfo, metadata, transcript, video_queue, vast };
