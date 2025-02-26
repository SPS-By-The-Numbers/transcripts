'use client'

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import DateRangePicker from 'components/DateRangePicker';
import Divider from '@mui/material/Divider';
import SearchResult from 'components/SearchResult';
import Stack from '@mui/material/Stack';
import { compareDesc } from 'date-fns';
import { encodeDateNoThrow } from 'common/params';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { DateRange } from 'components/DateRangePicker';
import type { CategoryId, VideoId } from 'common/params';

type SearchEntry = {
  videoId: VideoId;
  title: string;
  publishDate: string;
};

type ArchiveProps = {
  category: CategoryId;
  dateRange: DateRange;
  videos: Array<SearchEntry>;
};

export default function Archive({category, dateRange, videos}: ArchiveProps) {
  const [isNavigating, startNavigation] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();

  const handleRangeChange = (newRange: DateRange) => {
    const searchParamsEntries = new Array<[string, string]>;
    for (const [key, value] of searchParams.entries()) {
      if (key === 'start' || key === 'end') {
        continue;
      }

      searchParamsEntries.push([key, value]);
    }

    if (newRange.start !== null) {
      const encoded = encodeDateNoThrow(newRange.start);
      if (encoded) {
        searchParamsEntries.push(['start', encoded]);
      }
    }

    if (newRange.end !== null) {
      const encoded = encodeDateNoThrow(newRange.end);
      if (encoded) {
        searchParamsEntries.push(['end', encoded]);
      }
    }

    const query = searchParamsEntries.map(([k,v]) => `${k}=${v}`).join('&');

    startNavigation(() => {
        router.push(`${pathName}?${query}`);
    });
  };

  const videoLinks: React.ReactNode[] = videos
    .sort((a, b) => compareDesc(a.publishDate, b.publishDate))
    .map(video => (
      <SearchResult key={video.videoId} category={category} videoId={video.videoId} title={video.title} publishDate={video.publishDate} />
    ));

  return (
    <Stack
        spacing={2}
        sx={{
          padding: "1ex",
        }}>

      <Backdrop
        sx={(theme) => ({ color: 'primary.contrastText', zIndex: theme.zIndex.drawer + 1 })}
        open={isNavigating}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <DateRangePicker range={dateRange} onRangeChange={handleRangeChange} />

      <Divider />

      {videoLinks}

    </Stack>
  );
}
