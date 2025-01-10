import * as Constants from 'config/constants';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import DateSearchIndex from 'components/DateSearchIndex';
import { encodeDate, decodeDate } from 'common/params';
import { fetchEndpoint } from 'utilities/client/endpoint';
import { parseISO } from 'date-fns';

import type { DateRange } from 'components/DateSearchIndexFilter';

const mostRecentLimit = 50;

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function ArchiveIndex(
    props: { params: Promise<{category: CategoryId}>, searchParams?: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const params = (await props.params);

  const category = params.category;
  const parameters : Record<string, string> = { category };
  const range : DateRange = { start: null, end: null };

  // Extract dates. Reencode before sending to metadata endpoint to sanitize.
  if (searchParams?.start && typeof(searchParams.start) === 'string') {
    range.start = decodeDate(searchParams.start);
    parameters['start'] = encodeDate(range.start);
  }

  if (searchParams?.end && typeof(searchParams.end) === 'string') {
    range.end = decodeDate(searchParams.end);
    parameters['end'] = encodeDate(range.end);
  }

  // If no start or end, grab the most recent videos to RecentLimit
  if (!searchParams?.start && !searchParams?.end) {
    parameters.limit = mostRecentLimit.toString();
  }

  const response = await fetchEndpoint('metadata', 'GET', parameters);
  let videos = new Array<any>();
  let showBanner = false;
  if (response.ok && response.data.length > 0) {
    videos = response.data.map(v => ({
        videoId: v.videoId,
        title: v.title,
        publishDate: v.publishDate}));
  }

  // No dates huh? Set the start to oldest video.
  if (parameters.limit) {
    showBanner = true;
    range.start = parseISO(videos?.[0].publishDate);
  }

  return (
    <Stack
        component="main"
        spacing={2}
        sx={{
          padding: "1ex",
        }}>
      <Alert variant="filled" severity="info"
        sx={{display: showBanner ? "flex" : "none" }}>
        Showing first {mostRecentLimit} videos. Change Start Date to find older ones.
      </Alert>
      <DateSearchIndex category={category} videos={videos} range={range}/>
    </Stack>
  );
}
