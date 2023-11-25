'use client'

import YouTube, { YouTubePlayer } from 'react-youtube'
import { Options } from 'youtube-player/dist/types';
import { useState } from 'react'

type VideoPlayerParams = {
  category: string;
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

function toSec(hhmmss) {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + Number((parts[1]) * 60) + Number((parts[0] * 60 * 60));
}

export default function VideoPlayer({category, videoId} : VideoPlayerParams) {
  const [ytComponent, setYtComponent] = useState<YouTubePlayer>();

  function jumpToTime(event) {
    const fragment = (new URL(event.target.href)).hash.split('#')[1];
    history.pushState(null, '', event.target.href);
    jumpToTimeInternal(toSec(fragment));
  }

  function jumpToTimeInternal(timeSec) {
    if (ytComponent) {
      ytComponent.seekTo(timeSec, true);
      ytComponent.playVideo();
    }
  }

  function handleReady(event) {
    setYtComponent(event.target);
    if (window.location.hash) {
      const selString = `a[name="${window.location.hash.substr(1)}"]`;
      const el = document.querySelector(selString) as HTMLAnchorElement;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        jumpToTimeInternal(toSec(el.href.split('#')[1]));
      }
    }
  }

  return (
    <YouTube style={ytplayerStyle} videoId={ videoId } opts={youtubeOpts} onReady={handleReady} />
  );

}
