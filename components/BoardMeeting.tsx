import BoardMeetingControl from 'components/BoardMeetingControl';
import TranscriptControl from 'components/TranscriptControl';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import LanguageNav from 'components/LanguageNav';
import SpeakerBubble from 'components/SpeakerBubble';
import TranscriptHeader from 'components/TranscriptHeader';
import VideoPlayer from './VideoPlayer';
import { UnknownSpeakerNum } from 'utilities/client/speaker';
import { toTimeClassName } from 'utilities/client/css'

import type { DiarizedTranscript } from 'common/transcript';
import type { ReactNode } from 'react';
import type { SpeakerInfoData } from 'utilities/client/speaker';

type BoardMeetingParams = {
  metadata: any,
  category: string,
  initialExistingNames: object,
  initialExistingTags: Set<string>,
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

  const langNav = (<LanguageNav name='lang-nav' curLang={languageOrder[0]} />);

  return (
      <>
        <Stack>
          <div>
            <TranscriptHeader
              category={category}
              title={metadata.title}
              description={metadata.description}
              videoId={metadata.video_id}
              translationNav={langNav}/>
          </div>
          <Stack direction="row">
            <TranscriptControl>
              <main>
                {speakerBubbles}
              </main>
            </TranscriptControl>
            <Stack>
              <Card sx={{position: "sticky", top: "1rem"}} >
                <VideoPlayer videoId={videoId} />
              </Card>
            </Stack>
          </Stack>
        </Stack>
      </>
  );
}
/*
        <BoardMeetingControl
          header={transcriptHeader}
          transcriptNode={transcriptSection}
          errors={diarizedTranscript.loadErrors}
          category={category}
          videoId={videoId}
          initialExistingNames={initialExistingNames}
          initialExistingTags={initialExistingTags}
          speakerNums={speakerNums}
        />
        */
