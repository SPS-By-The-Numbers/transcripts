import * as Constants from 'config/constants';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchResult from 'components/SearchResult';
import Stack from '@mui/material/Stack';
import { fetchEndpoint } from 'utilities/client/endpoint';

import type { CategoryId } from 'common/params';

async function makeResults(category: CategoryId) {
  const parameters : Record<string, string> = { category, limit: "3" };
  const response = await fetchEndpoint('metadata', 'GET', parameters);
  if (!response.ok || response.data.length == 0) {
    return (<Typography>Sadness. Nothing in this category. </Typography>);
  }
  return response.data.map(v => (
    <SearchResult key={v.videoId} category={category} videoId={v.videoId} title={v.title} publishDate={v.publishDate} />));
}

function MakeAccordions() {
  return Object.entries(Constants.CATEGORY_CHANNEL_MAP).map(async ([key, info]) => {
    return (
      <Accordion key={key} defaultExpanded disableGutters>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel${key}-content`}
          id={`panel${key}-header`}
          sx={{bgcolor: 'primary.analogous'}}
        >
          <header><Typography>{info.name} - Recent Transcripts</Typography></header>
        </AccordionSummary>
        <AccordionDetails sx={{bgcolor: 'primary.background'}} >
          <Stack spacing={"0.5ex"}>
          {await makeResults(key)}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  });
}

export default async function Landing() {
  return MakeAccordions();
}
