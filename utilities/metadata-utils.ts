import { get, child } from "firebase/database"
import { dbPublicRoot } from 'utilities/firebase';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { parseDateFromPath } from './path-utils';

const pathDateFormat = 'yyyy-MM-dd';

export type VideoData = {
    videoId: string,
    title: string,
    description: string,
    publishDate: Date,
    channelId: string,
}

function metadataToVideoData(entry: any): VideoData {
    return {
        videoId: entry.video_id,
        title: entry.title,
        description: entry.description,
        publishDate: parseISO(entry.publish_date),
        channelId: entry.channel_id
    };
}

export async function getCategoryPublicRoot(category: string): Promise<any> {
    return (await get(dbPublicRoot)).child(category);
}

export async function getAllCategories(): Promise<string[]> {
    const result = (await get(dbPublicRoot)).val();

    return Object.keys(result);
}

export async function getAllVideosForCategory(category: string): Promise<VideoData[]> {
    const result = (await getCategoryPublicRoot(category)).child(`metadata`).val();
    if (!result) {
      return [];
    }

    const allVideos: VideoData[] = Object.entries(result).map(
      ([videoId, metadata]) => metadataToVideoData(metadata)
    );

    return allVideos;
}

export async function getDatesForCategory(category: string): Promise<string[]> {
    const result = (await getCategoryPublicRoot(category)).child(`index/date`).val();
    if (!result) {
      return [];
    }
    return Object.keys(result);
}

export async function getAllVideosForPublishDate(category: string, datePath: string): Promise<VideoData[]> {
    const result = (await getCategoryPublicRoot(category)).child(`index/date/${datePath}`).val();

    return Object.entries(result).map(([videoId, metadata]) => metadataToVideoData(metadata));
}

export async function getAllVideosForDateRange(
    category: string, startDate: string | null, endDate: string | null
): Promise<VideoData[]> {
    const allDates: string[] = await getDatesForCategory(category);
    const start: Date | null = startDate !== null ?
        parseDateFromPath(startDate) : null;
    const end: Date | null = endDate !== null ?
        parseDateFromPath(endDate) : null;

    const filteredDates: string[] = allDates.filter((dateString: string): boolean => {
        const date: Date = parseDateFromPath(dateString);

        if (start !== null && isBefore(date, start)) {
            return false;
        }

        if (end !== null && isAfter(date, end)) {
            return false;
        }

        return true;
    });

    const filteredVideos: VideoData[] = [];

    for (const date of filteredDates) {
        const curVideos: VideoData[] = await getAllVideosForPublishDate(category, date);
        filteredVideos.push(...curVideos);
    }

    return filteredVideos;
}

export async function getMetadata(category: string, id: string): Promise<any> {
    return (await getCategoryPublicRoot(category)).child(`metadata/${id}`).val();
}

export async function getVideoRef(category: string, id: string): Promise<any> {
    return (await getCategoryPublicRoot(category)).child(`v/${id}`);
}

export async function getExistingRef(category: string): Promise<any> {
    return (await getCategoryPublicRoot(category)).child('existing');
}
