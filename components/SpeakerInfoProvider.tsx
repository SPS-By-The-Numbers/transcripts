'use client'
 
import { createContext, useContext, useState, useMemo } from 'react'

import type { SpeakerInfoData } from 'utilities/client/speaker'

type TimestampCallback = (ts: string) => void;

type SpeakerInfoContextType = {
  speakerInfo: SpeakerInfoData;
  setSpeakerInfo:(s: SpeakerInfoData) => void;
};

type SpeakerInfoContextParams = {
  children: React.ReactNode;
  initialSpeakerInfo: SpeakerInfoData;
};

// Pattern from https://stackoverflow.com/a/74174425
export const SpeakerInfoContext = createContext<SpeakerInfoContextType>(
    { speakerInfo: {},
      setSpeakerInfo: () => {},
    }
);

export default function SpeakerInfoContextProvider({children, initialSpeakerInfo}: SpeakerInfoContextParams) {
  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfoData>(initialSpeakerInfo)

  const value = useMemo(() => ({
      speakerInfo,
      setSpeakerInfo,
    }),
    [speakerInfo]
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
