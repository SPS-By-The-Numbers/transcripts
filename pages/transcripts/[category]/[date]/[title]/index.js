import { parseJSON } from "date-fns";
import { getAllCategories, getAllVideosForCategory, getVideoForDateAndTitle, getSpeakerMapping, getTranscript } from "../../../../../utilities/metadata-utils";
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
        date: parseJSON(video.date),
        title: video.metadata.title || 'Unknown Video'
    }));

    const paths = nativeParams.map(entry => ({
        params: {
            category: entry.category,
            date: formatDateForPath(entry.date),
            title: entry.title
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
    const title = decodeURIComponent(context.params.title);

    const video = await getVideoForDateAndTitle(category, date, title);

    const videoId = video.metadata.video_id;
    const transcript = await getTranscript(category, videoId);
    const speakers = await getSpeakerMapping(category, videoId);

    return {
        props: {
            videoId,
            transcript,
            speakers
        }
    }
}

export default function Index({ videoId, transcript, speakers }) {
    return <BoardMeeting videoId={ videoId } transcript={ transcript } speakers={ speakers } />
}
