'use client'
 
import { createContext, useContext, useState, useMemo } from 'react'

import type { ExistingNames, TagSet, SpeakerInfoData } from 'utilities/client/speaker'

type SpeakerInfoContextParams = {
  children: React.ReactNode;
  initialSpeakerInfo: SpeakerInfoData;
  initialExistingNames: ExistingNames;
  initialExistingTags: TagSet;
};

type SpeakerInfoContextType = {
  speakerInfo: SpeakerInfoData;
  setSpeakerInfo:(x: SpeakerInfoData) => void;
  existingNames: ExistingNames;
  setExistingNames: (x: ExistingNames) => void;
  existingTags: TagSet;
  setExistingTags: (x: TagSet) => void;
};

// Pattern from https://stackoverflow.com/a/74174425
export const SpeakerInfoContext = createContext<SpeakerInfoContextType>(
    { speakerInfo: {},
      setSpeakerInfo: () => {},
    }
);

export default function SpeakerInfoContextProvider({
  children, initialSpeakerInfo, initialExistingNames, initialExistingTags}: SpeakerInfoContextParams) {

  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfoData>(initialSpeakerInfo)
  const [existingNames, setExistingNames] = useState<ExistingNames>(initialExistingNames);
  const [existingTags, setExistingTags] = useState<TagSet>(initialExistingTags);

  const value = useMemo(() => ({
      speakerInfo,
      setSpeakerInfo,
      existingNames,
      setExistingNames,
      existingTags,
      setExistingTags,
    }),
    [speakerInfo, existingNames, existingTags]
  );
 
  return (
    <SpeakerInfoContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </SpeakerInfoContext.Provider>
  )
}
