'use client'

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

export default function Providers({ children }) {
  return <LocalizationProvider dateAdapter={AdapterDateFns}>
    {children}
  </LocalizationProvider>;

}