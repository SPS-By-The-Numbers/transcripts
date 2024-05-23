'use client'

type TranscriptControlParams = {
  onTimeStampSelected: (timeStamp: string) => void,
  children : React.ReactNode,
};

export default function TranscriptControl({onTimeStampSelected, children} : TranscriptControlParams) {
  function handleClick(e): void {
    if (e.target.tagName !== 'SPAN') {
      return;
    }

    const classList = Array.from(e.target.classList) as string[];
    const tsClassName: string | undefined = classList.find((e: string) => e.startsWith('ts-'));
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
