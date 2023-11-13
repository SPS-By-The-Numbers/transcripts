import 'styles/globals.scss'
import Nav from 'components/Nav'
import Script from 'next/script'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SPS By The Numbers - Transcriptions',
  description: 'Public meeting transcriptions from SPS By The Numbers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
        <Nav />
        {children}
      </body>
    </html>
  )
}
