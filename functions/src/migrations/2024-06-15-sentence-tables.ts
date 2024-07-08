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
import langs from 'langs';
import { FirebaseAdminStorageAccessor } from 'utils/storage';
import { DiarizedTranscript, makeSentenceTablePath, makeTranscriptDataPath } from 'common/transcript';
import { basename } from 'node:path';
import { makePublicPath } from 'common/paths';
import { doAuth } from './auth';

import type { Iso6393Code, VideoId } from "common/params";

doAuth();

const accessor = new FirebaseAdminStorageAccessor();

for (const category of Constants.ALL_CATEGORIES) {
  const [allFiles] = await accessor.bucket.getFiles(
      { prefix: makePublicPath(category, Constants.WHISPERX_ARCHIVE_SUBDIR),
        autoPaginate: true,
        });

  for (const file of allFiles) {
    try {
      const splits = basename(file.name).split('.');
      const vid : VideoId = splits[0];
      const iso6391Code : string = splits[1];
      const language : Iso6393Code = langs.where('1', iso6391Code)['3'];

      // Generate the filenames.
      const diarizedPath = makeTranscriptDataPath(category, vid);
      const sentencesPath = makeSentenceTablePath(category, vid, language);
      const [[diarizedTranscriptExists], [sentenceTableExists]] =
        await Promise.all([accessor.bucket.file(diarizedPath).exists(),
                          accessor.bucket.file(sentencesPath).exists()]);
      if (!diarizedTranscriptExists || !sentenceTableExists) {
        console.log('Writing ', file.name);
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
