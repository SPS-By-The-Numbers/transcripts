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
};

export default function SpeakerBubbleTitle({speakerNum} : SpeakerBubbleTitleParams) {
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
