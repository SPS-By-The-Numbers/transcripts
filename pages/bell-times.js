import React from 'react'

import Histogram from '../components/Histogram';
import SchoolList from '../components/SchoolList';

import Schools from '../data/schools.json';
import SurveyData from '../data/bell-survey.json';

export default function BellTimes({ survreyData, schools }) {
  const state = { survreyData, schools };

  return (
    <main className="p-2 h-full w-full min-h-screen flex flex-row items-stretch justify-items-stretch bg-gray-300 space-x-1">
      <div className="w-1/4 flex flex-col items-stretch justify-start space-y-1">
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
              xlabel:"Yes or no",
              ylabel: "%",
              diff_score: "1",
              categories:[ "Yes", "No" ],
              series: [89, 11]
            }}
          />
        </div>
        <div className="h-80 flex overflow-hidden">
          <div
            state={state}
            heading="New positives per 100k"
          />
        </div>
        <div className="h-80 flex overflow-hidden">
          <div
            state={state}
            heading="Positives per people tested (%)"
          />
        </div>
        <div className="h-80 flex overflow-hidden">
          <div
            state={state}
            heading="Tests"
          />
        </div>
        <div className="h-80 flex overflow-hidden">
          <div
            state={state}
            heading="Deaths"
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
