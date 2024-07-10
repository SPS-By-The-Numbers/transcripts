import { fetchEndpoint } from 'utilities/client/endpoint';
import { toSpeakerColorClass } from 'utilities/client/css';

import type { CategoryId, VideoId } from 'common/params';

export type SpeakerInfoData = {
  [key: number] : {name: string, tags: Set<string>, color: string};
};

export type SpeakerControlInfo = {
  speakerInfo: SpeakerInfoData,
  existingNames: object,
  existingTags: Set<string>,
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

export function getSpeakerAttributes(speakerNum : number, speakerInfo : SpeakerInfoData ) {
  const data = speakerInfo?.[speakerNum];

  const name = data?.name || toSpeakerKey(speakerNum);
  const tags = data?.tags ? new Set<string>(data.tags) : new Set<string>();

  const colorClass = toSpeakerColorClass(speakerNum);

  return { name, colorClass, tags };
}

export async function getSpeakerControlInfo(category: CategoryId, videoId: VideoId) : Promise<SpeakerControlInfo> {
  const response = await fetchEndpoint('speakerinfo', 'GET', {category, videoId});
  if (!response.ok) {
    throw response;
  }
  return response.data;
}
