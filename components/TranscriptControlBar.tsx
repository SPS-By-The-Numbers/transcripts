'use client'

import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import LanguageNav from 'components/LanguageNav';
import PublishIcon from '@mui/icons-material/Publish';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { useAnnotations } from 'components/AnnotationsProvider'
import { VideoControlContext } from 'components/VideoControlProvider';
import { ChangeEvent, useContext, useState } from 'react';

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';

type TranscriptControlBarProps = {
  curLang: Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function TranscriptControlBar(
    { curLang, sx = [] }: TranscriptControlBarProps) {
  const [ autoscroll, setAutoscroll ] = useState<bool>(true);

  const annotationsContext = useAnnotations();
  const { serverState } = useContext(VideoControlContext);
  const { videoControl } = useContext(VideoControlContext);

  const handleAutoscrollChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Use local state because publishing to the videoControl steps outside
    // the React system so it does not know to rerender.
    const new_value = event.target.checked;
    setAutoscroll(new_value);
    videoControl.setAutoscroll(new_value);
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={[{
          justifyContent: "space-around",
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <Paper
        variant="outlined"
        sx={{
            backgroundColor: (autoscroll ? "primary.main" : undefined),
            paddingX: "0.5ex",
            justifyItems: "center",
            width: "100%",
          }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={autoscroll}
                color="warning"
                onChange={handleAutoscrollChange}
                />
            }
            label="Autoscroll"/>
        </FormGroup>
      </Paper>
      <LanguageNav
        name='lang-nav'
        curLang={curLang}
        sx={{width: "100%"}}
      />
      <Button
        variant="contained"
        aria-label="publish-changes"
        color="secondary"
        disabled={true}>
        <PublishIcon />
      </Button>
    </Stack>
  );
}

