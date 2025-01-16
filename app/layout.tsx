import * as Constants from 'config/constants'
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import MuiProviders from './MuiProviders';
import Nav from 'components/Nav'
import NavStateProvider from 'components/providers/NavStateProvider'
import Script from 'next/script'
import { Metadata } from 'next'

import '../styles/globals.scss';

export const metadata: Metadata = {
  title: 'SPS By The Numbers - Transcriptions',
  description: 'Public meeting transcriptions from SPS By The Numbers',
}

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
      </head>
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${Constants.GA_MEASUREMENT_ID}`} />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
        <MuiProviders>
          <CssBaseline />
          <InitColorSchemeScript attribute="class"/>
          <NavStateProvider>
            <Nav />
            <Box sx={{
              marginTop: "0.5ex",
              height: "100%",
              maxWidth: "120ch",
              marginX: 'auto',
              }}>
              {children}
            </Box>
          </NavStateProvider>
        </MuiProviders>
      </body>
    </html>
  )
}
