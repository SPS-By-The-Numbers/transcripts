import Link from 'next/link'

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { getEndpointUrl } from 'utilities/client/endpoint';

function getDownloadURL(category, videoId, ext) {
    return getEndpointUrl('transcript', {videoId: videoId, type: ext});
}

type DownloadLinksParams = {
  category: string;
  videoId: string;
  className: string;
};

export default function DownloadLinks({category, videoId, className} : DownloadLinksParams) {
  return (
    <Stack direction="row" spacing={2} sx={{fontSize: 'small'}}>
      <Stack
          direction="row"
          spacing={1}
      >
        <Box sx={{mx:1}}>
          <Link href={getDownloadURL(category, videoId, 'json')}>json</Link>
        </Box>
        <Box sx={{mx:1}}>
          <Link href={getDownloadURL(category, videoId, 'tsv')}>tsv</Link>
        </Box>
        <Box sx={{mx:1}}>
          <Link href={getDownloadURL(category, videoId, 'txt')}>txt</Link>
        </Box>
        <Box sx={{mx:1}}>
          <Link href={getDownloadURL(category, videoId, 'srt')}>srt</Link>
        </Box>
        <Box sx={{mx:1}}>
          <Link href={getDownloadURL(category, videoId, 'vtt')}>vtt</Link>
        </Box>
      </Stack>
    </Stack>
  );
}
