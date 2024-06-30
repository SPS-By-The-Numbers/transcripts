import fetch from 'node-fetch';
import * as FirebaseUtils from 'utils/firebase';
import sourceMapSupport from 'source-map-support'

// Set up unique project id for these tests so they can't hit anything real.
export const TEST_PROJECT_ID = 'fakeproject';

// Be sure to use 127.0.0.1 instead of localhost to avoid binding the ipv6 ::1
export const EMULATOR_ENDPOINT_ROOT = 'http://127.0.0.1:5001/sps-by-the-numbers/us-west1';

export const FAKE_USER_ID = 'fakeuser';
export const FAKE_AUTH_CODE = 'fake_auth';

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

export function fetchEndpoint(endpoint : string, method: string, parameters : Record<string,string>) {
  const fullUrl = `${EMULATOR_ENDPOINT_ROOT}/${endpoint}`;
  if (method === 'GET') {
    return fetch(fullUrl + '?' + new URLSearchParams(parameters).toString());
  }

  return fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
  });
}
