import Head from 'next/head'
import Link from 'next/link'
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
          <Link href="/bell-times" passHref={true}>
            <div className={styles.card}>
              <h2>SPS Bell Time Survey Results</h2>
              <strong>Key results:</strong> <br /> Even families still without bus service overwhelmingly prefer a 2-bell schedule. Other data gathered is harder to analyze. Click through and read HAZARD at top.
            </div>
          </Link>
          <a href="https://andrewbcooper.shinyapps.io/spsstarttimes/" className={styles.card}>
            <h2>SPS Start Times Exploration Tool</h2>
            Andy Cooper (acooper at alumni.washington.edu)&apos;s awesome tool for exploring the impact of the
            2022 proposed bell time changes by joining multiple government datasets at the census tract granularity.
            Includes Equity metrics.
          </a>
          <a href="https://sps-panorama.web.app/" className={styles.card}>
            <h2>SPS Panorama Data Slicer (2019)</h2>
            Tool for comparing SPS Panorama data for different schools, sorting them to find the most
            distinguishing characteristics. Much more understandable than the Panorama site. Data for 2021
            is not uploaded yet.
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        Powered by sleep-deprived parents.
      </footer>
    </div>
  )
}
