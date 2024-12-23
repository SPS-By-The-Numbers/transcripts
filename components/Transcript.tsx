import Box from '@mui/material/Box';
import SpeakerBubble from 'components/SpeakerBubble';
import InfoEditPanel from 'components/InfoEditPanel';
import TranscriptClickHandler from 'components/TranscriptClickHandler';
import TranscriptVideo from 'components/TranscriptVideo';
import { UnknownSpeakerNum } from 'utilities/client/speaker';
import { toTimeClassName } from 'utilities/client/css'

import type { CategoryId } from 'common/params';
import type { DiarizedTranscript } from 'common/transcript';
import type { ExistingNames, SpeakerInfoData, TagSet } from 'utilities/client/speaker';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

type TranscriptParams = {
  metadata: any;
  category: CategoryId;
  initialExistingNames: ExistingNames;
  initialExistingTags: TagSet;
  diarizedTranscript: DiarizedTranscript;
  speakerInfo: SpeakerInfoData;
  languageOrder: Array<string>;
  sx?: SxProps<Theme>;
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
    initialExistingTags,
    sx = []} : TranscriptParams) {
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

  return (
    <Box sx={[
      {
          display: "grid",
          height: `calc(100% - 100px)`,
          columnGap: "1ex",
          rowGap: "0.5ex",
          padding: "1ex",
          justifyItems: "normal",
          maxWidth: {xs: "75ch", lg: "100%"},
          marginX: "auto",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "auto 1fr",
          },
          gridTemplateRows: "auto 3fr",
          gridTemplateAreas: {
            xs: `"transcriptVideo"
                 "transcript"`,
            lg: `"transcript transcriptVideo"
                 "transcript infoeditpanel"`
          },
      },
      ...(Array.isArray(sx) ? sx : [sx])]}>
      <TranscriptVideo
        title={metadata.title}
        curLang={languageOrder[0]}
        videoId={videoId}
        sx={{ gridArea: "transcriptVideo" }}
      />

      <InfoEditPanel
        category={category}
        speakerNums={speakerNums}
        initialExistingNames={initialExistingNames}
        initialExistingTags={initialExistingTags}
        videoId={videoId}
        sx={{
          gridArea: "infoeditpanel",
          overflowY: "scroll",
          display: {xs: "none", lg: "block" }
        }}
      />

      <Box sx={{
          gridArea: "transcript",
          marginX: "auto",
          overflowY: "scroll",
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
