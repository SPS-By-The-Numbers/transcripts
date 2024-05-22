import stream from 'stream';
import { onRequest } from "firebase-functions/v2/https";
import { createGzip } from 'zlib'
import { pipeline } from 'node:stream/promises';

import { getDefaultBucket } from './firebase_utils.js';
import { makeResponseJson, makePublicPath } from './utils.js';
import { getCategoryPublicDb, getAuthCode } from './firebase_utils.js';

const LANGUAGES = new Set(['en']);

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

      const auth_code = (await getAuthCode(req.body.user_id));

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
        const bucket = getDefaultBucket();
        const filename = makePublicPath(category, `${req.body.vid}.${lang}.json`);
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

export { metadata, transcript };
