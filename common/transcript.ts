import * as Constants from "config/constants";
import langs from 'langs';
import { split, SentenceSplitterSyntax } from "sentence-splitter";

// Used to allow browser vs dom vs unittest test style data access.
export abstract class StorageAccessor {
  abstract getBytes(bucket: string, path : string) : Promise<ArrayBuffer>;
}

// The WhisperX json data is very verbose and contains redundant information
// which bloats the size of the transcript compared to raw words by over 10x.
//
// It must be reduced before passing into React props otherwise there will
// be a LOT of unecessary download to the client.
export type WhisperXWordData = {
  word: string;
  start: number;
  end: number;
  score: number;
  speaker: string;
};

export type WhisperXSegmentData = {
  start: number;
  end: number;
  text: string;
  speaker: string;
  words: WhisperXWordData[];
};

export type WhisperXTranscript = {
  segments : WhisperXSegmentData[];
  language : string;
};

export type VideoId = string;
export type SegmentId = string;
export type SpeakerId = number;

// Use array to compress size of keys in json serialization.
export type SentenceMetadata = [
  SegmentId,  // Id string that is unique to one transcript.
  SpeakerId,  // Number for the speaker.
  number,  // Start time
  number   // End time.
  ];

export type TranscriptVersion = 1;

export type Transcript = {
  version : TranscriptVersion;
  language : string;
  sentenceMetadata : SentenceMetadata[];
};

const WHISPERX_GRANULARITY_S = 0.001;

// SMALL_TS_INCREMENT_S is a very small increment in the timestamp used to synthetically
// advance time if time timestamps are missing.
const SMALL_TS_INCREMENT_S = WHISPERX_GRANULARITY_S / 100;


export const UnknownSpeakerNum : number = 99;

export function toSpeakerNum(speakerKey: string) {
  if (!speakerKey) {
    return UnknownSpeakerNum;
  }

  const parts = speakerKey.split('_');
  if (parts.length < 2) {
    console.error('Invalid speakerKey', speakerKey, parts);
    return UnknownSpeakerNum;
  }
  return parseInt(speakerKey.split('_')[1]);
}

// Makes the path string for public data. The prefix is the same in storage as it is in the database.
export function makePublicPath(...parts) {
  return [Constants.APP_SCOPE, "public", ...parts].join("/");
}

export function makePrivatePath(...parts) {
  return [Constants.APP_SCOPE, "private", ...parts].join("/");
}

// Returns the path to the transcript data for the identified file.
export function makeTranscriptPath(category: string, id: VideoId, language:string): string {
  return makePublicPath(category, Constants.SENTENCE_TABLE_SUBDIR, `${id}.${language}.json`);
}

export function makeWhisperXTranscriptsPath(category: string, id: string, language:string): string {
  return makePublicPath(category, Constants.WHISPERX_ARCHIVE_SUBDIR, `${id}.${language}.json.xz`);
}

function toSentences(speaker : number, firstId : number, words : string[], wordStarts : number[], wordEnds : number[]) {
  const paragraph = words.join(' ');
  const allSplits = split(paragraph);
  const sentenceTexts = allSplits
    .filter((node) => {
        return node.type === SentenceSplitterSyntax.Sentence;
     })
    .map((node) => {
        return node.raw;
     });
  let totalWords = 0;

  const sentenceMetadata = [];
  const sentences = [];
  for (const [id, text] of sentenceTexts.entries()) {
    const numWords = (text.match(/ /g)||[]).length + 1;
    const start = wordStarts[totalWords];
    const end = wordEnds[totalWords + numWords - 1];
    totalWords += numWords;

    sentenceMetadata.push([(id + firstId).toString(), speaker, start, end]);
    sentences.push(text);
  }

  return {sentenceMetadata, sentences};   
}

export function toTranscript(whisperXTranscript: WhisperXTranscript) : [Transcript, string[]] {
  // Output data
  const sentenceMetadata = [];
  const sentences = [];

  // Grouping data.
  let curSpeakerNum = -1;
  const words = [];
  const wordStarts = [];
  const wordEnds = [];
  for (const rawSegment of whisperXTranscript.segments) {
    // There are some degenerate segments. Push them into the previous entry if it exists.
    if (rawSegment.words.length === 0 && rawSegment.text.trimEnd().length !== 0) {
      // Only attempt to add to the previous. If there was no previous, give up.
      if (words.length > 0) {
        words.at[words.length-1] += rawSegment.text.trimEnd();
      }
      continue;
    }

    const newSpeaker = toSpeakerNum(rawSegment.speaker);
    if (newSpeaker !== curSpeakerNum) {
      if (words.length > 0) {
        const result = toSentences(curSpeakerNum, sentences.length, words, wordStarts, wordEnds);
        sentenceMetadata.push(...result.sentenceMetadata);
        sentences.push(...result.sentences);
      }

      curSpeakerNum = newSpeaker;
      words.length = 0;
      wordStarts.length = 0;
      wordEnds.length = 0;
    }

    let lastStart = rawSegment.words[0].start || rawSegment.start;
    for (const wordInfo of rawSegment.words) {
      // Hack for missing start time or end time. Move forward by a small amount.
      const start = wordInfo.start || lastStart + SMALL_TS_INCREMENT_S;
      let end = wordInfo.end || start + SMALL_TS_INCREMENT_S;
      lastStart = end;
      words.push(wordInfo.word.trim());
      wordStarts.push(start);
      wordEnds.push(end);
    }
  }

  if (words.length > 0) {
    const result = toSentences(curSpeakerNum, sentences.length, words, wordStarts, wordEnds);
    sentenceMetadata.push(...result.sentenceMetadata);
    sentences.push(...result.sentences);
  }

  // Whipser uses iso639-1 language codes. Move to iso-639-3.
  const whisperLang = langs.where('1', whisperXTranscript.language);
  const language = (whisperLang && whisperLang["3"]) || "eng";  // Default to english.

  return [
      {
        version: 1,
        language,
        sentenceMetadata,
      },
      sentences ];
}

