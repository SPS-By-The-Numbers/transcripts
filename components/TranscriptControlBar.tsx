import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LanguageNav from 'components/LanguageNav';
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
      sx={[{
          justifyContent: "space-around",
          bgcolor: 'primary.main',
          "& .MuiOutlinedInput-root": {
            color: 'primary.contrastText',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <Button sx={{width: "100%"}} >
        <Box sx={{
            color: 'primary.contrastText',
          }}>
          Download
        </Box>
      </Button>
      <Button sx={{width: "100%"}} >
        <Box sx={{
            color: 'primary.contrastText',
          }}>
          Autoscroll
        </Box>
      </Button>
      <LanguageNav
        name='lang-nav'
        curLang={curLang}
        sx={{width: "100%"}}
      />
    </Stack>
  );
}

