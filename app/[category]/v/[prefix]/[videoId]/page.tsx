import BoardMeeting from 'components/BoardMeeting'
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import { Metadata, ResolvingMetadata } from "next"
import { app } from 'utilities/firebase'
import { getExistingRef, getMetadata, getVideoRef } from "utilities/metadata-utils"
import { getDatabase, ref, child, get } from "firebase/database"
import { getTranscript } from "utilities/transcript"

type VideoParams = {
    category: string,
    prefix: string,
    videoId: string,
};

type Props = {
  params: VideoParams
  searchParams: { [key: string]: string | string[] | undefined }
};

type DbInfoEntry ={
  name : string;
  tags : Array<string>;
};

async function loadSpeakerControlInfo(category: string, videoId: string) {
  const database = getDatabase(app);
  const videoRef = await getVideoRef(category, videoId);
  const existingRef = await getExistingRef(category);

  const speakerInfo = {};
  const videoData = videoRef.val();
  if (videoData && videoData.speakerInfo) {
    for (const [k,v] of Object.entries(videoData.speakerInfo)) {
      const entry = v as DbInfoEntry;
      const n = entry?.name;
      const t = entry?.tags;
      speakerInfo[k] = speakerInfo[k] || {};
      if (n && speakerInfo[k].name === undefined) {
        speakerInfo[k].name = n;
      }
      if (t && speakerInfo[k].tags === undefined) {
        speakerInfo[k].tags = new Set<string>(t);
      }
    }
  }

  const existingOptions = existingRef.val();

  const existingNames = {...existingOptions?.names};
  const existingTags = new Set<string>();
  if (existingOptions?.tags) {
    Object.keys(existingOptions.tags).forEach(tag => existingTags.add(tag));
  }

  return {speakerInfo, existingNames, existingTags};
}

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
    const transcript = await getTranscript(params.category, params.videoId, 'en');
    const speakerControlInfo = await loadSpeakerControlInfo(params.category, params.videoId);

    return (
      <TranscriptControlProvider initialSpeakerInfo={ speakerControlInfo.speakerInfo }>
        <BoardMeeting
            metadata={ metadata }
            category={ params.category }
            transcript={ transcript }
            initialExistingNames={ speakerControlInfo.existingNames }
            initialExistingTags={ speakerControlInfo.existingTags } />
      </TranscriptControlProvider>
    );
}
