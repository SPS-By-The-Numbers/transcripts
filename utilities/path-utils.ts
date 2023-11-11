import { format, parse, startOfDay } from 'date-fns';

const pathDateFormat = 'yyyy-MM-dd';

export function formatDateForPath(date: Date): string {
    return format(date, pathDateFormat);
}

export function parseDateFromPath(dateString: string): Date {
    return startOfDay(parse(dateString, pathDateFormat, new Date()));
}

export function getCategoryPath(category: string): string {
    return `/transcripts/${category}`;
}

export function getDatePath(category: string, date: Date): string {
    return `${getCategoryPath(category)}/${formatDateForPath(date)}`;
}

export function getTranscriptPath(category: string, date: Date, videoId: string): string {
    return `${getDatePath(category, date)}/${videoId}`;
}
