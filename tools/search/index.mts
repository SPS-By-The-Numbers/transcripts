import { DiarizedTranscript } from 'common/transcript';
import { FirebaseWebClientStorageAccessor } from 'utilities/client/storage';
import { getIndex } from './client.mts';
import { getSpeakerControlInfo, getSpeakerAttributes } from 'utilities/client/speaker';

import type { CategoryId, VideoId, VideoMetadata } from 'common/params';

type Document = {
  id : string,
  sentenceGroup : string,
  text: string,
  start: string,
  end: string,
};

async function insertDocs(category: CategoryId,
                          categoryLang: Iso6393Code,
                          documents) {
  console.log(`Indexing ${documents.length} docs`);
  const index = getIndex(category, categoryLang);

  const task = await index.addDocuments(documents, {
    // documents have both "id" and "videoId" and the former is our primary ley.
    primaryKey: 'id'
  }).waitTask();
  console.log(result);
}

function makeId(videoId, start) {
  // ID videoID suffixed with the starttime in milliseconds separated by an underscore.
  // This is required to fit the primary key constraints of meilisearch.
  return `${videoId}_${Math.round(parseFloat(start) * 1000)}`;
}

async function indexBatch(accessor: FirebaseWebClientStorageAccessor,
                          category: CategoryId,
                          categoryLang: Iso6393Code,
                          batch: Array<VideoId>,
                          metadataMap: {[VideoId]: VideoMetadata}) {
  const resultsArray : Document = await Promise.all(batch.map(async (videoId) => {
    try {
      const transcript = await DiarizedTranscript.fromStorage(accessor, category, videoId, [categoryLang]);
      
      const speakerInfo = await getSpeakerControlInfo(category, videoId).speakerInfo;
      const speakerBubble = transcript.groupSentenceInfoBySpeaker();
      const sentences = transcript.languageToSentenceTable[categoryLang];

      return speakerBubble.map(
        groupedInfo => {
          const { name, tags } = getSpeakerAttributes(groupedInfo.speaker, speakerInfo);

          return {
            id: makeId(videoId, groupedInfo.sentenceInfo[0][2]),
            speaker: name,
            tags: [...tags],
            videoId,
            start: groupedInfo.sentenceInfo[0][2],
            end: groupedInfo.sentenceInfo.at(-1)[3],
            text: groupedInfo.sentenceInfo.map(info => sentences[info[0]]).join(' '),
              title: (metadataMap[videoId]?.title ?? `${videoId} missing title`),
            publishDate: metadataMap[videoId]?.publishDate ?? '1950-01-01T00:00:00.000Z',
            transcribeDate: metadataMap[videoId]?.publishDate ?? '2024-07-14T00:00:00.000Z',
          };
        }
      );
    } catch (e) {
       console.error('failed: ', videoId, ' ', e);
       throw e;
    }
  }));

  await insertDocs(category, categoryLang, resultsArray.flat());
}

export async function indexVideos(category: CategoryId, categoryLang: Iso6393Code, videoIds: Array<VideoId>, allMetadata: Array<VideoMetadata>) {
  const batchSize = 10;
  const accessor = new FirebaseWebClientStorageAccessor();
  const metadataMap = Object.fromEntries(allMetadata.map(e => [e.videoId, e]));

  for (let numDone = 0; numDone < videoIds.length; numDone += batchSize) {
    await indexBatch(accessor, category, categoryLang,
                     videoIds.slice(numDone, numDone + batchSize), metadataMap);
    console.log(`${numDone} out of ${videoIds.length} done`);
  }
}
