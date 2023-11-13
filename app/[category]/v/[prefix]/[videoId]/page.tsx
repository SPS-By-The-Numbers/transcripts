import { getAllCategories, getAllVideosForCategory, getMetadata, getSpeakerMapping, getTranscript, VideoData } from "utilities/metadata-utils";
import { formatDateForPath, parseDateFromPath } from "utilities/path-utils";
import BoardMeeting from 'components/BoardMeeting';
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { ReactNode } from "react";

type VideoParams = {
    category: string,
    prefix: string,
    videoId: string,
}

export async function generateStaticParams(): GenerateStaticParams<VideoParams> {
    const categories: string[] = await getAllCategories();

    const categoriesWithVideos: Array<{ category: string, video: VideoData }> = [];
    
    for (const category of categories) {
        const videos: VideoData[] = await getAllVideosForCategory(category);

        categoriesWithVideos.push(...videos.map(video => ({
            category,
            video,
        })));
    }

    return categoriesWithVideos.map(({ category, video }) => ({
        category: category,
        prefix: video.metadata.video_id.substr(0,2).toUpperCase(),
        videoId: video.metadata.video_id
    }));
}

export default async function Index({params}: VideoParams): ReactNode {
    const metadata = await getMetadata(params.category, params.videoId);
    const transcript = await getTranscript(params.category, params.videoId);
    const speakerInfo = await getSpeakerMapping(params.category, params.videoId);

    return <BoardMeeting
        metadata={ metadata }
        category={ params.category }
        transcript={ transcript }
        speakerInfo={ speakerInfo } />
}
