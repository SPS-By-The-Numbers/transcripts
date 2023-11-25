'use client'

import { useEffect } from 'react'

type TranscriptControlParams = {
  children : React.ReactNode;
};

export default function TranscriptControl({children} : TranscriptControlParams) {
  function handleClick(e) {
    if (e.target.tagName === 'SPAN' && e.target.id) {
      console.log('click', e.target.id)
      history.pushState(null, '', `#${e.target.id}`);
    }
  }

  useEffect(() => {
    const handler = document.getElementById('clickhandler');
    if (handler) {
      handler.addEventListener('click', handleClick)
    }

    return () => {
      const handler = document.getElementById('clickhandler');
      if (handler) {
        handler.removeEventListener('click', handleClick)
      }
    }
  })

  return (
    <div id="clickhandler">
      { children }
    </div>
  );
}
