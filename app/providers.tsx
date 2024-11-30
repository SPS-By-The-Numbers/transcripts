'use client'

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

export default function Providers({ children }) {
  return(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </LocalizationProvider>
    );

}
