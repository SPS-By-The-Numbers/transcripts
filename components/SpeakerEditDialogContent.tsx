'use client'

import ActionDialogConstants from 'components/ActionDialogConstants';
import ActionDialogContent from 'components/ActionDialogContent';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { getSpeakerAttributes } from 'utilities/client/speaker';
import { isEqual } from 'lodash-es';
import { useActionDialog } from 'components/ActionDialogProvider';
import { useAnnotations } from 'components/AnnotationsProvider'
import { useContext } from 'react';

import type { ExistingNames, TagSet, SpeakerInfoData } from 'utilities/client/speaker'

type SpeakerEditDialogContentProps = {
  speakerNum : int;
  onClose: (value: string) => void;
};

export default function SpeakerEditDialogContent(
    {speakerNum, onClose}: SpeakerEditDialogContentProps) {
  const annotationsContext = useAnnotations();
  const { setActionDialogMode } = useActionDialog();

  function handleNameChange(speakerNum : number, newValue) {
    const newSpeakerInfo = {...annotationsContext.speakerInfo};
    const info = newSpeakerInfo[speakerNum] = newSpeakerInfo[speakerNum] || {};
    const newName = typeof newValue === 'string' ? newValue : newValue?.label;

    if (newName && !annotationsContext.existingNames.hasOwnProperty(newName)) {
      const recentTags = info.tags ?? new Set<string>();
      const newExistingNames = {...annotationsContext.existingNames, [newName]: {recentTags} };
      // TODO: Extract all these isEquals() checks.
      if (!isEqual(annotationsContext.existingNames, newExistingNames)) {
        annotationsContext.setExistingNames(newExistingNames);
      }
    }

    if (newName !== info.name) {
      info.name = newName;
      // Autopopulate the recent tags if nothing else was there.
      if (!info.tags || info.tags.size === 0) {
        info.tags = new Set<string>(annotationsContext.existingNames[newName]?.recentTags);
      }
      annotationsContext.setSpeakerInfo(newSpeakerInfo);
    }
  }

  function handleTagsChange(speakerNum : number,
                            newTagOptions: Array<OptionType | string>) {
    const newSpeakerInfo = {...annotationsContext.speakerInfo};
    const newExistingTags = new Set<string>(annotationsContext.existingTags);

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
    annotationsContext.setSpeakerInfo(newSpeakerInfo);

    if (!isEqual(new Set<string>(annotationsContext.existingTags), newExistingTags)) {
      annotationsContext.setExistingTags(newExistingTags);
    }
  }

  // Create select options. Put them in sorted order.
  const nameOptions = new Array<OptionType>();
  for (const name of Object.keys(annotationsContext.existingNames).sort()) {
    nameOptions.push({label: name});
  }
  const tagOptions : OptionType[] = [];
  for (const tag of Array.from(annotationsContext.existingTags).sort()) {
    tagOptions.push({label: tag});
  }

  // Translate speaker numbers to names.
  const { name, tags } = getSpeakerAttributes(speakerNum,
                                              annotationsContext.speakerInfo);
  const curName = nameOptions.filter(v => v.label === name)?.[0] ?? null;
  const curTags = tagOptions.filter(v => tags.has(v.label));

  return (
    <ActionDialogContent title={`Edit Speaker ${speakerNum}`} onClose={onClose}>
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
          <Button
              variant="contained"
              onClick={() => setActionDialogMode({mode: ActionDialogConstants.uploadChangesMode})}>
            Publish Changes
          </Button>
        </Stack>
      </Stack>
    </ActionDialogContent>
  );
}
