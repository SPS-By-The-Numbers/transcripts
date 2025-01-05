'use client'

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { ActionDialogControlContext } from 'components/ActionDialogControlProvider';
import { makeDialogContents as makeLoginContents } from 'components/LoginDialogContent';
import { makeDialogContents as makeSpeakerEditContents } from 'components/SpeakerEditDialogContent';
import { useContext } from 'react';

function doNothing() {}

function makeContents(dialogControl) {
  if (dialogControl?.mode === "speaker") {
    const speakerNum = dialogControl.params.speakerNum;
    let {dialogTitle,  dialogContents} = makeSpeakerEditContents(speakerNum);
    dialogContents = (<DialogContent key="contents">{dialogContents}</DialogContent>)
    return ({
      chainedHandleClose: doNothing,
      dialogContents,
      dialogTitle
    });
  } else if (dialogControl?.mode === "login") {
    let {dialogTitle,  dialogContents} = makeLoginContents();
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
  const {actionDialogControl, setActionDialogControl} = useContext(ActionDialogControlContext);
  const {dialogContents, dialogTitle, chainedHandleClose} = makeContents(actionDialogControl);

  const handleClose = (value: string) => {
    chainedHandleClose();
    setActionDialogControl(undefined); // Dismisses Dialog.
  };

  return (
    <Dialog onClose={handleClose} open={actionDialogControl !== undefined}>
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
