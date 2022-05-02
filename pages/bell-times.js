import { useMemo } from 'react';
import React from 'react'

import Histogram from '../components/Histogram';
import SchoolList from '../components/SchoolList';

import Schools from '../data/schools.json';
import SurveyData from '../data/bell-survey.json';

function calculateStats(survreyData, schools) {
  const activeSchools = new Set(schools.filter(({active}) => active));
  const activeData = survreyData.filter(
      d => d.schools.split(',').filter(
        v => activeSchools.has(v)
      ).length !== 0 
    );
  const numEntries = activeData.length;
  const numEligible = activeData.filter(d => d.eligible).length;
  const numUseIn2022 = activeData.filter(d => d.useIn2022).length;
  const numNeedHelp = activeData.filter(d => d.needHelp).length;
  const numPreferCurrentBell = activeData.filter(d => d.preferCurrentBell).length;
  const numSplitBellTime = activeData.filter(d => d.splitBellTime).length;
  const numChildCareChallenges = activeData.filter(d => d.childcareChallenges).length;

  // Count distance and service type.

  return {
    numEntries,
    numEligible,
    numUseIn2022,
    numNeedHelp,
    numPreferCurrentBell,
    numSplitBellTime,
    numChildCareChallenges
  };
}

export default function BellTimes({ survreyData, schools }) {
  const state = { survreyData, schools };

  const stats = useMemo(
    () => calculateStats(survreyData, schools),
    [survreyData, schools]
  );
  const percentSeries = (num) => {
    return [num / stats.numEntries, (stats.numEntries-num)/stats.numEntries]
  }


  return (
    <main className="p-2 h-full w-full min-h-screen flex flex-row items-stretch justify-items-stretch bg-gray-300 space-x-1">
      <div className="w-1/8 flex flex-col items-stretch justify-start space-y-1">
        <div className="flex-stretch">
          <SchoolList
            state={state}
            toggleActive={(schoolId)=>1}
            setAllInactive={()=>1}
            />
        </div>
      </div>
      <div className="flex-grow flex flex-col items-stretch justify-start shadow-lg">
        <div className="h-80 flex overflow-hidden">
          <Histogram
            title="Eligible for Bus Service"
            key="Ugh"
            data={{
              ylabel: "%",
              categories:[ "Yes", "No" ],
              series: [{name: "Eligible", data: percentSeries(stats.numEligible)}]
            }}
          />
        </div>
        <div className="h-80 flex overflow-hidden">
          <Histogram
            title="Eligible for Bus Service"
            key="Ugh"
            data={{
              ylabel: "%",
              diff_score: "1",
              categories:[ "Yes", "No" ],
              series: [{name: "Eligible", data:[89,11]}]
            }}
          />
        </div>
      </div>
    </main>
  );
}

export async function getStaticProps() {
  const schoolListState = Schools.map( s => ({
      schoolId: s,
      name: s, 
      active: true,
      color: 'grey'
    }));
  return {
    props: {
      survreyData: SurveyData,
      schools: schoolListState,
    },
    revalidate: 1, // In seconds
  };
}
