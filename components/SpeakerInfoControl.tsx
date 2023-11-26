'use client'

import React from 'react';

import CreatableSelect from 'react-select/creatable'
import { app } from 'utilities/firebase'
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { getSpeakerAttributes, toSpeakerKey, SpeakerInfoData } from 'utilities/speaker-info'
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { isEqual } from 'lodash-es'
import { toSpeakerNum } from "utilities/speaker-info"
import { useEffect, useState } from 'react'
import { useTranscriptContext } from 'components/TranscriptControlProvider'

const useMount = (fun) => useEffect(fun, []);

type DbInfoEntry ={
  name : string;
  tags : Array<string>;
};

type SpeakerInfoControlParams = {
  category : string;
  speakerNums : Set<number>;
  videoId : string;
  className: string;
  initialExistingNames : object,
  initialExistingTags : Set<string>,
};

type OptionType = {
  value : string;
  label : string;
};

// Initialize Firebase
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
let appCheck;

// speakerInfo has the name, tags, etc.
// number is a list of speaker keys like [0, 1, 2, .. ]
export default function SpeakerInfoControl({category, className, speakerNums, videoId, initialExistingNames, initialExistingTags} : SpeakerInfoControlParams) {
  const [existingNames, setExistingNames] = useState<object>(initialExistingNames);
  const [existingTags, setExistingTags] = useState<Set<string>>(initialExistingTags);
  const [authState, setAuthState] = useState<object>({});
  const {speakerInfo, setSpeakerInfo} = useTranscriptContext();

  function handleNameChange(speakerNum : number, selectedOption : OptionType) {
    const newSpeakerInfo = {...speakerInfo};
    const newName = selectedOption?.value;
    const info = newSpeakerInfo[speakerNum] = newSpeakerInfo[speakerNum] || {};
    if (newName && !existingNames.hasOwnProperty(newName)) {
      const newExistingNames = Object.assign({}, existingNames);
      const recentTags = info.tags ? Array.from(info.tags) : [];
      newExistingNames[newName] = { recentTags };
      // TODO: Extract all these isEquals() checks.
      if (!isEqual(existingNames, newExistingNames)) {
        setExistingNames(newExistingNames);
      }
    }

    console.log('names', newName, info.name);
    if (newName !== info.name) {
      info.name = newName;
      // Autopopulate the recent tags if nothing else was there.
      if (!info.tags || info.tags.size === 0) {
        info.tags = new Set<string>(newExistingNames[newName]?.recentTags);
      }
      setSpeakerInfo(newSpeakerInfo);
    }

  }

  async function handleSignin() {
    try {
      const result = await signInWithPopup(auth, provider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      // The signed-in user info.
      const user = result.user;
      setAuthState({user, credential});

      // IdP data available using getAdditionalUserInfo(result)
      // ...

    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Signin failed", errorCode, errorMessage, email, credential);
    }
  }

  function handleTagsChange(speakerNum : number, newTagOptions) {
    const newSpeakerInfo = {...speakerInfo};
    const newExistingTags = new Set<string>(existingTags);

    const info = newSpeakerInfo[speakerNum] = newSpeakerInfo[speakerNum] || {};
    const newTags = new Set<string>();
    for (const option of newTagOptions) {
      newTags.add(option.value);
      newExistingTags.add(option.value);
    }
    info.tags = newTags;
    setSpeakerInfo(newSpeakerInfo);

    if (!isEqual(existingTags, newExistingTags)) {
      setExistingTags(newExistingTags);
    }
  }

  async function handleSubmit(event) {
    const data = {
      auth: auth.currentUser ? await auth.currentUser.getIdToken(true) : "SpsSoSekure",
      category,
      videoId,
      speakerInfo: Object.fromEntries(
          Object.entries(speakerInfo).map(
            ([k,v], i) => [
              k,
              { name: v.name, tags: (v.tags ? Array.from(v.tags) : []) }
            ]))
    };

    fetch(
      'https://speakerinfo-rdcihhc4la-uw.a.run.app/sps-by-the-numbers/us-west1/speakerinfo',
      //'http://127.0.0.1:5001/sps-by-the-numbers/us-west1/speakerinfo',
      {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
  }

  // Must be deleted once
  // https://github.com/JedWatson/react-select/issues/5459 is fixed.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Create all options.
  const allSpeakers : number[] = Array.from(speakerNums).sort((a,b) => a-b);
  const newExistingNames = Object.assign({}, existingNames);
  for (const speakerNum of allSpeakers) {
    const { name, tags } = getSpeakerAttributes(speakerNum, speakerInfo);
    if (name !== toSpeakerKey(speakerNum)) {
      newExistingNames[name] = {recentTags: Array.from(tags)};
    }
  }
  if (!isEqual(newExistingNames, existingNames)) {
    setExistingNames(newExistingNames);
  }

  const nameOptions : OptionType[] = [];
  for (const name of Object.keys(newExistingNames).sort()) {
    nameOptions.push({label: name, value: name});
  }

  const tagOptions : OptionType[] = [];
  for (const tag of Array.from(existingTags.keys()).sort()) {
    tagOptions.push({label: tag, value: tag});
  }

  // Create the speaker table.
  const speakerLabelInputs : React.ReactElement[] = [];
  let submitButton : React.ReactElement = (<></>);
  if (isMounted) {
    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    if (!appCheck) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LfukwApAAAAAOysCMfJontBc36O2vly91NWpip8'),

        // Optional argument. If true, the SDK automatically refreshes App Check
        // tokens as needed.
        isTokenAutoRefreshEnabled: true
      });
    }

    for (const speakerNum of allSpeakers) {
      const { name, colorClass, tags } = getSpeakerAttributes(speakerNum, speakerInfo);
      const curName = nameOptions.filter(v => v.label === name)?.[0];
      const curTags = tagOptions.filter(v => tags.has(v.label));
      speakerLabelInputs.push(
        <li key={speakerNum} className={`py-1 flex ${colorClass}`}>
          <div className="pl-2 pr-1 basis-1/2">
            <CreatableSelect
                id={`cs-name-${name}`}
                isClearable
                options={nameOptions}
                value={curName}
                placeholder={`Name for ${name}`}
                onChange={(newValue: OptionType) => handleNameChange(speakerNum, newValue)} />
          </div>
          <div className="pl-1 pr-2 basis-1/2">
            <CreatableSelect
                id={`cs-tag-${name}`}
                isClearable
                isMulti
                value={curTags}
                options={tagOptions}
                placeholder={`Tags for ${name}`}
                onChange={newValue => handleTagsChange(speakerNum, newValue)} />
          </div>
        </li>
      );
    }

    if (auth.currentUser) {
      submitButton = (
        <button key="submit-button"
          className="px-4 py-2 m-2 bg-red-500 rounded"
          onClick={handleSubmit}>
            Submit Changes as {auth.currentUser.email}
        </button>
      );
    } else {
      submitButton = (
        <button key="signin-button"
          className="px-4 py-2 m-2 bg-red-500 rounded"
          onClick={handleSignin}>
            Login To Submit
        </button>
      );
    }
  } else {
    speakerLabelInputs.push(<div key="loading-div">Wait...Loading Speakers Labels</div>);
  }

  return (
    <div className={className}>
      Speaker List
      <ul className="list-style-none">
        { speakerLabelInputs }
      </ul>
      {submitButton}
    </div>
  );
}
