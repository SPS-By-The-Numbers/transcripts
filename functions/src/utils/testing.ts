import fetch from 'node-fetch';
import * as fs from 'node:fs';
import * as FirebaseUtils from 'utils/firebase';
import sourceMapSupport from 'source-map-support'

// Set up unique project id for these tests so they can't hit anything real.
export const TEST_PROJECT_ID = 'fakeproject';

// Be sure to use 127.0.0.1 instead of localhost to avoid binding the ipv6 ::1
export const EMULATOR_ENDPOINT_ROOT = 'http://127.0.0.1:5001/sps-by-the-numbers/us-west1';

export const FAKE_USER_ID = 'fakeuser';
export const FAKE_AUTH_CODE = 'fake_auth';

// One whisperX transcript. Note the stored file has a .xz extension but it is actually plaintext to avoid
// needing to load the xz codec!
export const DATA_WHISPERX_TRANSCRIPT = JSON.parse(fs.readFileSync(
    "../testdata/testbucket/transcripts/public/testcategory/archive/whisperx/a95KMDHf4vQ.en.json.xz",
    "utf-8"));

  // Fake metadata to use in test.
export const DATA_METADATA = {
  channel_id: "UC07MVxpRKdDJmqwWDGYqotA",
  publish_date: "2015-11-04T00:00:00",
  title: "School Board Meeting Date: November 4th, 2015 Pt.2",
  description: "Blah",
  video_id: "-95KMDHf4vQ",
}

let processInitialized = false;

export function initializeFirebaseTesting() {
  if (!processInitialized) {
    // Initialize test database
    process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
    process.env.FIREBASE_DATABASE_EMULATOR_HOST="127.0.0.1:9000"
    FirebaseUtils.initializeFirebase({
        projectId : TEST_PROJECT_ID,
        databaseURL: "http://127.0.0.1:9000/?ns=sps-by-the-numbers-default-rtdb"
    });
    processInitialized = true;
  }
}

export async function beforeAll() {
  sourceMapSupport.install()
  initializeFirebaseTesting();
  await FirebaseUtils.setAuthCode(FAKE_USER_ID, FAKE_AUTH_CODE);
}

export function fetchEndpoint(endpoint : string, method: string, parameters : Record<string,string | object>) {
  const fullUrl = `${EMULATOR_ENDPOINT_ROOT}/${endpoint}`;
  if (method === 'GET') {
    const narrowedParams = parameters as Record<string, string>;
    return fetch(fullUrl + '?' + new URLSearchParams(narrowedParams).toString());
  }

  return fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
  });
}
