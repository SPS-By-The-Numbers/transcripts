import { getCategoryPublicDb, jsonOnRequest } from "./utils/firebase";
import { makeResponseJson } from "./utils/response";

async function getMetadata(req, res) {
  const category = req.query.category;
  if (!category || category.length > 20) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  if (!req.query.videoId) {
    return res.status(400).send(makeResponseJson(false, "missing videoId"));
  }

  const result = (await getCategoryPublicDb(category)
      .child(`metadata`)
      .child(req.query.videoId)
      .once("value")).val();
  if (!result) {
     console.log("blah, ", result);
    return res.status(400).send(makeResponseJson(false, "no metadata for videoId"));
  }

  return res.status(200).send(makeResponseJson(true, "ok", result));
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
