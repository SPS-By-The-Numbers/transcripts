'use client'

import { useSpeakerInfo } from 'components/SpeakerInfoProvider'
import { getSpeakerAttributes } from 'utilities/speaker-info'

type SpeakerBubbleTitleParams = {
  speakerNum : number;
};

export default async function SpeakerBubbleTitle({speakerNum} : SpeakerBubbleTitleParams) {
  const { speakerInfo } = useSpeakerInfo();
  // TODO: Get SpeakerInfo from context.
  const { name } = getSpeakerAttributes(speakerNum, speakerInfo);
  return <h2>{name}</h2>;
};
