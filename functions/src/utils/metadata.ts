import { getCategoryPublicDb } from 'utils/firebase';

import type { CategoryId, VideoId } from 'common/params';
import { parseISO } from 'date-fns';

export type StoredMetadata = {
  title: string;
  video_id: string;
  channel_id: string;
  description: string;
  publish_date: string;
};

export const PUBLISHED_INDEX_PATH = 'index/published';

export function makePublishedIndexKey(metadata : StoredMetadata) {
  return `${metadata.publish_date};${metadata.video_id}`;
}

export function splitPublishedIndexKey(key : string) : [Date, VideoId] {
  const [dateString, videoId] = key.split(';');

  return [parseISO(dateString), videoId];
}

export async function indexMetadata(category : CategoryId, metadata : StoredMetadata) {
  getCategoryPublicDb(category, PUBLISHED_INDEX_PATH, makePublishedIndexKey(metadata)).set(metadata);
}

export async function setMetadata(category : CategoryId, metadata : StoredMetadata) {
  if (!metadata || !metadata.video_id) {
    console.error("Invalid metadata: ", metadata);
    return false;
  }

  try {
    let promises : Array<Promise<unknown>> = [];
    promises.push(getCategoryPublicDb(category, 'metadata', metadata.video_id).set(metadata));
    promises.push(indexMetadata(category, metadata));

    await Promise.all(promises);
    return true;
  } catch (e) {
    console.error("Unable to set metadata: ", e);
  }

  return false;
}
