'use strict';

const _ = require('lodash');
const admin = require("firebase-admin");
const { Innertube } = require('youtubei.js');
const { PubSub } = require('@google-cloud/pubsub')
const { getStorage } = require("firebase-admin/storage");
const { onRequest } = require("firebase-functions/v2/https");
const { parseISO, format } = require('date-fns');

const pathDateFormat = 'yyyy-MM-dd';

let global_youtube;
const pubSubClient = new PubSub();

// Global intialization for process.
admin.initializeApp();

function getPublicDb() {
  return admin.database().ref(`/transcripts/public`);
}

function getCategoryPublicDb(category) {
  return getPublicDb().child(category);
}

function getCategoryPrivateDb(category) {
  return admin.database().ref(`/transcripts/private/${category}`);
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

async function regenerateMetadata(category, limit) {
  const bucket = getStorage().bucket('sps-by-the-numbers.appspot.com');
  const options = {
    prefix: `transcripts/public/${category}/metadata/`,
    matchGlob: "**.metadata.json",
    delimiter: "/",
  };

  const publicRoot = getCategoryPublicDb(category);

  const [files] = await bucket.getFiles(options);
  console.log(`found ${files.length}`);
  let n = 0;
  let outstanding = [];
  for (const file of files) {
    if (limit && n > limit) {
      break;
    }
    n = n+1;

    outstanding.push((new Response(file.createReadStream())).json().then(async (metadata) => {
      const publishDate = parseISO(metadata.publish_date);
      const indexRef = publicRoot.child(`index/date/${format(publishDate, pathDateFormat)}/${metadata.video_id}`);
      outstanding.push(indexRef.set(metadata));
      const metadataRef = publicRoot.child(`metadata/${metadata.video_id}`);
      outstanding.push(metadataRef.set(metadata));
    }));

    // Concurrency limit.
    if (outstanding.length > 25) {
      await Promise.allSettled(outstanding);
      outstanding = [];
    }
  }
}

async function migrate(category, limit) {
  const bucket = getStorage().bucket('sps-by-the-numbers.appspot.com');
  const options = {
    prefix: `transcription/${category}`
  };

  const [files] = await bucket.getFiles(options);

  console.log("Starting for files: " + files.length);
  let n = 0;
  let outstanding = [];
  let numMetadata = 0;
  for (const file of files) {
    if (limit && n > limit) {
      break;
    }
    n = n+1;
//    console.log(`processing ${file.name}`);

    const origBasename = basename(file.name);
    const videoId = origBasename.split('.')[0];
    const makeDest = (type, videoId, suffix) => {
      return bucket.file(`transcripts/public/${category}/${type}/${videoId}.${suffix}`);
    }
    let dest = undefined;
    if (origBasename.endsWith('.metadata.json')) {
      numMetadata = numMetadata+1;
      dest = makeDest('metadata', videoId, 'metadata.json');
    } else if (origBasename.endsWith('.json')) {
      dest = makeDest('json', videoId, 'en.json');
    } else if (origBasename.endsWith('.vtt')) {
      dest = makeDest('vtt', videoId, 'en.vtt');
    } else if (origBasename.endsWith('.srt')) {
      dest = makeDest('srt', videoId, 'en.srt');
    } else if (origBasename.endsWith('.txt')) {
      dest = makeDest('txt', videoId, 'en.txt');
    } else if (origBasename.endsWith('.tsv')) {
      dest = makeDest('tsv', videoId, 'en.tsv');
    }
    if (dest) {
      let shouldSkip = false;
      outstanding.push(dest.exists()
        .then(([exists]) => shouldSkip = exists)
        .finally(async () => {
            if (!shouldSkip) {
              console.log(`copy ${file.name} to ${dest.name}`);
              await file.copy(dest, { predefinedAcl: 'publicRead' });
            }
          })
        .catch(console.error));
    }

    // Concurrency limit.
    if (outstanding.length > 25) {
      await Promise.allSettled(outstanding);
      outstanding = [];
    }
  }
  console.log('numMetadata', numMetadata);
  await Promise.allSettled(outstanding);
}

// POST to speaker info with JSON body of type:
// {
//    "videoId": "abcd",
//    "speakerInfo": { "SPEAKER_00": { "name": "some name", "tags": [ "parent", "ptsa" ] }
// }
exports.speakerinfo = onRequest(
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
      decodedIdToken = await admin.auth().verifyIdToken(req.body?.auth);
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
            (recentTags && !_.isEqual(existingOptions.names[name].recentTags, recentTags))) {
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

exports.metadata = onRequest(
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

    if (req.body?.cmd === "regenerateMetadata") {
      try {
        await regenerateMetadata(req.body.category, req.body.limit);
      } catch (e) {
        console.error(e);
        return res.status(500).send(makeResponseJson(false, "Exception"));
      }
      return res.status(200).send(makeResponseJson(true, "done"));
    } else if (req.body?.cmd === "migrate") {
      try {
        await migrate(req.body.category, req.body.limit);
      } catch (e) {
        console.error(e);
        return res.status(500).send(makeResponseJson(false, "Exception"));
      }
      return res.status(200).send(makeResponseJson(true, "done"));
    } else if (req.body?.cmd === "set") {
      const category_public = getCategoryPublicDb(req.body.category);
      if (!req.body?.metadata || !Object.keys(req.body.metadata).length) {
        return res.status(400).send(makeResponseJson(false, "missing metadata"));
      }
      category_public.child('metadata').update(req.body.metadata);

      // Add to the index.
      for (const [vid, info] of Object.entries(req.body.metadata)) {
         const published = new Date(info.publish_date).toISOString().split('T')[0];
         category_public.child('index').child('date').child(published)
             .child(vid).set(info);
      }
      return res.status(200).send(
          makeResponseJson(
              true,
              `Added metadata for ${Object.keys(req.body.metadata)}`));
    }

    return res.status(400).send("Unknown command");
  }
);

exports.find_new_videos = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'GET') {
       return res.status(400).send(makeResponseJson(false, "Expects GET"));
    }

    const public_ref = getPublicDb();
    const all_data = (await public_ref.once("value")).val();

    const all_new_vid_ids = [];
    const add_ts = new Date();
    let limit = 0;
    // Can be empty in test and initial bootstrap.
    if (all_data) {
      for (const category of Object.keys(all_data)) {
        const public_category_ref = getCategoryPublicDb(category);
        const metadata_snapshot = await public_category_ref.child('metadata').once("value");
        const new_video_ids = {};

        for (const vid of await getVideosForCategory(category)) {
          if (limit++ > 5) {
            break;
          }

          if (!metadata_snapshot.child(vid.id).exists()) {
            console.log(metadata_snapshot.val());
            new_video_ids[vid.id] =  { add: add_ts, start: "", instance: "" };
          }
        }

        all_new_vid_ids.push(...Object.keys(new_video_ids));
        getCategoryPrivateDb(category).child('new_vids').update(new_video_ids);
      }
    }

    await pubSubClient.topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});

    return res.status(200).send(makeResponseJson(true, "vids enqueued", all_new_vid_ids));
  }
);
