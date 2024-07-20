import * as Constants from 'config/constants';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';

export default function Nav() {
  return (
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Button
                variant="contained"
                href={Constants.HOME_URL}
                disableElevation={true}
                alt="home"
                startIcon={<Avatar src={'/logo.png'} variant='square' />}
              >
            </Button>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Typography
                  noWrap
                  component="a"
                  href="/"
                  sx={{ mr: 2, flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                Recents
              </Typography>
              <Typography
                  noWrap
                  component="a"
                  href="/seattle-city-council"
                  sx={{ mr: 2, flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                Seattle City Council
              </Typography>
              <Typography
                  noWrap
                  component="a"
                  href="/seattle-city-council"
                  sx={{ mr: 2, flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                SPS Board
              </Typography>
              <Typography
                  noWrap
                  component="a"
                  href="/about"
                  sx={{ mr: 2, flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                About
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
  );
}

