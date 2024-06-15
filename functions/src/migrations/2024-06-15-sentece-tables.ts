// Migration to regenerate all whisperx output into a transcript file and
// an english sentence table file. Result for each 
//
//  /transcripts/public/[category]/archive/whisperx/[vid].eng.json.xz
//
// should be two files:
//
//  /transcripts/public/[category]/diarized/[vid].json
//  /transcripts/public/[category]/sentences/[vid].eng.json

import { Stream } from "stream";
import { basename } from 'node:path';
import { createGzip } from "zlib";
import { initializeFirebase, getDefaultBucket } from 'utils/firebase';
import { makePublicPath, toTranscript } from 'common/transcript';
import { pipeline } from 'node:stream/promises';
import { stringify } from 'csv-stringify';
import * as Constants from 'config/constants';
import * as fs from 'node:fs/promises';
import * as lzma from "lzma-native";
import * as streamBuffers from 'stream-buffers';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(await fs.readFile('/Users/albert/src/transcriptions/tools/gcloud-storage-key.json', {encoding: 'utf8'}));

initializeFirebase({credential: admin.credential.cert(serviceAccount)});

async function writeToStorage(path: string, filter: any, contents: string, fileOptions: object = {}) {
  const file = getDefaultBucket().file(path);
  const passthroughStream = new Stream.PassThrough();
  passthroughStream.write(contents);
  passthroughStream.end();
  await pipeline(passthroughStream, filter, file.createWriteStream(fileOptions));
}

for (const category of Constants.ALL_CATEGORIES) {
  const [allFiles] = await getDefaultBucket().getFiles(
      { prefix: makePublicPath(category, Constants.WHISPERX_ARCHIVE_SUBDIR),
        autoPaginate: true,
        });

  for (const file of allFiles) {
    const buffer = new streamBuffers.WritableStreamBuffer({ initialSize: 150 * 1024 });
    await pipeline(file.createReadStream(), lzma.createDecompressor(), buffer);
    const str = buffer.getContentsAsString('utf8');
    const [transcript, sentences] = toTranscript(JSON.parse(str));

    // Generate the filenames.
    const vid = basename(file.name).split('.')[0];
    const language = transcript.language;
    const diarizedPath = makePublicPath(category, Constants.DIARIZED_SUBDIR, `${vid}.${language}.json`);
    const sentencesPath = makePublicPath(category, Constants.SENTENCE_TABLE_SUBDIR, `${vid}.${language}.tsv`);

    // Write the sentence data.
    const tsvWriter = stringify({
        header: false,
        delimiter: '\t',
      });

    // Write the sentence tsv.
    for (const [id, text] of sentences.entries()) {
      tsvWriter.write([id, text]);
    }
    tsvWriter.end();

    await pipeline(
        tsvWriter, 
        createGzip({level: 9}),
        getDefaultBucket().file(sentencesPath).createWriteStream(
          {metadata: {contentEncoding: "gzip", contentType: "text/plain"}}
          ));

    // Write the diarized json.
    const diarizedJson = JSON.stringify(transcript);
    await writeToStorage(diarizedPath, createGzip({level: 9}), diarizedJson, {metadata: {contentEncoding: "gzip"}});
  }
}
