import { MeiliSearch } from 'meilisearch'

export const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  //host: 'https://meilisearch-rdcihhc4la-uw.a.run.app',
  //apiKey: 'fcb72b464bc4d53e1e6b69a315607874daf5e9880b5f41c1bda96a4172dc3518',
  apiKey: '32ad7106c6a8b6b8fca7338eee1180f2770ff587ae188e9d6976633b181b5347',
  //apiKey: 'masterKey',
});

export const CATEGORY = 'sps-board';
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

