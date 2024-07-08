import { getCategoryPublicDb, jsonOnRequest } from "./utils/firebase";
import { makeResponseJson } from "./utils/response";
import { parseISO } from 'date-fns';
import { sanitizeCategory } from "./utils/path";

type MatchOptions = {
  limit? : number;
  startDate? : Date;
  endDate? : Date;
};

import type { CategoryId, VideoId, VideoMetadata } from "common/params";

function metadataToVideoMetadata(entry: any): VideoMetadata {
    return {
        videoId: entry.video_id,
        title: entry.title,
        description: entry.description,
        publishDate: parseISO(entry.publish_date),
        channelId: entry.channel_id
    };
}

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
    matchOptions.limit = req.query.limit;
  }

  // Parse into dates as a validation step.
  if (req.query.start_date) {
    matchOptions.startDate = parseISO(req.query.start_date);
  }
  if (req.query.end_date) {
    matchOptions.endDate = parseISO(req.query.end_date);
  }

  // Otherwise return list metadata for the category based on search params.
  return res.status(200).send(makeResponseJson(true, "ok", await getMatchingMetdata(category, matchOptions)));
}

async function getMetadataForVideo(category: CategoryId, videoId: VideoId) : Promise<VideoMetadata> {
  return (await getCategoryPublicDb(category, 'metadata', videoId).once("value")).val();
}

async function getMatchingMetdata(category: CategoryId, matchOptions : MatchOptions) : Promise<VideoMetadata[]> {
  // Two modes of operation: With dates or without.
  // If there are no dates, the most recent LIMIT_RESULTS is returned.
  // If there are are dates, there is no limit assumed unless one is passed in.
  let query = getCategoryPublicDb(category, 'index', 'publish_date').orderByKey();
  if (matchOptions.startDate) {
    query = query.startAt(matchOptions.startDate.toISOString());
  }
  if (matchOptions.endDate) {
    query = query.endAt(matchOptions.endDate.toISOString());
  }
  if (matchOptions.limit) {
    query = query.limitToLast(matchOptions.limit);
  }
  return Object.values((await query.once("value")).val()).map(v => metadataToVideoMetadata(v));
}

export const metadata = jsonOnRequest(
  {cors: true, region: ["us-west1"]},
  async (req, res) => {
    if (req.method === "GET") {
      return getMetadata(req, res);
    }

    return res.status(405).send(makeResponseJson(false, "Method Not Allowed"));
  }
);
