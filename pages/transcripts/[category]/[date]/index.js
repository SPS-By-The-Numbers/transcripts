import { readdir } from 'fs/promises';
import path from 'path';

export async function getStaticPaths(context) {
    console.log(context);
    const category = context.params.category;

    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts', category),
        { withFileTypes: true }
    );

    const dates = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
        .map(entry => entry.name.substring(0, entry.name.indexOf('.json')));

    return {
        paths: dates.map(
            date => ({
                params: {
                    category,
                    date
                }
            })
        )
    };
}

export default function Index(props) {
    return (
        <main>Transcript for {props.category} on {props.date} goes here</main>
    );
}