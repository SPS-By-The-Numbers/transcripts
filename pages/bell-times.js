import React, { useMemo, useState }  from 'react'

import Histogram from '../components/Histogram';
import SchoolList from '../components/SchoolList';

import Schools from '../data/schools.json';
import SurveyData from '../data/bell-survey.json';

function calculateStats(survreyData, schools) {
  const activeSchools = new Set(schools.filter(({active}) => active).map(s => s.schoolId));
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

export default function BellTimes({ survreyData, initialSchools }) {
  const [schools, setSchools] = useState(initialSchools);

  const stats = useMemo(
    () => calculateStats(survreyData, schools),
    [survreyData, schools]
  );

  const percentSeries = (num) => {
    return [num / stats.numEntries * 100, (stats.numEntries-num)/stats.numEntries * 100];
  }
  const numSeries = (num) => {
    return [num, stats.numEntries-num];
  }

  return (
    <main className="p-2 h-full w-full min-h-screen flex flex-row items-stretch justify-items-stretch bg-gray-300 space-x-1">
      <div className="w-1/8 flex flex-col items-stretch justify-start space-y-1">
        <div className="flex-stretch">
          <SchoolList
            schools={schools}
            toggleActive={(schoolId)=>{
              setSchools((oldSchools) =>
                oldSchools.map((s) =>
                  s.schoolId === schoolId
                      ? { ...s, active: !s.active }
                      : { ...s }));
            }}
            setAllInactive={() =>
              setSchools((oldSchools) =>
                oldSchools.map((s) => {return {...s, active: false }}))
            }
            />
        </div>
      </div>



      <div className="flex-grow flex flex-col items-stretch justify-start shadow-lg">
        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Prefers 2-tier Bell Time (n=${stats.numEntries})`}
            data={{
              ylabel: 'families',
              categories:[ "2-tier Bell", "3-tier Bell" ],
              series: [{showInLegend:false, name: 'families', data: numSeries(stats.numPreferCurrentBell)}]
            }}
          />
        </div>

        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Expects Childcare Challenges (n=${stats.numEntries})`}
            data={{
              ylabel: 'families',
              categories:[ "Expects Challenges", "No Challenges" ],
              series: [{showInLegend:false, name: 'families', data: numSeries(stats.numChildCareChallenges)}]
            }}
          />
        </div>

        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Has students with both 7:30 and 9:30 (n=${stats.numEntries})`}
            data={{
              ylabel: 'families',
              categories:[ "Has 7:30/9:30 split", "Not split" ],
              series: [{showInLegend:false, name: 'families', data: numSeries(stats.numSplitBellTime)}]
            }}
          />
        </div>

        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Eligible for Bus Service (n=${stats.numEntries})`}
            data={{
              ylabel: 'families',
              categories: [ "Eligible", "Not Eligible" ],
              series: [{showInLegend:false, name: 'families', data: numSeries(stats.numEligible)}]
            }}
          />
        </div>

        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Plans on Bussing in 2022-2023 (n=${stats.numEligible})`}
            data={{
              ylabel: 'families',
              categories:[ "Eligible and will bus", "Eligible and will NOT bus" ],
              series: [{
                showInLegend:false,
                name: 'families',
                data: [stats.numUseIn2022, stats.numEligible - stats.numUseIn2022]
                }]
            }}
          />
        </div>

        <div className="h-80 flex overflow-hidden">
          <Histogram
            title={`Needs Help Finding Transit w/o Bus (n=${stats.numEligible})`}
            data={{
              ylabel: 'families',
              categories:[ "Needs Help", "Does Not Need Help" ],
              series: [{showInLegend:false, name: 'families', data: [stats.numNeedHelp, stats.numEligible - stats.numNeedHelp]}]
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
      initialSchools: schoolListState,
    },
    revalidate: 1, // In seconds
  };
}
