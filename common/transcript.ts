import * as Constants from "config/constants";
import langs from 'langs';
import { parse } from 'csv-parse/sync';
import { pipeline } from 'node:stream/promises';
import { split, SentenceSplitterSyntax } from "sentence-splitter";

import type { Readable } from 'node:stream';
import type { WhisperXTranscript } from "common/whisperx";

///////////////////
/// Types
///////////////////

export type CategoryId = string;
export type SegmentId = string;
export type SpeakerId = number;
export type Iso6393Code = string;
export type VideoId = string;

// Use array to compress size of keys in json serialization.
export type SentenceMetadata = [
  SegmentId,  // Id string that is unique to one transcript.
  SpeakerId,  // Number for the speaker.
  number,  // Start time
  number   // End time.
  ];

export type TranscriptVersion = 1;

export type TranscriptData = {
  version : TranscriptVersion;
  language : string;
  sentenceMetadata : SentenceMetadata[];
};

export type SentenceTable = {
  [id : string] : string;
};

export type MetadataBySpeaker = {
  speaker: number;
  sentenceMetadata : SentenceMetadata[];
};

export type SpeakerNameMap = {
  [speaker: number] : string;
};

export type LanguageToSentenceTable = {
  [language : Iso6393Code] : SentenceTable;
};

///////////////////
/// Constants
///////////////////

const WHISPERX_GRANULARITY_S = 0.001;

// SMALL_TS_INCREMENT_S is a very small increment in the timestamp used to synthetically
// advance time if time timestamps are missing.
const SMALL_TS_INCREMENT_S = WHISPERX_GRANULARITY_S / 100;

export const UnknownSpeakerNum : number = 99;

const TSV_ISO6393_REGEX = /\.([a-z]{3})\.tsv$/;

///////////////////
/// Classes
///////////////////
export abstract class StorageAccessor {
  listFilesByPrefix(prefix: string) : Promise<string[]>;
  getBytes(path: string) : Promise<Buffer>;
  writeBytes(path: string, data: string) : Promise<void>;
}

export class DiarizedTranscript {
  readonly category: CategoryId;
  readonly videoId: VideoId;
  readonly transcriptData: TranscriptData;
  readonly originalLanguage: Iso6393Code;
  readonly sentenceMetadata: SentenceMetadata;
  readonly languageToSentenceTable: LanguageToSentenceTable;

  constructor(
      category: CategoryId,
      videoId: VideoId,
      transcriptData: TranscriptData,
      languageToSentenceTable: LanguageToSentenceTable) {
    this.category = category;
    this.videoId = videoId;
    this.transcriptData = transcriptData;
    this.originalLanguage = this.transcriptData.language;
    this.sentenceMetadata = this.transcriptData.sentenceMetadata;
    this.languageToSentenceTable = languageToSentenceTable;
  }

  static async makeFromStorage(
      storageAccessor: StorageAccessor,
      category: CategoryId,
      videoId: VideoId,
      languages: Iso6393Code[]) : Transcript {
    // Load the large data files.
    const loadPromises = new Array<Promise<any>>;
    loadPromises.push(storageAccessor.getBytes(makeTranscriptPath(category, videoId)));
    loadPromises.push(...languages.map(
          l => storageAccessor.getBytes(makeSentenceTablePath(category, videoId, l))));

    // Wait for everything.
    const results = await Promise.all(loadPromises);

    // Decode results. Make sure the order is exactly the same as above!
    const decoder = new TextDecoder('utf-8');
    const transcriptData : TranscriptData = JSON.parse(decoder.decode(results.shift()));
    const languageToSentenceTable : LanguageToSentenceTable = {};
    for (const language of languages) {
      const sentenceTableRows : [string, string][] =
          parse(decoder.decode(results.shift()), { delimiter: '\t', trim: true });
      const sentenceTable : SentenceTable = {};
      sentenceTableRows.forEach(row => sentenceTable[row[0]] = row[1]);
      languageToSentenceTable[language] = sentenceTable;
    }

    return new DiarizedTranscript(category, videoId, transcriptData, languageToSentenceTable);
  }

  sentence(language: Iso6393Code, segmentId: SegmentId) : string {
    return this.languageToSentenceTable[language]?.[segmentId] || `<missing ${segmentId}>`;
  }

  groupMetadataBySpeaker(speakerNames : SpeakerNameMap) : MetadataBySpeaker[] {
    const result : MetadataBySpeaker = []
    for (const metadata of this.transcriptData.sentenceMetadata) {
      if (result.at(-1)?.speaker !== metadata[1]) {
        result.push({speaker: metadata[1], sentenceMetadata: new Array<SentenceMetadata>});
      }
      result.at(-1).sentenceMetadata.push(metadata);
    }
    return result;
  }
}

///////////////////
/// Free Functions
///////////////////

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

// Returns the path to the transcript data for given `videoId`.
export function makeTranscriptPath(category: CategoryId, videoId: VideoId): string {
  return makePublicPath(category, Constants.DIARIZED_SUBDIR, `${videoId}.json`);
}

// Returns the path to the sentence table for the given `videoId`.
export function makeSentenceTablePath(category: CategoryId, videoId: VideoId, language: Iso6393Code): string {
  return makePublicPath(category, Constants.SENTENCE_TABLE_SUBDIR, `${videoId}.${language}.tsv`);
}

export function makeWhisperXTranscriptsPath(
    category: CategoryId,
    id: VideoId,
    language: Iso6393Code): string {
  return makePublicPath(category, Constants.WHISPERX_ARCHIVE_SUBDIR, `${id}.${language}.json.xz`);
}

function toSentences(speaker : SpeakerId, firstId : SpeakerId, words : string[], wordStarts : number[], wordEnds : number[]) {
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

  const sentenceMetadata = new Array<SentenceMetadata>;
  const sentences = new Array<string>;
  for (const [id, text] of sentenceTexts.entries()) {
    const numWords = (text.match(/ /g)||[]).length + 1;
    const start = wordStarts[totalWords];
    const end = wordEnds[totalWords + numWords - 1];
    totalWords += numWords;

    const metdata : SentenceMetadata = [(id + firstId).toString(), speaker, start, end];
    sentenceMetadata.push(metdata);
    sentences.push(text);
  }

  return {sentenceMetadata, sentences};   
}

export function toTranscript(whisperXTranscript: WhisperXTranscript) : [TranscriptData, string[]] {
  // Output data
  const sentenceMetadata = new Array<SentenceMetadata>;
  const sentences = new Array<string>;

  // Grouping data.
  let curSpeakerNum = -1;
  const words = new Array<string>;
  const wordStarts = new Array<number>;
  const wordEnds = new Array<number>;
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

// Taken from https://stackoverflow.com/a/49428486
function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}
