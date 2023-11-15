'use client'

import React from 'react';

import { getDatabase, ref, onValue } from "firebase/database"
import { initializeApp } from "firebase/app"
import { useEffect, useState } from 'react'
import distinctColors from 'distinct-colors'
import CreatableSelect from 'react-select/creatable'

const palette = distinctColors({ count: 45, lightMin: 70, chromaMax: 200 });

const firebaseConfig = {
  databaseURL: "https://sps-by-the-numbers-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);

function getSpeakerAttributes(speaker, speakers, speakerInfo) {
  // TODO: Make this all go into speakerInfo.
  const origLabel = speakers[speaker];
  const overrideLabel = speakerInfo[speaker];
    console.log('the name', overrideLabel);
  const name = overrideLabel?.name || origLabel || speaker;
  const speakerNum = Number(speaker.split('_')[1]);
  const color = palette[speakerNum];

  return { name, color, origLabel, speaker };
}

export default function SpeakerInfo({speakers, videoId, initialSpeakerInfo}) {
  const [speakerInfo, setSpeakerInfo] = useState(initialSpeakerInfo);

  function handleNameChange(curSpeaker, newValue) {
    const newSpeakerInfo = {...speakerInfo};
    console.log("wtf", newValue);
    console.log("curSpeaker", curSpeaker);
    console.log("oldSI", newSpeakerInfo);
    newSpeakerInfo[curSpeaker].name = newValue.name;
    console.log("newSI", newSpeakerInfo);
    setSpeakerInfo(newSpeakerInfo);
  }

  function handleTagsChange(curSpeaker, newValue) {
    const newSpeakerInfo = {...speakerInfo};
    newSpeakerInfo[curSpeaker].tags.add(newValue.value);
    setSpeakerInfo(newSpeakerInfo);
  }

  async function handleOnClick(event) {
  }

  // Load from the database.
  useEffect(() => {
    let ignore = false;
    const database = getDatabase(app);
    const path = `transcripts/v/${videoId}`;
    const videoRef = ref(database, `transcripts/v/${videoId}`);
    onValue(videoRef, (snapshot) => {
      const data = snapshot.val();
      if (!ignore && data) {
        const newSpeakerInfo = {};
        for (const [k,v] of data.speakers) {
          newSpeakerInfo[k] = {...v, tags: new Set(v.tags)};
        }
        setSpeakerInfo(newSpeakerInfo);
      }
    });
    return () => { ignore = true; };
  }, [videoId, setSpeakerInfo]);

  // Create the speaker table.
  console.log(speakerInfo);
  const speakerLabelInputs : React.ReactElement[] = [];
  const allSpeakers = Array.from(speakers).sort();
  const nameOptions = []; // TODO: This needs to be done differently. Pull from DB and merge with existing names, but not the SPEAKER_00
  for (const s of allSpeakers) {
    const { name, color, origLabel, speaker } = getSpeakerAttributes(s, speakers, speakerInfo);
    nameOptions.push(({name, label: name}));
    const curName = nameOptions.filter(v => v.name === name)?.[0];
    speakerLabelInputs.push(
      <li key={`li-${name}`} className="py-1 flex" style={{backgroundColor: color.name()}}>
        <div className="pl-2 pr-1 basis-1/2">
          <CreatableSelect
              isClearable
              options={nameOptions}
              value={curName}
              placeholder={`Name for ${name}`}
              onChange={newValue => handleNameChange(speaker, newValue)} />
        </div>
        <div className="pl-1 pr-2 basis-1/2">
          <CreatableSelect
              isClearable
              isMulti
              placeholder={`Tags for ${name}`}
              onChange={newValue => handleTagsChange(speaker, newValue)} />
        </div>
      </li>
    );
  }

  return (
    <>
      Speaker List
      <ul className="list-style-none">
        { speakerLabelInputs }
      </ul>
      <button
        className="px-4 py-2 m-2 bg-red-500 rounded"
        onClick={handleOnClick}>
          Submit Label Suggestion
      </button>
    </>
  );
}
