import { intlFormat } from 'date-fns';
import Link from 'next/link'
import { getVideoPath } from 'utilities/path-utils';

type DateProps = {
    category: string,
    datePath: string,
    videos: any[],
};

export default function VideoLinks({category, videos, datePath}: DateProps) {

    const videoLinks: React.ReactNode[] = videos.map(
        video => (
            <li key={video.metadata.video_id} className="mx-3 list-disc">
                <Link href={getVideoPath(category, video.metadata.video_id)}>
                    {video.metadata.title}
                </Link>
            </li>
    ));

    return (
        <main className="mx-5 my-5">
          <h2 className="my-4 text-lg">
            Meetings that we have transcripts for.
            Transcripts for { category } on { datePath }
          </h2>
            <ul className="flex flex-col flex-wrap h-screen">
                { videoLinks }
            </ul>
        </main>
    );
}

