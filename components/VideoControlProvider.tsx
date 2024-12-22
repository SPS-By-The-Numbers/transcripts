'use client'
 
import { createContext, useState, useMemo } from 'react';

type VideoPlayerControl = {
  jumpToTime: (hhmmss: string) => void;
};

type VideoControlContextType = {
  videoControl : VideoPlayerControl;
  setVideoControl: (vc: VideoPlayerControl) => void;
};

type VideoControlProviderParams = {
  children: React.ReactNode;
};

const emptyVideoControl = {
  jumpToTime: (ts: string) => {},
};

// Pattern from https://stackoverflow.com/a/74174425
export const VideoControlContext = createContext<VideoControlContextType>({
  videoControl: emptyVideoControl,
  setVideoControl: () => {},
});
 
export default function VideoControlContextProvider({children}: VideoControlProviderParams) {
  const [videoControl, setVideoControl] = useState<VideoPlayerControl>(emptyVideoControl);

  const value = useMemo(() => ({ videoControl, setVideoControl }), [videoControl]);
 
  return (
    <VideoControlContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </VideoControlContext.Provider>
  )
}
