import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
    <Card variant="outlined" sx={[{paddingY: 0}, ...(Array.isArray(sx) ? sx : [sx])]}>
      <CardContent sx={{paddingX: 0, paddingY: 0}}>
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
      </CardContent>
    </Card>
  );
}
