// This recreates the meilisearch index for all transcripts in all categories.

import * as Contstants from 'config/constants';
import { indexVideos } from './index.mts';
import { getAllMetadata } from 'utilities/client/metadata';
import fs from 'node:fs';

import type { CategoryId } from 'common/params';

async function recreateCategory(category: CategoryId) {
  const allMetadata = await getAllMetadata(category);
  await indexVideos(category, 'eng', allMetadata.map(m => m.videoId), allMetadata);
}

async function main() {
  for (const category of Contstants.ALL_CATEGORIES) {
    await recreateCategory(category);
  }
}

await main();
process.exit(0);
