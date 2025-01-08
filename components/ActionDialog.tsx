'use client'

import ActionDialogConstants from 'components/ActionDialogConstants';
import Dialog from '@mui/material/Dialog';
import SpeakerEditDialogContent from 'components/SpeakerEditDialogContent';
import UploadChangesDialogContent from 'components/UploadChangesDialogContent';
import { useActionDialog } from 'components/ActionDialogProvider';

function makeContents(actionDialogMode, handleClose) {
  if (actionDialogMode?.mode === ActionDialogConstants.speakerMode) {
     return (
       <SpeakerEditDialogContent
         speakerNum={actionDialogMode.params.speakerNum}
         onClose={handleClose}/>
     );
  } else if (actionDialogMode?.mode === ActionDialogConstants.uploadChangesMode) {
    return (<UploadChangesDialogContent onClose={handleClose}/>);
  }

  return (<></>);
}

export default function ActionDialog() {
  const {actionDialogMode, setActionDialogMode} = useActionDialog();

  const handleClose = (value: string) => {
    setActionDialogMode(undefined); // Dismisses Dialog.
  };

  return (
    <Dialog onClose={handleClose} open={actionDialogMode !== undefined}>
      {makeContents(actionDialogMode, handleClose)}
    </Dialog>
  );
}
