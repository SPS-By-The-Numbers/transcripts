import { readdir } from 'fs/promises';
import path from 'path';
import Link from 'next/link'

export async function getStaticProps(context) {
    console.log(context);
    const category = context.params.category;

    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts', category),
        { withFileTypes: true }
    );

    const transcripts = entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
        .map(entry => entry.name.substring(0, entry.name.indexOf('.json')));

    return {
        props: {
            category,
            transcripts
        }
    }
}

export async function getStaticPaths() {
    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts'),
        { withFileTypes: true }
    );

    const categories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    return {
        paths: categories.map(category => ({
            params: {
                category
            }
        })),
        fallback: false
    };
}

export default function Index(props) {
    const { category, transcripts } = props;

    const transcriptLinks = transcripts.map(
        transcript => <li><Link href={path.join('/', 'transcripts', category, transcript)}>{transcript}</Link></li>
    )

    return (
        <main>
            <ul>
                {transcriptLinks}
            </ul>
        </main>
    );
}