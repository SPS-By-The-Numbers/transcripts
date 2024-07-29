import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import DownloadLinks from 'components/DownloadLinks'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LanguageNav from 'components/LanguageNav';
import Link from 'next/link'
import Stack from '@mui/material/Stack';
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
    <>
      <Accordion defaultExpanded disableGutters variant="outlined" sx={{mb:2, mt:0}} >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-content`}
          id={`panel-header`}
          sx={{
            bgcolor: 'primary.analogous',
            "& .MuiAccordionSummary-content": {
              my: '6px',
            }
          }}
        >
          <Stack direction="row" sx={{mr:"3ex", width:'100%'}}>
            <Stack sx={{ flexGrow: 4 }}>
              <Typography component="h2" style={{fontWeight: 'bold', fontSize: 'large'}}>{ title }</Typography>
              <DownloadLinks className="flex-auto text-left" category={category} videoId={videoId} />
            </Stack>
            <Box sx={{ flexGrow: 5 }}>
              <LanguageNav name='lang-nav' curLang={curLang} />
            </Box>
            <Box sx={{ flexGrow: 5 }}>
              <Typography align="right">
                <i>Code adapted from <Link href="https://colab.research.google.com/github/Majdoddin/nlp/blob/main/Pyannote_plays_and_Whisper_rhymes_v_2_0.ipynb">{"Majdoddin's collab example"}</Link></i>
              </Typography>
            </Box>
          </Stack>
        </AccordionSummary>

        <AccordionDetails
          sx={{
            bgcolor: 'primary.info',
            '& .MuiAccordionDetails-root': {
              my: '6px',
            }
          }} >
          <Box>
            <Typography variant="body1" gutterBottom>{ description }</Typography>
            <Typography variant="caption">Click on words in the transcription to jump to its portion of the audio. The URL can be copy/pasted to get back to the exact second.</Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
