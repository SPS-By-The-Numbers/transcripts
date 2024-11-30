import * as Constants from 'config/constants';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { getVideoPath } from "common/paths"
import { format, parseISO } from "date-fns";

import type { CategoryId, VideoId } from 'common/params';

type SearchResultsParams = {
  category: CategoryId;
  videoId: VideoId;
  title: string;
  publishDate: string;
};

export default function SearchResults({category, videoId, title, publishDate} : SearchResultsParams) {
  // TODO: The data in the database is the wrong timezone. It assumed UTC when it should
  // have been local time. Boooo.
  const isoDate = parseISO(publishDate);
  const publishDateOnly = new Date(isoDate.valueOf() + isoDate.getTimezoneOffset() * 60 * 1000);
  return (
    <Paper sx={{ p:1, display: 'inline-flex', alignItems: "center" }}>
      <Box
          component="img"
          alt={`Screenshot of ${title}`}
          src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
          sx={{
            mx:2,
            width: {
              xs: 100,
              sm: 200,
              md: 300,
              lg: 400,
              xl: 500,
           },
           height: '100%',
          }}
          />
      <Typography
          href={`${getVideoPath(category, videoId)}`}
          component="a"
          variant="h5"
          sx={{ textDecoration: 'none' }}
          >
        {title}
        <Typography>
          published: {format(publishDateOnly, "yyyy-MM-dd")}
        </Typography>
      </Typography>
    </Paper>
  );
}
