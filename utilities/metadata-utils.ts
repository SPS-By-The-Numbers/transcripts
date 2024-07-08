import * as Database from 'firebase/database';
import { get, child, QueryConstraint, startAt, endAt, query, orderByKey, limitToLast } from "firebase/database"
import { dbPublicRoot } from 'utilities/client/firebase';
import { parseISO } from 'date-fns';
import { parseDateFromPath } from "./path-utils";

import type { CategoryId, VideoMetadata } from 'common/params';
import type { DataSnapshot } from 'firebase/database';

function metadataToVideoMetadata(entry: any): VideoMetadata {
    return {
        videoId: entry.video_id,
        title: entry.title,
        description: entry.description,
        publishDate: parseISO(entry.publish_date),
        channelId: entry.channel_id
    };
}

export async function getAllVideosForCategory(category: string): Promise<VideoMetadata[]> {
    const result = (await Database.get(Database.child(dbPublicRoot, `${category}/metadata`))).val();
    if (!result) {
      return [];
    }

    const allVideos: VideoMetadata[] = Object.entries(result).map(
      ([videoId, metadata]) => metadataToVideoMetadata(metadata)
    );

    return allVideos;
}

export async function getCategoryPublicData(category: CategoryId, path: string): Promise<any> {
    return (await Database.get(Database.child(dbPublicRoot, `${category}/${path}`))).val();
}

export async function getDatesForCategory(category: string): Promise<string[]> {
    const result = getCategoryPublicData(category, 'index/date');
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

export async function getAllVideosForPublishDate(category: string, datePath: string): Promise<VideoMetadata[]> {
    const result = await getCategoryPublicData(category, `index/date/${datePath}`);

    return Object.entries(result).map(([videoId, metadata]) => metadataToVideoMetadata(metadata));
}

export async function getAllVideosForDateRange(
    category: string, startDate: string | null, endDate: string | null
): Promise<VideoMetadata[]> {
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
            [videoId: string]: VideoMetadata
        }
    } = data.val();

    const videos: VideoMetadata[] = Object.entries(videosByDate).flatMap(([dateString, videosById]) =>
        Object.entries(videosById).map(([videoId, videoData]) => metadataToVideoMetadata(videoData))
    );

    return videos;
}
