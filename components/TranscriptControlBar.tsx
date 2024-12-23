import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import LanguageNav from 'components/LanguageNav';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ExpandMore, Language } from '@mui/icons-material';
import { SupportedLanguages } from 'common/languages';
import { useState } from 'react';

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';

type TranscriptControlBarProps = {
  curLang: Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function TranscriptControlBar({ curLang, sx = [] }: TranscriptControlBarProps) {
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
      <Button variant="contained" size="small" sx={{width: "100%"}} >
        Download
      </Button>
      <Button variant="contained" size="small" sx={{width: "100%"}} >
        Autoscroll
      </Button>
      <LanguageNav
        name='lang-nav'
        curLang={curLang}
        sx={{width: "100%"}}
      />
    </Stack>
  );
}

