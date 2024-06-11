'use client'

type TranscriptControlParams = {
  onTimeStampSelected: (timeStamp: string) => void,
  children : React.ReactNode,
};

export default function TranscriptControl({onTimeStampSelected, children} : TranscriptControlParams) {
  function handleClick(e): void {
    // Search for nearest span.
    let span = e.target;
    while (span && span.tagName !== 'SPAN') {
      span = span.parentElement;
    }

    // So span found.
    if (!span) {
      return;
    }

    const classList = Array.from(span.classList) as string[];
    const tsClassName: string | undefined = classList.find((name: string) => name.startsWith('ts-'));
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
