import 'styles/globals.scss'
import Nav from 'components/Nav'
import Script from 'next/script'
import { Metadata } from 'next'
import Providers from './providers';

export const dynamic = 'force-static';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'SPS By The Numbers - Transcriptions',
  description: 'Public meeting transcriptions from SPS By The Numbers',
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
        <Script src="https://www.googletagmanager.com/gtag/js?id=GTM-WLJHZHL" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
