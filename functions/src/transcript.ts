import langs from 'langs';
import { DiarizedTranscript } from 'common/transcript';
import { getCategoryPublicDb, getAuthCode, jsonOnRequest } from './utils/firebase';
import { getStorageAccessor } from './utils/storage';
import { makeResponseJson } from './utils/response';

import type { WhisperXTranscript } from 'common/whisperx';
import type { Iso6393Code, VideoId } from 'common/params';

const LANGUAGES = new Set<Iso6393Code>(["eng"]);

async function uploadTrancript(req, res) {
  if (!req.body.user_id) {
    console.log("No UserId");
    res.status(401).send(makeResponseJson(false, "missing user_id"));
    return;
  }

  const auth_code = (await getAuthCode(req.body.user_id));
  if (req.body.auth_code !== auth_code) {
    console.log("invalid Auth code");
    res.status(401).send(makeResponseJson(false, "invalid auth_code"));
    return;
  }

  // Check request to ensure it looks like valid JSON request.
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).send(makeResponseJson(false, "Expects JSON"));
    return;
  }

  const category = req.body.category;
  if (!category || category.length > 20) {
    console.log("Missing category");
    res.status(400).send(makeResponseJson(false, "Expects category"));
    return;
  }

  if (!req.body.vid) {
    console.log("Missing vid");
    res.status(400).send(makeResponseJson(false, "Missing vid"));
    return;
  }

  const transcripts = req.body.transcripts || {};
  for (const iso6391Lang of Object.keys(transcripts)) {
    const lang : Iso6393Code = langs.where('1', iso6391Lang)['3'];
    if (!LANGUAGES.has(lang)) {
      console.log("Unknown language: ", iso6391Lang);
      res.status(400).send(makeResponseJson(false, `Unknown language ${lang}`));
      return;
    }
  }

  for (const [iso6391Lang, whisperXTranscript] of Object.entries(transcripts) as [Iso6393Code, WhisperXTranscript][]) {
    const lang : Iso6393Code = langs.where('1', iso6391Lang)['3'];
    console.log("Saved vid: ", req.body.vid, " langage: ", lang);
    const diarizedTranscript = await DiarizedTranscript.fromWhisperX(
        category, req.body.vid, whisperXTranscript);
    diarizedTranscript.writeSentenceTable(getStorageAccessor(), lang);
    diarizedTranscript.writeDiarizedTranscript(getStorageAccessor());
  }

  if (req.body.metadata && !setMetadata(req.body.category, req.body.metadata)) {
    console.log("Failed setting metadata: ", req.body);
    res.status(500).send(makeResponseJson(false, "Internal error"));
    return;
  }

  res.status(200).send(makeResponseJson(true, "update done"));
}

async function downloadTranscript(req, res) {
  const category = req.query.category;
  if (!category || category.length > 20) {
    res.status(400).send(makeResponseJson(false, "Expects category"));
    return;
  }

  if (!req.query.vid) {
    res.status(400).send(makeResponseJson(false, "Missing vid"));
    return;
  }
  const videoId : VideoId = req.query.vid;

  const diarizedTranscript = await DiarizedTranscript.fromStorage(getStorageAccessor(), category, videoId, ['eng']);
  console.log(diarizedTranscript);
  const sentences = new Array<string>;
  for (const [_, segmentId] of diarizedTranscript.sentenceMetadata) {
    sentences.push(diarizedTranscript.languageToSentenceTable['eng'][segmentId]);
  }
  res.status(200).send(makeResponseJson(true, 'transcript', {sentences}));
}

function setMetadata(category, metadata) {
  if (!metadata || !metadata["video_id"]) {
    console.log("Invalid metadata: ", metadata);
    return false;
  }

  const video_id = metadata["video_id"];
  const category_public = getCategoryPublicDb(category);
  category_public.child("metadata").child(video_id).set(metadata);

  // Add to the index.
  const published = new Date(metadata["publish_date"]).toISOString().split("T")[0];
  category_public.child("index").child("date").child(published)
    .child(video_id).set(metadata);

  return true;
}

const transcript = jsonOnRequest(
  {cors: true, region: ["us-west1"]},
  async (req, res) => {
    if (req.method === "GET") {
      return downloadTranscript(req, res);
    } else if (req.method === "PUT") {
      return uploadTrancript(req, res);
    }

    return res.status(405).send(makeResponseJson(false, "Method Not Allowed"));
  }
);

export { transcript };
