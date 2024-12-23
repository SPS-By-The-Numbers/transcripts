'use client'

import React from 'react';

import * as Constants from 'config/constants'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { SpeakerInfoContext } from 'components/SpeakerInfoProvider'
import { fetchEndpoint } from 'utilities/client/endpoint'
import { firebaseApp } from 'utilities/client/firebase'
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { getSpeakerAttributes, toSpeakerKey } from 'utilities/client/speaker'
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { isEqual } from 'lodash-es'
import { toSpeakerNum } from "utilities/client/speaker"
import { useEffect, useState, useContext } from 'react'

import type { ExistingNames, TagSet, SpeakerInfoData } from 'utilities/client/speaker'

type SpeakerInfoSubmitStatus = {
  has_submitted: boolean;
  last_status: number;
  in_progress: boolean;
};

type DbInfoEntry ={
  name : string;
  tags : Array<string>;
};

type SpeakerInfoControlParams = {
  category : string;
  speakerNums : Set<number>;
  videoId : string;
  initialExistingNames : ExistingNames,
  initialExistingTags : TagSet,
};

type OptionType = {
  label : string;
};

// Initialize Firebase
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
let appCheck;

function makeSubmitStatusSuffix(submitStatus: SpeakerInfoSubmitStatus): String {
  if (!submitStatus.has_submitted) {
    return '';
  }

  if (submitStatus.in_progress) {
    return ' - submitting';
  }

  if (submitStatus.last_status == 200) {
    return ' - success!';
  }

  return ` - failed: ${submitStatus.last_status}`;
}

// speakerInfo has the name, tags, etc.
// number is a list of speaker keys like [0, 1, 2, .. ]
export default function SpeakerInfoControl({
    category,
    speakerNums,
    videoId,
    initialExistingNames,
    initialExistingTags } : SpeakerInfoControlParams) {
  const [existingNames, setExistingNames] = useState<ExistingNames>(initialExistingNames);
  const [existingTags, setExistingTags] = useState<TagSet>(initialExistingTags);
  const [authState, setAuthState] = useState<object>({});
  const {speakerInfo, setSpeakerInfo} = useContext(SpeakerInfoContext);
  const [submitStatus, setSubmitStatus] = useState<SpeakerInfoSubmitStatus>(
      { has_submitted: false, in_progress: false, last_status: 0 });

  function handleNameChange(speakerNum : number, newValue, reason) {
    const newSpeakerInfo = {...speakerInfo};
    const info = newSpeakerInfo[speakerNum] = newSpeakerInfo[speakerNum] || {};
    const newName = typeof newValue === 'string' ? newValue : newValue?.label;

    if (newName && !existingNames.hasOwnProperty(newName)) {
      const recentTags = info.tags ?? new Set<string>;
      const newExistingNames = {...existingNames, [newName]: {recentTags} };
      // TODO: Extract all these isEquals() checks.
      if (!isEqual(existingNames, newExistingNames)) {
        setExistingNames(newExistingNames);
      }
    }

    if (newName !== info.name) {
      info.name = newName;
      // Autopopulate the recent tags if nothing else was there.
      if (!info.tags || info.tags.size === 0) {
        info.tags = new Set<string>(newExistingNames[newName]?.recentTags);
      }
      console.log("setting speaker:", info);
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
      const email = error.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Signin failed", errorCode, errorMessage, email, credential);
    }
  }

  function handleTagsChange(speakerNum : number, newTagOptions: Array<OptionType | string>) {
    const newSpeakerInfo = {...speakerInfo};
    const newExistingTags = new Set<string>(existingTags);

    const newTags = new Set<string>();
    for (const option of newTagOptions) {
      if (typeof option === 'string') {
        newTags.add(option);
        newExistingTags.add(option);
      } else {
        newTags.add(option.label);
        newExistingTags.add(option.label);
      }
    }
    const info = newSpeakerInfo[speakerNum] = newSpeakerInfo[speakerNum] || {};
    info.tags = newTags;
    setSpeakerInfo(newSpeakerInfo);

    if (!isEqual(new Set<string>(existingTags), newExistingTags)) {
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

    setSubmitStatus({...submitStatus, has_submitted: true, in_progress: true});

    const response = await fetchEndpoint('speakerinfo', 'POST', data);

    setSubmitStatus({has_submitted: true, in_progress: false, last_status: response.status});
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
    nameOptions.push({label: name});
  }

  const tagOptions : OptionType[] = [];
  for (const tag of Array.from(existingTags).sort()) {
    tagOptions.push({label: tag});
  }

  // Create the speaker table.
  const speakerLabelInputs : React.ReactElement[] = [];
  let submitButton : React.ReactElement = (<></>);
  if (isMounted) {
    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    if (Constants.isProduction && !appCheck) {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(Constants.RECAPTCHA_KEY),

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
        <TableRow
            key={speakerNum}
            className={colorClass}
            sx={{
                py: 1,
                '&:last-child td, &:last-child th': { border: 0 }
            }}
        >
          <TableCell>
            {speakerNum}
          </TableCell>
          <TableCell>
            <Autocomplete
                id={`cs-name-${name}`}
                autoComplete
                blurOnSelect
                freeSolo
                sx={{
                  "& .MuiOutlinedInput-root": {
                    padding: 0,
                  }
                }}
                options={nameOptions}
                value={curName}
                renderInput={(params) => (
                  <TextField
                      {...params}
                      sx={{input: {textAlign: "left", margin: "dense"}}}
                      placeholder={`Name for ${name}`} />)}
                onChange={(event, newValue, reason) =>
                    handleNameChange(speakerNum, newValue, reason)} />
          </TableCell>
          <TableCell>
            <Autocomplete
                id={`cs-tag-${name}`}
                multiple
                autoComplete
                freeSolo
                sx={{
                  "& .MuiOutlinedInput-root": {
                    padding: 0,
                  }
                }}
                options={tagOptions}
                value={curTags}
                renderInput={(params) => (
                  <TextField
                      {...params}
                      sx={{input: {textAlign: "left", margin: "dense"}}}
                      placeholder={`Tags for ${name}`} />)}
                onChange={(event, newValue, reason) =>
                    handleTagsChange(speakerNum, newValue)} />
          </TableCell>
        </TableRow>
      );
    }

    if (auth.currentUser) {
      submitButton = (
        <Button key="submit-button"
          variant="contained"
          size="small"
          onClick={handleSubmit}>
            Submit Changes as {auth.currentUser.email}{makeSubmitStatusSuffix(submitStatus)}
        </Button>
      );
    } else {
      submitButton = (
        <Button key="signin-button"
          variant="contained"
          size="small"
          onClick={handleSignin}>
            Login To Submit
        </Button>
      );
    }
  }

  return (
    <TableContainer component={Paper} style={{height: '100%'}}>
      <Stack direction="row" px={1} sx={{
            py: "5px",
            backgroundColor:"primary.analogous"
          }}
      >
        <Typography variant="h6" sx={{flexGrow:1}}>Speaker List</Typography>
        <div>
        {submitButton}
        </div>
      </Stack>
      <Table size="small" aria-label="Speaker names"
        sx={{ overscrollY:"scroll" }}
      >
        <TableHead>
          <TableRow sx={{bgcolor: 'primary.info'}}>
            <TableCell style={{width: "5%", maxWidth: "5%"}} size="small">#</TableCell>
            <TableCell style={{width: "65%", maxWidth: "65%"}} size="small">Name</TableCell>
            <TableCell style={{width: "30%", maxWidth: "30%"}} size="small">Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { speakerLabelInputs }
        </TableBody>
      </Table>
    </TableContainer>
  );
}
