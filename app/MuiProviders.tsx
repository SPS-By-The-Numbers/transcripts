'use client'

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

export default function MuiProviders({ children }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </LocalizationProvider>
  );
}
