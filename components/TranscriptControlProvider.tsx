'use client'
 
import { SpeakerInfoData } from 'utilities/speaker-info'
import { YouTubePlayer } from 'react-youtube'
import { createContext, useContext, useState } from 'react'

export type TranscriptControlContext = {
  speakerInfo: SpeakerInfoData;
  setSpeakerInfo:(s: SpeakerInfoData) => void;
};

type TranscriptControlContextParams = {
  children: React.ReactNode;
  initialSpeakerInfo: SpeakerInfoData;
};

// Pattern from https://stackoverflow.com/a/74174425
const TranscriptControlContextInstance = createContext<TranscriptControlContext>(
    { speakerInfo: {},
      setSpeakerInfo: (s) => console.error("cannot setSpeakerInfo yet. Context uninitialized"),
    }
);

export function useTranscriptContext() {
  return useContext<TranscriptControlContext>(TranscriptControlContextInstance);
}
 
export default function TranscriptControlContext({children, initialSpeakerInfo}: TranscriptControlContextParams) {
  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfoData>(initialSpeakerInfo)
 
  return (
    <TranscriptControlContextInstance.Provider
        value={{
          speakerInfo,
          setSpeakerInfo}}>
      {children}
    </TranscriptControlContextInstance.Provider>
  )
}
