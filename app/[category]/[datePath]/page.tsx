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

export default async function Index({params}: {params: DateParams}) {
    return (<VideoLinks
        category={params.category}
        videos={await getAllVideosForPublishDate(params.category, params.datePath)}
        datePath={params.datePath} />);
}
