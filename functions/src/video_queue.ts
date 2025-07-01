import * as Constants from 'config/constants';
import { getCategoryPublicDb, getCategoryPrivateDb, getPubSubClient, jsonOnRequest, getAuthCode, getUser } from "./utils/firebase";

import { getVideosForCategory } from "./youtube.js";
import { makeResponseJson } from "./utils/response";
import { sanitizeCategory } from "./utils/path";
import { validateObj } from './utils/validation';

import type { UserRecord } from "./utils/firebase";

async function getVideoQueue(req, res) {
  const authCodeErrors = validateObj(req.query, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const auth_code = (await getAuthCode(req.query.user_id));
  if (req.query.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, `invalid auth_code`));
  }

  const new_vids = {};
  for (const category of Constants.ALL_CATEGORIES) {
    const category_vids = (await getCategoryPrivateDb(category).child("new_vids").once("value")).val();
    if (category_vids) {
      new_vids[category] = category_vids;
    } else {
      new_vids[category] = [];
    }
  }

  return res.status(200).send(makeResponseJson(true, "New vids", new_vids));
}

async function findNewVideos(req, res) {
  const all_new_vid_ids = new Array<string>;
  const all_queued_videos = new Array<string>;
  const add_ts = new Date();

  let limit = 0;
  // Can be empty in test and initial bootstrap.
  for (const category of Constants.ALL_CATEGORIES) {
    console.log(`Scraping ${category}`);
    try {
      const metadata_ref = getCategoryPublicDb(category, "metadata");
      const metadata_snapshot = await metadata_ref.once("value");
      const new_video_ids = {};

      for (const vid of await getVideosForCategory(category)) {
        if (req.body.limit && ++limit > req.body.limit) {
          break;
        }

        if ('id' in vid && (!metadata_snapshot.exists() || !metadata_snapshot.child(vid.id).exists())) {
          new_video_ids[vid.id] = {add: add_ts, lease_expires: "", vast_instance: ""};
        }
      }

      console.log(`${category} adding ${Object.keys(new_video_ids)}`);

      all_new_vid_ids.push(...Object.keys(new_video_ids));
      await getCategoryPrivateDb(category).child("new_vids").update(new_video_ids);
    } catch (e) {
      console.error(`Failed youtube scrape for ${category} ${e}`);
    }

    all_queued_videos.push(...Object.keys((await getCategoryPrivateDb(category).child("new_vids").once("value")).val()));
  }


  // If there are new video ids. Wake up the trasncription jobs.
  if (all_queued_videos) {
    await getPubSubClient().topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});
  }

  return res.status(200).send(makeResponseJson(true, "vids enqueued", all_new_vid_ids));
}

async function removeItem(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const auth_code = (await getAuthCode(req.body.user_id));
  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth_code"));
  }

  // TODO: validate video_ids.
  const requestErrors = validateObj(req.body, 'reqCategory');
  if (requestErrors.length) {
    return res.status(400).send(makeResponseJson(false, requestErrors.join(', ')));
  }

  const removes = new Array<Promise<void>>;
  for (const vid of req.body.video_ids) {
    removes.push(getCategoryPrivateDb(req.body.category).child("new_vids").child(vid).remove());
  }

  await Promise.all(removes);

  return res.status(200).send(makeResponseJson(true, "Items removed"));
}

async function removeVastInstance(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const auth_code = (await getAuthCode(req.body.user_id));
  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth_code"));
  }

  const vast_ref = getCategoryPrivateDb("_admin").child("vast").child(req.body.user_id);
  await vast_ref.remove();

  await getPubSubClient().topic("stop_transcribe_instance").publishMessage(
    {data: JSON.stringify({instance_ids: [req.body.user_id], remove_stale: true})});

  return res.status(200).send(makeResponseJson(true, "Instance removed"));
}

async function addNewVideo(req, res) {
  const category = sanitizeCategory(req.body.category);
  if (!category) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  let user : UserRecord;
  try {
    user = await getUser(req.body?.auth);
  } catch (error) {
    return res.status(401).send(makeResponseJson(false, "Did you forget to login?"));
  }

  if (!req.body.video_id.match(/^[0-9A-Za-z-]{11}$/)) {
    return res.status(400).send(makeResponseJson(false, "invalid video id"));
  }

  const txnId = `${(new Date).toISOString().split(".")[0]}Z`;
  const auditRef = getCategoryPrivateDb(category).child(`audit/${txnId}`);
  console.error("User ", user);
  auditRef.set({
    name: "video POST",
    headers: req.headers,
    body: req.body,
    email: user.email || "",
    emailVerified: user.emailVerified || false,
    uid: user.uid || "",
  });

  getCategoryPrivateDb(category).child("new_vids").update({
    [req.body.video_id]: {add: new Date(), lease_expires: "", vast_instance: ""},
  });
  await getPubSubClient().topic("start_transcribe").publishMessage({data: Buffer.from("boo!")});
  return res.status(200).send(makeResponseJson(true, `added ${req.body.video_id}`));
}

async function updateEntry(req, res) {
  const authCodeErrors = validateObj(req.body, 'authCodeParam');
  if (authCodeErrors.length) {
    return res.status(401).send(makeResponseJson(false, authCodeErrors.join(', ')));
  }

  const auth_code = (await getAuthCode(req.body.user_id));
  if (req.body.auth_code !== auth_code) {
    return res.status(401).send(makeResponseJson(false, "invalid auth_code"));
  }

  const category = sanitizeCategory(req.body.category);
  if (!category) {
    return res.status(400).send(makeResponseJson(false, "Expects category"));
  }

  // Give a 30 minute lease.
  const lease_expire_ts = new Date();
  lease_expire_ts.setTime(lease_expire_ts.getTime() + (40 * 60 * 1000));
  const now = new Date().toISOString();

  const queue_ref = getCategoryPrivateDb(category).child("new_vids");
  const existing_vids = (await queue_ref.once("value")).val();
  const all_sets = new Array<Promise<void>>;
  const updated_ids = new Array<string>;
  if (req.body.video_ids.length != 1) {
    return res.status(400).send(makeResponseJson(false, "only supports one video_ids"));
  }
  for (const vid of req.body.video_ids) {
    if (vid in existing_vids) {
      updated_ids.push(vid);
      if (existing_vids[vid].lease_expires > now) {
        return res.status(403).send(
          makeResponseJson(false, `${vid} leased until ${existing_vids[vid].lease_expires}`));
      }

      all_sets.push(queue_ref.child(vid).set(
        {...existing_vids[vid],
          vast_instance: req.body.user_id,
          lease_expires: lease_expire_ts.toISOString(),
        }));
    }
  }

  await Promise.all(all_sets);

  return res.status(200).send(makeResponseJson(true, "Items updated", {updated_ids}));
}

const video_queue = jsonOnRequest(
  {cors: true, region: [Constants.GCP_REGION], memory: "512MiB"},
  async (req, res) => {
    if (req.method === "GET") {
      return getVideoQueue(req, res);
    } else if (req.method === "PUT") {
      return addNewVideo(req, res);
    } else if (req.method === "POST") {
      return findNewVideos(req, res);
    } else if (req.method === "PATCH") {
      return updateEntry(req, res);
    } else if (req.method === "DELETE") {
      return removeItem(req, res);
    }

    return res.status(405).send(makeResponseJson(false, "Method Not Allowed"));
  }
);

const vast = jsonOnRequest(
  {cors: true, region: [Constants.GCP_REGION]},
  async (req, res) => {
    if (req.method === "DELETE") {
      return removeVastInstance(req, res);
    }

    return res.status(405).send(makeResponseJson(false, "Method Not Allowed"));
  }
);


export {video_queue, vast};
