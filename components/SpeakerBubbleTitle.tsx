'use client'

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAnnotations } from 'components/providers/AnnotationsProvider'
import { speakerClassPrefix } from 'components/TranscriptClickHandler'
import { getSpeakerAttributes } from 'utilities/client/speaker'
import { useContext } from 'react'

type SpeakerBubbleTitleParams = {
  speakerNum : number;
  start: number;
  end: number;
};

function formatTime(totalSeconds : number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds < 60) {
  return `${seconds.toFixed(0)}s`;
  }

  // Format as MM:SS
  return `${String(minutes)}m${String(seconds.toFixed(0)).padStart(2, '0')}s`
}

export default function SpeakerBubbleTitle({speakerNum, start, end} : SpeakerBubbleTitleParams) {
  const durationSecs = end - start;
  const annotationsContext = useAnnotations();
  const { name, tags } = getSpeakerAttributes(speakerNum,
                                              annotationsContext.speakerInfo);
  return (
    <Stack
        className="t"
        direction="row"
        justifyContent="space-between"
        spacing={1}
        sx={{alignItems:"end"}}>
      <Box sx={{
          flex: "0 0 auto",
          maxWidth: "45%"
        }}>
        <Typography component="h5" variant="h5">{name}</Typography>
      </Box>
      <Stack
          useFlexGap
          direction="row"
          spacing={0.4}
          justifyContent="flex-end" 
          sx={{
            flexWrap: "wrap",
            flexGrow: 1,
          }}>
        {
          [...tags].map(t => {
            return <Chip label={t} key={t} size="small" color="info" />;
          })
        }
      </Stack>
      <Box sx={{
          flex: "0 0 auto",
          maxWidth: "45%"
        }}>
        <Typography className="d" data-timing={`${start}-${end}`} variant="body2">[{formatTime(durationSecs)}]</Typography>
      </Box>
      <Box>
        <Typography>
          <IconButton
            sx={{paddingX: "1ex"}}
            size="small"
            className={`${speakerClassPrefix}-${speakerNum}`}>
            <EditTwoToneIcon fontSize="inherit"/>
          </IconButton>
        </Typography>
      </Box>
    </Stack>
  );
};
