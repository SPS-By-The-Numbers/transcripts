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

  const pathName: string = usePathname();
  const { push } = useRouter();

  const handleFilterChange = (newFilters: TranscriptIndexFilterSelection) => {
    startNavigation(() => {
        push(buildUrl(pathName, newFilters), { scroll: false });
    });
  }

  const videoLinks: React.ReactNode[] = videos
    .sort((a, b) => compareDesc(a.publishDate, b.publishDate))
    .map(video => (
      <SearchResult category={category} videoId={video.videoId} title={video.title} publishDate={video.publishDate} />
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
  const parameters: string[] = [
    filterParams.category && `category=${filterParams.category}`,
    filterParams.dateRange.start && `start=${encodeDate(filterParams.dateRange.start)}`,
    filterParams.dateRange.end && `end=${encodeDate(filterParams.dateRange.end)}`
  ].filter(param => param !== null) as string[];

  let urlString = basePath;

  const paramString = parameters.join('&');
  if (paramString !== null && paramString !== '') {
    urlString += `?${paramString}`;
  }

  return urlString;
}
