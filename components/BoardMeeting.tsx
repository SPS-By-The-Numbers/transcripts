import TranscriptHeader from 'components/TranscriptHeader'
import SpeakerBubble from 'components/SpeakerBubble'
import BoardMeetingControl from 'components/BoardMeetingControl';
import type { DiarizedTranscript } from 'utilities/transcript'
import { toHhmmss } from 'utilities/transcript'
import { UnknownSpeakerNum } from 'utilities/speaker-info'

type BoardMeetingParams = {
  metadata: any,
  category: string,
  initialExistingNames: object,
  initialExistingTags: Set<string>,
  diarizedTranscript: DiarizedTranscript,
};

function toTimeAnchor(seconds) {
    if (seconds) {
        return `${toHhmmss(seconds)}`;
    }
    return '';
}

const mainStyle = {
    fontFamily: 'sans-serif',
    fontSize: '14px',
    color: '#111',
    padding: '1em 1em 1em 1em',
    backgroundColor: '#efe7dd',
};

export default function BoardMeeting({
    metadata,
    category,
    diarizedTranscript,
    initialExistingNames,
    initialExistingTags } : BoardMeetingParams) {
  const videoId = metadata.video_id;

  const speakerNums = new Set<number>();

  // Merge all segments from the same speaker to produce speaking divs.
  const speakerBubbles = diarizedTranscript.diarized.map((bubble, i) => {
      speakerNums.add(bubble.speaker);

      return (
        <SpeakerBubble key={i} speakerNum={ bubble.speaker }>
          {
            bubble.segments.map(segment => (
                <span key={ `${i}-${segment[0]}` }
                  className={ `ts-${toTimeAnchor(segment[2])}` }>
                  { segment[1] }
                </span>
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
          category={category}
          videoId={videoId}
          initialExistingNames={initialExistingNames}
          initialExistingTags={initialExistingTags}
          speakerNums={speakerNums}
        />
      </main>
  );
}
