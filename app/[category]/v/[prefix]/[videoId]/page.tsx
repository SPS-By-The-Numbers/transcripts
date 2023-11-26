import BoardMeeting from 'components/BoardMeeting'
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import { Metadata, ResolvingMetadata } from "next"
import { app } from 'utilities/firebase'
import { formatDateForPath, parseDateFromPath } from "utilities/path-utils"
import { getAllCategories, getAllVideosForCategory, getMetadata, getSpeakerMapping, VideoData } from "utilities/metadata-utils"
import { getDatabase, ref, child, get } from "firebase/database"
import { getTranscript } from "utilities/transcript"
import { toSpeakerNum } from "utilities/speaker-info"

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
  const categoryRoot = ref(database, `transcripts/${category}`);
  const videoRef = child(categoryRoot, `v/${videoId}`);
  const existingRef = child(categoryRoot, 'existing');

  const speakerInfo = {};
  const videoData = (await get(videoRef)).val();
  if (videoData && videoData.speakerInfo) {
    for (const [origK,v] of Object.entries(videoData.speakerInfo)) {
      const k = toSpeakerNum(origK);
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

  const existingOptions = (await get(existingRef)).val();

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
    const transcript = await getTranscript(params.category, params.videoId, false);
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
