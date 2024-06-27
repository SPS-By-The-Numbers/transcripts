'use client'

type TranscriptControlParams = {
  onTimeStampSelected: (timeStamp: string) => void,
  children : React.ReactNode,
};

export default function TranscriptControl({onTimeStampSelected, children} : TranscriptControlParams) {
  function handleClick(e): void {
    const clickedTimestamp: string | null = findSelectedTimestamp(e.target);

    if (clickedTimestamp === null) {
      return;
    }

    onTimeStampSelected(clickedTimestamp);
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
