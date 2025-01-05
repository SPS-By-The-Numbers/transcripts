'use client'
 
import { isEqual, cloneDeep } from 'lodash-es'

import { createContext, useContext, useState, useMemo } from 'react'

import type { ExistingNames, TagSet, SpeakerInfoData } from 'utilities/client/speaker'

type LastPublishedState = {
  speakerInfo: SpeakerInfoData;
};

type AnnotationsContextParams = {
  children: React.ReactNode;
  initialSpeakerInfo: SpeakerInfoData;
  initialExistingNames: ExistingNames;
  initialExistingTags: TagSet;
};

class AnnotationsContextState {
  readonly speakerInfo: SpeakerInfoData;
  readonly setSpeakerInfo:(x: SpeakerInfoData) => void;

  readonly existingNames: ExistingNames;
  readonly setExistingNames: (x: ExistingNames) => void;

  readonly existingTags: TagSet;
  readonly setExistingTags: (x: TagSet) => void;

  readonly publishedState: LastPublishedState;
  readonly setLastPublishedState: (x: LastPublishedState) => void;

  constructor(
      speakerInfo: SpeakerInfoData,
      setSpeakerInfo:(x: SpeakerInfoData) => void,

      existingNames: ExistingNames,
      setExistingNames: (x: ExistingNames) => void,

      existingTags: TagSet,
      setExistingTags: (x: TagSet) => void,

      lastPublishedState: LastPublishedState,
      setLastPublishedState: (x: LastPublishedState) => void) {
    this.speakerInfo = speakerInfo;
    this.setSpeakerInfo = setSpeakerInfo;

    this.existingNames = existingNames;
    this.setExistingNames = setExistingNames;

    this.existingTags = existingTags;
    this.setExistingTags = setExistingTags;

    this.lastPublishedState = lastPublishedState;
    this.setLastPublishedState = setLastPublishedState;
  }

  needsPublish() : bool {
    console.log(this.lastPublishedState.speakerInfo)
    console.log(this.speakerInfo)
    return !isEqual(this.lastPublishedState.speakerInfo, this.speakerInfo);
  }
}

// Pattern from https://stackoverflow.com/a/74174425
const AnnotationsContext =
  createContext<AnnotationsContextState | undefined>(undefined);

// Pattern from https://kentcdodds.com/blog/how-to-use-react-context-effectively
export function useAnnotations() {
  const context = useContext(AnnotationsContext);
  if (context === undefined) {
    throw new Error('Missing <AnnotationsProvider>')
  }

  return context;
}

export default function AnnotationsProvider({
  children, initialSpeakerInfo, initialExistingNames, initialExistingTags}: AnnotationsContextParams) {

  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfoData>(initialSpeakerInfo)
  const [existingNames, setExistingNames] = useState<ExistingNames>(initialExistingNames);
  const [existingTags, setExistingTags] = useState<TagSet>(initialExistingTags);

  const [lastPublishedState, setLastPublishedState] = useState<LastPublishedState>(
    {
      speakerInfo: cloneDeep(initialSpeakerInfo),
    }
  );

  const value = useMemo(() => (new AnnotationsContextState(
      speakerInfo,
      setSpeakerInfo,
      existingNames,
      setExistingNames,
      existingTags,
      setExistingTags,
      lastPublishedState,
      setLastPublishedState,
    )),
    [speakerInfo, existingNames, existingTags, lastPublishedState]
  );
 
  return (
    <AnnotationsContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </AnnotationsContext.Provider>
  )
}
