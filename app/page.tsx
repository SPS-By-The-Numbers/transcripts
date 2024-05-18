'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VideoData, getAllCategories } from '../utilities/metadata-utils';
import { formatDateForPath, getVideoPath } from 'utilities/path-utils';

type DateSelection = {
  start: Date | null,
  end: Date | null
}

export default function Index() {
  const [category, updateCategory]: [string | null, any] =
    useState('sps-board');

  const [dateSelection, updateDateSelection]: [DateSelection, any] =
    useState({start: new Date(2024, 2, 1), end: null});

  const [videos, setVideos]: [VideoData[], any] = useState([]);

  useEffect(() => {
    if (category === null || (dateSelection.start === null && dateSelection.end === null)) {
      setVideos([]);
      return () => {};
    }

    const searchUrl: URL = new URL(`${window.location.origin}/api/search`);

    if (category !== null) {
      searchUrl.searchParams.append('category', category);
    }

    if (dateSelection.start !== null) {
      searchUrl.searchParams.append('start', formatDateForPath(dateSelection.start));
    }

    if (dateSelection.end !== null) {
      searchUrl.searchParams.append('end', formatDateForPath(dateSelection.end));
    }

    const abortController = new AbortController();
    const signal: AbortSignal = abortController.signal;
    fetch(searchUrl, { signal })
      .then((response: Response) => response.json())
      .then((responseJson) => {
        setVideos(responseJson.data as VideoData[]);
      });

    return () => {
      abortController.abort('parameters changed')
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
