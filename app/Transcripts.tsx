'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isValid } from 'date-fns';
import resolveConfig from 'tailwindcss/resolveConfig';
import { TailSpin } from 'react-loader-spinner';

import { content, theme } from '../tailwind.config.cjs';
import TranscriptFilter, { TranscriptFilterSelection, DateRange } from 'components/TranscriptFilter';
import { VideoData, getAllVideosForDateRange } from 'utilities/metadata-utils';
import { formatDateForPath, getVideoPath, parseDateFromPath } from 'utilities/path-utils';

const defaultCategory = 'sps-board';
const defaultDate = parseDateFromPath('2024-03-01');

export default function Transcripts({ allCategories }: { allCategories: string[] }) {
  const { filterParams, updateFilterParams } = useFilterParams(allCategories);
  const [filters, updateFilters]: [TranscriptFilterSelection, any] = useState(filterParams);

  const [isLoading, setLoading] = useState(true);
  const [videos, setVideos]: [VideoData[], any] = useState([]);

  useEffect(() => {
    if (filters.category === null || (filters.dateRange.start === null && filters.dateRange.end === null)) {
      setVideos([]);
      return () => {};
    }

    let ignore = false;

    const startDateString = filters.dateRange.start !== null ? formatDateForPath(filters.dateRange.start) : null;
    const endDateString = filters.dateRange.end !== null ? formatDateForPath(filters.dateRange.end) : null;

    getAllVideosForDateRange(filters.category, startDateString, endDateString)
      .then(videoData => {
        if (!ignore) {
          setLoading(false);
          setVideos(videoData);
        }
      });

      return () => {
        ignore = true;
      }
  }, [filters])

  function handleFilterChange(filters: TranscriptFilterSelection) {
    updateFilters(filters);
    updateFilterParams(filters);
  }

  const videoLinks: React.ReactNode[] = videos.map(
    video => (
      <li key={video.videoId} className="mx-3 list-disc">
        <Link href={getVideoPath(filters.category, video.videoId)}>
          {video.title}
        </Link>
      </li>
    ));

  // Get access to the tailwind theme colors to pass to the loading spinner
  // Specifying only content and theme keys is a workaround for a type error pertaining
  // to the "future" key
  const fullConfig = resolveConfig({ content, theme });
  const loadingSection = <section className="my-4 flex flex-row">
    <TailSpin wrapperClass="justify-center" color={fullConfig.theme.colors.blue['500']} />
  </section>;

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
      <TranscriptFilter selection={filters} onFilterChange={handleFilterChange} />
      {isLoading ? loadingSection : resultsSection}
    </>
  );
}

function useFilterParams(allCategories: string[]): {
   filterParams: TranscriptFilterSelection,
   updateFilterParams: (newFilters: TranscriptFilterSelection) => void
} {
  const searchParams: URLSearchParams = useSearchParams();
  const pathName: string = usePathname();
  const { push } = useRouter();

  const filterParams: TranscriptFilterSelection = {
    category: getCategoryFromParams(searchParams, allCategories),
    dateRange: getDateRangeFromParams(searchParams),
  };

  const updateFilterParams = (newFilters: TranscriptFilterSelection) => {
    push(buildUrl(pathName, newFilters), { scroll: false });
  }

  return {
    filterParams,
    updateFilterParams
  };
}

function getCategoryFromParams(params: URLSearchParams, allCategories: string[]): string {
  const categoryParam: string | null = params.get('category');

  if (categoryParam !== null && allCategories.includes(categoryParam)) {
    return categoryParam;
  }

  return defaultCategory;
}

function getDateRangeFromParams(params: URLSearchParams): DateRange {
  const start: Date | null = getDateFromParams(params, 'start');
  const end: Date | null = getDateFromParams(params, 'end');

  if (start === null && end === null) {
    return { start: defaultDate, end: null };
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

function buildUrl(basePath: string, filterParams: TranscriptFilterSelection): string {
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