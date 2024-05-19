import isEqual from 'lodash.isequal';
import { onRequest } from "firebase-functions/v2/https";
import { makeResponseJson } from './utils.js';

import { getCategoryPublicDb, getCategoryPrivateDb, verifyIdToken } from './firebase_utils.js';

// POST to speaker info with JSON body of type:
// {
//    "videoId": "abcd",
//    "speakerInfo": { "SPEAKER_00": { "name": "some name", "tags": [ "parent", "ptsa" ] }
// }
const speakerinfo = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'POST') {
       return res.status(400).send(makeResponseJson(false, "Expects POST"));
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers['content-type'] !== 'application/json') {
       return res.status(400).send(makeResponseJson(false, "Expects JSON"));
    }

    let decodedIdToken = null;
    try {
      decodedIdToken = verifyIdToken(req.body?.auth);
    } catch (error) {
      return res.status(400).send(makeResponseJson(false, "Did you forget to login?"));
    }

    const category = req.body?.category;
    if (!category || category.length > 20) {
      return res.status(400).send(makeResponseJson(false, "Invalid Category"));
    }

    const videoId = req.body?.videoId;
    if (!videoId || videoId.length > 12) {
       if (Buffer.from(videoId, 'base64').toString('base64') !== videoId) {
         return res.status(400).send(makeResponseJson(false, "Invalid VideoID"));
       }
    }

    const speakerInfo = req.body?.speakerInfo;
    if (!speakerInfo) {
      return res.status(400).send(makeResponseJson(false, "Expect speakerInfo"));
    }

    // Validate request structure.
    const allTags = new Set();
    const allNames = new Set();
    const recentTagsForName = {};
    for (const info of Object.values(speakerInfo)) {
      const name = info.name;
      if (name) {
        allNames.add(name);
      }

      const tags = info.tags;
      if (tags) {
        if (!Array.isArray(tags)) {
          return res.status(400).send(makeResponseJson(false, "Expect tags to be an array"));
        }
        if (name) {
          recentTagsForName[name] = [...(new Set(tags))];
        }
        for (const tag of tags) {
          if (typeof(tag) !== 'string') {
            return res.status(400).send(makeResponseJson(false, "Expect tags to be strings"));
          }
          allTags.add(tag);
        }
      }
    }

    // Write audit log.
    try {
      const privateRoot = getCategoryPrivateDb(category);
      const publicRoot = getCategoryPublicDb(category);
      if ((await publicRoot.child('<enabled>').once('value')).val() !== 1) {
        return res.status(400).send(makeResponseJson(false, "Invalid Category"));
      }

      // Timestamp to close enough for txn id. Do not use PII as it is
      // by public.
      const txnId = `${(new Date).toISOString().split('.')[0]}Z`;
      const auditRef = privateRoot.child(`audit/${txnId}`);
      auditRef.set({
        name: 'speakerinfo POST',
        headers: req.headers,
        body: req.body,
        email: decodedIdToken.email,
        emailVerified: decodedIdToken.email_verified,
        uid: decodedIdToken.uid
        });

      const videoRef = publicRoot.child(`v/${videoId}/speakerInfo`);
      videoRef.set(speakerInfo);

      // Update the database stuff.
      const existingRef = publicRoot.child('existing');
      const existingOptions = (await existingRef.once('value')).val();

      // Add new tags.
      let existingOptionsUpdated = false;
      for (const name of allNames) {
        const recentTags = recentTagsForName[name];
        if (!Object.prototype.hasOwnProperty.call(existingOptions.names, name) ||
            (recentTags && !isEqual(existingOptions.names[name].recentTags, recentTags))) {
          existingOptions.names[name] = {txnId, recentTags: recentTags || []};
          existingOptionsUpdated = true;
        }
      }
      for (const tag of allTags) {
        if (!Object.prototype.hasOwnProperty.call(existingOptions.tags, tag)) {
          existingOptions.tags[tag] = txnId;
          existingOptionsUpdated = true;
        }
      }
      if (existingOptionsUpdated) {
        existingRef.set(existingOptions);
      }

      res.status(200).send(makeResponseJson(true, "success",
            { speakerInfo,
              existingTags: Object.keys(existingOptions.tags),
              existingNames: Object.keys(existingOptions.names)}));

    } catch(e) {
      console.error("Updating DB failed with: ", e);
      return res.status(500).send(makeResponseJson(false, "Internal error"));
    }
  }
);

export { speakerinfo };
