import React, { useMemo, useState }  from 'react'

import styles from '../styles/Home.module.css'
import Histogram from '../components/Histogram';
import SchoolList from '../components/SchoolList';
import ItemList from '../components/ItemList';

import Schools from '../data/schools.json';
import SurveyData from '../data/bell-survey.json';

function h(a, b, c) {
  const str = a + b + c;
  let code = 31;
  for (let i=0; i < str.length; i++) {
    code += (str[i]*31)^(str.length - i);
  }
  return code;
}

function calculateStats(survreyData, schools, filters) {
  const activeSchools = new Set(schools.filter(({active}) => active).map(s => s.schoolId));

  let filteredData = survreyData;
  for (let f of filters) {
    if (f.active === false) {
      if (f.itemId === 'bus-eligible') {
        filteredData = filteredData.filter(d => d.eligible !== true );
      } else if (f.itemId === 'bus-ineligible') {
        filteredData = filteredData.filter(d => d.eligible !== false );
      } else if (f.itemId === 'plans-on-bus') {
        filteredData = filteredData.filter(d => d.useIn2022 !== true );
      } else if (f.itemId === 'no-plans-on-bus') {
        filteredData = filteredData.filter(d => d.useIn2022 !== false );
      } else if (f.itemId === 'prefers-2-bells') {
        filteredData = filteredData.filter(d => d.preferCurrentBell !== true );
      } else if (f.itemId === 'prefers-3-bells') {
        filteredData = filteredData.filter(d => d.preferCurrentBell !== false );
      } else if (f.itemId === 'need-transit-help') {
        filteredData = filteredData.filter(d => d.needHelp !== true );
      } else if (f.itemId === 'no-need-transit-help') {
        filteredData = filteredData.filter(d => d.needHelp !== false );
      } else if (f.itemId === 'split-bell-time') {
        filteredData = filteredData.filter(d => d.splitBellTime !== true );
      } else if (f.itemId === 'no-split-bell-time') {
        filteredData = filteredData.filter(d => d.splitBellTime !== false );
      } else if (f.itemId === 'childcare-challenges') {
        filteredData = filteredData.filter(d => d.childcareChallenges !== true );
      } else if (f.itemId === 'no-childcare-challenges') {
        filteredData = filteredData.filter(d => d.childcareChallenges !== false );
      }
    }
  }

  const activeData = filteredData.filter(
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

  let freeForm = activeData.map(({freeFormNoBusImpact, freeForm3TierImpact, freeFormOtherComments}) => ({freeFormNoBusImpact: freeFormNoBusImpact.trim(), freeForm3TierImpact: freeForm3TierImpact.trim(), freeFormOtherComments: freeFormOtherComments.trim()}));
  freeForm = freeForm.filter(f => f.freeFormNoBusImpact || f.freeForm3TierImpact || f.freeFormOtherComments);
  freeForm = freeForm.map(f => ({
  ...f,
  hash: h(f.freeFormNoBusImpact, f.freeFormOtherComments, f.freeForm3TierImpact)
  }));
  freeForm.sort((a,b) => a.hash < b.hash);

  return {
    numEntries,
    numEligible,
    numUseIn2022,
    numNeedHelp,
    numPreferCurrentBell,
    numSplitBellTime,
    numChildCareChallenges,
    freeForm
  };
}

export default function BellTimes({ survreyData, initialSchools, initialFilters }) {
  const [schools, setSchools] = useState(initialSchools);
  const [filters, setFilters] = useState(initialFilters);

  const stats = useMemo(
    () => calculateStats(survreyData, schools, filters),
    [survreyData, schools, filters]
  );

  const numSeries = (num) => {
    return [num, stats.numEntries-num];
  }

  return (
    <main>
      <section>
        <p>Results from the April 2022 <a href="https://forms.gle/6siw5FAnQCqpToC46">Bell-time Survey</a>.</p>

        <p><strong>Key result:</strong> Even families still without bus service overwhelmingly prefer a 2-bell schedule.</p>

        <p><strong style={{color:"red"}}>HAZARD:</strong> This survey method was very biased! It does NOT evenlly represent many schools, especially title-1, ELL, etc. It would be wrong to interpret it as representing the whole district. However, it does represent over 1200 real families so it would be equally wrong to dismiss it.  Read the <a href="https://docs.google.com/document/d/1rrpHXLxn2ajhg9V3L5rnhnA0S7K-fLPEJvNfudgVpHg/edit?#">executive summary</a> that was sent to the board for suggested interpretation.</p>
        <p>Some data slices still missing. Check back for updates. Email spsbelltimesurvey@gmail.com with questions.</p>

      </section>
      <section className="p-2 h-full w-full min-h-screen flex flex-row items-stretch justify-items-stretch bg-gray-300 space-x-1">
        <div className="w-1/8 flex flex-col items-stretch justify-start space-y-1">
          <div className="flex-stretch">
            <ItemList
              items={filters}
              toggleActive={(itemId)=>{
                setFilters((oldFilters) =>
                  oldFilters.map((f) =>
                    f.itemId === itemId
                        ? { ...f, active: !f.active }
                        : { ...f }));
              }}
              />
          </div>
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

        <div className="flex-grow flex flex-col justify-start shadow-lg">
          <div>Num Comments {stats.freeForm.length}</div>
          {
            stats.freeForm.map(({freeFormNoBusImpact, freeForm3TierImpact, freeFormOtherComments, hash}) =>
            (
              <div className='freeform-card'>
               <h3>How would not having a bus service impact your family and student/s?</h3>
               { freeFormNoBusImpact || '[no answer]' }

               <h3>How would the proposed change to bell times impact your family and student/s?</h3>
               { freeForm3TierImpact || '[no answer]'}

               <h3>Any other comments?</h3>
               { freeFormOtherComments || '[no answer]'}
              </div>
            ))
          }
          
        </div>
      </section>
    </main>
  );
}

function makeItem(id, name, active, color) {
  return {itemId: id, name, active, color};
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
      initialFilters: [
        makeItem('bus-eligible', 'Eligible For Bus', true, 'grey'),
        makeItem('bus-ineligible', 'Not Eligible For Bus', true, 'grey'),
        makeItem('plans-on-bus', 'Planning to Bus in 2022-2023', true, 'grey'),
        makeItem('no-plans-on-bus', 'Not Planning to Bus in 2022-2023', true, 'grey'),
        makeItem('need-transit-help', 'W/o bus would need transit help', true, 'grey'),
        makeItem('no-need-transit-help', 'W/o bus would NOT need transit help', true, 'grey'),
        makeItem('prefers-2-bells', 'Prefers 2 bells', true, 'grey'),
        makeItem('prefers-3-bells', 'Prefers 3 bells', true, 'grey'),
        makeItem('split-bell-time', 'Split between tier 1 and 3', true, 'grey'),
        makeItem('no-split-bell-time', 'Not split between tier 1 and 3', true, 'grey'),
        makeItem('childcare-challenges', '3-bells = childcare challenges', true, 'grey'),
        makeItem('no-childcare-childcare', '3-bells will not create childcare challenges', true, 'grey'),
      ],
    },
    revalidate: 1, // In seconds
  };
}
