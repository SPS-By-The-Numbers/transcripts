import Link from 'next/link'
import TranscriptHeader from 'components/TranscriptHeader'
import SpeakerBubble from 'components/SpeakerBubble'
import SpeakerInfoControl from 'components/SpeakerInfoControl'
import TranscriptControl from 'components/TranscriptControl';
import VideoPlayer from 'components/VideoPlayer'
import YouTube from 'react-youtube'
import { SpeakerInfoData } from 'utilities/speaker-info'
import type { TranscriptData } from 'utilities/transcript'
import type { Entries } from 'type-fest';
import { toSpeakerKey, UnknownSpeakerNum } from 'utilities/speaker-info'

type BoardMeetingParams = {
  metadata: any,
  category: string,
  initialExistingNames: object,
  initialExistingTags: Set<string>,
  transcript: TranscriptData,
};

function toTimeAnchor(seconds) {
    if (seconds) {
        const hhmmss = new Date(seconds * 1000).toISOString().slice(11, 19);
        return `${hhmmss}`;
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
    transcript,
    initialExistingNames,
    initialExistingTags } : BoardMeetingParams) {
  const videoId = metadata.video_id;

  const speakerBubbles : React.ReactNode[] = [];
  let speakerNum : number = UnknownSpeakerNum;
  let curWordAnchors : React.ReactNode[] = []
  const speakerNums = new Set<number>();

  // Merge all segments from the same speaker to produce speaking divs.
  for (const [i, segment] of Object.entries(Object.values(transcript.segments))) {
    // If speaker changed, create a SpeakerBubble and reset curWordAnchors.
    if (speakerNum && speakerNum !== segment.speakerNum && curWordAnchors.length > 0) {
      speakerBubbles.push(
        <SpeakerBubble
            key={i}
            speakerNum={ speakerNum }>
          {curWordAnchors}
        </SpeakerBubble>
      );
      curWordAnchors = [];
    }
    speakerNum = segment.speakerNum;
    speakerNums.add(speakerNum);
    for (let wordNum = 0; wordNum < segment.words.length; wordNum++) {
      curWordAnchors.push(
        <span key={`${i}-${wordNum}`}
          id={toTimeAnchor(segment.starts[wordNum])}>
          { segment.words[wordNum] }
        </span>);
    }
  }

  // Catch the last bubble.
  if (curWordAnchors.length > 0) {
    speakerBubbles.push(
      <SpeakerBubble
          key={'last'}
          speakerNum={ speakerNum }>
        {curWordAnchors}
      </SpeakerBubble>
    );
  }

  return (
      <main style={mainStyle}>
        <TranscriptHeader
            category={category}
            title={metadata.title}
            description={metadata.description}
            videoId={metadata.video_id} />

        <section className="p">
          <VideoPlayer
            category={category}
            videoId={videoId} />
          <SpeakerInfoControl
              className="c px-2 border border-2 border-black rounded"
              category={category}
              initialExistingNames={initialExistingNames}
              initialExistingTags={initialExistingTags}
              speakerNums={speakerNums}
              videoId={videoId} />
        </section>
        <TranscriptControl>
          <section>
              {speakerBubbles}
          </section>
        </TranscriptControl>

      </main>
  );
}
