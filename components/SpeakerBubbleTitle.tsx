'use client'

import { SpeakerInfoContext } from 'components/SpeakerInfoProvider'
import { getSpeakerAttributes } from 'utilities/client/speaker'
import Typography from '@mui/material/Typography';
import { useContext } from 'react'

type SpeakerBubbleTitleParams = {
  speakerNum : number;
};

export default function SpeakerBubbleTitle({speakerNum} : SpeakerBubbleTitleParams) {
  const { speakerInfo } = useContext(SpeakerInfoContext);
  const { name } = getSpeakerAttributes(speakerNum, speakerInfo);
  return <Typography sx={{color: 'darkblue', fontSize: 'larger', fontWeight: 'bold'}}>{name}</Typography>;
};
