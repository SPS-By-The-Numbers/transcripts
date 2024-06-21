// Types and functions for saving/storing a compressed WhisperX json output.
//
// The WhisperX json data is very verbose and contains redundant information
// which bloats the size of the transcript compared to raw words by over 10x.
//
// It must be reduced before passing into React props otherwise there will
// be a LOT of unecessary download to the client.
//
// The codec is punted up to the embedder because lzma is the right thing
// for this kind of archival. However different libraries work better/worse
// in the node.js and browser envrionment.

import * as Constants from "config/constants";
import { makePublicPath } from "common/paths";

import type { StorageAccessor } from 'common/storage';
import type { CategoryId, Iso6393Code, VideoId } from "common/params";

// Top level WhipserX trannscript ytpe.
export type WhisperXTranscript = {
  segments : WhisperXSegmentData[];
  language : string;
};

// Data fora segment of diarized speech.
export type WhisperXSegmentData = {
  start: number;
  end: number;
  text: string;
  speaker: string;
  words: WhisperXWordData[];
};

// Per "word" timing and confidence score.  Sometimes the word is just punctuation.
export type WhisperXWordData = {
  word: string;
  start: number;
  end: number;
  score: number;
  speaker: string;
};

// Create path to the compressed WhipserX file for the given parameters.
export function makeWhisperXTranscriptsPath(
    category: CategoryId,
    videoId: VideoId,
    language: Iso6393Code): string {
  return makePublicPath(
      category,
      Constants.WHISPERX_ARCHIVE_SUBDIR,
      `${videoId}.${language}.json.xz`);
}

export async function getArchivedWhisperXTranscript(
    storageAccessor: StorageAccessor,
    category: CategoryId,
    videoId: VideoId,
    language: Iso6393Code) : Promise<WhisperXTranscript> {
  const decoder = new TextDecoder('utf-8');
  const bytes = await storageAccessor.readBytesLzma(
      makeWhisperXTranscriptsPath(category, videoId, language));
  return JSON.parse(decoder.decode(bytes));
}
