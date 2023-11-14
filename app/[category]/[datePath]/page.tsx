import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link'
import { getAllCategories, getAllVideosForPublishDate, getDatesForCategory } from 'utilities/metadata-utils';
import { parseDateFromPath, formatDateForPath } from 'utilities/path-utils';
import VideoLinks from './VideoLinks';

type DateParams = {
    category: string,
    datePath: string,
};

type Props = {
  params: DateParams
  searchParams: { [key: string]: string | string[] | undefined }
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata): Promise<Metadata> {

  // fetch data
  const parentMetadata = await parent;

  return {
    title: `Transcripts of ${params.category} meetings on ${params.datePath}`,
    description: `Transcripts of ${params.category}] meetings on ${params.datePath}`
  }
}

export async function generateStaticParams() {
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

export default async function Index({params}: {params: DateParams}) {
    const date = parseDateFromPath(params.datePath);
    return (<VideoLinks
        category={params.category}
        videos={await getAllVideosForPublishDate(params.category, date)}
        date={date} />);
}
