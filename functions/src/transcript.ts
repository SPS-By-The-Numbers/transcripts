import * as Constants from 'config/constants';
import langs from 'langs';
import { DiarizedTranscript } from 'common/transcript';
import { getAuthCode, jsonOnRequest } from './utils/firebase';
import { getStorageAccessor } from './utils/storage';
import { scrapeMetadata, setMetadata } from './utils/metadata';
import { makeResponseJson } from './utils/response';
import { validateObj } from './utils/validation';

import type { WhisperXTranscript } from 'common/whisperx';
import type { Iso6393Code, VideoId } from 'common/params';

const LANGUAGES = new Set<Iso6393Code>(["eng"]);

async function ensureMetadata(req, videoId) {
  // If there is a manually constructed metadata, just send it.
  if (req.body.metadata) {
    return req.body.metadata;
  }
  return await scrapeMetadata(videoId);
}

async function uploadTrancript(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const auth_code = (await getAuthCode(req.body.user_id));
  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth_code"));
  }

  // Check request to ensure it looks like valid JSON request.
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).send(makeResponseJson(false, "Expects JSON"));
    return;
  }

  const requestErrors = validateObj(req.body, 'uploadTranscriptRequest');
  if (requestErrors.length) {
    console.log("Failed validation: ", requestErrors);
    return res.status(400).send(makeResponseJson(false, requestErrors.join(', ')));
  }

  const videoId = req.body.video_id;
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
    console.log("Saved video: ", videoId, " language: ", lang);
    const diarizedTranscript = await DiarizedTranscript.fromWhisperX(
        req.body.category, videoId, whisperXTranscript);
    diarizedTranscript.writeSentenceTable(getStorageAccessor(), lang);
    diarizedTranscript.writeDiarizedTranscript(getStorageAccessor());
  }

  const metadata = await ensureMetadata(req, videoId);

  if (!(await setMetadata(req.body.category, metadata))) {
    console.log("Failed setting metadata: ", metadata);
    res.status(500).send(makeResponseJson(false, "Unable to set metadata"));
    return;
  }

  res.status(200).send(makeResponseJson(true, "update done"));
}

async function downloadTranscript(req, res) {
  const requestErrors = validateObj(req.query, 'reqCategory', 'reqVideoId');
  if (requestErrors.length) {
    return res.status(400).send(makeResponseJson(false, requestErrors.join(', ')));
  }
  const videoId : VideoId = req.query.video_id;

  const diarizedTranscript = await DiarizedTranscript.fromStorage(
      getStorageAccessor(), req.query.category, videoId, ['eng']);
  const sentences = new Array<string>;
  for (const [_, segmentId] of diarizedTranscript.sentenceInfo) {
    sentences.push(diarizedTranscript.languageToSentenceTable['eng'][segmentId]);
  }
  res.status(200).send(makeResponseJson(true, 'transcript', {sentences}));
}

const transcript = jsonOnRequest(
  {cors: true, region: [Constants.GCP_REGION]},
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
