'use client'

import { useTranscriptContext } from 'components/TranscriptControlProvider'
import { getSpeakerAttributes } from 'utilities/speaker-info'

type SpeakerBubbleTitleParams = {
  speakerNum : number;
};

export default function SpeakerBubbleTitle({speakerNum} : SpeakerBubbleTitleParams) {
  const { speakerInfo } = useTranscriptContext();
  const { name } = getSpeakerAttributes(speakerNum, speakerInfo);
  return <h2>{name}</h2>;
};
