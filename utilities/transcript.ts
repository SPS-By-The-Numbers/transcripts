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

export type WhisperXTranscriptData = {
  segments : WhisperXSegmentData[];
  language : string;
};

export type SegmentData = {
  id: string;  // Id string that is unique to one transcript.

  // Parallel arrays for words and the start timestamps of each word.
  // Arrays are in timestamp order.
  text: string;
  start: number;
  end: number;
};

export type SpeakerBubble = {
  speaker: string;
  segments : SegmentData[];
};

export type TranscriptData = {
  speakerBubbles : SpeakerBubble[];
  language : string;
};

// Returns the path to the json transcript data for the identified file.
function makeTranscriptsPath(category: string, id: string, language:string): string {
  return `/transcripts/public/${category}/json/${id}.${language}.json`;
}

// Takes a `transcript` and produces an array of documents suitable for sending to
// Meilisearch.
export function toSearchDocuments(vid: string, transcript: TranscriptData) {
  return transcript.segments.map((segment, i) => ({
    id: `${vid}/${i}`,
    vid,
    speaker: segment.speakerNum,
    language: transcript.language,
    text: segment.words.join(' '),
    start: segment.starts[0],
    segmentId: i,
  }));
}

export function toSpeakerBubbles(whisperXTranscript: WhisperXTranscriptData, 
    wordsAreSegments: boolean): SpeakerBubble[] {
  const speakerBubbles = new Array<SpeakerBubble>();

  let curSpeakerNum = -1;
  let segments = null;
  for (const rawSegment of whisperXTranscript.segments) {
    const newSpeaker = toSpeakerNum(rawSegment.speaker);
    if (newSpeaker !== curSpeakerNum) {
      if (segments) {
        speakerBubbles.push({speaker: curSpeakerNum, segments});
      }

      curSpeakerNum = newSpeaker;
      segments = new Array<SegmentData>();
    }

    if (wordsAreSegments) {
      let lastStart : number = rawSegment.words[0].start || 0;
      for (const word of rawSegment.words) {
        const segmentData = new SegmentData();
        segmentData.text = word.word;
        segments.text.push(word.word);

        // Hack for missing start time. Move forward by 0.1 milliseconds.
        lastStart = word.start || lastStart + SMALL_TS_INCREMENT;
        segmentData.start = lastStart;
        segmentData.end = word.end || lastStart + SMALL_TS_INCREMENT;

        segments.push(segmentData);
      }
    } else {
      segments.push({
        text: rawSegment.text,
        start: rawSegment.start,
        end: rawSegment.end,
      });
    }
  }

  if (segments) {
    speakerBubbles.push({speaker: curSpeakerNum, segments});
  }

  return speakerBubbles;
}

export async function getTranscript(category: string, id: string, language: string,
    wordsAreSegments: boolean = false): Promise<TranscriptData> {
  try {
    const transcriptsPath = makeTranscriptsPath(category, id, language);
    const fileRef = Storage.ref(Storage.getStorage(), transcriptsPath);
    const whisperXTranscript : WhisperXTranscriptData =
        JSON.parse(new TextDecoder().decode(await Storage.getBytes(fileRef)));
    const speakerBubbles = toSpeakerBubbles(whisperXTranscript, wordsAreSegments);

    return {speakerBubbles, language};
  } catch (e) {
    console.error(e);
  }

  return { speakerBubbles: [], language };
}

export function toHhmmss(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export function fromHhmmss(hhmmss: string): number {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + (Number(parts[1]) * 60) + (Number(parts[0]) * 60 * 60);
}
