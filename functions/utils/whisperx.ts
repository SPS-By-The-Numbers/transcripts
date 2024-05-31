import * as Storage from "firebase/storage"
import type { SpeakerSegments } from 'utilities/transcript'
import { toSpeakerNum } from 'utilities/speaker-info'

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

export function makeWhisperXTranscriptsPath(category: string, id: string, language:string): string {
  return `/transcripts/public/${category}/archive/whisperx/${id}.${language}.json.xz`;
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
    text: bubble.segments.map(s => s[1]).join(' '),
    start: bubble.segments[0][2],
    segmentId: i,
  }));
}

export function toDiarizedTranscript(whisperXTranscript: WhisperXTranscript, 
    wordsAreSegments: boolean): DiarizedTranscript {
  const speakerSegments = new Array<SpeakerSegments>();

  let curSpeakerNum = -1;
  let segments;
  let segmentIndex = 0;
  for (const rawSegment of whisperXTranscript.segments) {
    segmentIndex++;
    const newSpeaker = toSpeakerNum(rawSegment.speaker);
    if (newSpeaker !== curSpeakerNum) {
      if (segments) {
        speakerSegments.push({speaker: curSpeakerNum, segments});
      }

      curSpeakerNum = newSpeaker;
      segments = new Array<SegmentData>();
    }

    if (wordsAreSegments) {
      let lastStart : number = rawSegment.words[0].start || 1;
      let wordIndex = 0;
      for (const word of rawSegment.words) {
        wordIndex++;
        const start = word.start || lastStart + SMALL_TS_INCREMENT;

        let end = word.end;
        if (!end) {
          // Hack for missing start time. Move forward by 0.1 milliseconds.
          end = start + SMALL_TS_INCREMENT;
        }
        lastStart = end;
        segments.push([wordIndex, word.word.trim(), start, end]);
      }
    } else {
      if (rawSegment.text) {
        segments.push([
          segmentIndex,
          rawSegment.text.trim(),
          rawSegment.start,
          rawSegment.end,
          ]);
      }
    }
  }

  if (segments) {
    speakerSegments.push({speaker: curSpeakerNum, segments});
  }

  return { language: whisperXTranscript.language, diarized: speakerSegments};
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
