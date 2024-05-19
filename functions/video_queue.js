import { onRequest } from "firebase-functions/v2/https";
import { makeResponseJson, getAllCategories } from './utils.js';
import { getCategoryPublicDb, getCategoryPrivateDb, getPubSubClient } from './firebase_utils.js';
import { getVideosForCategory } from './youtube.js';

const new_video_queue = onRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method !== 'GET') {
       return res.status(400).send(makeResponseJson(false, "Expects GET"));
    }

    const category = req.query.category;
    if (!category || category.length > 20) {
      return res.status(400).send(makeResponseJson(false, "Expects category"));
    }

    if (!req.query.user_id) {
      return res.status(400).send(makeResponseJson(false, "missing user_id"));
    }

    const auth_code = (await getCategoryPrivateDb(req.query.category)
        .child('vast').child(req.query.user_id).once("value")).val();

    if (req.query.auth_code !== auth_code) {
      return res.status(401).send(makeResponseJson(false, "invalid auth code"));
    }

    const new_vids = (await getCategoryPrivateDb(category).child('new_vids').once("value")).val();
    return res.status(200).send(makeResponseJson(true, "New vids", new_vids));
  }
);

const find_new_videos = onRequest(
  { cors: true, region: ["us-west1"] },
  // TODO: Move this into new_vids and distinguis POST vs GET.
  async (req, res) => {
    if (req.method !== 'GET') {
       return res.status(400).send(makeResponseJson(false, "Expects GET"));
    }

    const all_new_vid_ids = [];
    const add_ts = new Date();
    let limit = 0;
    // Can be empty in test and initial bootstrap.
    for (const category of getAllCategories()) {
      const metadata_ref = getCategoryPublicDb(category, 'metadata');
      const metadata_snapshot = (await metadata_ref).once("value");
      const new_video_ids = {};

      for (const vid of await getVideosForCategory(category)) {
        if (req.query.limit && ++limit > req.query.limit) {
          break;
        }

        if (!metadata_snapshot.child(vid.id).exists()) {
          new_video_ids[vid.id] =  { add: add_ts, start: "", instance: "" };
        }
      }

      all_new_vid_ids.push(...Object.keys(new_video_ids));
      getCategoryPrivateDb(category).child('new_vids').update(new_video_ids);
    }

    // If there are new video ids. Wake up the trasncription jobs.
    if (all_new_vid_ids) {
      await getPubSubClient().topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});
    }

    return res.status(200).send(makeResponseJson(true, "vids enqueued", all_new_vid_ids));
  }
);

export { new_video_queue, find_new_videos }
