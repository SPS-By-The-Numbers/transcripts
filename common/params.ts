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

export function decodeDate(dateString: string): Date {
    return startOfDay(parse(dateString, pathDateFormat, new Date()));
}
