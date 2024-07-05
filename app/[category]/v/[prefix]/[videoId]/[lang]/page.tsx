import * as Constants from 'config/constants'
import BoardMeeting from 'components/BoardMeeting'
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import { storageAccessor } from "utilities/firebase"
import { DiarizedTranscript } from "common/transcript"
import { Metadata, ResolvingMetadata } from "next"
import { Storage } from '@google-cloud/storage';
import { getMetadata } from "utilities/metadata-utils"
import { loadSpeakerControlInfo } from 'utilities/client/speaker'

export type VideoParams = {
    category: string,
    prefix: string,
    videoId: string,
    lang: string,
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


/*
const SUPPORTED_LANGUAGES = {
  "amh": "Amharic",
  "jpn": "Japanese",
  "kor": "Korean",
  "som": "Somali",
  "spa": "Spanish",
  'eng': 'English',
  'vie': 'Vietnamese',
  'zho-HANS': 'Simplified Chinese',
  'zho-HANT': 'Traditional Chinese',
};
*/

export default async function Index({params}: {params: VideoParams}) {
  const lang = params.lang === undefined ? 'eng' : params.lang;

/*
  if (!(lang in SUPPORTED_LANGUAGES)) {
    return (
      <div>
      Invalid language code {params.lang}
      </div>
    );
  }
  */

  const languageOrder = new Array<string>();
  const translatedSentences = {};
  if (params.lang !== 'eng') {
    languageOrder.push(params.lang);
  }
  // Ensure English is the last.
  languageOrder.push('eng');

  // Handle the fact that transcript files for english still use the 2-letter ISO-639 code.
  const loadData = new Array<Promise<any>>;
  loadData.push(getMetadata(params.category, params.videoId));
  loadData.push(DiarizedTranscript.fromStorage(
      storageAccessor, params.category, params.videoId, languageOrder));
  loadData.push(loadSpeakerControlInfo(params.category, params.videoId));

  const [metadata, diarizedTranscript, speakerControlInfo] = await Promise.all(loadData);

  return (
    <TranscriptControlProvider initialSpeakerInfo={ speakerControlInfo.speakerInfo }>
      <BoardMeeting
          metadata={ metadata }
          category={ params.category }
          diarizedTranscript={ diarizedTranscript }
          languageOrder={ languageOrder }
          speakerInfo={ speakerControlInfo.speakerInfo }
          initialExistingNames={ speakerControlInfo.existingNames }
          initialExistingTags={ speakerControlInfo.existingTags } />
    </TranscriptControlProvider>
  );
}

