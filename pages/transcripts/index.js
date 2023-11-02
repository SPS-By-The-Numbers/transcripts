import Link from 'next/link'
import { readdir } from 'fs/promises';
import path from 'path';

export async function getStaticProps(context) {
    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts'),
        { withFileTypes: true }
    );

    const categories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    return {
        props: {
            categories
        }
    }
}

export default function Index(props) {
    const { categories } = props;

    const categoryLinks = categories.map(
        category => <li><Link href={path.join('/', 'transcripts', category)}>{category}</Link></li>
    );

    return (
        <main>
            <ul>
            {categoryLinks}
            </ul>
        </main>
    );
}