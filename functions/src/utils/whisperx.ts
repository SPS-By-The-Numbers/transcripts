import * as Storage from "firebase/storage";
import type { DiarizedTranscript, SegmentData } from "../../../utilities/transcript";
import { SegmentTypeValues } from "../../../utilities/transcript";
import { split, SentenceSplitterSyntax } from "sentence-splitter";
import { makeWhisperXTranscriptsPath } from "./path.js";
import { toSpeakerNum } from "../../../utilities/speaker-info";


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

export function toMonologuesAndSegments(whisperXTranscript: WhisperXTranscript) : [SpeakerMonologue[], Segments]  {
  const diarized = toDiarizedTranscript(whisperXTranscript);
  const monologues = [];
  const segments = {};

  for (const diarizedSegment of diarized.diarized) {
    const segmentMetadata = [];
    for (const segment of diarizedSegment.segments) {
      segmentMetadata.push([segment[0], segment[2], segment[3]]);
      segments[segment[0]] = segment[1];
    }
    monologues.push({speaker: diarizedSegment.speaker, segmentMetadata});
  }

  return [monologues, segments];
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
