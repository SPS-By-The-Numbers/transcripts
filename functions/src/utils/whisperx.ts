import * as Storage from "firebase/storage";
import type { DiarizedTranscript, SpeakerMonologue, SegmentData } from "../../../utilities/transcript";
import { SegmentTypeValues } from "../../../utilities/transcript";
import { split, SentenceSplitterSyntax } from "sentence-splitter";
import { makeWhisperXTranscriptsPath } from "./path.js";
import { toSpeakerNum } from "../../../utilities/speaker-info";


const WHISPERX_GRANULARITY_S = 0.001;

// SMALL_TS_INCREMENT_S is a very small increment in the timestamp used to synthetically
// advance time if time timestamps are missing.
const SMALL_TS_INCREMENT_S = WHISPERX_GRANULARITY_S / 100;

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

function toSentences(words : string[], wordStarts : number[], wordEnds : number[]) : SegmentData[] {
  const paragraph = words.join(' ');
  const sentences = split(paragraph);
  const sentenceTexts = sentences
    .filter((node) => {
        return node.type === SentenceSplitterSyntax.Sentence;
     })
    .map((node) => {
        return node.raw;
     });
  let totalWords = 0;
  return sentenceTexts.map((text, id) => {
      const numWords = (text.match(/ /g)||[]).length + 1;
      const start = wordStarts[totalWords];
      const end = wordEnds[totalWords + numWords - 1];
      totalWords += numWords;
      return [id.toString(), text, start, end];
    });
}

// Takes a `transcript` and produces an array of documents suitable for sending to
// Meilisearch.
//
// TODO: move to own file.
export function toSearchDocuments(vid: string, transcript: DiarizedTranscript) {
  return transcript.diarized.map((bubble, i) => ({
    id: `${vid}/${i}`,
    vid,
    speaker: bubble.speaker,
    language: transcript.language,
    text: bubble.segments.map((s) => s[1]).join(" "),
    start: bubble.segments[0][2],
    segmentId: i,
  }));
}

export function toMonologuesAndSegments(whisperXTranscript: WhisperXTranscript) {
}

export function toDiarizedTranscript(whisperXTranscript: WhisperXTranscript): DiarizedTranscript {
  const speakerMonologues = new Array<SpeakerMonologue>();

  let curSpeakerNum = -1;
  const words = [];
  const wordStarts = [];
  const wordEnds = [];
  for (const rawSegment of whisperXTranscript.segments) {
    const newSpeaker = toSpeakerNum(rawSegment.speaker);
    if (newSpeaker !== curSpeakerNum) {
      if (words.length > 0) {
        speakerMonologues.push({speaker: curSpeakerNum, segments: toSentences(words, wordStarts, wordEnds)});
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
    speakerMonologues.push({speaker: curSpeakerNum, segments: toSentences(words, wordStarts, wordEnds)});
  }

  return {
    version: 1,
    segmentType: SegmentTypeValues.Sentence,
    language: whisperXTranscript.language,
    diarized: speakerMonologues
    };
}

export async function getCompressedWhisperXTranscript(category: string, id: string, language: string): Promise<object> {
  try {
    const path = makeWhisperXTranscriptsPath(category, id, language);
    const fileRef = Storage.ref(Storage.getStorage(), path);
    return Storage.getBytes(fileRef);
  } catch (e) {
    console.error(e);
  }

  return [];
}
