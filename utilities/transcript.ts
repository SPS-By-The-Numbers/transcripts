import * as Storage from "firebase/storage"
import { app } from 'utilities/firebase'
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

export type WhisperXTranscriptData = {
  segments : WhisperXSegmentData[];
  language : string;
};

export type SegmentData = {
  speakerNum: number;  // The speaker number.

  // Parallel arrays for words and the start timestamps of each word.
  // It is possible for starts timestamps to have nulls if no start time was recorded.
  // Arrays are in timestamp order.
  words: string[];
  starts: number[];
};

export type TranscriptData = {
  segments : SegmentData[];
  language : string;
};

function makeTranscriptsPath(category: string, path: string): string {
  return `/transcripts/public/${category}/${path}`;
}

export async function getTranscript(category: string, id: string, wordTimes: boolean): Promise<TranscriptData> {
    const transcriptsPath = makeTranscriptsPath(category, `json/${id}.en.json`);
    try {
      const fileRef = Storage.ref(Storage.getStorage(), transcriptsPath);
      const whisperXTranscript : WhisperXTranscriptData = JSON.parse(new TextDecoder().decode(await Storage.getBytes(fileRef)));
      const transcriptData : TranscriptData = {
        segments: [],
        language: whisperXTranscript.language,
      };

      if (wordTimes) {
        transcriptData.segments = whisperXTranscript.segments.map(s => {
          const speakerNum = toSpeakerNum(s.speaker);
          const words : string[] = [];
          const starts : number[] = [];
          let lastStart : number = s.words[0].start || 0;
          for (const w of s.words) {
            words.push(w.word);
            lastStart = w.start || lastStart;
            starts.push(lastStart);
          }

          return { speakerNum, words, starts };
        });
      } else {
        transcriptData.segments = whisperXTranscript.segments.map(s => { return {
          speakerNum: toSpeakerNum(s.speaker),
          words: [ s.text ],
          starts: [ s.start ]
        }});
      }

      return transcriptData;
    } catch (e) {
      console.error(e);
    }

    return { segments: [], language: 'en' };
}

