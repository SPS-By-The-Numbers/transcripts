import BoardMeetingControl from 'components/BoardMeetingControl';
import SpeakerBubble from 'components/SpeakerBubble'
import TranscriptHeader from 'components/TranscriptHeader'
import { UnknownSpeakerNum } from 'utilities/speaker-info'
import { toTimeClassName } from 'utilities/client/css'

import type { DiarizedTranscript } from 'common/transcript'
import type { ReactNode } from 'react';
import type { SpeakerInfoData } from 'utilities/speaker-info'

type BoardMeetingParams = {
  metadata: any,
  category: string,
  initialExistingNames: object,
  initialExistingTags: Set<string>,
  diarizedTranscript: DiarizedTranscript,
  speakerInfo: SpeakerInfoData,
  languageOrder: string[],
};

const mainStyle = {
    fontFamily: 'sans-serif',
    fontSize: '14px',
    color: '#111',
    padding: '1em 1em 1em 1em',
    backgroundColor: 'white',
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
  const speakerBubbles = diarizedTranscript.groupMetadataBySpeaker().map((bubble, i) => {
      speakerNums.add(bubble.speaker);

      return (
        <SpeakerBubble key={i} speakerNum={ bubble.speaker }>
          {
            bubble.sentenceMetadata.map(([segmentId, speakerId, start]) => (
                <p key={ `${i}-${segmentId}` }
                  className={ toTimeClassName(start) }>
                  { textLines( segmentId, languageOrder, diarizedTranscript) }
                </p>
            ))
          }
        </SpeakerBubble>
      );
  });

  const transcriptHeader = <TranscriptHeader
            category={category}
            title={metadata.title}
            description={metadata.description}
            videoId={metadata.video_id} />

  const transcriptSection = (
    <section>
      {speakerBubbles}
    </section>);

  return (
      <main style={mainStyle}>
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
      </main>
  );
}
