import React, { useMemo, useState }  from 'react'

import Histogram from '../components/Histogram';
import HccRace from '../data/hcc-northend-resegregation.json';
import styles from '../styles/Home.module.css'

export default function Cascadia({ hccRace }) {
  const raceData = {
    nat: [],
    asian: [],
    black: [],
    hispanic: [],
    island: [],
    multiple: [],
    white: [],
  };

  for (const row of hccRace) {
    raceData.nat.push( [row[0], row[1] * 100] );
    raceData.asian.push( [row[0], row[2] * 100] );
    raceData.black.push([row[0], row[3] * 100]);
    raceData.hispanic.push([row[0], row[4] * 100]);
    raceData.island.push([row[0], row[5] * 100]);
    raceData.multiple.push([row[0], row[6] * 100]);
    raceData.white.push([row[0], row[7] * 100]);
  }

  raceData.nat.sort((a,b) => a[1] - b[1]);
  raceData.asian.sort((a,b) => a[1] - b[1]);
  raceData.black.sort((a,b) => a[1] - b[1]);
  raceData.hispanic.sort((a,b) => a[1] - b[1]);
  raceData.island.sort((a,b) => a[1] - b[1]);
  raceData.multiple.sort((a,b) => a[1] - b[1]);
  raceData.white.sort((a,b) => a[1] - b[1]);

  return (
    <main>
      <section>
        <p>HCC is commonly called a white, segregationist, program. However, visiting Cascadia, it becomes obvious the students look far more diverse than most of the 29 schools it pulls from.</p> 

        <p><strong>Highlights:</strong></p>
        <ul className={styles.points}>
          <li> - Cascadia feeds from 29 schools.</li>
          <li> - Cascadia is 54% white.</li>
          <li> - Only 11/29 schools have a lower percentage of white kids.</li>
          <li> - In this cohort, only 6/29 schools have more than 10% black kids (1/2 the black students in Cascadia come from these schools...verified with staff).</li>
          <li> - Of the remaining 23 schools, 13 have a higher percentage of black kids -- but realistically they mostly have very similar low numbers.</li>
          <li> - There are almost no native or island kids in these schools.</li>
        </ul>

        <p> Because of the false assumption that HCC is more white, the HCC removal will re-segregate these
        students. If we imagined a world where all of the existing students of color were sent back to their neighborhood schools, about 180 / 234 would end up in schools with equal of fewer peers that identify with the same race. (All Asians end up more isolated in any other school. Most multi-racial students too. 1/2 the Black students are in schools of similar or lower number numbers. Very few end up "better off".).
        </p>
        <p> Furthermore, because staffing up a program to support HCC-style differentiation in each school requires at least some minimal staffing overhead, a policy to break the cluster and redistribute resources will assign more resources to whiter populations by about 2.5x-3x (assuming 1 new teacher per school). This is because the schools themselves are segregated.</p>
        <p> See the <a href="https://medium.com/@awongawong/sps-misunderstands-its-own-gifted-program-1816665d86b">(not fully data centric) letter I wrote to the board</a> here</p>
      </section>
      <section>
        <div className="p-4 flex-grow flex flex-row items-stretch justify-start shadow-lg">
          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% White"
              data={{
                ylabel: '%',
                categories: raceData.white.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.white.map(d => d[1])}]
              }}
            />
          </div>

          <div className="p-4 h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Black"
              data={{
                ylabel: '%',
                categories: raceData.black.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.black.map(d => d[1])}]
              }}
            />
          </div>
        </div>

        <div className="p-4 flex-grow flex flex-row items-stretch justify-start shadow-lg">
          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Asian"
              data={{
                ylabel: '%',
                categories: raceData.asian.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.asian.map(d => d[1])}]
              }}
            />
          </div>

          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Mixed"
              data={{
                ylabel: '%',
                categories: raceData.multiple.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.multiple.map(d => d[1])}]
              }}
            />
          </div>

        </div>

        <div className="p-4 flex-grow flex flex-row items-stretch justify-start shadow-lg">
          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Native"
              data={{
                ylabel: '%',
                categories: raceData.nat.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.nat.map(d => d[1])}]
              }}
            />
          </div>

          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Island"
              data={{
                ylabel: '%',
                categories: raceData.island.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.island.map(d => d[1])}]
              }}
            />
          </div>
        </div>

        <div className="flex-grow flex flex-row items-stretch justify-start shadow-lg">
          <div className="h-90 w-1/2 flex overflow-hidden">
            <Histogram
              title="% Hispanic"
              data={{
                ylabel: '%',
                categories: raceData.hispanic.map(d => d[0]),
                series: [{showInLegend:false, name: 'families', data: raceData.hispanic.map(d => d[1])}]
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export async function getStaticProps() {
  return {
    props: {
      hccRace: HccRace,
    },
    revalidate: 1, // In seconds
  };
}
