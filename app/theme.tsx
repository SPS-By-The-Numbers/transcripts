'use client';

import {muiThemeConfig} from 'config/theme';
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

const theme = extendTheme(muiThemeConfig);

export default responsiveFontSizes(theme);
