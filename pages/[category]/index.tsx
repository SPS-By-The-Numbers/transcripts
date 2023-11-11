import { formatISO, parseISO, compareDesc } from 'date-fns';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { ReactNode } from 'react';
import { getAllCategories, getDatesForCategory } from '../../utilities/metadata-utils';
import { getDatePath } from '../../utilities/path-utils';

type CategoryParams = {
    category: string,
};

type CategoryProps = {
    category: string,
    dates: string[]
}

export const getStaticPaths: GetStaticPaths<CategoryParams> = async () => {
    const categories = await getAllCategories();

    return {
        paths: categories.map(category => ({
            params: {
                category
            }
        })),
        fallback: false
    };
};

export const getStaticProps: GetStaticProps<CategoryProps, CategoryParams> = async (context) => {
    const category = context.params.category;
    const dates = await getDatesForCategory(category);

    return {
        props: {
            category,
            dates: dates.map((date: Date): string => formatISO(date))
        }
    };
};

const Index: NextPage<CategoryProps> = (props: CategoryProps): ReactNode => {
    const { category } = props;
    const dates = props.dates.map((dateString: string): Date => parseISO(dateString));
    dates.sort(compareDesc);

    const dateLinks = dates.map((date: Date, i: number): ReactNode => (
        <li key={`li-${i}`} className="mx-3 list-disc"><Link href={ getDatePath(category, date) }>{ date.toLocaleDateString('en-US') }</Link></li>
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

export default Index;
