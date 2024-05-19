import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from "firebase-admin/storage";
import { getAuth } from 'firebase-admin/auth';
import { onRequest } from "firebase-functions/v2/https";

import { makePublicPath, makePrivatePath } from './utils.js';

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

function getCategoryPublicDb(category) {
  return getDatabase().ref(makePublicPath(category));
}

function getCategoryPrivateDb(category) {
  return getDatabase().ref(makePrivatePath(category));
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

async function verifyIdToken(token) {
  return await getAuth().verifyIdToken(token);
}

export { getCategoryPrivateDb, getCategoryPublicDb, getPubSubClient, getDefaultBucket, initializeFirebase, verifyIdToken, jsonOnRequest };
