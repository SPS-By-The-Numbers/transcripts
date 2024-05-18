'use strict';

import isEqual from 'lodash.isequal';
import stream from 'stream';
import { Innertube } from 'youtubei.js';
import { PubSub } from '@google-cloud/pubsub';
import { createGzip } from 'zlib'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from 'firebase-admin/app';
import { onRequest } from "firebase-functions/v2/https";
import { parseISO, format } from 'date-fns';
import { pipeline } from 'node:stream/promises';

const pathDateFormat = 'yyyy-MM-dd';

const LANGUAGES = new Set(['en']);
const STORAGE_BUCKET = 'sps-by-the-numbers.appspot.com';

let global_youtube;
const pubSubClient = new PubSub();

// Global intialization for process.
initializeApp();

function getPublicDb() {
  return getDatabase().ref(`/transcripts/public`);
}

function getCategoryPublicDb(category) {
  return getPublicDb().child(category);
}

function getCategoryPrivateDb(category) {
  return getDatabase().ref(`/transcripts/private/${category}`);
}

function makeResponseJson(ok, message, data = {}) {
  return { ok, message, data };
}

function basename(path) {
  return path.split('/').pop();
}

async function getYoutube() {
  if (!global_youtube) {
    global_youtube = await Innertube.create({generate_session_locally: true});
  }
  return global_youtube;
}

async function getVideosForCategory(category) {
  const youtube = await getYoutube();

  const results = [];
  let feed = null;

  if (category === "sps-board") {
    const channel = await youtube.getChannel("UC07MVxpRKdDJmqwWDGYqotA");
    const videos = await channel.getVideos();
    results.push(...videos.videos);

    if (videos.has_continuation) {
      feed = await videos.getContinuation();
    }
  } else if (category === "seattle-city-council") {
    const playlist = await youtube.getPlaylist("PLhfhh0Ed-ZC2d0zuuzyCf1gaPaKfH4k4f");
    feed = playlist.items();
  }

  while (feed?.has_continuation) {
    feed = await feed.getContinuation();
    results.push(...feed.videos);
  }

  return results;
}

function setMetadata(category, metadata) {
    const category_public = getCategoryPublicDb(category);
    if (!metadata || !Object.keys(metadata).length) {
      console.log(`Invalid metadata: `, metadata);
      return false;
    }
    category_public.child('metadata').update(metadata);

    // Add to the index.
    for (const [vid, info] of Object.entries(metadata)) {
       const published = new Date(info.publish_date).toISOString().split('T')[0];
       category_public.child('index').child('date').child(published)
           .child(vid).set(info);
    }
    return true;
}

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
      decodedIdToken = await getAuth().verifyIdToken(req.body?.auth);
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

const metadata = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'POST') {
       return res.status(400).send(makeResponseJson(false, "Expects POST"));
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers['content-type'] !== 'application/json') {
       return res.status(400).send(makeResponseJson(false, "Expects JSON"));
    }

    if (!req.body.category) {
      return res.status(400).send(makeResponseJson(false, "Expects category"));
    }

    if (req.body.cmd === "set") {
      if (!req.body?.metadata || !Object.keys(req.body.metadata).length) {
        return res.status(400).send(makeResponseJson(false, "missing metadata"));
      }
      if (!setMetadata(req.body.category, req.body.metadata)) {
        return res.status(500).send(makeResponseJson(false, `Internal error`));
      }

      return res.status(200).send(
          makeResponseJson(
            true,
            `Added metadata for ${Object.keys(req.body.metadata)}`));

    }

    return res.status(400).send("Unknown command");
  }
);

const transcript = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    try {
      if (req.method !== 'PUT') {
         return res.status(400).send(makeResponseJson(false, "Expects PUT"));
      }

      // Check request to ensure it looks like valid JSON request.
      if (req.headers['content-type'] !== 'application/json') {
         return res.status(400).send(makeResponseJson(false, "Expects JSON"));
      }

      if (!req.body.user_id) {
        return res.status(400).send(makeResponseJson(false, "missing user_id"));
      }

      const category = req.body.category;
      if (!category || category.length > 20) {
        return res.status(400).send(makeResponseJson(false, "Expects category"));
      }

      if (!req.body.vid) {
        return res.status(400).send(makeResponseJson(false, 'Missing vid'));
      }

      const auth_code = (await getCategoryPrivateDb(req.body.category)
          .child('vast').child(req.body.user_id).once("value")).val();

      if (req.body.auth_code !== auth_code) {
        return res.status(401).send(makeResponseJson(false, "invalid auth code"));
      }

      const transcripts = req.body.transcripts || {};
      for (const lang of Object.keys(transcripts)) {
        if (!LANGUAGES.has(lang)) {
          return res.status(400).send(makeResponseJson(false, `Unknown language ${lang}`));
        }
      }

      for (const [lang, contents] of Object.entries(transcripts)) {
        const bucket = getStorage().bucket(STORAGE_BUCKET);
        const filename = `transcripts/public/${category}/${req.body.vid}.${lang}.json`;
        const file = bucket.file(filename);
        const passthroughStream = new stream.PassThrough();
        passthroughStream.write(contents);
        passthroughStream.end();
        await pipeline(passthroughStream, createGzip(), file.createWriteStream({
          metadata: {
            contentEncoding: 'gzip'
          }
          }));
      }

      if (req.body.metadata && !setMetadata(req.body.category, req.body.metadata)) {
        return res.status(500).send(makeResponseJson(false, `Internal error`));
      }

      return res.status(200).send(makeResponseJson(true, `update done`));
    } catch(e) {
      console.error("Transcript fail: ", e);
      return res.status(500).send(makeResponseJson(false, "Internal error"));
    }
  }
);

const start_transcribe = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
  await pubSubClient.topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});
    return res.status(200).send(makeResponseJson(true, "transcription starte", ""));
  }
);

const find_new_videos = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'GET') {
       return res.status(400).send(makeResponseJson(false, "Expects GET"));
    }

    const public_ref = getPublicDb();
    const all_data = (await public_ref.once("value")).val();

    if (!all_data) {
       return res.status(500).send(makeResponseJson(false, "No Categories in DB"));
    }

    const all_new_vid_ids = [];
    const add_ts = new Date();
    let limit = 0;
    // Can be empty in test and initial bootstrap.
    for (const category of Object.keys(all_data)) {
      const public_category_ref = getCategoryPublicDb(category);
      const metadata_snapshot = await public_category_ref.child('metadata').once("value");
      const new_video_ids = {};

      for (const vid of await getVideosForCategory(category)) {
        if (req.query.limit && ++limit > req.query.limit) {
          break;
        }

        if (!metadata_snapshot.child(vid.id).exists()) {
          new_video_ids[vid.id] =  { add: add_ts, start: "", instance: "" };
        }
      }

      all_new_vid_ids.push(...Object.keys(new_video_ids));
      getCategoryPrivateDb(category).child('new_vids').update(new_video_ids);
    }

    // If there are new video ids. Wake up the trasncription jobs.
    if (all_new_vid_ids) {
      await pubSubClient.topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});
    }

    return res.status(200).send(makeResponseJson(true, "vids enqueued", all_new_vid_ids));
  }
);

export { speakerinfo, metadata, find_new_videos, start_transcribe, transcript };
