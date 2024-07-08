// Recreate the published index.
import * as Constants from 'config/constants';
import { getCategoryPublicDb } from "utils/firebase";
import { makePublishedIndexKey, PUBLISHED_INDEX_PATH } from "utils/metadata";
import { doAuth } from './auth';

import type { StoredMetadata } from "utils/metadata";

doAuth();

type PublishedIndex = {
  [ id: string ]: object;
};

for (const category of Constants.ALL_CATEGORIES) {
  const allMetadata = (await getCategoryPublicDb(category, 'metadata').once("value")).val();
  const published : PublishedIndex = {};
  for (const metadata of Object.values(allMetadata) as Array<StoredMetadata>) {
    published[makePublishedIndexKey(metadata)] = metadata;
  }
  console.log(`Writing ${category}`);
  await getCategoryPublicDb(category, PUBLISHED_INDEX_PATH).set(published);
  console.log("Write done.");
}

process.exit(0);
