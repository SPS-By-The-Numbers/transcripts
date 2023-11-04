import { formatISO, parseISO, intlFormat } from 'date-fns';
import Link from 'next/link'
import { getAllCategories, getAllMetadataForPublishDate, getDatesForCategory } from '../../../../utilities/metadata-utils';
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

    const metadata = await getAllMetadataForPublishDate(context.params.category, date);

    return {
        props: {
            category: context.params.category,
            date: formatISO(date),
            fileMetadata: metadata
        }
    };
}

export default function Index(props) {
    const { category, fileMetadata } = props;
    const date = parseISO(props.date);

    console.log(fileMetadata);

    const fileLinks = fileMetadata.map(
        fileEntry => <li><Link href={ getTranscriptPath(category, date, fileEntry.title) }>{ fileEntry.title }</Link></li>
    )
    return (
        <main>
            <header>Transcripts for { props.category } on { intlFormat(date) }</header>
            <ul>
                { fileLinks }
            </ul>
        </main>
    );
}