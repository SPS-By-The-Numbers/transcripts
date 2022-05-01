import Head from 'next/head'
import Image from 'next/image'
import Script from 'next/script'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>SPS By The Numbers</title>
        <meta name="Data-centric analyses and insights for Seattle Public Schools" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>
	SPS By The Numbers
        </h1>

        <p className={styles.description}>
	Data-centric analyses and insights for Seattle Public Schools
        </p>

        <div className={styles.grid}>
          <a href="https://docs.google.com/document/d/1rrpHXLxn2ajhg9V3L5rnhnA0S7K-fLPEJvNfudgVpHg/edit?#" className={styles.card}>
            <h2>SPS Bell Time Survey Results -- Letter to the board</h2>
            <p>More details coming soon. For now, here is the letter sent to the board</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        Powered by sleep-deprived parents.
      </footer>
    </div>
  )
}
