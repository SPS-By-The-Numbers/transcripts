'use client'

type TranscriptControlParams = {
  onTimeStampSelected: (timeStamp: string) => void,
  children : React.ReactNode,
};

export default function TranscriptControl({onTimeStampSelected, children} : TranscriptControlParams) {
  function handleClick(e): void {
    if (e.target.tagName !== 'SPAN') {
    }
    const tsClassName = Array.from(e.target.classList).find(e=>e.startsWith('ts-'));
    if (!tsClassName) {
      return;
    }

    onTimeStampSelected(tsClassName.slice(3));
  }

  return (
    <div id="clickhandler" onClick={handleClick}>
      { children }
    </div>
  );
}
