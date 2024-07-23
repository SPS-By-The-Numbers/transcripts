import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import DownloadLinks from 'components/DownloadLinks'
import LanguageNav from 'components/LanguageNav';
import Link from 'next/link'
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { blueGrey } from '@mui/material/colors';

import type { Iso6393Code } from 'common/params';

type TranscriptHeaderParams = {
  category: string;
  title: string;
  description: string;
  videoId: string;
  curLang: Iso6393Code;
};

export default function TranscriptHeader({category, title, description, videoId, curLang} : TranscriptHeaderParams) {
  return(
    <header>
      <Box sx={{p:2, border: '2 dashed black', my: 2, backgroundColor:blueGrey[100] }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <DownloadLinks className="flex-auto text-left" category={category} videoId={videoId} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <LanguageNav name='lang-nav' curLang={curLang} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography align="right">
                <i>Code adapted from <Link href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">{"Majdoddin's collab example"}</Link></i>
              </Typography>
            </Box>
          </Toolbar>
        <hr />
        <h2 className="t">{ title }</h2>
        <p>{ description }</p>
        <p><i>Click on words in the transcription to jump to its portion of the audio. The URL can be copy/pasted to get back to the exact second.</i></p>
      </Box>
    </header>
  );
}
