'use client';
import { Roboto } from 'next/font/google';
import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

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
          main: '#2664c2',
        },
        secondary: {
          main: '#c28426',
        }
      },
    },
  }
});

export default theme;
