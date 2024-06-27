import 'source-map-support/register.js';

export { speakerinfo } from "./speakerinfo.js";
export { transcript } from "./transcript.js";
export { video_queue, vast } from "./video_queue.js";

import { initializeFirebase } from "./utils/firebase.js";

initializeFirebase();
