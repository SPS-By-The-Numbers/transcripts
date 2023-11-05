import { formatISO, parseISO, intlFormat } from 'date-fns';
import Link from 'next/link'
import { getAllCategories, getAllVideosForPublishDate, getDatesForCategory } from '../../../../utilities/metadata-utils';
import { parseDateFromPath, formatDateForPath, getTranscriptPath } from '../../../../utilities/path-utils';

export async function getStaticPaths(context) {
    const categories = await getAllCategories();

    const categoriesWithDates = (await Promise.all(categories.map(
        category => getDatesForCategory(category).then(
            dates => dates.map(date => ({
                category,
                date
            }))
        )
    ))).flat();

    const paths = categoriesWithDates.map(
        entry => ({
            params: {
                category: entry.category,
                date: formatDateForPath(entry.date)
            }
        })
    );

    return {
        paths,
        fallback: false
    };
}

export async function getStaticProps(context) {
    const date = parseDateFromPath(context.params.date);

    const videos = await getAllVideosForPublishDate(context.params.category, date);

    return {
        props: {
            category: context.params.category,
            date: formatISO(date),
            videos: videos
        }
    };
}

export default function Index(props) {
    const { category, videos } = props;
    const date = parseISO(props.date);


    const videoLinks = videos.map(
        video => <li><Link key={video.metadata.videoId} href={ getTranscriptPath(category, date, video.metadata.title) }>{ video.metadata.title || 'Unknown Video' }</Link></li>
    );
    return (
        <main>
            <header>Transcripts for { props.category } on { intlFormat(date) }</header>
            <ul>
                { videoLinks }
            </ul>
        </main>
    );
}
