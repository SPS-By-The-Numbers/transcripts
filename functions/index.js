'use strict';

//const functions = require('@google-cloud/functions-framework');
const {onRequest} = require("firebase-functions/v2/https");
//const {logger} = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

// POST to speaker info with JSON body of type:
// {
//    "videoId": "abcd",
//    "speakerInfo": { "SPEAKER_00": { "name": "some name", "tags": [ "parent", "ptsa" ] }
// }
exports.speakerinfo = onRequest(
  { cors: ["*"], region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'POST') {
       return res.status(400).send("Expects POST");
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers['content-type'] !== 'application/json') {
       return res.status(400).send("Expects JSON");
    }

    if (req.body?.auth !== 'SPSSoSekure') {
      return res.status(400).send("Not So Secure");
    }

    const videoId = req.body?.videoId;
    if (!videoId || videoId.length > 12) {
       try {
         window.atob(videoId);
       } catch(e) {
         return res.status(400).send("Invalid VideoID");
       }
    }

    const speakerInfo = req.body?.speakerInfo;
    if (!speakerInfo) {
      return res.status(400).send("Expect speakerInfo");
    }

    for (const [speaker, info] of Object.entries(speakerInfo)) {
      const name = info.name;
      if (!name) {
        return res.status(400).send("Expect name");
      }

      const tags = info.tags;
      if (!tags || !Array.isArray(tags)) {
        return res.status(400).send("Expect tags to be an array");
      }
      for (const tag of tags) {
        if (typeof(tag) !== 'string') {
          return res.status(400).send("Expect tags to be strings");
        }
      }
    }


    const existingVideoSnapshot = await admin.database().ref(`/transcripts/v/${videoId}`).once('value');
    const existingOptionsSnapshot = await admin.database().ref('/existing').once('value');


    // Grab user ID data if available.
    // Compose 
    res.status(200).send("Hello world!");
  }
);
