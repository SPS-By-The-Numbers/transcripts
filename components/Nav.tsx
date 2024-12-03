import * as Constants from 'config/constants';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

export default function Nav() {
  return (
      <AppBar position="sticky">
        <Box sx={{
            display: Constants.isProduction ? "none" : "flex",
            backgroundColor: "red",
            justifyContent: "center",
            width: "100%"}}>
          Dev Mode. Emulators used.
        </Box>
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
      </AppBar>
  );
}

