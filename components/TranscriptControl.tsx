'use client'

import { VideoControlContext } from 'components/VideoControlProvider';
import { useContext } from 'react'

type TranscriptControlParams = {
  children : React.ReactNode,
};

export default function TranscriptControl({children} : TranscriptControlParams) {
  const { videoControl } = useContext(VideoControlContext);

  function handleClick(e): void {
    const clickedTimestamp: string | null = findSelectedTimestamp(e.target);

    if (clickedTimestamp === null) {
      return;
    }

    history.pushState(null, '', `#${clickedTimestamp}`);
    // Video player may not be loaded yet.
    if (videoControl) {
      videoControl.jumpToTime(clickedTimestamp);
    }
  }

  return (
    <div id="clickhandler" onClick={handleClick}>
      { children }
    </div>
  );
}

function findSelectedTimestamp(clickedElement: HTMLElement): string | null {
  let curElement: HTMLElement | null = clickedElement;

  while (curElement !== null) {
    const classList = Array.from<string>(curElement.classList);
    const tsClassName: string | undefined = classList.find((name: string) => name.startsWith('ts-'));

    if (tsClassName !== undefined) {
      return tsClassName.slice(3);
    }

    curElement = curElement.parentElement;
  }

  return null;
}
