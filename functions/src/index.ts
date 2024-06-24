import 'source-map-support/register.js';

export { speakerinfo } from "./speakerinfo";
export { metadata, transcript } from "./transcript";
export { video_queue, vast } from "./video_queue";

import { initializeFirebase } from "./utils/firebase";

initializeFirebase({});
