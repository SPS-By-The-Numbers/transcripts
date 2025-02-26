import * as Constants from 'config/constants';
import Alert from '@mui/material/Alert';
import Archive from 'components/Archive';

import Stack from '@mui/material/Stack';
import type { Metadata } from 'next'
import { encodeDateNoThrow, decodeDate } from 'common/params';
import { fetchEndpoint } from 'utilities/client/endpoint';
import { parseISO } from 'date-fns';

import type { CategoryId } from 'common/params';
import type { DateRange } from 'components/DateRangePicker';

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
    title: `${categoryInfo.name} Transcription Archive`,
    description: `Date searchable archive of all transcriptions for ${categoryInfo.name} in ${categoryInfo.type}: ${categoryInfo.id}`,
    keywords: [categoryInfo.name, "archive", "transcripts"],
  });
}

const mostRecentLimit = 50;

async function doDateSearch(category : CategoryId, range : DateRange) {
  const metadataParams : Record<string, string> = { category };
  if (range.start !== null) {
    const encoded = encodeDateNoThrow(range.start);
    if (encoded) {
      metadataParams['start'] = encoded;
    }
  }
  if (range.end !== null) {
    const encoded = encodeDateNoThrow(range.end);
    if (encoded) {
      metadataParams['end'] = encoded;
    }
  }

  if (metadataParams['start'] && metadataParams['end']) {
      metadataParams['limit'] = mostRecentLimit.toString();
  }

  return await fetchEndpoint('metadata', 'GET', metadataParams);
}

export default async function ArchiveIndex(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = (await props.params);

  const category = params.category;
  const metadataParams : Record<string, string> = { category };
  const range : DateRange = { start: null, end: null };

  // Extract dates. Reencode before sending to metadata endpoint to sanitize.
  if (searchParams?.start && typeof(searchParams.start) === 'string') {
    range.start = decodeDate(searchParams.start);
  }

  if (searchParams?.end && typeof(searchParams.end) === 'string') {
    range.end = decodeDate(searchParams.end);
  }

  const response = await doDateSearch(category, range);
  let videos = new Array<any>();
  let showBanner = false;
  if (response.ok && response.data.length > 0) {
    videos = response.data.map(v => ({
        videoId: v.videoId,
        title: v.title,
        publishDate: v.publishDate}));
  }

  return (
    <Stack
        component="main"
        spacing={2}
        sx={{
          padding: "1ex",
        }}>
      <Alert variant="filled" severity="info"
        sx={{display: !range.start && !range.end ? "flex" : "none" }}>
        Showing first {mostRecentLimit} videos. Change the Start Date to find older ones.
      </Alert>
      <Alert variant="filled" severity="error"
        sx={{display: response.ok ? "none" : "flex" }}>
        {response.message}
      </Alert>
      <Archive
        category={category}
        dateRange={range}
        videos={videos}
      />
    </Stack>
  );
}
