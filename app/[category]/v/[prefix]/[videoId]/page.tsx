import { getAllCategories, getAllVideosForCategory, getMetadata, getSpeakerMapping, VideoData } from "utilities/metadata-utils"
import { toSpeakerNum } from "utilities/speaker-info"
import { getTranscript } from "utilities/transcript"
import { formatDateForPath, parseDateFromPath } from "utilities/path-utils"
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import BoardMeeting from 'components/BoardMeeting'
import { Metadata, ResolvingMetadata } from "next"
import { ReactNode } from "react"

type VideoParams = {
    category: string,
    prefix: string,
    videoId: string,
};

type Props = {
  params: VideoParams
  searchParams: { [key: string]: string | string[] | undefined }
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata): Promise<Metadata> {

  const videoMetadata = await getMetadata(params.category, params.videoId);

  // fetch data
  const parentMetadata = await parent;

  return {
    title: `Transcript of ${params.category} -  ${videoMetadata.title}`,
    description: `Transcript of ${params.category} - ${videoMetadata.title}`
  }
}

export default async function Index({params}: {params: VideoParams}) {
    const metadata = await getMetadata(params.category, params.videoId);
    const transcript = await getTranscript(params.category, params.videoId, false);
    const speakerMapping = await getSpeakerMapping(params.category, params.videoId);
    let speakerInfo = {};
    if (speakerMapping) {
        for (const [k,n] of Object.entries(speakerMapping)) {
            speakerInfo[toSpeakerNum(k)] = {'name': n }
        }
    }

    return (
      <TranscriptControlProvider initialSpeakerInfo={ speakerInfo }>
        <BoardMeeting
            metadata={ metadata }
            category={ params.category }
            transcript={ transcript }
            initialSpeakerInfo={ speakerInfo } />
      </TranscriptControlProvider>
    );
}
