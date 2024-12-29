'use client'

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ActionDialogControlContext } from 'components/ActionDialogControlProvider';
import { SpeakerInfoContext } from 'components/SpeakerInfoProvider'
import { getSpeakerAttributes, toSpeakerKey } from 'utilities/client/speaker'
import { isEqual } from 'lodash-es'
import { useContext } from 'react';

import type { ExistingNames, TagSet, SpeakerInfoData } from 'utilities/client/speaker'

function doNothing() {}

type SpeakerNameSelectProps = {
  speakerNum : int;
};

function SpeakerNameSelect({speakerNum}: SpeakerNameSelectProps) {
  const {speakerInfo, setSpeakerInfo,
    existingNames, setExistingNames,
    existingTags, setExistingTags} = useContext(SpeakerInfoContext);

  function handleNameChange(speakerNum : number, newValue) {
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
        info.tags = new Set<string>(existingNames[newName]?.recentTags);
      }
      setSpeakerInfo(newSpeakerInfo);
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

  const nameOptions = new Array<OptionType>();
  for (const name of Object.keys(existingNames).sort()) {
    nameOptions.push({label: name});
  }
  const tagOptions : OptionType[] = [];
  for (const tag of Array.from(existingTags).sort()) {
    tagOptions.push({label: tag});
  }

  const { name, tags } = getSpeakerAttributes(speakerNum, speakerInfo);
  const curName = nameOptions.filter(v => v.label === name)?.[0] ?? null;
  const curTags = tagOptions.filter(v => tags.has(v.label));

  return (
    <Stack spacing={2} sx={{marginY: "1ex"}}>
      <Autocomplete
        id={`cs-name-${name}`}
        autoComplete
        blurOnSelect
        freeSolo
        sx={{
          minWidth: "40ch",
          "& .MuiOutlinedInput-root": {
            padding: 0,
        }
        }}
        options={nameOptions}
        value={curName}
        renderInput={(params) => (
          <TextField
            label="Name"
            variant="standard"
            {...params}
            placeholder={`Name for ${name}`} />)}
        onChange={(event, newValue) =>
          handleNameChange(speakerNum, newValue)} />

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
              label="Tags"
              variant="standard"
              {...params}
              placeholder={`Tags for ${name}`} />)}
          onChange={(event, newValue) =>
              handleTagsChange(speakerNum, newValue)} />
      <Stack direction="row" spacing={1} sx={{paddingTop: "2ex", justifyContent: "right"}}>
        <Button variant="contained">
          Login to Upload
        </Button>
      </Stack>
    </Stack>
  );
}

function makeContents(dialogControl) {
  let chainedHandleClose = doNothing;
  let dialogContents = [];
  let dialogTitle = ""
  if (dialogControl?.mode === "speaker") {
    const speakerNum = dialogControl.params.speakerNum;
    dialogTitle = `Edit Speaker ${speakerNum}`;
    dialogContents.push(
      <DialogContent key="content">
        <SpeakerNameSelect speakerNum={speakerNum} />
      </DialogContent>
    );
  }
  return {chainedHandleClose, dialogContents, dialogTitle};
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
