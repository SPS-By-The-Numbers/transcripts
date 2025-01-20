import * as Constants from 'config/constants';

import { deleteIndex, createIndex, getIndex } from './client.mts';
import { MeiliSearch } from 'meilisearch';
import stopWords from 'stopwords-en';

import type { Settings } from 'meilisearch';

async function updateSettings(category: CategoryId, lang: Iso6393Code) {
  console.log("Updating Settings");
  const index = getIndex(category, lang);

  const newSettings: Settings = {
    distinctAttribute: 'videoId',
    proximityPrecision: 'byWord',
    searchableAttributes: ['text', 'videoId', 'start', 'end', 'transcribeDate', 'publishDate', 'title', 'speaker', 'tags'],
    filterableAttributes: ['id', 'transcribeDate', 'publishDate', 'speaker', 'tags'],
    sortableAttributes: ['videoId', 'start', 'end', 'publishDate', 'transcribeDate', 'speaker', 'tags'],
    stopWords,
  };
  console.log('new settings ', newSettings);

  console.log('update result: ', await index.updateSettings(newSettings));
}

async function recreate(category: CategoryId, lang: Iso6393Code) {
  await deleteIndex(category, lang);
  await createIndex(category, lang);
}

async function main() {
  for (const category of Constants.ALL_CATEGORIES) {
    if (process.argv[2] === 'recreate') {
      console.log("recreateing: " + category);
      await recreate(category, 'eng');
    }

    await updateSettings(category, 'eng');
  }
}

await main();
process.exit(0);

