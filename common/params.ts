import { format, parse, startOfDay } from 'date-fns';

export type CategoryId = string;
export type SegmentId = string;
export type SpeakerId = number;
export type Iso6393Code = string;
export type VideoId = string;
export type VideoMetadata = {
    channelId: string,
    description: string,
    publishDate: Date,
    title: string,
    videoId: string,
};

const pathDateFormat = 'yyyy-MM-dd';

export function encodeDate(date: Date): string {
  return format(date, pathDateFormat);
}

export function encodeDateNoThrow(date: Date) : string | undefined {
  try {
    return encodeDate(date);
  } catch(e) {
    // Ignore error.
  }

  return undefined;
}

export function decodeDate(dateString: string): Date {
    return startOfDay(parse(dateString, pathDateFormat, new Date()));
}

export function isValidVideoId(videoId: VideoId): boolean {
   return videoId.match(/^[A-Za-z0-9_-]{11}$/) !== null;
}
