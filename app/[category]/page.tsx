import DateIndex from './DateIndex';
import { Metadata, ResolvingMetadata } from 'next';
import { getAllCategories, getDatesForCategory } from 'utilities/metadata-utils';

type CategoryParams = {
    category: string,
};

type Props = {
  params: CategoryParams
  searchParams: { [key: string]: string | string[] | undefined }
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata): Promise<Metadata> {

  // fetch data
  const parentMetadata = await parent;

  return {
    title: `Transcripts of ${params.category} meetings`,
    description: `Transcripts of ${params.category} meetings`
  }
}

export async function generateStaticParams() {
    const categories = await getAllCategories();

    return categories.map(category => ({category}));
}

export default async function Index({params}: {params: CategoryParams}) {
    return <DateIndex category={params.category} dates={await getDatesForCategory(params.category)} />
}
