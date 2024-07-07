'use client'

import Link from 'next/link';
import LoadingSpinner from 'components/LoadingSpinner';
import TranscriptIndexFilter from 'components/TranscriptIndexFilter';
import { VideoData, getAllVideosForDateRange } from 'utilities/metadata-utils';
import { compareDesc, isValid } from 'date-fns';
import { formatDateForPath, getVideoPath, parseDateFromPath } from 'utilities/path-utils';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { DateRange, TranscriptIndexFilterSelection } from 'components/TranscriptIndexFilter';

export type DefaultFiltersByCategory = {
    [category: string]: { defaultStart: Date | null }
}

type Props = {
  defaultCategory: string,
  defaultsByCategory: DefaultFiltersByCategory,
};

export default function TranscriptIndex({ defaultCategory, defaultsByCategory }: Props) {
  const { filterParams, updateFilterParams } = useFilterParams(defaultCategory, defaultsByCategory);
  const [filters, updateFilters]: [TranscriptIndexFilterSelection, any] = useState(filterParams);
  const { videos, isLoading } = useFilteredVideos(filters);

  function handleFilterChange(filters: TranscriptIndexFilterSelection) {
    updateFilters(filters);
    updateFilterParams(filters);
  }

  const videoLinks: React.ReactNode[] = videos
    .sort((a, b) => compareDesc(a.publishDate, b.publishDate))
    .map(video => (
      <li key={video.videoId} className="mx-3 list-disc">
        <Link href={getVideoPath(filters.category, video.videoId)}>
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

  return (
    <>
      <TranscriptIndexFilter selection={filters} onFilterChange={handleFilterChange} />
      {isLoading ? loadingSection : resultsSection}
    </>
  );
}

function useFilterParams(defaultCategory: string, defaultsByCategory: DefaultFiltersByCategory): {
   filterParams: TranscriptIndexFilterSelection,
   updateFilterParams: (newFilters: TranscriptIndexFilterSelection) => void
} {
  const searchParams: URLSearchParams = useSearchParams();
  const pathName: string = usePathname();
  const { push } = useRouter();

  const category: string = getCategoryFromParams(searchParams, defaultCategory, defaultsByCategory);

  const filterParams: TranscriptIndexFilterSelection = {
    category,
    dateRange: getDateRangeFromParams(searchParams, defaultsByCategory[category].defaultStart),
  };

  const updateFilterParams = (newFilters: TranscriptIndexFilterSelection) => {
    push(buildUrl(pathName, newFilters), { scroll: false });
  }

  return {
    filterParams,
    updateFilterParams
  };
}

function useFilteredVideos(filters: TranscriptIndexFilterSelection): {
  videos: VideoData[], isLoading: boolean
} {
  const [isLoading, setLoading] = useState(true);
  const [videos, setVideos]: [VideoData[], any] = useState([]);

  useEffect(() => {
    if (filters.dateRange.start === null && filters.dateRange.end === null) {
      setVideos([]);
      return () => {};
    }

    const startDateString = filters.dateRange.start !== null ? formatDateForPath(filters.dateRange.start) : null;
    const endDateString = filters.dateRange.end !== null ? formatDateForPath(filters.dateRange.end) : null;

    let ignore = false;

    async function fetchVideos() {
      const videoData = await getAllVideosForDateRange(filters.category, startDateString, endDateString);

      if (ignore) {
        return;
      }

      setLoading(false);
      setVideos(videoData);
    }

    fetchVideos();

    return () => {
      ignore = true;
    }
  }, [filters])

  return { videos, isLoading };
}

function getCategoryFromParams(params: URLSearchParams, defaultCategory: string, defaultsByCategory: DefaultFiltersByCategory): string {
  const categoryParam: string | null = params.get('category');

  if (categoryParam !== null && defaultsByCategory.hasOwnProperty(categoryParam)) {
    return categoryParam;
  }

  return defaultCategory;
}

function getDateRangeFromParams(params: URLSearchParams, defaultStart: Date | null): DateRange {
  const start: Date | null = getDateFromParams(params, 'start');
  const end: Date | null = getDateFromParams(params, 'end');

  if (start === null && end === null) {
    return { start: defaultStart, end: null };
  }

  return { start, end };
}

function getDateFromParams(params: URLSearchParams, key: string): Date | null {
  const param: string | null = params.get(key);
  if (param === null) {
    return null;
  }

  const date: Date = parseDateFromPath(param);

  if (!isValid(date)) {
    return null;
  }

  return date;
}

function buildUrl(basePath: string, filterParams: TranscriptIndexFilterSelection): string {
  const parameters: string[] = [
    filterParams.category && `category=${filterParams.category}`,
    filterParams.dateRange.start && `start=${formatDateForPath(filterParams.dateRange.start)}`,
    filterParams.dateRange.end && `end=${formatDateForPath(filterParams.dateRange.end)}`
  ].filter(param => param !== null) as string[];

  let urlString = basePath;

  const paramString = parameters.join('&');
  if (paramString !== null && paramString !== '') {
    urlString += `?${paramString}`;
  }

  return urlString;
}
