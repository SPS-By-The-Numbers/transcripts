import { MeiliSearch } from 'meilisearch'

export const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  //host: 'https://meilisearch-rdcihhc4la-uw.a.run.app',
//  apiKey: 'fcb72b464bc4d53e1e6b69a315607874daf5e9880b5f41c1bda96a4172dc3518', // Read
  //apiKey: '4b1daea39477fa19f03762276bf69fd3ce1618ee5fd7a9bd97ff5d5999e4c7d0', // Write
  apiKey: 'masterKey',
});

export function getIndexName(category: CategoryId, lang: Iso6393Code) {
  return`${category}-${lang}`;
}

export function getIndex(category: CategoryId, lang: Iso6393Code) {
  return client.index(getIndexName(category, lang));
}

export async function deleteIndex(category: CategoryId, lang: Iso6393Code) {
  const task = await client.deleteIndex(getIndexName(category, lang));
  await client.waitForTask(task.taskUid);
}

export async function createIndex(category: CategoryId, lang: Iso6393Code) {
  const task = await client.createIndex(getIndexName(category, lang), {primaryKey: 'id'});
  await client.waitForTask(task.taskUid);
}
