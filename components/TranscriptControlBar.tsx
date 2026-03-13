'use client'

import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import LanguageNav from 'components/LanguageNav';
import Paper from '@mui/material/Paper';
import DownloadIcon from '@mui/icons-material/Download';
import PublishIcon from '@mui/icons-material/Publish';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { fromTimeClassName } from 'utilities/client/css';
import { useContext, useState } from 'react';
import { stringify } from 'csv-stringify/browser/esm/sync'
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

type CsvEntry = {
  start: number;
  end: number;
  speakerName: string;
  speakerTags: string;
  sentences: string;
};

function downloadTranscriptCsv(csvContent, fileName) {
    // Create a Blob with the CSV data and type
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an anchor tag for downloading
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download.csv'; // Set the file name

    // Append the anchor to the body, click it, and remove it
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);

    // Revoke the object URL to free up memory (optional but good practice)
    URL.revokeObjectURL(url);
}

function extractStartEnd(headerSection) : [number, number] {
  const timingElement = headerSection.getElementsByClassName('d')[0];
  if (timingElement instanceof HTMLElement) {
    const timing = timingElement.dataset['timing'];
    if (timing) {
      const splits = timing.split('-').map(x => parseInt(x));
      if (splits.length === 2) {
        return [splits[0], splits[1]];
      }
    }
  }

  return [-1, -1];
}

function generateTranscriptCsv() {
  const entries = new Array<CsvEntry>;

  const speakerBubbles = document.getElementsByTagName('main')[0].getElementsByTagName('article');
  for (const bubble of speakerBubbles) {
    // Parse the headers.
    const headerSection = bubble.firstElementChild;
    if (!headerSection) {
      continue;
    }
    const speakerName = headerSection.getElementsByTagName('h5')[0]?.textContent ?? "unknown";
    const [start, end] = extractStartEnd(headerSection);

    const tagList = new Array<string>;
    for (const s of headerSection.getElementsByTagName('span')) {
      tagList.push(s.textContent);
    }

    // Parse the sentences. First paragraph is buttons.
    const paragraphs = bubble.getElementsByTagName('p') ?? [];
    const segments = new Array<string>;
    for (let i = 1; i < paragraphs.length; i++) {
      segments.push(paragraphs[i].textContent);
    }
    entries.push({
      start,
      end,
      speakerName,
      speakerTags: tagList.join(', '),
      sentences: segments.join('\n'),
    });
  }

  return stringify(entries, {header: true});
}

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
      <Tooltip title="Download Transcript">
        <span>
          <Button
            variant="contained"
            aria-label="download-transcript"
            color="primary"
            onClick={() => downloadTranscriptCsv(
              generateTranscriptCsv(),
              `${window.location.pathname.split('/').pop()}.csv`)}
            sx={{width: "100%", height: "100%"}}
          >
            <DownloadIcon />
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Publish changes">
        <span>
          <Button
            variant="contained"
            aria-label="publish-changes"
            color="secondary"
            disabled={!annotationsContext.needsPublish()}
            onClick={() => setActionDialogMode({mode: "upload_changes"})}
            sx={{width: "100%", height: "100%"}}
          >
            <PublishIcon />
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

