import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import SpeakerBubble from 'components/SpeakerBubble';
import SpeakerInfoControl from 'components/SpeakerInfoControl';
import Stack from '@mui/material/Stack';
import TranscriptControl from 'components/TranscriptControl';
import TranscriptHeader from 'components/TranscriptHeader';
import VideoPlayer, { YtEmbedWidth, YtEmbedHeight } from 'components/VideoPlayer';
import { UnknownSpeakerNum } from 'utilities/client/speaker';
import { toTimeClassName } from 'utilities/client/css'

import type { CategoryId } from 'common/params';
import type { DiarizedTranscript } from 'common/transcript';
import type { ExistingNames, SpeakerInfoData, TagSet } from 'utilities/client/speaker';
import type { ReactNode } from 'react';

type BoardMeetingParams = {
  metadata: any,
  category: CategoryId,
  initialExistingNames: ExistingNames,
  initialExistingTags: TagSet,
  diarizedTranscript: DiarizedTranscript,
  speakerInfo: SpeakerInfoData,
  languageOrder: string[],
};

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

export default function BoardMeeting({
    metadata,
    category,
    diarizedTranscript,
    languageOrder,
    speakerInfo,
    initialExistingNames,
    initialExistingTags } : BoardMeetingParams) {
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
    <Stack className='transcript-stack'>
      <TranscriptHeader
        category={category}
        title={metadata.title}
        description={metadata.description}
        videoId={metadata.video_id}
        curLang={languageOrder[0]}/>
      <Stack direction="row" spacing={1}>
        <Stack>
          <Box className="transcript-controls">
            <Card className="transcript-video">
              <VideoPlayer videoId={videoId} />
            </Card>
            <Card className="transcript-speakers">
              <SpeakerInfoControl
                category={category}
                speakerNums={speakerNums}
                videoId={videoId}
                className=""
                initialExistingNames={initialExistingNames}
                initialExistingTags={initialExistingTags}
              />
            </Card>
          </Box>
        </Stack>

        <TranscriptControl>
          <main className="transcript-main">
            {speakerBubbles}
          </main>
        </TranscriptControl>

      </Stack>
    </Stack>
  );
}
