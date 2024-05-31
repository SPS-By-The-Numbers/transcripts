import * as Storage from "firebase/storage"
import { app } from 'utilities/firebase'
import { toSpeakerNum } from 'utilities/speaker-info'

// SMALL_TS_INCREMENT is a very small increment in the timestamp used to synthetically
// advance time if time timestamps are missing.
const SMALL_TS_INCREMENT = 0.0001;

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

// Use array to compress size of keys in json serialization.
export type SegmentData = [
  string,  // Id string that is unique to one transcript.
  string,  // Text of the segment.
  number,  // Start time
  number   // End time.
  ];

export type SpeakerBubble = {
  speaker: number;
  segments : SegmentData[];
};

export type DiarizedTranscript = {
  diarized : SpeakerBubble[];
  language : string;
};

// Returns the path to the transcript data for the identified file. Data is 
function makeDiarizedTranscriptsPath(category: string, id: string, language:string): string {
  return `/transcripts/public/${category}/diarized/${id}.${language}.json`;
}

function makeWhisperXTranscriptsPath(category: string, id: string, language:string): string {
  return `/transcripts/public/${category}/archive/whisperx/${id}.${language}.json.xz`;
}

// Takes a `transcript` and produces an array of documents suitable for sending to
// Meilisearch.
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

export function toSpeakerBubbles(whisperXTranscript: WhisperXTranscript, 
    wordsAreSegments: boolean): SpeakerBubble[] {
  const speakerBubbles = new Array<SpeakerBubble>();

  let curSpeakerNum = -1;
  let segments;
  let segmentIndex = 0;
  for (const rawSegment of whisperXTranscript.segments) {
    segmentIndex++;
    const newSpeaker = toSpeakerNum(rawSegment.speaker);
    if (newSpeaker !== curSpeakerNum) {
      if (segments) {
        speakerBubbles.push({speaker: curSpeakerNum, segments});
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
    speakerBubbles.push({speaker: curSpeakerNum, segments});
  }

  return speakerBubbles;
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

export async function getDiarizedTranscript(category: string, id: string, language: string): Promise<DiarizedTranscript> {
  try {
    const path = makeDiarizedTranscriptsPath(category, id, language);
    const fileRef = Storage.ref(Storage.getStorage(), path);
    const raw_bytes = await Storage.getBytes(fileRef);
    const diarizedTranscript : DiarizedTranscript =
        JSON.parse(new TextDecoder().decode(raw_bytes));

    return diarizedTranscript;
  } catch (e) {
    console.error(e);
  }

  return { diarized: [], language };
}

export function toHhmmss(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export function fromHhmmss(hhmmss: string): number {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + (Number(parts[1]) * 60) + (Number(parts[0]) * 60 * 60);
}
