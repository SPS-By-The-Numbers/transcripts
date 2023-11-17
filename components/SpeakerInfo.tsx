'use client'

import React from 'react';

import { getDatabase, ref, onValue } from "firebase/database"
import { initializeApp } from "firebase/app"
import { useEffect, useState } from 'react'
import { Color } from "chroma-js"
import distinctColors from 'distinct-colors'
import CreatableSelect from 'react-select/creatable'

type SpeakerInfoData = {
  [key: string]: {name: string, tags: Set<string>, color: string};
};

type SpeakerInfoParams = {
  speakerKeys : Set<string>;
  videoId : string;
  speakerInfo: SpeakerInfoData;
  setSpeakerInfo: any;
};

type OptionType = {
  value: string;
  label: string;
};

const palette = distinctColors({ count: 45, lightMin: 70, chromaMax: 200 });

const firebaseConfig = {
  databaseURL: "https://sps-by-the-numbers-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);

export function getSpeakerAttributes(speaker : string, speakerInfo : SpeakerInfoData ) {
  const data = speakerInfo ? speakerInfo[speaker] : undefined;
  const name = data?.name || speaker;
  const tags = data?.tags || new Set<string>;

  const speakerNum = Number(speaker.split('_')[1]);
  const color = palette[speakerNum];

  return { name, color, tags };
}

// speakerInfo has the name, tags, etc.
// speakerKeys is a list of speaker keys like SPEAKER_00
export default function SpeakerInfo({speakerKeys, videoId, speakerInfo, setSpeakerInfo} : SpeakerInfoParams) {
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set<string>);
  const [existingTags, setExistingTags] = useState<Set<string>>(new Set<string>);

  function handleNameChange(curSpeaker : string, selectedOption : OptionType) {
    const newSpeakerInfo = {...speakerInfo};
    const newName = selectedOption?.value;
    if (newName) {
      newSpeakerInfo[curSpeaker].name = newName;
      setSpeakerInfo(newSpeakerInfo);
      if (!existingNames.has(newName)) {
        const newExistingNames = new Set(existingNames);
        newExistingNames.add(newName);
        setExistingNames(newExistingNames);
      }
    }
  }

  function handleTagsChange(curSpeaker, newTagOptions) {
    const newSpeakerInfo = {...speakerInfo};
    const newExistingTags = new Set<string>(existingTags);
    for (const option of newTagOptions) {
      newSpeakerInfo[curSpeaker].tags.add(option.value);
      newExistingTags.add(option.value);
    }
    setSpeakerInfo(newSpeakerInfo);

    if (existingTags.size !== newExistingTags.size) {
      setExistingTags(newExistingTags);
    }
  }

  async function handleOnClick(event) {
  }

  // Load from the database.
  useEffect(() => {
    let ignore = false;
    const database = getDatabase(app);
    const path = `transcripts/v/${videoId}`;
    const videoRef = ref(database, `transcripts/v/${videoId}`);
    const existingRef = ref(database, `exisiting`);

    onValue(videoRef, (snapshot) => {
      const data = snapshot.val();
      if (!ignore && data) {
        const newSpeakerInfo = {};
        for (const [k,v] of data.speakerKeys) {
          newSpeakerInfo[k] = {...v, tags: new Set(v.tags)};
        }
        setSpeakerInfo(newSpeakerInfo);
      }
    });

    onValue(existingRef, (snapshot) => {
      const data = snapshot.val();
      if (!ignore && data) {
        setExistingNames(new Set<string>(Object.keys(data.names)));
        setExistingTags(new Set<string>(Object.keys(data.tags)));
      }
    });

    return () => { ignore = true; };
  }, [videoId, setSpeakerInfo, setExistingNames, setExistingTags]);

  // Must be deleted once
  // https://github.com/JedWatson/react-select/issues/5459 is fixed.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Create all options.
  const allSpeakers : string[] = Array.from(speakerKeys).sort();
  const newExistingNames = new Set(existingNames);
  for (const s of allSpeakers) {
    const { name } = getSpeakerAttributes(s, speakerInfo);
    if (name !== s) {
      newExistingNames.add(name);
    }
  }
  if (newExistingNames.size !== existingNames.size) {
    setExistingNames(newExistingNames);
  }
  const nameOptions : OptionType[] =
      [...newExistingNames.keys()].sort().map(name => ({label: name, value: name}));
  const tagOptions : OptionType[] =
      [...existingTags.keys()].sort().map(tag => ({label: tag, value: tag}));

  // Create the speaker table.
  const speakerLabelInputs : React.ReactElement[] = [];
  if (isMounted) {
    for (const s of allSpeakers) {
      const { name, color, tags } = getSpeakerAttributes(s, speakerInfo);
      const curName = nameOptions.filter(v => v.label === name)?.[0];
      speakerLabelInputs.push(
        <li key={`li-${s}`} className="py-1 flex" style={{backgroundColor: color.name()}}>
          <div className="pl-2 pr-1 basis-1/2">
            <CreatableSelect
                id={`cs-name-${name}`}
                isClearable
                options={nameOptions}
                value={curName}
                placeholder={`Name for ${name}`}
                onChange={(newValue: OptionType) => handleNameChange(s, newValue)} />
          </div>
          <div className="pl-1 pr-2 basis-1/2">
            <CreatableSelect
                id={`cs-tag-${name}`}
                isClearable
                isMulti
                options={tagOptions}
                placeholder={`Tags for ${name}`}
                onChange={newValue => handleTagsChange(s, newValue)} />
          </div>
        </li>
      );
    }
  }

  return (
    <div style={{overflowY: "scroll", height: "40vh"}}>
      Speaker List
      <ul className="list-style-none">
        { speakerLabelInputs }
      </ul>
      <button
        className="px-4 py-2 m-2 bg-red-500 rounded"
        onClick={handleOnClick}>
          Submit Label Suggestion
      </button>
    </div>
  );
}
