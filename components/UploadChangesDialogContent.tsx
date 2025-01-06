'use client'

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useAuth } from 'components/AuthProvider'

export const dialogMode = 'upload_changes';

export function makeDialogContents() {
  const dialogTitle = 'Upload Changes';
  const dialogContents = (
    <LoginDialogContent />
  );
  return {dialogContents, dialogTitle};
}

/*
async publish(category: CategoryId, videoId: VideoId,
              onSubmit: (object) => void,
                onDone: (object) => void) {
  const data = {
    auth: auth.currentUser ? await auth.currentUser.getIdToken(true) : "SpsSoSekure",
    category,
    videoId,
    speakerInfo: Object.fromEntries(
        Object.entries(this.speakerInfo).map(
          ([k,v], i) => [
            k,
            { name: v.name, tags: (v.tags ? Array.from(v.tags) : []) }
          ]))
  };

  onSubmit(data);
  if (data.status === 200) {
    this.setLastPublishedState({...this.lastPublishedState, speakerInfo: this.speakerInfo});
  }

  onDone(await fetchEndpoint('speakerinfo', 'POST', data));
}
*/

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
