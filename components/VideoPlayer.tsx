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

// https://blog.youtube/news-and-events/new-default-size-for-embedded-videos/
function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

var shrinkVideo = false;
// edit layout on mobile: this is a quick improvement of shrinking the video on small screens

// The SPS videos seem to be at 560*315, a ratio of 1.7777. 
// For same ratio on mobile we want 400 * 225
// shrinking the frame is also the way to get a lower res video
const windowWidth = getWindowDimensions().width;
if (windowWidth < 700) {
  shrinkVideo = true;
}
export const YtEmbedWidth = shrinkVideo ? 400 : 560;
export const YtEmbedHeight = shrinkVideo ? 225 : 315;

const youtubeOpts : Options = {
    width: YtEmbedWidth,
    height: YtEmbedHeight,
    playerVars: {
        playsinline: 1,
        rel: 0
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
