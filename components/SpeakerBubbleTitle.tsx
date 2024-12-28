'use client'

import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SpeakerInfoContext } from 'components/SpeakerInfoProvider'
import { speakerClassPrefix } from 'components/TranscriptClickHandler'
import { getSpeakerAttributes } from 'utilities/client/speaker'
import { useContext } from 'react'

type SpeakerBubbleTitleParams = {
  speakerNum : number;
};

export default function SpeakerBubbleTitle({speakerNum} : SpeakerBubbleTitleParams) {
  const { speakerInfo } = useContext(SpeakerInfoContext);
  const { name } = getSpeakerAttributes(speakerNum, speakerInfo);
  return (
    <Stack direction="row">
      <Typography className="t">{name}
        <IconButton sx={{paddingX: "1ex"}} size="small" className={`${speakerClassPrefix}-${speakerNum}`}><EditTwoToneIcon fontSize="inherit"/></IconButton>
      </Typography>
    </Stack>
  );
};
