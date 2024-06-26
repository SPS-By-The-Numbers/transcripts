import * as Constants from 'config/constants';
import langs from 'langs';
import { getArchivedWhisperXTranscript } from 'common/whisperx';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { makePublicPath } from 'common/paths';
import { split, SentenceSplitterSyntax } from 'sentence-splitter';

import type { CategoryId, Iso6393Code, SegmentId, SpeakerId, VideoId } from 'common/params';
import type { StorageAccessor } from 'common/storage';
import type { WhisperXTranscript } from 'common/whisperx';

///////////////////
/// Types
///////////////////

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

const EMPTY_TRANSIT_DATA : TranscriptData = {
  version: 1,
  language: 'eng',
  sentenceMetadata: [],
};

///////////////////
/// Classes
///////////////////
export class DiarizedTranscript {
  readonly category: CategoryId;
  readonly videoId: VideoId;
  readonly transcriptData: TranscriptData;
  readonly originalLanguage: Iso6393Code;
  readonly sentenceMetadata: SentenceMetadata[];
  readonly languageToSentenceTable: LanguageToSentenceTable;
  readonly loadErrors: string[];

  constructor(
      category: CategoryId,
      videoId: VideoId,
      transcriptData: TranscriptData,
      languageToSentenceTable: LanguageToSentenceTable,
      loadErrors: string[]) {
    this.category = category;
    this.videoId = videoId;
    this.originalLanguage = transcriptData.language;
    this.sentenceMetadata = transcriptData.sentenceMetadata;
    this.languageToSentenceTable = languageToSentenceTable;
    this.loadErrors = loadErrors;
  }

  static async fromStorage(
      storageAccessor: StorageAccessor,
      category: CategoryId,
      videoId: VideoId,
      languages: Iso6393Code[]) : Promise<DiarizedTranscript> {
    // Load the large data files.
    const loadPromises = new Array<Promise<any>>;
    loadPromises.push(storageAccessor.readBytes(makeTranscriptDataPath(category, videoId)));
    loadPromises.push(...languages.map(
          l => storageAccessor.readBytes(makeSentenceTablePath(category, videoId, l))));

    // Wait for everything.
    const allResults = await Promise.allSettled(loadPromises);

    // Decode results. Make sure the order is exactly the same as above!
    if (allResults[0].status === 'rejected') {
      return new DiarizedTranscript(category, videoId, EMPTY_TRANSIT_DATA, {},
          ["Cannout load transcript Data"]);
    }

    const errors : string[] = [];
    const decoder = new TextDecoder('utf-8');
    const transcriptData : TranscriptData = JSON.parse(decoder.decode(allResults[0].value));
    allResults.shift();
    const languageToSentenceTable : LanguageToSentenceTable = {};
    for (const language of languages) {
      const result = allResults.shift();
      if (result?.status === 'rejected') {
        errors.push(`Unable to load sentences for ${language}`);
        continue;
      }

      const sentenceTableRows : [string, string][] =
          parse(decoder.decode(result?.value), { delimiter: '\t', trim: true });
      const sentenceTable : SentenceTable = {};
      sentenceTableRows.forEach(row => sentenceTable[row[0]] = row[1]);
      languageToSentenceTable[language] = sentenceTable;
    }

    return new DiarizedTranscript(category, videoId, transcriptData, languageToSentenceTable, errors);
  }

  static async fromWhisperXArchive(
      storageAccessor: StorageAccessor,
      category: CategoryId,
      videoId: VideoId,
      language: Iso6393Code) : Promise<DiarizedTranscript> {
    const whisperXTranscript = await getArchivedWhisperXTranscript(storageAccessor, category, videoId, language);
      return DiarizedTranscript.fromWhisperX(category, videoId, whisperXTranscript);
    }

  static fromWhisperX(category: CategoryId, videoId: VideoId,
      whisperXTranscript : WhisperXTranscript) : DiarizedTranscript {
    // Accumualted output.
    const sentenceMetadata = new Array<SentenceMetadata>;
    const sentences = new Array<string>;

    // Grouping variables.
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

    // Whipser uses iso639-1 language codes. Move to iso639-3.
    const whisperLang = langs.where('1', whisperXTranscript.language);
    const languageInFile = (whisperLang && whisperLang['3']) || "eng";  // Default to english.
    const transcriptData : TranscriptData = {
      version: 1,
      language: languageInFile,
      sentenceMetadata
    };
    const sentenceTable : SentenceTable = {};
    for (const [id, text] of sentences.entries()) {
      sentenceTable[id] = text;
    }
    const languageToSentenceTable = {
      [transcriptData.language]: sentenceTable
    }

    return new DiarizedTranscript(category, videoId, transcriptData, languageToSentenceTable, []);
  }

  sentence(language: Iso6393Code, segmentId: SegmentId) : string {
    return this.languageToSentenceTable[language]?.[segmentId] || `<missing ${language}-${segmentId}>`;
  }

  groupMetadataBySpeaker(speakerNames : SpeakerNameMap = {}) : MetadataBySpeaker[] {
    const result = new Array<MetadataBySpeaker>;
    for (const metadata of this.sentenceMetadata) {
      if (result.at(-1)?.speaker !== metadata[1]) {
        result.push({speaker: metadata[1], sentenceMetadata: new Array<SentenceMetadata>});
      }
      result.at(-1)?.sentenceMetadata.push(metadata);
    }
    return result;
  }

  async writeSentenceTable(storageAccessor: StorageAccessor, language: Iso6393Code) : Promise<unknown> {
    const sentenceTable = this.languageToSentenceTable[language];
    if (!sentenceTable) {
      throw `No sentenceTable for ${language}`;
    }
    const rows = new Array<[string, string]>;
    for (const sentenceId of Object.keys(sentenceTable).sort()) {
      rows.push([sentenceId, sentenceTable[sentenceId]]);
    }

    return storageAccessor.writeBytesGzip(
        makeSentenceTablePath(this.category, this.videoId, language),
        stringify(rows, { header: false, delimiter: '\t', }));
  }

  async writeDiarizedTranscript(storageAccessor: StorageAccessor) : Promise<unknown> {
    if (!this.sentenceMetadata) {
      throw "Missing sentenceMetadata";
    }

    const transcriptData : TranscriptData = {
      version: 1,
      language: this.originalLanguage,
      sentenceMetadata: this.sentenceMetadata,
    };

    return storageAccessor.writeBytesGzip(
        makeTranscriptDataPath(this.category, this.videoId),
        JSON.stringify(transcriptData));
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
// Returns the path to the transcript data for given `videoId`.
export function makeTranscriptDataPath(category: CategoryId, videoId: VideoId): string {
  return makePublicPath(category, Constants.DIARIZED_SUBDIR, `${videoId}.json`);
}

// Returns the path to the sentence table for the given `videoId`.
export function makeSentenceTablePath(category: CategoryId, videoId: VideoId, language: Iso6393Code): string {
  return makePublicPath(category, Constants.SENTENCE_TABLE_SUBDIR, `${videoId}.${language}.tsv`);
}

function toSentences(speaker : SpeakerId, firstId : number, words : string[], wordStarts : number[], wordEnds : number[]) {
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
