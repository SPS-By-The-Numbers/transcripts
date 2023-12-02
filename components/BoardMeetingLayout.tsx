'use client'

import { ElementType, ReactNode } from 'react';
import VideoPlayer, { jumpToTime } from './VideoPlayer';
import SpeakerInfoControl from './SpeakerInfoControl';
import TranscriptControl from './TranscriptControl';

type BoardMeetingLayoutParams = {
  header: ReactNode,
  transcript: ReactNode,
  category: string,
  videoId: string,
  initialExistingNames: object,
  initialExistingTags: Set<string>,
  speakerNums: Set<number>
};

export default function BoardMeetingLayout({
  header,
  transcript,
  category,
  videoId,
  initialExistingNames,
  initialExistingTags,
  speakerNums
}: BoardMeetingLayoutParams): ReactNode {
  function handleTimeStampSelected(timeStamp: string): void {
      history.pushState(null, '', `#${timeStamp}`);
      jumpToTime(timeStamp);
  }

  return (
    <>
        { header }
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
        <TranscriptControl onTimeStampSelected={handleTimeStampSelected}>
          { transcript }
        </TranscriptControl>
    </>
  );
}