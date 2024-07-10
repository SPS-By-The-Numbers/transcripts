import * as Database from 'firebase/database';
import { dbPublicRoot } from 'utilities/client/firebase';
import { parseISO } from 'date-fns';

import type { VideoMetadata } from 'common/params';

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
