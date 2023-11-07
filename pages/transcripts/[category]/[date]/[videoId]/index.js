import { parseISO } from "date-fns";
import { getAllCategories, getAllVideosForCategory, getVideoForDateAndId, getSpeakerMapping, getTranscript } from "../../../../../utilities/metadata-utils";
import { formatDateForPath, parseDateFromPath } from "../../../../../utilities/path-utils";
import { BoardMeeting } from '../../../../../components/BoardMeeting';

export async function getStaticPaths() {
    const categories = await getAllCategories();

    const categoriesWithMetadata = (await Promise.all(categories.map(
        category => getAllVideosForCategory(category).then(
            allVideos => allVideos.map(
                video => ({
                    category,
                    video
                })
            )
        )
    ))).flat();

    const nativeParams = categoriesWithMetadata.map(({category, video}) => ({
        category: category,
        date: parseISO(video.date),
        videoId: video.metadata.video_id
    }));

    const paths = nativeParams.map(entry => ({
        params: {
            category: entry.category,
            date: formatDateForPath(entry.date),
            videoId: entry.videoId
        }
    }));

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps(context) {
    const category = context.params.category;
    const date = parseDateFromPath(context.params.date);
    const videoId = context.params.videoId;

    const video = await getVideoForDateAndId(category, date, videoId);

    const transcript = await getTranscript(category, videoId);
    const speakers = await getSpeakerMapping(category, videoId);

    return {
        props: {
            video,
            category,
            transcript,
            speakers
        }
    }
}

export default function Index({ video, category, transcript, speakers }) {
    return <BoardMeeting video={ video } category={ category } transcript={ transcript } speakers={ speakers } />
}
