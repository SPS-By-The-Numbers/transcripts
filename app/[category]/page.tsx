import DateIndex from './DateIndex';
import { GenerateStaticParams, Metadata, ResolvingMetadata } from 'next';
import { ReactNode } from 'react';
import { getAllCategories, getDatesForCategory } from 'utilities/metadata-utils';

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

type CategoryParams = {
    category: string,
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

export async function generateStaticParams(): GenerateStaticParams<CategoryParams> {
    const categories = await getAllCategories();

    return categories.map(category => ({category}));
}

export default async function Index({params}: CategoryParams): ReactNode {
    return <DateIndex category={params.category} dates={await getDatesForCategory(params.category)} />
}
