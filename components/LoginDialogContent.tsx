'use client'

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useAuth } from 'components/AuthProvider'

export function makeDialogContents() {
  const dialogTitle = 'Authenticate to Upload Changes';
  const dialogContents = (
    <LoginDialogContent />
  );
  return {dialogContents, dialogTitle};
}

export default function LoginDialogContent() {
  const authContext = useAuth();

  let text;
  console.log(authContext);
  if (authContext.user()) {
    text = `Logged in as ${authContext.user().email}`;
  } else {
    text = <Button onClick={()=>authContext.signIn()}>Sign In</Button>
  }

  return (
    <Stack spacing={2} sx={{marginY: "1ex"}}>
      {text}
    </Stack>
  );
}
