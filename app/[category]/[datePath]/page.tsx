import { formatISO, parseISO, intlFormat } from 'date-fns';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Link from 'next/link'
import { ReactNode } from 'react';
import { VideoData, getAllCategories, getAllVideosForPublishDate, getDatesForCategory } from 'utilities/metadata-utils';
import { parseDateFromPath, formatDateForPath, getVideoPath } from 'utilities/path-utils';
import VideoLinks from './VideoLinks';

type DateParams = {
    category: string,
    datePath: string,
};

export async function generateStaticParams(): GenerateStaticParams<DateParams> {
    const categories: string[] = await getAllCategories();

    const categoriesWithDates: Array<{ category: string, date: Date }> = [];

    for (const category of categories) {
        const dates: Date[] = await getDatesForCategory(category);

        categoriesWithDates.push(...dates.map(date => ({
            category,
            date
        })));
    }

    return categoriesWithDates.map(
        ({category, date}) => ({
            category,
            datePath: formatDateForPath(date)
            }));
}

export default async function Index({params}: DateParams): ReactNode {
    const date = parseDateFromPath(params.datePath);
    return (<VideoLinks
        category={params.category}
        videos={await getAllVideosForPublishDate(params.category, date)}
        date={date} />);
}
