// Migration to regenerate all whisperx output into a transcript file and
// an english sentence table file. Result for each 
//
//  /transcripts/public/[category]/archive/whisperx/[vid].eng.json.xz
//
// should be two files:
//
//  /transcripts/public/[category]/diarized/[vid].json
//  /transcripts/public/[category]/sentences/[vid].eng.json

import * as Constants from 'config/constants';
import process from 'node:process';
import { CloudStorageAccessor } from 'common/storage';
import { DiarizedTranscript, makeSentenceTablePath, makeTranscriptDataPath } from 'common/transcript';
import { basename } from 'node:path';
import { makePublicPath } from 'common/paths';


import type { Iso6393Code, VideoId } from "common/params";

const accessor = new CloudStorageAccessor({keyfile:process.env.TRANSCRIPT_STORAGE_KEYFILE}); 

for (const category of Constants.ALL_CATEGORIES) {
  const [allFiles] = await accessor.bucket.getFiles(
      { prefix: makePublicPath(category, Constants.WHISPERX_ARCHIVE_SUBDIR),
        autoPaginate: true,
        });

  for (const file of allFiles) {
    try {
      const splits = basename(file.name).split('.')[0];
      const vid : VideoId = splits[0];
      const language : Iso6393Code = splits[1];

      // Generate the filenames.
      const diarizedPath = makeTranscriptDataPath(category, vid);
      const sentencesPath = makeSentenceTablePath(category, vid, language);
      const diarizedTranscriptExists = (await accessor.bucket.file(diarizedPath).exists())[0];
      const sentenceTableExists = (await accessor.bucket.file(sentencesPath).exists())[0];
      
      if (!diarizedTranscriptExists || !sentenceTableExists) {
        const diarizedTranscript = await DiarizedTranscript.fromWhisperXArchive(accessor, category, vid, language);

        if (!sentenceTableExists) {
          diarizedTranscript.writeSentenceTable(accessor, diarizedTranscript.originalLanguage);
        }

        if (!diarizedTranscriptExists) {
          await diarizedTranscript.writeDiarizedTranscript(accessor);
        }
      }
    } catch (e) {
      console.error("Failed ", file.name, " with error ", e);
    }
  }
}
