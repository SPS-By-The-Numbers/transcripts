import path from 'path';
import { get, child } from "firebase/database"
import { dbRoot } from 'utilities/firebase';
import { readdir, readFile } from 'fs/promises';
import { Dirent, existsSync } from 'fs';
import { compareAsc, isEqual, parseISO, startOfDay } from 'date-fns';

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

export async function getAllCategories(): Promise<string[]> {
    const result = (await get(dbRoot)).val();

    return Object.keys(result);
}

export async function getAllVideosForCategory(category: string): Promise<VideoData[]> {
    const result = (await get(dbRoot)).child(`${category}/metadata`).val();
    if (!result) {
      return [];
    }

    const allVideos: VideoData[] = Object.entries(result).map(
      ([videoId, metadata]) => metadataToVideoData(metadata)
    );

    return allVideos;
}

export async function getDatesForCategory(category: string): Promise<string[]> {
    const result = (await get(dbRoot)).child(`${category}/index/date`).val();
    if (!result) {
      return [];
    }
    return Object.keys(result);
}

export async function getAllVideosForPublishDate(category: string, datePath: string): Promise<VideoData[]> {
    const result = (await get(dbRoot)).child(`${category}/index/date/${datePath}`).val();

    return Object.entries(result).map(([videoId, metadata]) => metadataToVideoData(metadata));
}

export async function getMetadata(category: string, id: string): Promise<any> {
    return (await get(dbRoot)).child(`${category}/metadata/${id}`).val();
}

export async function getSpeakerMapping(category: string, id: string): Promise<any> {
/*
    const speakersRootRef = Storage.ref(makeTranscriptsRootRef(category), 'speakers');
    const speakerPath: string = path.join(buildTranscriptFolderPath(category, id), `${id}.speakers.json`);
    */


    return {};
}
