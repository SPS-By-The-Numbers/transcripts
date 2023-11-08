import { formatISO, parseISO } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { ReactElement } from 'react';
import { getAllCategories, getDatesForCategory } from '../../../utilities/metadata-utils';
import { getDatePath } from '../../../utilities/path-utils';
import styles from '../../../styles/Home.module.css';

type CategoryParams = {
    category: string,
};

type CategoryProps = {
    category: string,
    dates: string[]
}

export const getStaticPaths = (async () => {
    const categories = await getAllCategories();

    return {
        paths: categories.map(category => ({
            params: {
                category
            }
        })),
        fallback: false
    };
}) satisfies GetStaticPaths<CategoryParams>;

export const getStaticProps = (async (context) => {
    const category = context.params.category;
    const dates = await getDatesForCategory(category);

    return {
        props: {
            category,
            dates: dates.map((date: Date): string => formatISO(date))
        }
    };
}) satisfies GetStaticProps<CategoryProps, CategoryParams>;

export default function Index(props: CategoryProps): ReactElement {
    const { category } = props;
    const dates = props.dates.map((dateString: string): Date => parseISO(dateString));

    const dateLinks = dates.map((date: Date, i: number): ReactElement => (
        <li key={`li-${i}`} className="mx-3 list-disc"><Link href={getDatePath(category, date)}>{date.toLocaleDateString('en-US')}</Link></li>
    ))

    return (
        <main className="mx-5 my-5">
          <h2 className="my-4 text-lg">
            All transcripts for <b>{category}</b> by date:
          </h2>
          <ul className="flex flex-col flex-wrap h-screen">
              { dateLinks }
          </ul>
        </main>
    );
}
