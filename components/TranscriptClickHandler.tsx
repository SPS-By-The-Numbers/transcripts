'use client'

import { VideoControlContext } from 'components/VideoControlProvider';
import { dialogMode as speakerMode } from 'components/SpeakerEditDialogContent';
import { useActionDialog } from 'components/ActionDialogProvider';
import { useContext } from 'react'

export const speakerClassPrefix = 'editSpeaker';

type TranscriptControlParams = {
  children : React.ReactNode,
};

export default function TranscriptControl({children} : TranscriptControlParams) {
  const { videoControl } = useContext(VideoControlContext);
  const { setActionDialogMode } = useActionDialog();

  function handleTimestampJump(command, element): void {
    // Command is ts-NNNNN
    const clickedTimestamp = command.slice(3);

    history.pushState(null, '', `#${clickedTimestamp}`);
    // Video player may not be loaded yet.
    if (videoControl) {
      videoControl.jumpToTime(clickedTimestamp);
    }
  }

  function handleEditSpeaker(command, element): void {
    // Command is ts-NNNNN
    const speakerNum = parseInt(command.split('-')[1]);
    setActionDialogMode({
      mode: speakerMode,
      params: { speakerNum },
    });
  }

  function handleAction(clickedElement: HTMLElement) {
    let curElement: HTMLElement | null = clickedElement;

    // Search up the document until there is a classname that starts with
    // `ts-`. This indicates a timestamp encoded in the classname.
    while (curElement !== null) {
      for (const name of curElement.classList) {
        if (name.startsWith('ts-')) {
          handleTimestampJump(name, curElement);
        } else if (name.startsWith(speakerClassPrefix)) {
          handleEditSpeaker(name, curElement);
        }
      }
      curElement = curElement.parentElement;
    }
  }

  function handleClick(e) {
    handleAction(e.target);
  }

  return (
    <div id="clickhandler" onClick={handleClick}>
      { children }
    </div>
  );
}
