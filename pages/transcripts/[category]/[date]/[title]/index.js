import { parseJSON } from "date-fns";
import { getAllCategories, getAllMetadataForCategory, getMetadataForDateAndTitle, getSpeakerMapping, getTranscript } from "../../../../../utilities/metadata-utils";
import { formatDateForPath, parseDateFromPath } from "../../../../../utilities/path-utils";
import { BoardMeeting } from '../../../../../components/BoardMeeting';

export async function getStaticPaths() {
    const categories = await getAllCategories();

    const categoriesWithMetadata = (await Promise.all(categories.map(
        category => getAllMetadataForCategory(category).then(
            allMetadata => allMetadata.map(
                metadata => ({
                    category,
                    metadata
                })
            )
        )
    ))).flat();

    const debugMetadata = categoriesWithMetadata.find(entry => entry.metadata.video_id === '--Rm3V-Gvtc');
    console.log('debug metadata:');
    console.log(debugMetadata);

    const nativeParams = categoriesWithMetadata.map(entry => ({
        category: entry.category,
        date: parseJSON(entry.metadata.publish_date),
        title: entry.metadata.title
    }));

    const paths = nativeParams.map(entry => ({
        params: {
            category: entry.category,
            date: formatDateForPath(entry.date),
            title: entry.title
        }
    }));

    const debugPath = paths.find(path => path.params.title === encodeURIComponent(debugMetadata.metadata.title));
    console.log('debug path:');
    console.log(debugPath);

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps(context) {
    const category = context.params.category;
    const date = parseDateFromPath(context.params.date);
    const title = decodeURIComponent(context.params.title);

    const metadata = await getMetadataForDateAndTitle(category, date, title);

    const id = metadata.video_id;
    const transcript = await getTranscript(category, id);
    const speakers = await getSpeakerMapping(category, id);

    return {
        props: {
            id,
            transcript,
            speakers
        }
    }
}

export default function Index({ id, transcript, speakers }) {
    return <BoardMeeting video_id={ id } transcript={ transcript } speakers={ speakers } />
}