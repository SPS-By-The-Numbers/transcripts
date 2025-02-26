import * as Constants from 'config/constants';

import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchResult from 'components/SearchResult';
import Stack from '@mui/material/Stack';
import { Metadata } from 'next'
import { fetchEndpoint } from 'utilities/client/endpoint';

import type { ApiResponse } from 'common/response';
import type { CategoryId } from 'common/params';

export const metadata: Metadata = {
  title: Constants.APP_TITLE + ": Recent Transcriptions",
};

function ResultAccordion({category, categoryName, response} : {category : CategoryId, categoryName : string, response : ApiResponse}) {
  return (
    <Accordion defaultExpanded disableGutters>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${category}-content`}
        id={`panel-${category}-header`}
        sx={{backgroundColor: 'secondary.main'}} >

        <Typography component="h5" variant="h5">
          {categoryName} - Recent Transcripts
        </Typography>

      </AccordionSummary>

      <AccordionDetails>
        <Alert
            severity="error"
            sx={{display: !response.ok ? "flex" : "none"}}
          >
          Unable to load recents: {response.message}
        </Alert>

        <Alert
            severity="info"
            sx={{display: (response.ok && response.data.length === 0) ? "flex" : "none"}} >
          Sadness. Nothing in this category.
        </Alert>
        <Stack spacing={"0.5ex"}>
          {response.data.map(video => (
            <SearchResult
              key={video.videoId}
              category={category}
              videoId={video.videoId}
              title={video.title}
              publishDate={video.publishDate} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default async function LandingPage() {
  // Get most recent items per category.
  const allCategories = Object.entries(Constants.CATEGORY_CHANNEL_MAP);

  const categoryResponses = await Promise.all(
    allCategories.map(
      ([category]) => fetchEndpoint('metadata', 'GET', {category, limit: "3"})));

  return (
    <Stack
        spacing={1}
        sx={{
          marginX: "auto",
          maxWidth: "120ch",
          padding: "1ex",
        }}>
      {
        allCategories.map(([category, categoryInfo], i) => {
          return (
            <ResultAccordion
              key={category}
              category={category}
              categoryName={categoryInfo.name}
              response={categoryResponses[i]} />
          );
        })
      }
    </Stack>
  );
}
