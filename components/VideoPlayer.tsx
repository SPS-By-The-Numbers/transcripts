'use client'

import YouTube from 'react-youtube'
import { Options } from 'youtube-player/dist/types';
import { VideoControlContext } from 'components/VideoControlProvider';
import { forwardRef, MutableRefObject, useRef, useEffect } from 'react';
import { fromHhmmss, toHhmmss } from 'utilities/client/css'
import { useContext } from 'react'

type VideoPlayerParams = {
  videoId: string;
};

// Keep this in sync with $video-sizes in styles/global.scss
const VideoSizes = {
  xs: {
    width: 352,
    height: 198,
  },
  sm: {
    width: 426,
    height: 240,
  },
  md: {
    width: 640,
    height: 385,
  }
};

const youtubeOpts : Options = {
    width: VideoSizes.xs.width,
    height: VideoSizes.xs.height,
    playerVars: {
        playsinline: 1
    }
};

export interface VideoPlayerControl {
  jumpToTime(hhmmss: string): void;
}

let markedElementClassName = '';

export default forwardRef(function VideoPlayer({ videoId } : VideoPlayerParams, ref: MutableRefObject<VideoPlayerControl>) {
  const ytElement = useRef<any>(null);
  const { setVideoControl } = useContext(VideoControlContext);

  useEffect(() => {
    setVideoControl({
        jumpToTime: (hhmmss: string) => {
            console.log('Boo:',hhmmss);
          if (hhmmss) {
            jumpToTimeInternal(fromHhmmss(hhmmss));
          }
        }
      });
    // Start the periodic update.
    const interval = setInterval(() => {
        if (ytElement.current) {
          // Scroll if playing.
          if (ytElement.current.getPlayerState() === 1) {
            const hhmmss = toHhmmss(ytElement.current.getCurrentTime());
            scrollTranscriptTo(hhmmss);
          }
        }
    }, 1000);

    // Stop the periodic updates at end.
    return () => clearInterval(interval);
  }, [setVideoControl]);

  function scrollTranscriptTo(hhmmss) {
    const tsClassName = `ts-${hhmmss}`;
    const spans : HTMLCollectionOf<Element> = document.getElementsByClassName(tsClassName);

    if (spans.length) {
      // Found timestamp spans. Update mark.

      // HACKHACK: This is a no-no modifying the underlying dom element in React. But it's fast.
      const allMarkedElements : HTMLCollectionOf<Element> = document.getElementsByClassName(markedElementClassName);
      for (const el of Array.from(allMarkedElements)) {
        el.classList.remove('m');
      }

      markedElementClassName = tsClassName;
      for (const el of Array.from(spans)) {
        el.classList.add('m');
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }
  }

  function jumpToTimeInternal(timeSec: number) {
        console.log(timeSec);
    if (ytElement.current) {
      ytElement.current.seekTo(timeSec, true);
      ytElement.current.playVideo();
    }
  }

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
    <YouTube videoId={videoId} opts={youtubeOpts} onReady={handleReady} />
  );
});
