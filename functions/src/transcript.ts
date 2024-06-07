import {Stream} from "stream";
import * as lzma from "lzma-native";
import {onRequest} from "firebase-functions/v2/https";
import {createGzip} from "zlib";
import {pipeline} from "node:stream/promises";

import {getDefaultBucket, getCategoryPublicDb, getAuthCode} from "./utils/firebase";
import {makeDiarizedTranscriptsPath} from "../../utilities/transcript";
import {makeResponseJson} from "./utils/response";
import {makeWhisperXTranscriptsPath} from "./utils/path";
import type {WhisperXTranscript} from "./utils/whisperx";
import {toDiarizedTranscript} from "./utils/whisperx";


const LANGUAGES = new Set(["en"]);

async function writeToStorage(path: string, filter: any, contents: string, fileOptions: object = {}) {
  const file = getDefaultBucket().file(path);
  const passthroughStream = new Stream.PassThrough();
  passthroughStream.write(contents);
  passthroughStream.end();
  await pipeline(passthroughStream, filter, file.createWriteStream(fileOptions));
}

const transcript = onRequest(
  {cors: true, region: ["us-west1"]},
  async (req, res) => {
    try {
      if (req.method !== "PUT") {
        res.status(400).send(makeResponseJson(false, "Expects PUT"));
        return;
      }

      // Check request to ensure it looks like valid JSON request.
      if (req.headers["content-type"] !== "application/json") {
        res.status(400).send(makeResponseJson(false, "Expects JSON"));
        return;
      }

      if (!req.body.user_id) {
        res.status(400).send(makeResponseJson(false, "missing user_id"));
        return;
      }

      const category = req.body.category;
      if (!category || category.length > 20) {
        res.status(400).send(makeResponseJson(false, "Expects category"));
        return;
      }

      if (!req.body.vid) {
        res.status(400).send(makeResponseJson(false, "Missing vid"));
        return;
      }

      const auth_code = (await getAuthCode(req.body.user_id));

      if (req.body.auth_code !== auth_code) {
        res.status(401).send(makeResponseJson(false, "invalid auth code"));
        return;
      }

      const transcripts = req.body.transcripts || {};
      for (const lang of Object.keys(transcripts)) {
        if (!LANGUAGES.has(lang)) {
          res.status(400).send(makeResponseJson(false, `Unknown language ${lang}`));
          return;
        }
      }

      for (const [lang, whisperXTranscript] of Object.entries(transcripts) as [string, WhisperXTranscript][]) {
        const diarizedTranscript = toDiarizedTranscript(whisperXTranscript, false);

        const archivePath = makeWhisperXTranscriptsPath(category, req.body.vid, lang);
        const whisperXTranscriptJson = JSON.stringify(whisperXTranscript);
        console.log(`Writing ${lang} json with ${whisperXTranscriptJson.length} to ${archivePath}`);
        await writeToStorage(archivePath, lzma.createCompressor({preset: lzma.PRESET_EXTREME}), whisperXTranscriptJson);

        const diarizedJson = JSON.stringify(diarizedTranscript);
        const diarizedPath = makeDiarizedTranscriptsPath(category, req.body.vid, lang);
        console.log(`Writing ${lang} json with ${diarizedJson.length} to ${diarizedPath}`);
        await writeToStorage(diarizedPath, createGzip({level: 9}), diarizedJson, {metadata: {contentEncoding: "gzip"}});
      }

      if (req.body.metadata && !setMetadata(req.body.category, req.body.metadata)) {
        res.status(500).send(makeResponseJson(false, "Internal error"));
        return;
      }

      res.status(200).send(makeResponseJson(true, "update done"));
      return;
    } catch (e) {
      console.error("Transcript fail: ", e);
      res.status(500).send(makeResponseJson(false, "Internal error"));
      return;
    }
  }
);

function setMetadata(category, metadata) {
  const category_public = getCategoryPublicDb(category);
  if (!metadata || !metadata["video_id"]) {
    console.log("Invalid metadata: ", metadata);
    return false;
  }

  const video_id = metadata["video_id"];
  category_public.child("metadata").child(video_id).set(metadata);

  // Add to the index.
  const published = new Date(metadata["publish_date"]).toISOString().split("T")[0];
  category_public.child("index").child("date").child(published)
    .child(video_id).set(metadata);

  return true;
}

const metadata = onRequest(
  {cors: true, region: ["us-west1"]},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(400).send(makeResponseJson(false, "Expects POST"));
      return;
    }

    // Check request to ensure it looks like valid JSON request.
    if (req.headers["content-type"] !== "application/json") {
      res.status(400).send(makeResponseJson(false, "Expects JSON"));
      return;
    }

    if (!req.body.category) {
      res.status(400).send(makeResponseJson(false, "Expects category"));
      return;
    }

    if (req.body.cmd === "set") {
      if (!req.body?.metadata || !Object.keys(req.body.metadata).length) {
        res.status(400).send(makeResponseJson(false, "missing metadata"));
        return;
      }
      if (!setMetadata(req.body.category, req.body.metadata)) {
        res.status(500).send(makeResponseJson(false, "Internal error"));
        return;
      }

      res.status(200).send(
        makeResponseJson(
          true,
          `Added metadata for ${Object.keys(req.body.metadata)}`));
      return;
    }

    res.status(400).send("Unknown command");
    return;
  }
);

export {metadata, transcript};
