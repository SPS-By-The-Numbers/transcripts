import { MeiliSearch } from 'meilisearch'

export const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  //host: 'https://meilisearch-rdcihhc4la-uw.a.run.app',
   apiKey: 'fcb72b464bc4d53e1e6b69a315607874daf5e9880b5f41c1bda96a4172dc3518', // Read
  //apiKey: '4b1daea39477fa19f03762276bf69fd3ce1618ee5fd7a9bd97ff5d5999e4c7d0', // Write
  //apiKey: 'masterKey',
});

//export const CATEGORY = 'sps-board';
export const CATEGORY = 'seattle-city-council';
export const CATEGORY_ORIG_LANG = 'eng';
export const INDEX_NAME = `${CATEGORY}-${CATEGORY_ORIG_LANG}`;

// An index is where the documents are stored.
export const index = client.index(INDEX_NAME)

export type Document = {
  id : string,
  sentenceGroup : string,
  text: string,
  start: string,
  end: string,
};

