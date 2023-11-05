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
        category => <li className="mx-3 list-disc text-lg"><Link href={ getCategoryPath(category) }>{category}</Link></li>
    );

    return (
        <main className="mx-5 my-5">
          <h2 className="my-4 text-lg">
            Meetings that we have transcripts for.
          </h2>
          <ul className="flex flex-col flex-wrap h-screen">
                {categoryLinks}
            </ul>
        </main>
    );
}
