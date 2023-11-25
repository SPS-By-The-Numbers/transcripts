export type SpeakerInfoData = {
  [key: number] : {name: string, tags: Set<string>, color: string};
};

export function toColorClass(speakerNum: number) {
  return `c-${speakerNum % 8}`;
}

export function getSpeakerAttributes(speakerNum : number, speakerInfo : SpeakerInfoData ) {
  const data = speakerInfo ? speakerInfo[speakerNum] : undefined;

  const name = data?.name || `SPEAKER_${speakerNum}`;
  const tags = data?.tags || new Set<string>();

  const colorClass = toColorClass(speakerNum);

  return { name, colorClass, tags };
}

