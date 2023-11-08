import { parseISO } from "date-fns";
import { getAllCategories, getAllVideosForCategory, getVideoForDateAndId, getSpeakerMapping, getTranscript, VideoData } from "../../../../../utilities/metadata-utils";
import { formatDateForPath, parseDateFromPath } from "../../../../../utilities/path-utils";
import { BoardMeeting } from '../../../../../components/BoardMeeting';
import { GetStaticPaths, GetStaticProps } from "next";
import { ReactElement } from "react";

type VideoParams = {
    category: string,
    date: string,
    videoId: string,
}

type VideoProps = {
    metadata: any,
    category: string,
    transcript: any,
    speakers: any
};

export const getStaticPaths = (async () => {
    const categories: string[] = await getAllCategories();

    const categoriesWithVideos: Array<{ category: string, video: VideoData }> = [];
    
    for (const category of categories) {
        const videos: VideoData[] = await getAllVideosForCategory(category);

        categoriesWithVideos.push(...videos.map(video => ({
            category,
            video,
        })));
    }

    const nativeParams: Array<{ category: string, date: Date, videoId: string }> = categoriesWithVideos.map(({ category, video }) => ({
        category: category,
        date: video.date,
        videoId: video.metadata.video_id
    }));

    return {
        paths: nativeParams.map(entry => ({
            params: {
                category: entry.category,
                date: formatDateForPath(entry.date),
                videoId: entry.videoId
            }
        })),
        fallback: false
    };
}) satisfies GetStaticPaths<VideoParams>;

export const getStaticProps = (async (context) => {
    const category = context.params.category;
    const date = parseDateFromPath(context.params.date);
    const videoId = context.params.videoId;

    const video = await getVideoForDateAndId(category, date, videoId);

    const transcript = await getTranscript(category, videoId);
    const speakers = await getSpeakerMapping(category, videoId);

    return {
        props: {
            metadata: video.metadata,
            category,
            transcript,
            speakers
        }
    };
}) satisfies GetStaticProps<VideoProps, VideoParams>;

export default function Index({ metadata, category, transcript, speakers }): ReactElement {
    return <BoardMeeting metadata={ metadata } category={ category } transcript={ transcript } speakers={ speakers } />
}
