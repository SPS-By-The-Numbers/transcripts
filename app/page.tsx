'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VideoData, getAllCategories, getAllVideosForDateRange } from '../utilities/metadata-utils';
import { formatDateForPath, getVideoPath } from 'utilities/path-utils';

type DateSelection = {
  start: string | null,
  end: string | null
}

export default function Index() {
  const [category, updateCategory]: [string | null, any] =
    useState('sps-board');

  const [dateSelection, updateDateSelection]: [DateSelection, any] =
    useState({start: '2024-03-01', end: null});

  const [videos, setVideos]: [VideoData[], any] = useState([]);

  useEffect(() => {
    if (category === null || (dateSelection.start === null && dateSelection.end === null)) {
      setVideos([]);
      return () => {};
    }

    let ignore = false;

    getAllVideosForDateRange(category, dateSelection.start, dateSelection.end)
      .then(videoData => {
        if (!ignore) {
          setVideos(videoData);
        }
      });

      return () => {
        ignore = true;
      }
  }, [category, dateSelection])

  const videoLinks: React.ReactNode[] = videos.map(
    video => (
      <li key={video.videoId} className="mx-3 list-disc">
        <Link href={getVideoPath(category, video.videoId)}>
          {video.title}
        </Link>
      </li>
    ));

  return (
    <main className="mx-5 my-5">
      <h2 className="my-4 text-lg">
        Transcripts:
      </h2>
      <ul className="flex flex-col flex-wrap h-screen">
        {videoLinks}
      </ul>
    </main>
  );
}
