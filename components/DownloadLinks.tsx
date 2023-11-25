import Link from 'next/link'

function cloudDownloadURL(category, videoId, ext) {
    return `https://storage.googleapis.com/sps-by-the-numbers.appspot.com/transcription/${category}/${videoId[0]}/${videoId}.${ext}`
}

type DownloadLinksParams = {
  category: string;
  videoId: string;
  className: string;
};

export default function DownloadLinks({category, videoId, className} : DownloadLinksParams) {
  return (
    <div className={className}>
      <b>Data Files:</b>
      <Link className={"px-1"} href={cloudDownloadURL(category, videoId, 'json')}>json</Link>
      <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, videoId, 'tsv')}>tsv</Link>
      <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, videoId, 'txt')}>txt</Link>
      <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, videoId, 'srt')}>srt</Link>
      <Link className={"px-1 border-l-2 border-gray-600 border-dashed"} href={cloudDownloadURL(category, videoId, 'vtt')}>vtt</Link>
    </div>
  );
}
