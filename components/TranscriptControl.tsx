'use client'

type TranscriptControlParams = {
  onTimeStampSelected: (timeStamp: string) => void,
  children : React.ReactNode,
};

export default function TranscriptControl({onTimeStampSelected, children} : TranscriptControlParams) {
  function handleClick(e): void {
    if (e.target.tagName === 'SPAN' && e.target.id) {
      onTimeStampSelected(e.target.id);
    }
  }

  return (
    <div id="clickhandler" onClick={handleClick}>
      { children }
    </div>
  );
}
