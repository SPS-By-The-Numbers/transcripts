import * as Constants from 'config/constants';

import TranscriptSearch from 'components/TranscriptSearch';

import type { CategoryId } from 'common/params.ts';

type PageProps = {
  params: Promise<{category: CategoryId}>,
  searchParams?: Promise<SearchParams>
}

export async function generateMetadata({ params, searchParams }: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const category = (await params).category;
  const categoryInfo = Constants.CATEGORY_CHANNEL_MAP[category];

  if (!categoryInfo) {
    return await parent;
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
