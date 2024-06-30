import isEqual from "lodash.isequal";
import { getCategoryPublicDb, getCategoryPrivateDb, getUser, jsonOnRequest } from "./utils/firebase";
import { makeResponseJson } from "./utils/response";

// POST to speaker info with JSON body of type:
// {
//    "videoId": "abcd",
//    "speakerInfo": { "SPEAKER_00": { "name": "some name", "tags": [ "parent", "ptsa" ] }
// }
const speakerinfo = jsonOnRequest(
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

    let user;
    try {
      user = getUser(req.body?.auth);
    } catch (error) {
      res.status(401).send(makeResponseJson(false, "Did you forget to login?"));
      return;
    }

    const category = req.body?.category;
    if (!category || category.length > 20) {
      res.status(400).send(makeResponseJson(false, "Invalid Category"));
      return;
    }

    const videoId = req.body?.videoId;
    if (!videoId || videoId.length > 12) {
      if (Buffer.from(videoId, "base64").toString("base64") !== videoId) {
        res.status(400).send(makeResponseJson(false, "Invalid VideoID"));
        return;
      }
    }

    const speakerInfo = req.body?.speakerInfo;
    if (!speakerInfo) {
      res.status(400).send(makeResponseJson(false, "Expect speakerInfo"));
      return;
    }

    // Validate request structure.
    const allTags = new Set<string>();
    const allNames = new Set<string>();
    const recentTagsForName = {};
    for (const info of Object.values(speakerInfo) as {name: string, tags: string[]}[]) {
      const name = info.name;
      if (name) {
        allNames.add(name);
      }

      const tags = info.tags;
      if (tags) {
        if (!Array.isArray(tags)) {
          res.status(400).send(makeResponseJson(false, "Expect tags to be an array"));
          return;
        }
        if (name) {
          recentTagsForName[name] = [...(new Set(tags))];
        }
        for (const tag of tags) {
          if (typeof(tag) !== "string") {
            res.status(400).send(makeResponseJson(false, "Expect tags to be strings"));
            return;
          }
          allTags.add(tag);
        }
      }
    }

    // Write audit log.
    try {
      const privateRoot = getCategoryPrivateDb(category);
      const publicRoot = getCategoryPublicDb(category);
      if ((await publicRoot.child("<enabled>").once("value")).val() !== 1) {
        res.status(400).send(makeResponseJson(false, "Invalid Category"));
        return;
      }

      // Timestamp to close enough for txn id. Do not use PII as it is
      // by public.
      const txnId = `${(new Date).toISOString().split(".")[0]}Z`;
      const auditRef = privateRoot.child(`audit/${txnId}`);
      console.error("User ", user);
      auditRef.set({
        name: "speakerinfo POST",
        headers: req.headers,
        body: req.body,
        email: user.email || "",
        emailVerified: user.emailVerified || false,
        uid: user.uid || "",
      });

      const videoRef = publicRoot.child(`v/${videoId}/speakerInfo`);
      videoRef.set(speakerInfo);

      // Update the database stuff.
      const existingRef = publicRoot.child("existing");
      const existingOptions = (await existingRef.once("value")).val();

      // Add new tags.
      let existingOptionsUpdated = false;
      for (const name of allNames) {
        const recentTags = recentTagsForName[name];
        if (!Object.prototype.hasOwnProperty.call(existingOptions.names, name) ||
            (recentTags && !isEqual(existingOptions.names[name].recentTags, recentTags))) {
          existingOptions.names[name] = {txnId, recentTags: recentTags || []};
          existingOptionsUpdated = true;
        }
      }
      for (const tag of allTags) {
        if (!Object.prototype.hasOwnProperty.call(existingOptions.tags, tag)) {
          existingOptions.tags[tag] = txnId;
          existingOptionsUpdated = true;
        }
      }
      if (existingOptionsUpdated) {
        existingRef.set(existingOptions);
      }

      res.status(200).send(makeResponseJson(true, "success",
        {speakerInfo,
          existingTags: Object.keys(existingOptions.tags),
          existingNames: Object.keys(existingOptions.names)}));
    } catch (e) {
      console.error("Updating DB failed with: ", e);
      res.status(500).send(makeResponseJson(false, "Internal error"));
    }
  }
);

export { speakerinfo };
