'use client'

import { forwardRef, MutableRefObject, useRef } from 'react';
import YouTube from 'react-youtube'
import { Options } from 'youtube-player/dist/types';

type VideoPlayerParams = {
  videoId: string;
};

const ytplayerStyle = {
    aspectRatio: '16 / 9',
    width: '100%',
    height: 'auto',
};

const youtubeOpts : Options = {
    height: '390',
    width: '640',
    playerVars: {
        playsinline: 1
    }
};

function toSec(hhmmss: string): number {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + (Number(parts[1]) * 60) + (Number(parts[0]) * 60 * 60);
}

export interface VideoPlayerControl {
  jumpToTime(hhmmss: string): void;
}

export default forwardRef(function VideoPlayer({ videoId } : VideoPlayerParams, ref: MutableRefObject<VideoPlayerControl>) {
  const ytElement = useRef<any>(null);

  function jumpToTimeInternal(timeSec: number) {
    if (ytElement.current) {
      ytElement.current.seekTo(timeSec, true);
      ytElement.current.playVideo();
    }
  }

  ref.current = {
    jumpToTime: (hhmmss: string) => {
      jumpToTimeInternal(toSec(hhmmss));
    }
  };

  function handleReady(event) {
    if (event.target) {
      ytElement.current = event.target;
      if (window.location.hash) {
        const selString = `span[id="${window.location.hash.substr(1)}"]`;
        const el = document.querySelector(selString) as HTMLSpanElement;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          jumpToTimeInternal(toSec(el.id));
        }
      }
    }
  }

  return (
    <YouTube style={ytplayerStyle} videoId={videoId} opts={youtubeOpts} onReady={handleReady} />
  );
});
