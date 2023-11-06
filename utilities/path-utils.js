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
    // HACK: This is tricky. The video Title is used for the filename of the
    // transcription. Unfortunately the title may commonly have slashes
    // (eg 10/12/2023) or other filesystem and URL unfriendly characters. In
    // the `[date]/[title]/index.js` getStaticPaths() function, the title
    // is exported to the filesystem and Next.js does some sort of conversion
    // to the filesystem that works locally, but not on firebase.
    //
    // To work around this, in `[date]/[title]/index.js` getStaticPaths(),
    // the title is preemptively run through encodeURIComponent() to ensure
    // the output filename does not have any filesystem unfriendly parts.
    // Now the real filename is encodeURIComponent(title). This means links
    // to it have to URI encode the already encoded path to escape the percentage
    // signs. Hence there must be a double encodeURIComponent().
    //
    // A better fix would be to have a getFilesystemSafeTitle() function that
    // minimally escapes filesystem characters instead of abusing
    // encodeURIComponent() for that function.
    return `${getDatePath(category, date)}/${encodeURIComponent(encodeURIComponent(title))}`;
}
