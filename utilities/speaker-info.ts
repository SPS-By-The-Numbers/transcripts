export type SpeakerInfoData = {
  [key: number] : {name: string, tags: Set<string>, color: string};
};

export function toSpeakerKey(speakerNum: number) {
  if (speakerNum < 10) {
    return `SPEAKER_0${speakerNum}`;
  }

  return `SPEAKER_${speakerNum}`;
}

export function toColorClass(speakerNum: number) {
  return `c-${speakerNum % 7}`;
}

export function getSpeakerAttributes(speakerNum : number, speakerInfo : SpeakerInfoData ) {
  const data = speakerInfo ? speakerInfo[speakerNum] : undefined;

  const name = data?.name || toSpeakerKey(speakerNum);
  const tags = data?.tags || new Set<string>();

  const colorClass = toColorClass(speakerNum);

  return { name, colorClass, tags };
}
