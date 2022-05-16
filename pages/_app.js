import styles from '../styles/globals.scss'
import Nav from '../components/Nav'

import { useEffect } from 'react';
import TagManager from 'react-gtm-module';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
      TagManager.initialize({ gtmId: 'GTM-WLJHZHL' });
  }, []);
  return <>
    <Nav />
    <Component {...pageProps} />
  </>
}

export default MyApp
