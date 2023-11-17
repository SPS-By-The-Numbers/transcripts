'use strict';

const functions = require('@google-cloud/functions-framework');
const {onRequest} = require("firebase-functions/v2/https");
const {onValueCreated} = require("firebase-functions/v2/database");
const {logger} = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

// POST to speaker info with JSON body of type:
// {
//    "videoId": "abcd",
//    "speakerInfo": { "SPEAKER_00": { "name": "some name", "tags": [ "parent", "ptsa" ] }
// }
exports.speakerinfo = onRequest(
  { cors: [/firebase\.com$/, "flutter.com"] },
  (req, res) => {
    // Check request to ensure it looks like valid JSON.
    // Grab user ID data if available.
    // Compose 
    res.status(200).send("Hello world!");
  }
);
