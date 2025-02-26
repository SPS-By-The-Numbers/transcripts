import Box from '@mui/material/Box';
import InfoEditPanel from 'components/InfoEditPanel';
import Paper from '@mui/material/Paper';
import SpeakerBubble from 'components/SpeakerBubble';
import TranscriptClickHandler from 'components/TranscriptClickHandler';
import TranscriptVideo from 'components/TranscriptVideo';
import Typography from '@mui/material/Typography';
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
    <Paper sx={[
      {
          display: "grid",
          height: `calc(100% - 80px)`,
          columnGap: "1ex",
          rowGap: "0.5ex",
          padding: "1ex",
          maxWidth: "max-content",
          marginX: "auto",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 3fr",
          },
          gridTemplateRows: "auto auto 3fr",
          gridTemplateAreas: {
            xs: `"title"
                 "transcriptVideo"
                 "transcript"`,
            lg: `"title title"
                 "transcriptVideo transcript"
                 "infoeditpanel transcript"`
          },
      },
      ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box sx={{ gridArea: "title",
                 justifyItems: "center" }}>
        <Typography variant="h5" component="h1" >
          {metadata.title}
        </Typography>
      </Box>

      <TranscriptVideo
        curLang={languageOrder[0]}
        videoId={videoId}
        sx={{ gridArea: "transcriptVideo" }}
      />

      <InfoEditPanel
        category={category}
        speakerNums={speakerNums}
        metadata={metadata}
        sx={{
          gridArea: "infoeditpanel",
          display: {xs: "none", lg: "block" },
          overflowY: "hidden"
        }}
      />
      <Box sx={{
          gridArea: "transcript",
          marginX: "auto",
          padding: "0.5ex",
          overflowY: "scroll",
          maxWidth: "75ch" }}>
        <TranscriptClickHandler>
          <main>
            {speakerBubbles}
          </main>
        </TranscriptClickHandler>
      </Box>
    </Paper>
  );
}
