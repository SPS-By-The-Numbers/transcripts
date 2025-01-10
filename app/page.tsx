import * as Constants from 'config/constants';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchResult from 'components/SearchResult';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { fetchEndpoint } from 'utilities/client/endpoint';

import type { CategoryId } from 'common/params';

export const dynamic = 'force-dynamic';

async function makeMostRecentResults(category: CategoryId) {
  const parameters : Record<string, string> = { category, limit: "3" };
  const response = await fetchEndpoint('metadata', 'GET', parameters);
  if (!response.ok || response.data.length == 0) {
    return (<Typography>Sadness. Nothing in this category. </Typography>);
  }
  return response.data.map(v => (
    <SearchResult
      key={v.videoId}
      category={category}
      videoId={v.videoId} title={v.title}
      publishDate={v.publishDate} />));
}

function makeResultAccordions() {
  return Object.entries(Constants.CATEGORY_CHANNEL_MAP).map(async ([key, info]) => {
    return (
      <Accordion key={key} defaultExpanded disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel${key}-content`}
          id={`panel${key}-header`}
          sx={{backgroundColor: 'secondary.main'}} >
          <Typography component="h5" variant="h5">
            {info.name} - Recent Transcripts
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={"0.5ex"}>
          {await makeMostRecentResults(key)}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  });
}

export default function Landing() {
  return (
    <Stack spacing={1}
      sx={{
        marginX: "auto",
        maxWidth: "120ch",
        padding: "1ex",
      }}>
      { makeResultAccordions()}
    </Stack>
  );
}
