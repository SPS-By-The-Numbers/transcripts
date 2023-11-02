import { readdir } from 'fs/promises';
import path from 'path';

export async function getStaticPaths(context) {
    const categoryFileEntries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts'),
        { withFileTypes: true }
    );

    const categories = categoryFileEntries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    const categoriesWithNestedTranscripts = await Promise.all(categories.map(
        category => readdir(
            path.join(process.cwd(), 'data', 'transcripts', category),
            { withFileTypes: true }
        ).then(transcriptFileEntries => ({
            category,
            transcriptFileEntries
        }))
    ));

    const paths = categoriesWithNestedTranscripts
        .flatMap(categoryEntry => categoryEntry.transcriptFileEntries
            .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
            .map(entry => entry.name.substring(0, entry.name.indexOf('.json')))
            .map(date => ({
                params: {
                    category: categoryEntry.category,
                    date
                }
            }))
    );

    return {
        paths,
        fallback: false
    };
}

export function getStaticProps(context) {
    return {
        props: {
            category: context.params.category,
            date: context.params.date
        }
    }
}

export default function Index(props) {
    return (
        <main>Transcript for {props.category} on {props.date} goes here</main>
    );
}