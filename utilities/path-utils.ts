import { format, parse, startOfDay } from 'date-fns';

const pathDateFormat = 'yyyy-MM-dd';

export function formatDateForPath(date: Date): string {
    return format(date, pathDateFormat);
}

export function parseDateFromPath(dateString: string): Date {
    return startOfDay(parse(dateString, pathDateFormat, new Date()));
}

export function getCategoryPath(category: string): string {
    return `/${category}`;
}

export function getDatePath(category: string, date: string): string {
    return `${getCategoryPath(category)}/${date}`;
}

export function getVideoPath(category: string, videoId: string): string {
    return `${getCategoryPath(category)}/v/${videoId.substr(0,2).toUpperCase()}/${videoId}`;
}
