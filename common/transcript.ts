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
export type SentenceInfo = [
  SegmentId,  // Id string that is unique to one transcript.
  SpeakerId,  // Number for the speaker.
  number,  // Start time
  number   // End time.
  ];

export type TranscriptVersion = 1;

export type TranscriptData = {
  version : TranscriptVersion;
  language : string;
  sentenceInfo : SentenceInfo[];
};

export type SentenceTable = {
  [id : string] : string;
};

export type SentenceInfoBySpeaker = {
  speaker: number;
  sentenceInfo : SentenceInfo[];
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

const EMPTY_TRASCRIPT_DATA : TranscriptData = {
  version: 1,
  language: 'eng',
  sentenceInfo: [],
};

///////////////////
/// Classes
///////////////////
export class DiarizedTranscript {
  readonly category: CategoryId;
  readonly videoId: VideoId;
  readonly transcriptData: TranscriptData;
  readonly originalLanguage: Iso6393Code;
  readonly sentenceInfo: SentenceInfo[];
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
    this.sentenceInfo = transcriptData.sentenceInfo;
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
    loadPromises.push(...languages.map(l => getSentenceTable(storageAccessor, category, videoId, l)));

    // Wait for everything.
    const [transcriptDataResult, ...sentenceTableResult] = await Promise.allSettled(loadPromises);

    if (transcriptDataResult.status === 'rejected') {
      return new DiarizedTranscript(category, videoId, EMPTY_TRASCRIPT_DATA, {},
          ["Cannout load transcript Data"]);
    }

    const decoder = new TextDecoder('utf-8');
    const errors : string[] = [];
    const rawInput = JSON.parse(decoder.decode(transcriptDataResult.value));
    if (rawInput.sentenceMetadata) {
      // TODO: Fix diarized files.
      // If this executes, there's an old version of the data file.
      rawInput.sentenceInfo = rawInput.sentenceMetadata;
      delete rawInput.sentenceMetadata;
    }
    // TODO: Use Json schema to check for data corruption here.
    const transcriptData : TranscriptData = rawInput as TranscriptData;

    // Process the language table.
    const languageToSentenceTable : LanguageToSentenceTable = {};
    const missingLanguages = new Array<string>();
    for (const [i, language] of languages.entries()) {
      const result = sentenceTableResult[i];
      if (result?.status === 'rejected') {
        missingLanguages.push(language);
        continue;
      }

      languageToSentenceTable[language] = result.value;
    }

    // Process the missing languages.
    if (missingLanguages.length > 0) {
      const translatedMissing = await translateToMissingLangauges(category, videoId,
          transcriptData.language, missingLanguages, errors);
      Object.assign(languageToSentenceTable, translatedMissing);
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
    const sentenceInfo = new Array<SentenceInfo>;
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
          sentenceInfo.push(...result.sentenceInfo);
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
      sentenceInfo.push(...result.sentenceInfo);
      sentences.push(...result.sentences);
    }

    // Whipser uses iso639-1 language codes. Move to iso639-3.
    const whisperLang = langs.where('1', whisperXTranscript.language);
    const languageInFile = (whisperLang && whisperLang['3']) || "eng";  // Default to english.
    const transcriptData : TranscriptData = {
      version: 1,
      language: languageInFile,
      sentenceInfo
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

  groupSentenceInfoBySpeaker(speakerNames : SpeakerNameMap = {}) : SentenceInfoBySpeaker[] {
    const result = new Array<SentenceInfoBySpeaker>;
    for (const sentenceInfo of this.sentenceInfo) {
      if (result.at(-1)?.speaker !== sentenceInfo[1]) {
        result.push({speaker: sentenceInfo[1], sentenceInfo: new Array<SentenceInfo>});
      }
      result.at(-1)?.sentenceInfo.push(sentenceInfo);
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
    if (!this.sentenceInfo) {
      throw "Missing sentenceInfo";
    }

    const transcriptData : TranscriptData = {
      version: 1,
      language: this.originalLanguage,
      sentenceInfo: this.sentenceInfo,
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

  const sentenceInfo = new Array<SentenceInfo>;
  const sentences = new Array<string>;
  for (const [id, text] of sentenceTexts.entries()) {
    const numWords = (text.match(/ /g)||[]).length + 1;
    const start = wordStarts[totalWords];
    const end = wordEnds[totalWords + numWords - 1];
    totalWords += numWords;

    const metdata : SentenceInfo = [(id + firstId).toString(), speaker, start, end];
    sentenceInfo.push(metdata);
    sentences.push(text);
  }

  return {sentenceInfo, sentences};   
}

function tsvToSentenceTable(tsv : string) : SentenceTable {
  const sentenceTableRows : [string, string][] =
    parse(tsv, { delimiter: '\t', trim: true });
  const sentenceTable : SentenceTable = {};
  sentenceTableRows.forEach(row => sentenceTable[row[0]] = row[1]);
  return sentenceTable;
}

async function translateToMissingLangauges(category : CategoryId, videoId : VideoId,
    originalLanguage : Iso6393Code, missingLanguages : string[], errors : string[]) : Promise<LanguageToSentenceTable> {
    const urlParams = new URLSearchParams({ category, videoId, originalLanguage});
    for (const lang of missingLanguages) {
      urlParams.append('targetLanguages', lang);
    }
    const response = await fetch(`${Constants.ENDPOINTS['sentences']}?${urlParams.toString()}`);
    const jsonResponse = await response.json() as any;
    if (!jsonResponse?.ok) {
      console.error(jsonResponse?.message);
      return {};
    }
    return jsonResponse?.data;
}

export async function getSentenceTable(storageAccessor : StorageAccessor, category: CategoryId, videoId: VideoId, language: Iso6393Code) {
  const bytes = await storageAccessor.readBytes(makeSentenceTablePath(category, videoId, language));
  const decoder = new TextDecoder('utf-8');
  return tsvToSentenceTable(decoder.decode(bytes));
}
