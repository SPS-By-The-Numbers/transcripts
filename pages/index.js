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
	<img className="object-scale-down h-24 inline" src="/logo.png" />SPS By The Numbers
        </h1>

        <p className={styles.description}>
	Data-centric analyses and insights for Seattle Public Schools
        </p>

        <div className={styles.grid}>
          <Link href="/posts/hampson-2022-strike" passHref={true}>
            <div className={styles.card}>
              <h2>Notes from Conv w/ Director Hampson on 2022 Strike</h2>
              Someone posted deatiled notes from a conversation with Director Hampson about the 2022
              strike. It contains a lot of information about one directors thought. Almost no other
              info about SPS admin's or board's beliefs had been shared prior. It was deleted for
              some reason. Preserving it so everyone has equal access to information.
            </div>
          </Link>

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
          <Link href="/hcc-northend-resegregation" passHref={true}>
            <div className={styles.card}>
              <h2>HCC Dismantling Resegregates North End</h2>
              <strong>Key results:</strong> <br /> Cascadia is less white 2/3s of the schools it draws from. Instead of removing a segregationist program, we have actaully resegreggated Districts 1, 2, and 4.
            </div>
          </Link>
          <a href="/tools/panorama-slicer" className={styles.card}>
            <h2>SPS Panorama Data Slicer (2022)</h2>
            Tool for comparing SPS Panorama data for different schools, sorting them to find the most
            distinguishing characteristics. Much more understandable than the Panorama site.
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Powered by sleep-deprived parents.
        <br />
        <br />
        Questions? email: awong dot dev at gmail dot com</p>
      </footer>
    </div>
  )
}
