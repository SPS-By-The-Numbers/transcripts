'use client'

import { useEffect } from 'react'
import { jumpToTime } from 'components/VideoPlayer';

type TranscriptControlParams = {
  children : React.ReactNode;
};

export default function TranscriptControl({children} : TranscriptControlParams) {
  function handleClick(e) {
    if (e.target.tagName === 'SPAN' && e.target.id) {
      history.pushState(null, '', `#${e.target.id}`);
      jumpToTime(e.target.id);
    }
  }

  return (
    <div id="clickhandler" onClick={handleClick}>
      { children }
    </div>
  );
}
