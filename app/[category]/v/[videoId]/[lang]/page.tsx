import * as Constants from 'config/constants'
import BoardMeeting from 'components/BoardMeeting'
import TranscriptControlProvider from 'components/TranscriptControlProvider'
import { DiarizedTranscript } from "common/transcript"
import { Metadata, ResolvingMetadata } from "next"
import { SupportedLanguages } from 'common/languages';
import { getMetadata } from "utilities/client/metadata"
import { getSpeakerControlInfo } from 'utilities/client/speaker'
import { getVideoPath } from "common/paths"
import { isValidVideoId } from "common/params"
import { permanentRedirect, notFound } from 'next/navigation'
import { storageAccessor } from "utilities/client/storage"

// Really want these pages to be cacheable.
export const dynamic = 'force-static';
export const revalidate = 3600;

export type VideoParams = {
    category: string,
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

  try {
    const videoMetadata = await getMetadata(params.category, params.videoId);

    // fetch data
    const parentMetadata = await parent;

    return {
      title: `Transcript of ${params.category} -  ${videoMetadata.title}`,
      description: `Transcript of ${params.category} - ${videoMetadata.title}`,
      openGraph: {
        images: `https://i.ytimg.com/vi/${params.videoId}/hqdefault.jpg`,
      },
    }
  } catch (e) {
    console.log(e);
    return {
      title: "Missing metadata",
    }
  }
}


export default async function Index({params}: {params: VideoParams}) {
  // Handle the legacy URL redirect.
    console.log("videoId", params.videoId);
  if (Constants.LEGACY_PREFIX_REDIRECT && params.videoId.length === 2) {
    // If this is a legacy url with a prefix like /v/AB/ABCD123 then 
    // it might be a videId incorrect interpreted as lang.
    if (isValidVideoId(params.lang)) {
      const videoPath = getVideoPath(params.category, params.lang);
      permanentRedirect(videoPath);
    }
    notFound();
  }

  // Ensure the langauge is valid.
  const lang = params.lang ?? 'eng';
  if (!(lang in SupportedLanguages)) {
    return (
      <div>
      Invalid language code {params.lang}
      </div>
    );
  }

  const languageOrder = new Array<string>();
  const translatedSentences = {};
  if (params.lang !== 'eng') {
    languageOrder.push(params.lang);
  }
  // Ensure English is the last.
  languageOrder.push('eng');

  const loadData = new Array<Promise<any>>;
  const [metadata, diarizedTranscript, speakerControlInfo] = await Promise.all([
      getMetadata(params.category, params.videoId),
      DiarizedTranscript.fromStorage(
          storageAccessor, params.category, params.videoId, languageOrder),
      getSpeakerControlInfo(params.category, params.videoId)
    ]);

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

