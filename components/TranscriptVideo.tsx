import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import VideoPlayer from 'components/VideoPlayer';
import TranscriptControlBar from 'components/TranscriptControlBar';

import type { Iso6393Code } from 'common/params';
import type { SxProps, Theme } from '@mui/material';

type TranscriptVideoParams = {
  title: string;
  videoId: string;
  curLang: Iso6393Code;
  sx?: SxProps<Theme>;
};

export default function TranscriptVideo({
  title, videoId, curLang, sx=[]} : TranscriptVideoParams) {
  return (
    <Paper
        elevation={3}
        sx={[{padding: "0.5ex"}, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Typography variant="h6" component="div" sx={{paddingX: 0}}>
        {title}
      </Typography>
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
        sx={{
          borderColor: "blue",
          borderStyle: "solid",
        }}
      />
    </Paper>
  );
}
