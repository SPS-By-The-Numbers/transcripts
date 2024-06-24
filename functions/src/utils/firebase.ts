// Utilities for talking to firebase services. It does NOT use
// firebase storage API which are more limited than the Cloud Storage
// APIs and just not useful. Look at utils/storage.ts instead.

import { PubSub } from "@google-cloud/pubsub";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";
import { onRequest } from "firebase-functions/v2/https";

import { makeResponseJson } from "./response";
import { makePublicPath, makePrivatePath } from "common/paths";

import type { AppOptions } from "firebase-admin/app";

export { getDatabase } from "firebase-admin/database";
export { UserRecord } from "firebase-admin/auth";

export function jsonOnRequest(options : object, func) {
  return onRequest(options, async (req, res) => {
    try {
      return func(req, res);
    } catch (e) {
      console.log(e);
      return res.status(500).send(makeResponseJson(false, "Exception"));
    }
  });
}

export function getCategoryPublicDb(...parts : string[]) {
  return getDatabase().ref(makePublicPath(...parts));
}

export function getCategoryPrivateDb(...parts : string[]) {
  return getDatabase().ref(makePrivatePath(...parts));
}

const pubSubClient = new PubSub();
export function getPubSubClient() {
  return pubSubClient;
}

// Global intialization for process.
export function initializeFirebase(opts : AppOptions | undefined = undefined) {
  initializeApp(opts);
}

export async function getUser(token) {
  const decodedIdToken = await getAuth().verifyIdToken(token);
  console.error("decoded Id Token", decodedIdToken);
  return await getAuth().getUser(decodedIdToken.uid);
}

export async function getAuthCode(user_id) {
  return (await getCategoryPrivateDb("_admin")
    .child("vast").child(user_id).child("password").once("value")).val();
}

export async function setAuthCode(user_id : string, authCode : string) : Promise<void> {
  return (await getCategoryPrivateDb("_admin")
    .child("vast").child(user_id).child("password").set(authCode));
}
