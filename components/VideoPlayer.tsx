'use client'

import Box from '@mui/material/Box';
import YouTube from 'react-youtube'
import { Options } from 'youtube-player/dist/types';
import { VideoControlContext } from 'components/providers/VideoControlProvider';
import { useRef, useEffect, useState } from 'react';
import { fromHhmmss, toHhmmss } from 'utilities/client/css'
import { useContext } from 'react'

import type { SxProps, Theme } from '@mui/material';


const ResizeIntervalMs = 100;

type VideoPlayerParams = {
  videoId: string;
  sx?: SxProps<Theme>;
};

const VideoSizes = [
  [640, 385],
  [426, 240],
  [352, 198],
];

let markedElementClassName = '';

export default function VideoPlayer({ videoId, sx = [] } : VideoPlayerParams) {
  const ytElement = useRef<any>(null);
  const {setVideoControl} = useContext(VideoControlContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width:0, height: 0});

  useEffect(() => {
    let autoscroll = true;
    setVideoControl({
        jumpToTime: (hhmmss: string) => {
          if (hhmmss) {
            jumpToTimeInternal(fromHhmmss(hhmmss));
          }
        },
        setAutoscroll: (follow: boolean) => {
          autoscroll = follow;
        }
      });

    // Start the periodic update of timestamp.
    const interval = setInterval(() => {
        if (ytElement.current) {
          // Scroll if playing.
          if (ytElement.current.getPlayerState() === 1) {
            const hhmmss = toHhmmss(ytElement.current.getCurrentTime());
            updateTranscriptHighlight(hhmmss, autoscroll);
          }
        }
    }, 1000);

    function updateDimensions() {
      if (containerRef.current) {
        setDimensions(
          {
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          }
        );
      }
    }

    let pending_resize : number | undefined = undefined; 
    window.addEventListener('resize', () => {
      // Debounce the resize to avoid bunches of relayouts on a drag.
      window.clearTimeout(pending_resize);
      pending_resize = window.setTimeout(updateDimensions, ResizeIntervalMs);
    });
    updateDimensions();

    // Stop the periodic updates at end.
    return () => clearInterval(interval);
  }, [setVideoControl, setDimensions]);

  function updateTranscriptHighlight(hhmmss, scrollTranscript) {
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
        if (scrollTranscript) {
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

  function handleReady(event) {
    if (event.target) {
      ytElement.current = event.target;
      if (window.location.hash) {
        const hhmmss = window.location.hash.substr(1);
        updateTranscriptHighlight(hhmmss, true);
        jumpToTimeInternal(fromHhmmss(hhmmss));
      }
    }
  }

  const curSize = VideoSizes.reduce(
    (acc, cur) => {
      if (dimensions.width <= cur[0]) {
        return cur;
      }
      return acc;
    },
    VideoSizes[0]);

  return (
    <Box sx={{margin:"auto"}}>
      <Box ref={containerRef} sx={[{}, ...(Array.isArray(sx) ? sx : [sx])]}>
        <YouTube
          className="youtube-div"
          videoId={videoId}
          opts={{
            width: curSize[0],
            height: curSize[1],
            playerVars: {
                playsinline: 1
            },
          }}
        onReady={handleReady} />
      </Box>
    </Box>
  );
};
