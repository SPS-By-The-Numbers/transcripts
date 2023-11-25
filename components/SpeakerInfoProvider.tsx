'use client'
 
import { createContext, useContext, useState } from 'react'
import { SpeakerInfoData } from 'utilities/speaker-info'

export type SpeakerInfoContext = {
  speakerInfo: SpeakerInfoData;
  setSpeakerInfo:(s: SpeakerInfoData) => void
};

type SpeakerInfoProviderParams = {
  children: React.ReactNode;
  initialSpeakerInfo: SpeakerInfoData;
};

// Pattern from https://stackoverflow.com/a/74174425
const SpeakerInfoContextInstance = createContext<SpeakerInfoContext>(
    { speakerInfo: {},
      setSpeakerInfo: (s) => console.error("cannot setSpeakerInfo yet. Context uninitialized")
    }
);

export function useSpeakerInfo() {
  return useContext<SpeakerInfoContext>(SpeakerInfoContextInstance);
}
 
export default function SpeakerInfoProvider({children, initialSpeakerInfo}: SpeakerInfoProviderParams) {
  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfoData>(initialSpeakerInfo)
 
  return (
    <SpeakerInfoContextInstance.Provider value={{speakerInfo, setSpeakerInfo}}>
      {children}
    </SpeakerInfoContextInstance.Provider>
  )
}
