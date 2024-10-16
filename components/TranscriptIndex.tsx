'use client'

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';
import SearchResult from 'components/SearchResult';
import Stack from '@mui/material/Stack';
import TranscriptIndexFilter from 'components/TranscriptIndexFilter';
import { compareDesc, isValid } from 'date-fns';
import { encodeDate } from 'common/params';
import { getVideoPath } from 'common/paths';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

import type { DateRange, TranscriptIndexFilterSelection } from 'components/TranscriptIndexFilter';
import type { VideoMetadata, VideoId } from 'common/params';

export type DefaultFiltersByCategory = {
    [category: string]: { defaultStart: Date | null }
}

type Entry = {
  videoId: VideoId;
  title: string;
  publishDate: string;
};

type Props = {
  category: string;
  videos: Entry[];
  range: DateRange;
};

export default function TranscriptIndex({ category, videos, range }: Props) {
  const [isNavigating, startNavigation] = useTransition();

  const { push } = useRouter();
  const pathName = usePathname();

  const handleFilterChange = (newFilters: TranscriptIndexFilterSelection) => {
    startNavigation(() => {
        push(buildUrl(pathName, newFilters), { scroll: false });
    });
  }

  const videoLinks: React.ReactNode[] = videos
    .sort((a, b) => compareDesc(a.publishDate, b.publishDate))
    .map(video => (
      <SearchResult key={video.videoId} category={category} videoId={video.videoId} title={video.title} publishDate={video.publishDate} />
    ));

  const loadingSection = (
      <Box
          display='flex'
          justifyContent="center"
          alignItems="center"
          my={4} >
        <CircularProgress />
      </Box>);

  const resultsSection: React.ReactNode = <section>
    <h2 className="my-4 text-lg">
      Transcripts:
    </h2>
    <Stack spacing={1}>
      {videoLinks}
    </Stack>
  </section>;

  const filters : TranscriptIndexFilterSelection = {
    category,
    dateRange: range,
  };
  return (
    <>
      <TranscriptIndexFilter selection={filters} onFilterChange={handleFilterChange} />
      {isNavigating ? loadingSection : resultsSection}
    </>
  );
}

function buildUrl(basePath: string, filterParams: TranscriptIndexFilterSelection): string {
  const pathParts = basePath.split('/');
  pathParts.pop();
  pathParts.push(filterParams.category);

  const parameters = new Array<string>();
  if (filterParams.dateRange.start) {
    parameters.push(`start=${encodeDate(filterParams.dateRange.start)}`);
  }

  if (filterParams.dateRange.end) {
    parameters.push(`end=${encodeDate(filterParams.dateRange.end)}`);
  }

  if (parameters.length > 0) {
    return `${pathParts.join('/')}?${parameters.join('&')}`;
  }

  return pathParts.join('/');
}
