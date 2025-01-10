import TranscriptSearch from 'components/TranscriptSearch';

import type { CategoryId } from 'common/params.ts';

export default async function TranscriptSearchPage(props: {params: Promise<{category: CategoryId}>}) {
  const params = await props.params;
  const category = params?.['category'];

  return (<TranscriptSearch category={category} />);
}
