import { format, parse, startOfDay } from 'date-fns';

const pathDateFormat = 'yyyy-MM-dd';

export function formatDateForPath(date) {
    return format(date, pathDateFormat);
}

export function parseDateFromPath(dateString) {
    return startOfDay(parse(dateString, pathDateFormat, new Date()));
}

export function getCategoryPath(category) {
    return `/transcripts/${category}`;
}

export function getDatePath(category, date) {
    return `${getCategoryPath(category)}/${formatDateForPath(date)}`;
}

export function getTranscriptPath(category, date, title) {
    return `${getDatePath(category, date)}/${encodeURIComponent(title)}`;
}