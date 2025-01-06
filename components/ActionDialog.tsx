'use client'

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useActionDialog } from 'components/ActionDialogProvider';
import { makeDialogContents as makeUploadChangesContents,
         dialogMode as uploadChangesMode } from 'components/UploadChangesDialogContent';
import { makeDialogContents as makeSpeakerEditContents,
         dialogMode as speakerMode } from 'components/SpeakerEditDialogContent';

function doNothing() {}

function makeContents(dialogControl) {
  if (dialogControl?.mode === speakerMode) {
    const speakerNum = dialogControl.params.speakerNum;
    let {dialogTitle,  dialogContents} = makeSpeakerEditContents(speakerNum);
    dialogContents = (<DialogContent key="contents">{dialogContents}</DialogContent>)
    return ({
      chainedHandleClose: doNothing,
      dialogContents,
      dialogTitle
    });
  } else if (dialogControl?.mode === uploadChangesMode ) {
    let {dialogTitle,  dialogContents} = makeUploadChangesContents();
    dialogContents = (<DialogContent key="contents">{dialogContents}</DialogContent>)
    return ({
      chainedHandleClose: doNothing,
      dialogContents,
      dialogTitle
    });
  }

  return {chainedHandleClose: doNothing, dialogContents: (<></>), dialogTitle: ""};
}

export default function ActionDialog() {
  const {actionDialogMode, setActionDialogMode} = useActionDialog();

  const {dialogContents, dialogTitle, chainedHandleClose} = makeContents(actionDialogMode);

  const handleClose = (value: string) => {
    chainedHandleClose();
    setActionDialogMode(undefined); // Dismisses Dialog.
  };

  return (
    <Dialog onClose={handleClose} open={actionDialogMode !== undefined}>
      <DialogTitle key='title'>
        <Stack direction="row" sx={{justifyContent:"space-between", alignItems:"center"}}>
          {dialogTitle}
          <IconButton onClick={handleClose}>
            <CloseIcon size="inherit"/>
          </IconButton>
        </Stack>
      </DialogTitle>
      {dialogContents}
    </Dialog>
  );
}
