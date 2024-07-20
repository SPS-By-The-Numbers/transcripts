import * as Constants from 'config/constants'
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Nav from 'components/Nav'
import Providers from './providers';
import Script from 'next/script'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SPS By The Numbers - Transcriptions',
  description: 'Public meeting transcriptions from SPS By The Numbers',
}

function getDevBanner() {
  if (Constants.isProduction) {
    return undefined;
  }

  return (<Alert variant="filled" severity="warning">Is Dev Mode</Alert>);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
        <Providers>
          <CssBaseline />
          <InitColorSchemeScript />
          { getDevBanner() }
          <Nav />
          <Box
            width={'80%'}
            margin="auto"
            mt="2ex"
          >
          {children}
          </Box>
        </Providers>
      </body>
    </html>
  )
}
