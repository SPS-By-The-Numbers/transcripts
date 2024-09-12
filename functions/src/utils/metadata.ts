import { getCategoryPublicDb } from 'utils/firebase';
import { parseISO } from 'date-fns';

import type { CategoryId, VideoId, VideoMetadata } from 'common/params';

export type MatchOptions = {
  limit? : number;
  startDate? : Date;
  endDate? : Date;
};

export type StoredMetadata = {
  title : string;
  video_id : string;
  channel_id : string;
  description : string;
  publish_date : string;
  _updated? : string;
};

export const PUBLISHED_INDEX_PATH = 'index/published';

function metadataToVideoMetadata(entry: StoredMetadata): VideoMetadata {
    return {
        videoId: entry.video_id,
        title: entry.title,
        description: entry.description ?? '',
        publishDate: parseISO(entry.publish_date),
        channelId: entry.channel_id,
    };
}

export function makePublishedIndexKey(metadata : StoredMetadata) {
  return `${metadata.publish_date};${metadata.video_id}`;
}

export function splitPublishedIndexKey(key : string) : [Date, VideoId] {
  const [dateString, videoId] = key.split(';');

  return [parseISO(dateString), videoId];
}

export async function indexMetadata(category : CategoryId, metadata : StoredMetadata) {
  console.log("Writing index for ", metadata.video_id);
  getCategoryPublicDb(category, PUBLISHED_INDEX_PATH, makePublishedIndexKey(metadata)).set(metadata);
}

export async function setMetadata(category : CategoryId, m: StoredMetadata) {
  // TODO: Validate metdata.
  if (!m|| !m.video_id) {
    console.error("Invalid metadata: ", m);
    return false;
  }
  const metadata = Object.assign({}, m);
  metadata._updated = (new Date()).toISOString();

  console.log("Setting metadata for ", metadata.video_id);

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

function toDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export async function getMatchingMetdata(category: CategoryId, matchOptions : MatchOptions) : Promise<VideoMetadata[]> {
  console.log("Finding matches for ", matchOptions);

  // Two modes of operation: With dates or without.
  // If there are no dates, the most recent LIMIT_RESULTS is returned.
  // If there are are dates, there is no limit assumed unless one is passed in.
  let query = getCategoryPublicDb(category, PUBLISHED_INDEX_PATH).orderByKey();
  if (matchOptions.startDate) {
    query = query.startAt(toDateString(matchOptions.startDate));
  }
  if (matchOptions.endDate) {
    query = query.endBefore(toDateString(matchOptions.endDate));
  }
  if (matchOptions.limit) {
    query = query.limitToLast(matchOptions.limit);
  }
  const result = (await query.once("value")).val() as Array<StoredMetadata>;
  if (!result) {
    return [];
  }

  // Put it in descending order.
  return Object.values(result.reverse()).map(v => metadataToVideoMetadata(v));
}
