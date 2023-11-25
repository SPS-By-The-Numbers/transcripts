'use client'

import YouTube from 'react-youtube'
import { Options } from 'youtube-player/dist/types';
import { useTranscriptContext } from 'components/TranscriptControlProvider';

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

let ytElement : any = null;

export function jumpToTime(hhmmss) {
  jumpToTimeInternal(toSec(hhmmss));
}

function jumpToTimeInternal(timeSec) {
  if (ytElement) {
    ytElement.seekTo(timeSec, true);
    ytElement.playVideo();
  }
}

export default function VideoPlayer({category, videoId} : VideoPlayerParams) {

  function handleReady(event) {
    if (event.target) {
      ytElement = event.target;
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
    <YouTube style={ytplayerStyle} videoId={ videoId } opts={youtubeOpts} onReady={handleReady} />
  );

}
