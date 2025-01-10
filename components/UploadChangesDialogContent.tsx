'use client'

import ActionDialogContent from 'components/ActionDialogContent';
import Alert from '@mui/material/Alert';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import LogoutIcon from '@mui/icons-material/Logout';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { fetchEndpoint } from 'utilities/client/endpoint'
import { useAnnotations } from 'components/providers/AnnotationsProvider'
import { useAuth } from 'components/providers/AuthProvider'
import { useState } from 'react'

type UploadChangesDialogContentProps = {
  onClose: (value: string) => void;
};

type ErrorMessage = {
  message: string;
  severity?: 'error' | 'info' | 'success' | 'warning';
};

const noError = { message: '', severity: undefined };

function SignedOutContent({authContext}) {
  return (
    <Stack spacing={2} sx={{marginY: "1ex"}}>
      <Paper
          elevation={0}
          sx={{
            backgroundColor: "primary.info",
            padding: "0ex 2ex 0ex 2ex"
          }}>
        <p>
          In order to upload changes to speaker labels
          for others to see, you must authenticate with a Google
          Account so we can associate the change with an email address.
          This is to prevent abuse.
        </p>
        <p>
          Any Google account will work.
        </p>
      </Paper>
      <Tooltip title="Sign in to upload changes">
        <Button variant="contained" onClick={()=>authContext.signIn()}>
          Sign In With Google
        </Button>
      </Tooltip>
    </Stack>
  );
}  

function SignedInContent({authContext}) {
  const annotationsContext = useAnnotations();
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(noError);

  async function publishChanges() {
    const data = {
      auth: authContext.user() ? await authContext.user().getIdToken(true) : "SpsSoSekure",
      category: annotationsContext.category,
      videoId: annotationsContext.videoId,
      speakerInfo: Object.fromEntries(
          Object.entries(annotationsContext.speakerInfo).map(
            ([k,v], i) => [
              k,
              { name: v.name, tags: (v.tags ? Array.from(v.tags) : []) }
            ]))
    };

    let response;
    try {
      setIsPublishing(true);
      response = await fetchEndpoint('speakerinfo', 'POST', data);
    } finally {
      if (!response) {
        setErrorMessage({
          message: 'unknown exception',
          severity: 'error',
        });
      } else {
        if (response.ok) {
          annotationsContext.setLastPublishedState(
            {...annotationsContext.lastPublishedState,
              speakerInfo: annotationsContext.speakerInfo});
          setErrorMessage({
            message: 'Update Published',
            severity: 'success',
          });
        } else {
          setErrorMessage({
            message: `Server Error: ${response.message}`,
            severity: 'error',
          });
        }
      }
      setIsPublishing(false);
    }
  }

  return (
    <Stack spacing={2} sx={{marginY: "1ex"}}>
      <Alert
          sx={{ display: errorMessage.message !== '' ? 'flex': 'none' }}
          severity={errorMessage.severity}
          onClose={()=>setErrorMessage(noError)}>
        {errorMessage.message}
      </Alert>
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={isPublishing}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Alert severity="info" sx={{alignItems: "center"}}>
        <Box>
          Signed in: {authContext.user().email}
          <Tooltip title="Signout">
            <IconButton
              size="small"
              color="secondary"
              sx={{paddingLeft: "1ex"}}
              onClick={()=>authContext.signOut()}>
              <LogoutIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Alert>

      <Paper
          elevation={0}
          sx={{
            padding: "0ex 2ex 0ex 2ex"
          }}>
        <p>
          This will publish changes to speaker info for others to see. Uploads will record your email for abuse prevention.
        </p>
      </Paper>

      <Tooltip title="Publish changes">
        <span>
          <Button
              variant="contained"
              disabled={!annotationsContext.needsPublish()}
              onClick={publishChanges}
              sx={{width: "100%"}}>
            Publish
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

function SignedInOrOutContent() {
  const authContext = useAuth();

  if (authContext.user()) {
    return (<SignedInContent authContext={authContext} />);
  } else {
    return (<SignedOutContent authContext={authContext} />);
  }
}

export default function UploadChangesDialogContent({onClose}: UploadChangesDialogContentProps) {
  return (
    <ActionDialogContent title='Upload Changes' onClose={onClose}>
      <SignedInOrOutContent />
    </ActionDialogContent>
  );
}
