import Link from 'next/link'
import { readdir } from 'fs/promises';
import path from 'path';
import { getAllCategories } from '../../utilities/metadata-utils';
import { getCategoryPath } from '../../utilities/path-utils';

export async function getStaticProps(context) {
    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts'),
        { withFileTypes: true }
    );

    const categories = await getAllCategories();

    return {
        props: {
            categories
        }
    }
}

export default function Index(props) {
    const { categories } = props;

    const categoryLinks = categories.map(
        category => <li><Link href={ getCategoryPath(category) }>{category}</Link></li>
    );

    return (
        <main>
            <ul>
                {categoryLinks}
            </ul>
        </main>
    );
}