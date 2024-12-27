import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import VideoPlayer from 'components/VideoPlayer';
import TranscriptControlBar from 'components/TranscriptControlBar';

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';

type TranscriptVideoParams = {
  videoId: string;
  curLang: Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function TranscriptVideo({
  videoId, curLang, sx=[]} : TranscriptVideoParams) {
  return (
    <Box
        sx={[{padding: "0.5ex"}, ...(Array.isArray(sx) ? sx : [sx])]}>
      <VideoPlayer
        videoId={videoId}
        sx={{
          marginX: "auto",
          width: {
              xs: "352px",
              md: "426px",
          },
        }}
      />
      <TranscriptControlBar
        curLang={curLang}
      />
    </Box>
  );
}
