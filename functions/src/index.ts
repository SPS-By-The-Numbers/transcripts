import 'source-map-support/register.js';

export { metadata } from "./metadata";
export { sentences } from "./sentences";
export { speakerinfo } from "./speakerinfo";
export { transcript } from "./transcript";
export { video_queue, vast } from "./video_queue";

import { initializeFirebase } from "./utils/firebase";
import { initializeFirebaseTesting } from "./utils/testing";

if (process.env.SPSBTN_FIREBASE_TESTING === "1") {
  initializeFirebaseTesting();
} else {
  initializeFirebase();
}
