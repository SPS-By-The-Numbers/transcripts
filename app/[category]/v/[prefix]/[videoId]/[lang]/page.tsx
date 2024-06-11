import BoardMeeting from 'components/BoardMeeting'
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import { Metadata, ResolvingMetadata } from "next"
import { loadSpeakerControlInfo } from 'utilities/client/speaker'
import { getMetadata } from "utilities/metadata-utils"
import { getDiarizedTranscript } from "utilities/transcript"

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

export default async function Index({params}: {params: VideoParams}) {
  const lang = params.lang === undefined ? 'eng' : params.lang;

  if (!(lang in SUPPORTED_LANGUAGES)) {
    return (
      <div>
      Invalid language code {params.lang}
      </div>
    );
  }

  const transcriptLangCode = params.lang === 'eng' ? 'en' : params.lang;

  // Handle the fact that transcript files for english still use the 2-letter ISO-639 code.

  const metadata = await getMetadata(params.category, params.videoId);
  const diarizedTranscript = await getDiarizedTranscript(params.category, params.videoId, transcriptLangCode);
  const speakerControlInfo = await loadSpeakerControlInfo(params.category, params.videoId);
  const subtextTranscript = transcriptLangCode === 'en' ? undefined : await getDiarizedTranscript(params.category, params.videoId, 'en');

  return (
    <TranscriptControlProvider initialSpeakerInfo={ speakerControlInfo.speakerInfo }>
      <BoardMeeting
          metadata={ metadata }
          category={ params.category }
          diarizedTranscript={ diarizedTranscript }
          subtextTranscript={ subtextTranscript }
          initialExistingNames={ speakerControlInfo.existingNames }
          initialExistingTags={ speakerControlInfo.existingTags } />
    </TranscriptControlProvider>
  );
}

