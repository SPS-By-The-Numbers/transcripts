import { get, child, QueryConstraint, startAt, endAt, query, DataSnapshot, orderByKey, limitToLast } from "firebase/database"
import { dbPublicRoot } from 'utilities/firebase';
import { parseISO } from 'date-fns';
import { parseDateFromPath } from "./path-utils";

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

export async function getLastDateForCategory(category: string): Promise<Date | null> {
  const data: DataSnapshot = await get(query(
    child(dbPublicRoot, `${category}/index/date`),
    orderByKey(),
    limitToLast(1)));

  const dataVal: {
    [dateString: string]: any
  } = data.val();

  const datePaths: string[] = Object.keys(dataVal);

  if (datePaths.length === 0) {
    return null;
  }

  return parseDateFromPath(datePaths[0]);
}

export async function getAllVideosForPublishDate(category: string, datePath: string): Promise<VideoData[]> {
    const result = (await getCategoryPublicRoot(category)).child(`index/date/${datePath}`).val();

    return Object.entries(result).map(([videoId, metadata]) => metadataToVideoData(metadata));
}

export async function getAllVideosForDateRange(
    category: string, startDate: string | null, endDate: string | null
): Promise<VideoData[]> {
    const constraints: QueryConstraint[] = [orderByKey()];

    if (startDate !== null) {
        constraints.push(startAt(startDate));
    }

    if (endDate !== null) {
        constraints.push(endAt(endDate));
    }

    const data: DataSnapshot = await get(query(child(dbPublicRoot, `${category}/index/date`), ...constraints));
    const videosByDate: {
        [dateString: string]: {
            [videoId: string]: VideoData
        }
    } = data.val();

    const videos: VideoData[] = Object.entries(videosByDate).flatMap(([dateString, videosById]) =>
        Object.entries(videosById).map(([videoId, videoData]) => metadataToVideoData(videoData))
    );

    return videos;
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
