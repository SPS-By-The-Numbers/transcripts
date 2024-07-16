import { CATEGORY, CATEGORY_ORIG_LANG, index } from './client.mts';
import { readFile, writeFile } from 'node:fs/promises';
import { DiarizedTranscript } from 'common/transcript';
import { FirebaseWebClientStorageAccessor } from 'utilities/client/storage';
import allMetadata from './allMetadata.json';
const metadataMap = Object.fromEntries(allMetadata.map(e => [e.videoId, e]));

import type { Document } from './client.mts';

async function insertDocs(documents) {
  console.log(`Indexing ${documents.length} docs`);

  const task = await index.addDocuments(documents)
  const result = await index.waitForTask(task.taskUid);
  console.log(result);
}

const accessor = new FirebaseWebClientStorageAccessor();

const data = await readFile(process.argv[2], 'utf-8');
const videoIds = data.split('\n').map(s => s.trim());

function makeId(videoId, start) {
  // ID videoID suffixed with the starttime in milliseconds separated by an underscore.
  // This is required to fit the primary key constraints of meilisearch.
  return `${videoId}_${Math.round(parseFloat(start) * 1000)}`;
}

async function indexBatch(batch) {
  const resultsArray : Document = await Promise.all(batch.map(async (videoId) => {
    const transcript = await DiarizedTranscript.fromStorage(accessor, CATEGORY, videoId, [CATEGORY_ORIG_LANG]);
    
    const bySpeaker = transcript.groupSentenceInfoBySpeaker();
    const sentences = transcript.languageToSentenceTable[CATEGORY_ORIG_LANG];

    return bySpeaker.map(groupedInfo => ({
        id: makeId(videoId, groupedInfo.sentenceInfo[0][2]),
        videoId,
        start: groupedInfo.sentenceInfo[0][2],
        end: groupedInfo.sentenceInfo.at(-1)[3],
        text: groupedInfo.sentenceInfo.map(info => sentences[info[0]]).join(' '),
        title: metadataMap[videoId].title,
        publishDate: metadataMap[videoId].publishDate,
        transcribDate: metadataMap[videoId].publishDate ?? '2024-07-14T00:00:00.000Z',
    }));
  }));

  await insertDocs(resultsArray.flat());
}

let numDone = 0;
const batchSize = 10;
while (numDone < videoIds.length) {
  await indexBatch(videoIds.slice(numDone, numDone + batchSize));
  numDone += batchSize;
}

// Terminate cause firebase keeps a handle open
process.exit(0);
