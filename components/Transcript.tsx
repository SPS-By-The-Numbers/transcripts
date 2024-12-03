import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import SpeakerBubble from 'components/SpeakerBubble';
import SpeakerInfoControl from 'components/SpeakerInfoControl';
import Stack from '@mui/material/Stack';
import TranscriptClickHandler from 'components/TranscriptClickHandler';
import TranscriptHeader from 'components/TranscriptHeader';
import VideoPlayer from 'components/VideoPlayer';
import { UnknownSpeakerNum } from 'utilities/client/speaker';
import { toTimeClassName } from 'utilities/client/css'

import type { CategoryId } from 'common/params';
import type { DiarizedTranscript } from 'common/transcript';
import type { ExistingNames, SpeakerInfoData, TagSet } from 'utilities/client/speaker';
import type { ReactNode } from 'react';

type TranscriptParams = {
  metadata: any,
  category: CategoryId,
  initialExistingNames: ExistingNames,
  initialExistingTags: TagSet,
  diarizedTranscript: DiarizedTranscript,
  speakerInfo: SpeakerInfoData,
  languageOrder: string[],
};

// Produces spans of lines in each given language for the segment.
function textLines(segmentId, languageOrder, diarizedTranscript) {
  const lines = new Array<ReactNode>;
  for (const [langNum, language] of languageOrder.entries()) {
    lines.push(
      <span key={`${language}-segmentId`} className={`l-${langNum}`} >
        { diarizedTranscript.sentence(language, segmentId) }
      </span>
    );
    lines.push(
      <br key={`br-${language}-segmentId`} />
    );
  }
  lines.pop();

  return lines;
}

export default function Transcript({
    metadata,
    category,
    diarizedTranscript,
    languageOrder,
    speakerInfo,
    initialExistingNames,
    initialExistingTags } : TranscriptParams) {
  const videoId = metadata.video_id;
  const speakerNums = new Set<number>();

  // Merge all segments from the same speaker to produce speaking divs.
  const speakerBubbles = diarizedTranscript.groupSentenceInfoBySpeaker().map((bubble, i) => {
    speakerNums.add(bubble.speaker);

    return (
      <SpeakerBubble key={i} speakerNum={ bubble.speaker }>
        {
          bubble.sentenceInfo.map(([segmentId, speakerId, start]) => (
            <p key={ `${i}-${segmentId}` }
              className={ toTimeClassName(start) }>
              { textLines( segmentId, languageOrder, diarizedTranscript) }
            </p>
          ))
        }
      </SpeakerBubble>
    );
  });

  // TODO: Height of this needs to be minus header, or header has to scroll off.
  return (
    <Box sx={{
        display: "grid",
        height: "100vh",
        width: "100vw",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "1fr 2fr",
        },
        gridTemplateRows: {
          xs:  "auto auto auto 3fr",
          lg:  "auto minmax(0, 1fr) minmax(0, 1fr)",
        },
        gridTemplateAreas: {
          xs: `"header"
               "video"
               "controls"
               "main"`,
          lg: `"header header"
               "video main"
               "controls main"`
        },
      }}>

      <Box sx={{gridArea: "header"}}>
        <TranscriptHeader
          category={category}
          title={metadata.title}
          description={metadata.description}
          videoId={metadata.video_id}
          curLang={languageOrder[0]}/>
      </Box>

      <Card sx={{
          gridArea: "video",
          alignSelf: "start",
        }}
        >
        <VideoPlayer videoId={videoId} />
      </Card>

      <Card
        sx={{
          gridArea: "controls",
          alignSelf: "start",
          height: "100%",
        }}
      >
        <SpeakerInfoControl
          category={category}
          speakerNums={speakerNums}
          videoId={videoId}
          initialExistingNames={initialExistingNames}
          initialExistingTags={initialExistingTags}
        />
      </Card>

      <Box sx={{
          gridArea: "main",
          overflow: "scroll",
          maxWidth: "75ch" }}>
          <TranscriptClickHandler>
            <main>
              {speakerBubbles}
            </main>
          </TranscriptClickHandler>
      </Box>
    </Box>
  );
}
