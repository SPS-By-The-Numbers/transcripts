export type SpeakerInfoData = {
  [key: number] : {name: string, tags: Set<string>, color: string};
};

export const UnknownSpeakerNum : number = 99;

export function toSpeakerNum(speakerKey: string) {
  if (!speakerKey) {
    return UnknownSpeakerNum;
  }

  const parts = speakerKey.split('_');
  if (parts.length < 2) {
    console.error('Invalid speakerKey', speakerKey, parts);
    return UnknownSpeakerNum;
  }
  return Number(speakerKey.split('_')[1]);
}

export function toSpeakerKey(speakerNum: number) {
  if (speakerNum < 10) {
    return `SPEAKER_0${speakerNum}`;
  }

  return `SPEAKER_${speakerNum}`;
}

export function toColorClass(speakerNum: number) {
  return `c-${speakerNum % 8}`;
}

export function getSpeakerAttributes(speakerNum : number, speakerInfo : SpeakerInfoData ) {
  const data = speakerInfo ? speakerInfo[speakerNum] : undefined;

  const name = data?.name || toSpeakerKey(speakerNum);
  const tags = data?.tags || new Set<string>();

  const colorClass = toColorClass(speakerNum);

  return { name, colorClass, tags };
}
