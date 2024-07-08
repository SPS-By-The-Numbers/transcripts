import * as Constants from 'config/constants';
import { initializeFirebase } from "../utils/firebase";
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs'

export function doAuth() {
  if (!process.env.FIREBASE_SERVICE_KEYFILE) {
    throw "Missing FIREBASE_SERVICE_KEYFILE";
  }
  const credentialJson = readFileSync(
    process.env.FIREBASE_SERVICE_KEYFILE,
              { encoding: 'utf8', flag: 'r' });
  initializeFirebase({
      ...Constants.FIREBASE_CLIENT_CONFIG,
      credential: admin.credential.cert(JSON.parse(credentialJson))
     });
}
