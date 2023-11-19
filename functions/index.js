'use strict';

const { parseISO, format } = require('date-fns');

const {onRequest} = require("firebase-functions/v2/https");

const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage");
admin.initializeApp();

const pathDateFormat = 'yyyy-MM-dd';

function basename(path) {
  return path.split('/').pop();
}

async function regenerateMetadata(category, limit) {
  const bucket = getStorage().bucket('sps-by-the-numbers.appspot.com');
  const options = {
    prefix: `transcripts/public/${category}/metadata/`,
    matchGlob: "**.metadata.json",
    delimiter: "/",
  };

  const dbRoot = admin.database().ref(`/transcripts/${category}`);

  const [files] = await bucket.getFiles(options);
  console.log(`found ${files.length}`);
  let n = 0;
  let outstanding = [];
  for (const file of files) {
    if (limit && n > limit) {
      break;
    }
    n = n+1;
    console.log(`processing ${file.name}`);

    outstanding.push((new Response(file.createReadStream())).json().then(async (metadata) => {
      const publishDate = parseISO(metadata.publish_date);
      const dirRef = dbRoot.child(`index/date/${format(publishDate, pathDateFormat)}/${metadata.video_id}`);
      await dirRef.set(metadata);
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
  for (const file of files) {
    if (limit && n > limit) {
      break;
    }
    n = n+1;
    console.log(`processing ${file.name}`);

    const origBasename = basename(file.name);
    const videoId = origBasename.split('.')[0];
    const makeDest = (type, videoId, suffix) => {
      return bucket.file(`transcripts/public/${category}/${type}/${videoId}.${suffix}`);
    }
    let dest = undefined;
    if (origBasename.endsWith('.metadata.json')) {
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
      outstanding.push(file.exists().then(async (exists) => {
        if (!exists) {
          console.log(`copy ${file.name} to ${dest.name}`);
          await file.copy(dest, { predefinedAcl: 'publicRead' });
        }
      }));
    }

    // Concurrency limit.
    if (outstanding.length > 25) {
      await Promise.allSettled(outstanding);
      outstanding = [];
    }
  }
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
       return res.status(400).send("Expects POST");
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers['content-type'] !== 'application/json') {
       return res.status(400).send("Expects JSON");
    }

    if (req.body?.auth !== 'SPSSoSekure') {
      return res.status(400).send("Not So Secure");
    }

    const category = req.body?.category;
    if (!category || category.length > 20) {
      return res.status(400).send("Invalid Category");
    }

    const videoId = req.body?.videoId;
    if (!videoId || videoId.length > 12) {
       if (Buffer.from(videoId, 'base64').toString('base64') !== videoId) {
         return res.status(400).send("Invalid VideoID");
       }
    }

    const speakerInfo = req.body?.speakerInfo;
    if (!speakerInfo) {
      return res.status(400).send("Expect speakerInfo");
    }

    // Validate request structure.
    const allTags = new Set();
    const allNames = new Set();
    for (const info of Object.values(speakerInfo)) {
      const name = info.name;
      if (name) {
        allNames.add(name);
      }

      const tags = info.tags;
      if (tags) {
        if (!Array.isArray(tags)) {
          return res.status(400).send("Expect tags to be an array");
        }
        for (const tag of tags) {
          if (typeof(tag) !== 'string') {
            return res.status(400).send("Expect tags to be strings");
          }
          allTags.add(tag);
        }
      }
    }

    // Write audit log.
    try {
      const dbRoot = admin.database().ref(`/transcripts/${category}`);
      if ((await dbRoot.child('<enabled>').once('value')).val() !== 1) {
        return res.status(400).send("Invalid Category");
      }

      // Timestamp to close enough for txn id. Do not use PII as it is
      // by public.
      const txnId = `${(new Date).toISOString().split('.')[0]}Z`;
      const auditRef = dbRoot.child(`audit/${txnId}`);
      auditRef.set({
        name: 'speakerinfo POST',
        headers: req.headers,
        body: req.body,
        });

      const videoRef = dbRoot.child(`v/${videoId}/speakerInfo`);
      videoRef.set(speakerInfo);

      // Update the database stuff.
      const existingRef = dbRoot.child('existing');
      const existingOptions = (await existingRef.once('value')).val();
      // Add new tags.
      let existingOptionsUpdated = false;
      for (const name of allNames) {
        if (!Object.prototype.hasOwnProperty.call(existingOptions.names, name)) {
          existingOptions.names[name] = txnId;
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

      res.status(200).send(JSON.stringify({
        speakerInfo,
        existingTags: Object.keys(existingOptions.tags),
        existingNames: Object.keys(existingOptions.names)}));

    } catch(e) {
      console.error("Updating DB failed with: ", e);
      return res.status(500).send("Internal error");
    }
  }
);

exports.metadata = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'POST') {
       return res.status(400).send("Expects POST");
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers['content-type'] !== 'application/json') {
       return res.status(400).send("Expects JSON");
    }

    if (!req.body.category) {
      return res.status(400).send("Expects category");
    }

    if (req.body?.cmd === "regenerateMetadata") {
      try {
        await regenerateMetadata(req.body.category, req.body.limit);
      } catch (e) {
        console.error(e);
        return res.status(500).send("Exception");
      }
      return res.status(200).send("done");
    }
    if (req.body?.cmd === "migrate") {
      try {
        await migrate(req.body.category, req.body.limit);
      } catch (e) {
        console.error(e);
        return res.status(500).send("Exception");
      }
      return res.status(200).send("done");
    }

    return res.status(400).send("Unknown command");
  }
);
