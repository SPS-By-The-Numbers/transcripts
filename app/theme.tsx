'use client';
import { Roboto } from 'next/font/google';
import { extendTheme, responsiveFontSizes } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColor {
    analogous?: string;
    info?: string;
  }

  interface SimplePaletteColorOptions {
    analogous?: string;
    info?: string;
  }
}

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = extendTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: "#cdcdcd"
        },
        primary: {
          main: 'rgb(10, 67, 173)',
          analogous: '#0a95ad',
          info: '#efefef',
          contrastText: '#ececec',
        },
        secondary: {
          main: '#0a43ad',
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: "#cdcdcd"
        },
        primary: {
          main: '#0d2e8e',
          analogous: '#0a95ad',
          info: '#efefef',
          contrastText: '#ececec',
        },
        secondary: {
          main: '#8e6d0e',
        },
      },
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'primary.info',
        }
      },
    },
  }
});

export default responsiveFontSizes(theme);
