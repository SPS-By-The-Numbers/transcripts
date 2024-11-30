import * as Constants from 'config/constants';
import TranscriptIndex from 'components/TranscriptIndex';
import { encodeDate, decodeDate } from 'common/params';
import { fetchEndpoint } from 'utilities/client/endpoint';
import { parseISO } from 'date-fns';

import type { DateRange } from 'components/TranscriptIndexFilter';

const mostRecentLimit = 50;

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Params = {
  category: string,
}

export default async function Index(props: { params: Promise<Params>, searchParams?: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const params = await props.params;

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
  let videos : Array<any> = [];
  let banner = <></>;
  if (response.ok && response.data.length > 0) {
    videos = response.data.map(v => ({
        videoId: v.videoId,
        title: v.title,
        publishDate: v.publishDate}));
    // No dates huh? Set the start to oldest video.
    if (parameters.limit) {
      banner = (<p className="my-3">Showing first {mostRecentLimit} videos. Change Start Date to find older ones.</p>);
      range.start = parseISO(videos[0].publishDate);
    }

  }

  return (
    <>
      <main className="mx-5 my-5 max-w-screen-md">
        { banner }
        <TranscriptIndex category={category} videos={videos} range={range}/>
      </main>
    </>
  );
}
