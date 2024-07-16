import { client, index, INDEX_NAME } from './client.mts';
import { MeiliSearch } from 'meilisearch';
import stopWords from 'stopwords-en';

import type { Settings } from 'meilisearch';

if (process.argv[2] === 'recreate') {
  const deleteTask = await client.deleteIndex(INDEX_NAME);
  console.log(deleteTask);
  await client.waitForTask(deleteTask.taskUid);

  const createTask = await client.createIndex(INDEX_NAME, {primaryKey: 'id'});
  console.log(createTask);
  await client.waitForTask(createTask.taskUid);
}

console.log("Updating Settings");
const newSettings: Settings = {
  distinctAttribute: 'videoId',
  proximityPrecision: 'byWord',
  searchableAttributes: ['text', 'videoId', 'start', 'end', 'transcribeDate', 'publishDate', 'title'],
  sortableAttributes: ['start', 'end', 'publishDate', 'transcribeDate'],
  stopWords,
};
console.log('new settings ', newSettings);

console.log('update settings: ', await index.updateSettings(newSettings));

