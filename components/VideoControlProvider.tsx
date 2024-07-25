'use client'
 
import { createContext, useContext, useState, useMemo } from 'react';

import type { VideoPlayerControl } from 'components/VideoPlayer';

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
export const VideoControlContext = createContext<VideoControlContextType>();
 
export default function VideoControlContextProvider({children}: VideoControlProviderParams) {
  const [videoControl, setVideoControl] = useState<VideoControlContextType>(emptyVideoControl);

  const value = useMemo(() => ({ videoControl, setVideoControl }), [videoControl]);
 
  return (
    <VideoControlContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [])}
    </VideoControlContext.Provider>
  )
}
