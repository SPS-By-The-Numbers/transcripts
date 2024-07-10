'use client'

import Link from 'next/link';
import LoadingSpinner from 'components/LoadingSpinner';
import TranscriptIndexFilter from 'components/TranscriptIndexFilter';
import { compareDesc, isValid } from 'date-fns';
import { encodeDate } from 'common/params';
import { getVideoPath } from 'common/paths';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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

export default async function TranscriptIndex({ category, videos, range }: Props) {
  let isLoading = false;

  const pathName: string = usePathname();
  const { push } = useRouter();
  const handleFilterChange = (newFilters: TranscriptIndexFilterSelection) => {
    isLoading = true;
    push(buildUrl(pathName, newFilters), { scroll: false });
  }

  const videoLinks: React.ReactNode[] = videos
    .sort((a, b) => compareDesc(a.publishDate, b.publishDate))
    .map(video => (
      <li key={video.videoId} className="mx-3 list-disc">
        <Link href={getVideoPath(category, video.videoId)}>
          {video.title}
        </Link>
      </li>
    ));

  const loadingSection =  <section className="my-4 flex flex-row">
    <LoadingSpinner />
  </section>

  const resultsSection: React.ReactNode = <section>
    <h2 className="my-4 text-lg">
      Transcripts:
    </h2>
    <ul className="flex flex-col flex-wrap h-screen">
      {videoLinks}
    </ul>
  </section>;

  const filters : TranscriptIndexFilterSelection = {
    category,
    dateRange: range,
  };
  return (
    <>
      <TranscriptIndexFilter selection={filters} onFilterChange={handleFilterChange} />
      {isLoading ? loadingSection : resultsSection}
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
