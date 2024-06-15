import * as Storage from "firebase/storage"

// Use array to compress size of keys in json serialization.
export type SegmentData = [
  string,  // Id string that is unique to one transcript.
  string,  // Text of the segment.
  number,  // Start time
  number   // End time.
  ];

export type DiarizedSegments = {
  speaker: number;
  segments : SegmentData[];
};

// Returns the path to the transcript data for the identified file. Data is 
export function makeDiarizedTranscriptsPath(category: string, id: string, language:string): string {
  return `transcripts/public/${category}/diarized/${id}.${language}.json`;
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

  return { diarized: [], language, version: 1, segmentType: SegmentTypeValues.Sentence };
}

export function toHhmmss(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export function fromHhmmss(hhmmss: string): number {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + (Number(parts[1]) * 60) + (Number(parts[0]) * 60 * 60);
}
