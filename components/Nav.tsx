import * as Constants from 'config/constants';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';

function getDevBanner() {
  if (Constants.isProduction) {
    return undefined;
  }

  return (<Alert variant="filled" severity="warning">Is Dev Mode</Alert>);
}

export default function Nav() {
  return (
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters variant="dense">
            <Button
                variant="contained"
                href={Constants.HOME_URL}
                disableElevation={true}
                startIcon={<Avatar src={'/logo.png'} variant='square' />}
             />

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Stack
                  direction="row"
                  divider={<Divider orientation="vertical" flexItem aria-hidden="true" />}
                  spacing={1}
              >
                <Typography
                    noWrap
                    component="a"
                    href="/"
                    sx={{ mr: 2, color: 'inherit', textDecoration: 'none' }}>
                  Recents
                </Typography>
                <Typography
                    noWrap
                    component="a"
                    href="/seattle-city-council"
                    sx={{ mr: 2, color: 'inherit', textDecoration: 'none' }}>
                  Seattle City Council
                </Typography>
                <Typography
                    noWrap
                    component="a"
                    href="/sps-board"
                    sx={{ mr: 2, color: 'inherit', textDecoration: 'none' }}>
                  SPS Board
                </Typography>
                <Typography
                    noWrap
                    component="a"
                    href="/seattle-city-council/search"
                    sx={{ mr: 2, color: 'inherit', textDecoration: 'none' }}>
                   Text Search[Seattle City Council]
                </Typography>
                <Typography
                    noWrap
                    component="a"
                    href="/sps-board/search"
                    sx={{ mr: 2, color: 'inherit', textDecoration: 'none' }}>
                  Text Search[SPS Board]
                </Typography>
              </Stack>
            </Box>
            <Box sx={{flexGrow: 0}}>
              <Typography
                  noWrap
                  component="a"
                  href="/about"
                  sx={{ color: 'inherit', textDecoration: 'none' }}>
                About
              </Typography>
            </Box>
          </Toolbar>
        </Container>
        { getDevBanner() }
      </AppBar>
  );
}

