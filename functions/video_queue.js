import { makeResponseJson, getAllCategories, sanitizeCategory } from './utils.js';
import { getCategoryPublicDb, getCategoryPrivateDb, getPubSubClient, jsonOnRequest } from './firebase_utils.js';
import { getVideosForCategory } from './youtube.js';

async function getAuthCode(user_id) {
  return (await getCategoryPrivateDb('_admin')
      .child('vast').child(user_id).child('password').once("value")).val();
}

async function getVideoQueue(req, res) {
  if (!req.query.user_id) {
    return res.status(400).send(makeResponseJson(false, "missing user_id"));
  }

  const auth_code = (await getAuthCode(req.query.user_id));

  if (req.query.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth code"));
  }

  const new_vids = {};
  for (const category of getAllCategories()) {
    const category_vids = (await getCategoryPrivateDb(category).child('new_vids').once("value")).val();
    if (category_vids) {
      new_vids[category] = category_vids;
    } else {
      new_vids[category] = [];
    }
  }

  return res.status(200).send(makeResponseJson(true, "New vids", new_vids));
}

async function findNewVideos(req, res) {
  const all_new_vid_ids = [];
  const add_ts = new Date();

  let limit = 0;
  // Can be empty in test and initial bootstrap.
  for (const category of getAllCategories()) {
    const metadata_ref = getCategoryPublicDb(category, 'metadata');
    const metadata_snapshot = await metadata_ref.once("value");
    const new_video_ids = {};

    for (const vid of await getVideosForCategory(category)) {
      if (req.body.limit && ++limit > req.body.limit) {
        break;
      }

      if (!metadata_snapshot || !metadata_snapshot.child(vid.id).exists()) {
        new_video_ids[vid.id] =  { add: add_ts, lease_expires: "", vast_instance: "" };
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

async function removeItem(req, res) {
  const category = sanitizeCategory(req.body.category);
  if (!category) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  // TODO: Extract this auth check.
  if (!req.body.user_id) {
    return res.status(400).send(makeResponseJson(false, "missing user_id"));
  }

  const auth_code = (await getCategoryPrivateDb('_admin')
      .child('vast').child(req.body.user_id).once("value")).val();

  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth code"));
  }

  const removes = []
  for (const vid of req.body.video_ids) {
    removes.push(getCategoryPrivateDb(category).child('new_vids').child(vid).remove());
  }

  await Promise.all(removes);

  return res.status(200).send(makeResponseJson(true, "Items removed"));
}

async function removeVastInstance(req, res) {
  // TODO: Extract this auth check.
  if (!req.body.user_id) {
    return res.status(400).send(makeResponseJson(false, "missing user_id"));
  }

  const vast_ref = getCategoryPrivateDb('_admin').child('vast').child(req.body.user_id);
  const auth_code = (await getAuthCode(req.query.user_id));

  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth code"));
  }

  await vast_ref.remove();

  return res.status(200).send(makeResponseJson(true, "Instance removed"));
}

async function updateEntry(req, res) {
  const category = sanitizeCategory(req.body.category);
  if (!category) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  // TODO: Extract this auth check.
  if (!req.body.user_id) {
    return res.status(400).send(makeResponseJson(false, "missing user_id"));
  }

  const auth_code = (await getAuthCode(req.query.user_id));

  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth code"));
  }

  const lease_expire_ts = new Date();
  lease_expire_ts.setTime(lease_expire_ts.getTime() + (2*60*60*1000));

  const queue_ref = getCategoryPrivateDb(category).child('new_vids');
  const existing_vids = (await queue_ref.once("value")).val();
  const all_sets = [];
  const updated_ids = [];
  for (const vid of req.body.video_ids) {
    if (vid in existing_vids) {
      updated_ids.push(vid);
      all_sets.push(queue_ref.child(vid).set(
            { ...existing_vids[vid],
              vast_instance: req.body.user_id,
              lease_expires: lease_expire_ts.toISOString(),
            }));
    }
  }

  await Promise.all(all_sets);

  return res.status(200).send(makeResponseJson(true, "Items updated", {updated_ids}));
}

const video_queue = jsonOnRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method === 'GET') {
       return getVideoQueue(req, res);
    } else if (req.method === 'POST') {
       return findNewVideos(req, res);
    } else if (req.method === 'PATCH') {
       return updateEntry(req, res);
    } else if (req.method === 'DELETE') {
       return removeItem(req, res);
    }

    return res.status(405).send(makeResponseJson(false, 'Method Not Allowed'));
  }
);

const vast = jsonOnRequest(
  { cors: true, region: ["us-west1"] },
  async (req, res) => {
    if (req.method === 'DELETE') {
       return removeVastInstance(req, res);
    }

    return res.status(405).send(makeResponseJson(false, 'Method Not Allowed'));
  }
);


export { video_queue, vast }
