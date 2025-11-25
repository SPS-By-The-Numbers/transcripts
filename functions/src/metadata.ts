import * as Constants from 'config/constants';
import { decodeDate } from 'common/params';
import { getCategoryPublicDb, jsonOnRequest } from "./utils/firebase";
import { getMatchingMetdata, setMetadata, scrapeMetadata, unindexMetadata } from "./utils/metadata";
import { makeResponseJson } from "./utils/response";
import { sanitizeCategory } from "./utils/path";
import { validateObj } from './utils/validation';

import type { CategoryId, VideoId } from "common/params";
import type { StoredMetadata, MatchOptions } from "./utils/metadata";

async function getMetadata(req, res) {
  const category = sanitizeCategory(req.query.category);
  if (!category || category.length > 20) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  // Handle specific lookup.
  if (req.query.videoId) {
    const metadata = await getMetadataForVideo(req.query.category, req.query.videoId);
    if (!metadata) {
      console.warn("No metadata for ", req.query.videoId);
      return res.status(400).send(makeResponseJson(false, "no metadata for videoId"));
    }

    return res.status(200).send(makeResponseJson(true, "ok", metadata));
  }

  // Otherwise this is in matching mode.
  const matchOptions : MatchOptions = {};
  if (req.query.limit) {
    matchOptions.limit = parseInt(req.query.limit);
  }

  // Parse into dates as a validation step.
  if (req.query.start) {
    matchOptions.startDate = decodeDate(req.query.start);
  }
  if (req.query.end) {
    const endDate = decodeDate(req.query.end);
    // Move to day after to get all before.
    endDate.setDate(endDate.getDate() + 1);
    matchOptions.endDate = endDate;
  }

  // Otherwise return list metadata for the category based on search params.
  return res.status(200).send(makeResponseJson(true, "ok", await getMatchingMetdata(category, matchOptions)));
}

async function replaceMetadata(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const requestErrors = validateObj(req.body, 'uploadMetadataRequest');
  if (requestErrors.length) {
    console.log("Failed validation: ", requestErrors);
    return res.status(400).send(makeResponseJson(false, requestErrors.join(', ')));
  }

  setMetadata(req.body.category, req.body.metadata)
  return res.status(200).send(makeResponseJson(true, "ok"));
}

async function rescrapeMetadata(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const requestErrors = validateObj(req.body, 'scrapeMetadataRequest');
  if (requestErrors.length) {
    console.log("Failed validation: ", requestErrors);
    return res.status(400).send(makeResponseJson(false, requestErrors.join(', ')));
  }

  const videoId = req.body.video_id;
  const category = req.body.category;

  const oldMetadata = await getMetadataForVideo(category, videoId);
  if (!oldMetadata) {
    return res.status(404).send(makeResponseJson(false, `Could not find ${videoId} in ${category}`));
  }

  const newMetadata = await scrapeMetadata(videoId);

  console.log(`Redoing metadata for ${category} ${videoId}, ${newMetadata.title} ${newMetadata.publish_date}`)
  await unindexMetadata(category, oldMetadata)
  await setMetadata(category, newMetadata)
  return res.status(200).send(makeResponseJson(true, "ok", {oldMetadata, newMetadata}));
}

async function getMetadataForVideo(category: CategoryId, videoId: VideoId) : Promise<StoredMetadata> {
  return (await getCategoryPublicDb(category, 'metadata', videoId).once("value")).val();
}

export const metadata = jsonOnRequest(
  {cors: true, region: [Constants.GCP_REGION], memory: "512MiB"},
  async (req, res) => {
    if (req.method === "GET") {
      return getMetadata(req, res);
    } else if (req.method === "POST") {
      return replaceMetadata(req, res);
    } else if (req.method === "PUT") {
      return rescrapeMetadata(req, res);
    }

    return res.status(405).send(makeResponseJson(false, "Method Not Allowed"));
  }
);
