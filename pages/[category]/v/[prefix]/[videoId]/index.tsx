import { getAllCategories, getAllVideosForCategory, getMetadata, getSpeakerMapping, getTranscript, VideoData } from "../../../../../utilities/metadata-utils";
import { formatDateForPath, parseDateFromPath } from "../../../../../utilities/path-utils";
import BoardMeeting from '../../../../../components/BoardMeeting';
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { ReactNode } from "react";

type VideoParams = {
    category: string,
    prefix: string,
    videoId: string,
}

type VideoProps = {
    metadata: any,
    category: string,
    transcript: any,
    speakerInfo: any
};

export const getStaticPaths: GetStaticPaths<VideoParams> = async () => {
    const categories: string[] = await getAllCategories();

    const categoriesWithVideos: Array<{ category: string, video: VideoData }> = [];
    
    for (const category of categories) {
        const videos: VideoData[] = await getAllVideosForCategory(category);

        categoriesWithVideos.push(...videos.map(video => ({
            category,
            video,
        })));
    }

    const paths: Array<{ params: VideoParams }> =
        categoriesWithVideos.map(({ category, video }) => ({
            params: {
                category: category,
                prefix: video.metadata.video_id.substr(0,2).toUpperCase(),
                videoId: video.metadata.video_id
            }
    }));

    return {
        paths,
        fallback: false
    };
};

export const getStaticProps: GetStaticProps<VideoProps, VideoParams> = async (context) => {
    const category = context.params.category;
    const videoId = context.params.videoId;

    const metadata = await getMetadata(category, videoId);
    const transcript = await getTranscript(category, videoId);
    const speakerInfo = await getSpeakerMapping(category, videoId);

    return {
        props: {
            metadata,
            category,
            transcript,
            speakerInfo
        }
    };
};

const Index: NextPage<VideoProps> = ({ metadata, category, transcript, speakerInfo }): ReactNode => {
    return <BoardMeeting metadata={ metadata } category={ category } transcript={ transcript } speakerInfo={ speakerInfo } />
}

export default Index;
