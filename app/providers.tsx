'use client'

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import theme from './theme';

export default function Providers({ children }) {
  return(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <CssVarsProvider theme={theme}>
          {children}
        </CssVarsProvider>
      </AppRouterCacheProvider>
    </LocalizationProvider>
    );

}
