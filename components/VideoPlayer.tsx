'use client'

import YouTube from 'react-youtube'
import { Options } from 'youtube-player/dist/types';
import { forwardRef, MutableRefObject, useRef, useEffect, useState } from 'react';
import { fromHhmmss, toHhmmss } from 'utilities/client/css'

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

export interface VideoPlayerControl {
  jumpToTime(hhmmss: string): void;
}

let markedSpan = '';

export default forwardRef(function VideoPlayer({ videoId } : VideoPlayerParams, ref: MutableRefObject<VideoPlayerControl>) {
  const ytElement = useRef<any>(null);

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
        if (ytElement.current) {
          const hhmmss = toHhmmss(ytElement.current.getCurrentTime());
          scrollTranscriptTo(hhmmss);
        }
    }, 1000);

    //Clearing the interval
    return () => clearInterval(interval);
  }, []);

  function scrollTranscriptTo(hhmmss) {
    const tsClassName = `ts-${hhmmss}`;
    const spans : HTMLCollectionOf<Element> = document.getElementsByClassName(tsClassName);

    if (spans.length) {
      // Found timestamp spans. Update mark.

      // HACKHACK: This is a no-no modifying the underlying dom element in React. But it's fast.
      const oldSpans : HTMLCollectionOf<Element> = document.getElementsByClassName(markedSpan);
      for (const el of Array.from(oldSpans)) {
        const markElement = el.parentElement;
        if (markElement) {
          markElement.replaceWith(el);
        }
      }

      markedSpan = tsClassName;
      for (const el of Array.from(spans)) {
        const markElement = document.createElement('mark');
        if (el.parentNode) {
          el.parentNode.insertBefore(markElement, el);
          markElement.appendChild(el);
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
      }
    }
  }

  function jumpToTimeInternal(timeSec: number) {
    if (ytElement.current) {
      ytElement.current.seekTo(timeSec, true);
      ytElement.current.playVideo();
    }
  }

  ref.current = {
    jumpToTime: (hhmmss: string) => {
      jumpToTimeInternal(fromHhmmss(hhmmss));
    }
  };

  function handleReady(event) {
    if (event.target) {
      ytElement.current = event.target;
      if (window.location.hash) {
        const hhmmss = window.location.hash.substr(1);
        scrollTranscriptTo(hhmmss);
        jumpToTimeInternal(fromHhmmss(hhmmss));
      }
    }
  }

  return (
    <YouTube style={ytplayerStyle} videoId={videoId} opts={youtubeOpts} onReady={handleReady} />
  );
});
