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
    dark: {
      palette: {
        background: {
          default: "#cdcdcd"
        },
        primary: {
          main: '#0a43ad'
        },
        secondary: {
          main: '#8e6d0e',
        },
      },
    },
    light: {
      palette: {
        background: {
          default: "#333333"
        },
        primary: {
          main: '#0a43ad'
        },
        secondary: {
          main: '#8e6d0e',
        },
      },
    }
  }
});

export default responsiveFontSizes(theme);
