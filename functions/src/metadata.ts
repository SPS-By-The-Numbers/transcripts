import { getCategoryPublicDb, jsonOnRequest } from "./utils/firebase";
import { sanitizeCategory } from "./utils/path";
import { makeResponseJson } from "./utils/response";

import type { CategoryId, VideoId, VideoMetadata } from "common/params";

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

  // Otherwise return list metadata for the category based on search params.
  return res.status(200).send(makeResponseJson(true, "ok", getMatchingMetdata(req.query)));
}

async function getMetadataForVideo(category: CategoryId, videoId: VideoId) : Promise<VideoMetadata> {
  return (await getCategoryPublicDb(category)
      .child(`metadata`)
      .child(videoId)
      .once("value")).val();
}

async function getMatchingMetdata(query) : Promise<VideoMetadata[]> {
  // Two modes of operation.
  //  (1) (start_date, end_date)
  //  (2) most_recent X
  return new Array<VideoMetadata>();
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
