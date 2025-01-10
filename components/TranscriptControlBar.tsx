'use client'

import ActionDialogConstants from 'components/ActionDialogConstants';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import LanguageNav from 'components/LanguageNav';
import Paper from '@mui/material/Paper';
import PublishIcon from '@mui/icons-material/Publish';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useContext, useState } from 'react';
import { VideoControlContext } from 'components/providers/VideoControlProvider';
import { useActionDialog } from 'components/providers/ActionDialogProvider'
import { useAnnotations } from 'components/providers/AnnotationsProvider'

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';
import type { ChangeEvent } from 'react';

type TranscriptControlBarProps = {
  curLang: Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function TranscriptControlBar(
    { curLang, sx = [] }: TranscriptControlBarProps) {
  const [ autoscroll, setAutoscroll ] = useState<boolean>(true);

  const annotationsContext = useAnnotations();
  const { setActionDialogMode } = useActionDialog();
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
      <Tooltip title="Scroll transcript along with video">
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
      </Tooltip>
      <LanguageNav
        name='lang-nav'
        curLang={curLang}
        sx={{width: "100%"}}
      />
      <Tooltip title="Publish changes">
        <span>
          <Button
            variant="contained"
            aria-label="publish-changes"
            color="secondary"
            disabled={!annotationsContext.needsPublish()}
            onClick={() => setActionDialogMode({mode: ActionDialogConstants.uploadChangesMode})}
            sx={{width: "100%", height: "100%"}}
          >
            <PublishIcon />
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

