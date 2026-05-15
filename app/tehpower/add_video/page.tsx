'use client'

import * as Constants from 'config/constants';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { firebaseApp } from 'utilities/client/firebase'
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"
import { useState, useEffect } from 'react'

type SubmitStatus = {
  has_submitted: boolean;
  last_status: number;
  in_progress: boolean;
};

const CATEGORIES = ['sps-board', 'seattle-city-council'];

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
let appCheck : any = null;

function makeSubmitStatusSuffix(submitStatus: SubmitStatus): String {
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

export default function AddVideo() {
  const [videoId, setVideoId] = useState<string>("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(
      { has_submitted: false, in_progress: false, last_status: 0 });
  const [userId, setUserId] = useState<string>("");
  const [authCode, setAuthCode] = useState<string>("");
  const [rescrapeStatus, setRescrapeStatus] = useState<SubmitStatus>(
      { has_submitted: false, in_progress: false, last_status: 0 });
  const [authState, setAuthState] = useState<object>({});
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleSignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      setAuthState({user, credential});
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(error);
      const email = error.customData?.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Signin failed", errorCode, errorMessage, email, credential);
    }
  };

  const handleSubmit = async (e) => {
    setSubmitStatus({has_submitted: true, in_progress: true, last_status: 0});
    fetch('https://video-queue-rdcihhc4la-uw.a.run.app',
      {
        method: "PUT",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auth: auth.currentUser ? await auth.currentUser.getIdToken(true) : "SpsSoSekure",
          category,
          video_id: videoId,
        })
      }).then(response => setSubmitStatus({has_submitted: true, in_progress: false, last_status: response.status}));
  };

  const handleRescrape = async (e) => {
    setRescrapeStatus({has_submitted: true, in_progress: true, last_status: 0});
    fetch(Constants.ENDPOINTS.metadata,
      {
        method: "PUT",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          auth_code: authCode,
          category,
          video_id: videoId,
        })
      }).then(response => setRescrapeStatus({has_submitted: true, in_progress: false, last_status: response.status}));
  };

  if (isMounted) {
    if (!appCheck) {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(Constants.RECAPTCHA_KEY),
        isTokenAutoRefreshEnabled: true
      });
    }
  }

  const submitButton = auth.currentUser ? (
    <Button
      key="submit-button"
      variant="contained"
      color="error"
      onClick={handleSubmit}>
        Submit as {auth.currentUser.email}{makeSubmitStatusSuffix(submitStatus)}
    </Button>
  ) : (
    <Button
      key="signin-button"
      variant="contained"
      color="error"
      onClick={handleSignin}>
        Login To Submit
    </Button>
  );

  return (
    <main>
      <Paper sx={{maxWidth: "60ch", mx: "auto", my: "1rem", px: "1.5rem", py: "1rem"}}>
        <Stack spacing={3}>
          <Stack spacing={2}>
            <Typography variant="h5" component="h1">
              Add Video
            </Typography>
            <TextField
              label="Video Id to Transcribe"
              name="videoId"
              placeholder="abcd123"
              value={videoId}
              onChange={e => setVideoId(e.target.value)}
              fullWidth />
            <TextField
              label="Category of video"
              name="category"
              select
              value={category}
              onChange={e => setCategory(e.target.value)}
              fullWidth>
              {CATEGORIES.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <div>{submitButton}</div>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5" component="h2">
              Rescrape Title
            </Typography>
            <TextField
              label="user_id"
              name="userId"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              fullWidth />
            <TextField
              label="auth_code"
              name="authCode"
              type="password"
              value={authCode}
              onChange={e => setAuthCode(e.target.value)}
              fullWidth />
            <div>
              <Button
                key="rescrape-button"
                variant="contained"
                color="primary"
                onClick={handleRescrape}>
                  Rescrape title for {videoId || "<video id>"}{makeSubmitStatusSuffix(rescrapeStatus)}
              </Button>
            </div>
          </Stack>
        </Stack>
      </Paper>
    </main>
  );
}
