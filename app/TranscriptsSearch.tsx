import { isAfter, isBefore } from "date-fns";
import Link from 'next/link'
import { VideoData, getAllVideosForPublishDate, getDatesForCategory } from "utilities/metadata-utils"
import { getVideoPath, parseDateFromPath } from "utilities/path-utils"

type Props = {
  category: string,
  start: Date | null,
  end: Date | null
}

export default async function TranscriptsSearch({category, start, end}: Props) {
  // Require some kind of filter so it doesn't just load everything by default
  if (start === null && end === null) {
    return <></>;
  }

  const allDates: string[] = await getDatesForCategory(category);
  const filteredDates: string[] = allDates.filter((dateString: string): boolean => {
    const date: Date = parseDateFromPath(dateString);

    if (start !== null && isBefore(date, start)) {
      return false;
    }

    if (end !== null && isAfter(date, end)) {
      return false;
    }

    return true;
  });

  const filteredVideos: VideoData[] = [];

  for (const date of filteredDates) {
    const curVideos: VideoData[] = await getAllVideosForPublishDate(category, date);
    filteredVideos.push(...curVideos);
  }

  const videoLinks: React.ReactNode[] = filteredVideos.map(
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