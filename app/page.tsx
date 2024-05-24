'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TailSpin } from 'react-loader-spinner';
import resolveConfig from 'tailwindcss/resolveConfig';
import { content, theme } from '../tailwind.config.js';
import { VideoData, getAllVideosForDateRange } from '../utilities/metadata-utils';
import { formatDateForPath, getVideoPath, parseDateFromPath } from 'utilities/path-utils';
import TranscriptFilter, { TranscriptFilterSelection } from 'components/TranscriptFilter';

export default function Index() {
  const [category, updateCategory]: [string | null, any] =
    useState('sps-board');

  const [filters, updateFilters]: [TranscriptFilterSelection, any] = useState(
    {
      category: 'sps-board',
      dateRange: { start: parseDateFromPath('2024-03-01'), end: null }
    });

  function handleFilterChange(filters: TranscriptFilterSelection) {
    updateFilters(filters);
  }

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

    getAllVideosForDateRange(category, startDateString, endDateString)
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

  const videoLinks: React.ReactNode[] = videos.map(
    video => (
      <li key={video.videoId} className="mx-3 list-disc">
        <Link href={getVideoPath(category, video.videoId)}>
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
    <main className="mx-5 my-5 max-w-screen-md">
      <TranscriptFilter selection={filters} onFilterChange={handleFilterChange} />
      {isLoading ? loadingSection : resultsSection}
    </main>
  );
}
