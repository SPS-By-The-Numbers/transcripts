import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from "firebase-admin/storage";
import { getAuth } from 'firebase-admin/auth';
import { onRequest } from "firebase-functions/v2/https";

import { makePublicPath, makePrivatePath, makeResponseJson } from './utils.js';

const STORAGE_BUCKET = 'sps-by-the-numbers.appspot.com';

function jsonOnRequest(options, func) {
  return onRequest(options, async (req, res) => {
    try {
      return func(req, res);
    } catch (e) {
      console.log(e);
      return res.status(500).send(makeResponseJson(false, 'Exception'));
    }
  });
}

function getCategoryPublicDb(...parts) {
  return getDatabase().ref(makePublicPath(...parts));
}

function getCategoryPrivateDb(...parts) {
  return getDatabase().ref(makePrivatePath(...parts));
}

const pubSubClient = new PubSub();
function getPubSubClient() {
  return pubSubClient;
}

function getDefaultBucket() {
  return getStorage().bucket(STORAGE_BUCKET);
}

// Global intialization for process.
function initializeFirebase() {
  initializeApp();
}

async function getUser(token) {
  const decodedIdToken = await getAuth().verifyIdToken(token);
  console.error("decoded Id Token", decodedIdToken);
  return await getAuth().getUser(decodedIdToken.uid);
}

async function getAuthCode(user_id) {
  return (await getCategoryPrivateDb('_admin')
      .child('vast').child(user_id).child('password').once("value")).val();
}


export { getCategoryPrivateDb, getCategoryPublicDb, getPubSubClient, getDefaultBucket, initializeFirebase, getUser, jsonOnRequest, getAuthCode };
