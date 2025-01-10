import * as Constants from 'config/constants'
import ActionDialog from 'components/ActionDialog';
import ActionDialogProvider from 'components/providers/ActionDialogProvider';
import AnnotationsProvider from 'components/providers/AnnotationsProvider';
import AuthProvider from 'components/providers/AuthProvider';
import Transcript from 'components/Transcript'
import VideoControlContextProvider from 'components/providers/VideoControlProvider'
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
    params: Promise<VideoParams>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;

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

export default async function Index(props: {params: Promise<VideoParams>}) {
  const params = await props.params;
  // Handle the legacy URL redirect.
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
    <AuthProvider>
      <AnnotationsProvider
          category={params.category}
          videoId={params.videoId}
          initialSpeakerInfo={speakerControlInfo.speakerInfo}
          initialExistingNames={speakerControlInfo.existingNames}
          initialExistingTags={speakerControlInfo.existingTags}
        >
        <VideoControlContextProvider>
          <ActionDialogProvider>
            <ActionDialog />
            <Transcript
              metadata={ metadata }
              category={ params.category }
              diarizedTranscript={ diarizedTranscript }
              languageOrder={ languageOrder }
              speakerInfo={ speakerControlInfo.speakerInfo }
            />
          </ActionDialogProvider>
        </VideoControlContextProvider>
      </AnnotationsProvider>
    </AuthProvider>
  );
}
