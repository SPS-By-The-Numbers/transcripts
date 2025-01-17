import * as Constants from 'config/constants';

import TranscriptSearch from 'components/TranscriptSearch';

import type { CategoryId } from 'common/params.ts';
import type { Metadata } from 'next'

type PageProps = {
  params: Promise<{category: CategoryId}>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const category = (await params).category;
  const categoryInfo = Constants.CATEGORY_CHANNEL_MAP[category];

  if (!categoryInfo) {
    return {};
  }

  return ({
    title: `${categoryInfo.name} Transcription Search`,
    description: `Full text search over the archive of all transcriptions for ${categoryInfo.name}`,
    keywords: [categoryInfo.name, "full text search", "meilisearch"],
  });
}

export default async function TranscriptSearchPage(props: PageProps) {
  const params = await props.params;
  const category = params?.['category'];

  return (<TranscriptSearch category={category} />);
}
