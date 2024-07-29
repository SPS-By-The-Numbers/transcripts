'use client';
import { Roboto } from 'next/font/google';
import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColor {
    analogous?: string;
    infoBackground?: string;
  }

  interface SimplePaletteColorOptions {
    analogous?: string;
    infoBackground?: string;
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
        primary: {
          main: '#0a43ad',
          analogous: '#0a95ad',
          lighter: '#3e7ef4',
          infoBackground: '#efefef',
        },
        secondary: {
          main: '#0a43ad',
        }
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#0a41ad',
          analogous: '#0a95ad',
          lighter: '#3e7ef4',
          info: '#efefef',
        },
        secondary: {
          main: '#c28426',
        }
      },
    },
  }
});

export default theme;
