import { GetStaticProps } from 'next';
import Link from 'next/link';
import { readdir } from 'fs/promises';
import path from 'path';
import { getAllCategories } from '../utilities/metadata-utils';
import { getCategoryPath } from '../utilities/path-utils';
import { ReactNode } from 'react';

type TranscriptsProps = {
    categories: string[]
};

export const getStaticProps = (async (context) => {
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
}) satisfies GetStaticProps<TranscriptsProps>;

export default function Index(props: TranscriptsProps): ReactNode {
    const { categories } = props;

    const categoryLinks = categories.map(
        category => (
            <li key={category} className="mx-3 list-disc text-lg">
                <Link href={ getCategoryPath(category) }>
                    {category}
                </Link>
            </li>
        )
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
