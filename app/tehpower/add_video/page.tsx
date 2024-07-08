'use client'

import * as Constants from 'config/constants';
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
  const [authState, setAuthState] = useState<object>({});
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
   
  const handleSignin = async () => {
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
      console.error(error);

      // The email of the user's account used.
      const email = error.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Signin failed", errorCode, errorMessage, email, credential);
    }
  };

  const handleSubmit = async (e) => {
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

  if (isMounted) {
    if (!appCheck) {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(Constants.RECAPTCHA_KEY),

        // Optional argument. If true, the SDK automatically refreshes App Check
        // tokens as needed.
        isTokenAutoRefreshEnabled: true
      });
    }
  }

  let submitButton : React.ReactElement = (<></>);
  if (auth.currentUser) {
    submitButton = (
      <button key="submit-button"
        className="px-4 py-2 m-2 bg-red-500 rounded"
        onClick={handleSubmit}>
          Submit as {auth.currentUser.email}{makeSubmitStatusSuffix(submitStatus)}
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

  return (
      <div>
        <div>
          <div>
          <label className="m-2 px-2 py-2">Video Id to Transcribe<br />
          <input className="m-2 px-2 py-2 border-solid border-2" placeholder="abcd123" name="videoId" type="text" value={videoId} onChange={e => setVideoId(e.target.value)} />
          </label>
          </div>
          <div>
          <label className="m-2 px-2 py-2">Category of video<br />
          <select className="m-2 px-2 py-2" value={category} name="category" onChange={e => setCategory(e.target.value)}>
           {
             CATEGORIES.map(c => (
             <option className="m-2 px-2 py-2" key={c} value={c}>{c}</option>))
           }
          </select>
          </label>
          </div>
        </div>
        {submitButton}
      </div>
      );
}
