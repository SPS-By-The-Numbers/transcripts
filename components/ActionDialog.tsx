'use client'

import Dialog from '@mui/material/Dialog';
import SpeakerEditDialogContent from 'components/SpeakerEditDialogContent';
import UploadChangesDialogContent from 'components/UploadChangesDialogContent';
import { assertNever } from "assert-never";
import { useActionDialog } from 'components/providers/ActionDialogProvider';

import type { ActionDialogMode } from 'components/providers/ActionDialogProvider';

function makeContents(actionDialogMode : ActionDialogMode | undefined,
                      handleClose : (s: string) => void) {
  if (actionDialogMode === undefined) {
    return (<></>);
  }

  switch(actionDialogMode.mode) {
    case "speaker":
      return (
        <SpeakerEditDialogContent
          speakerNum={actionDialogMode.speakerNum}
          onClose={handleClose}/>
    );

    case "upload_changes":
      return (<UploadChangesDialogContent onClose={handleClose}/>);

    default:
      return assertNever(actionDialogMode);
  }
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
