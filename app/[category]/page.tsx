import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function InfoPage() {
  return (
    <Paper>
      <Typography>
      Transcripts for [category name] come from nightly scrape of [url].
      The last update to this category is [].
      </Typography>
    </Paper>
  );
}
