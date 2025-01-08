import { fetchEndpoint } from 'utilities/client/endpoint';
import { toSpeakerColorClass } from 'utilities/client/css';

import type { CategoryId, VideoId } from 'common/params';

export type SpeakerInfoData = {
  [key: number] : {name: string, tags: TagSet, color: string};
};

export type ExistingNames = {[name: string]: { recentTags?: Array<string> } };
export type TagSet = Set<string>;

export type SpeakerControlInfo = {
  speakerInfo: SpeakerInfoData,
  existingNames: ExistingNames,
  existingTags: TagSet,
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
  const tags = new Set<string>(data?.tags ?? []);

  const colorClass = toSpeakerColorClass(speakerNum);

  return { name, colorClass, tags };
}

export async function getSpeakerControlInfo(category: CategoryId, videoId: VideoId) : Promise<SpeakerControlInfo> {
  const response = await fetchEndpoint('speakerinfo', 'GET', {category, videoId});
  if (!response.ok) {
    throw response;
  }

  const speakerInfo: SpeakerInfoData = {};
  if (response.data.speakerInfo) {
    // TODO: this type is very wrong. We need to figure out how to transfer + validate types from db to cloud func to here.
    for (const [key, value] of Object.entries(response.data.speakerInfo) as Array<[string, {tags: Array<string>}]>) {
      speakerInfo[key] = {...value, tags: new Set<string>(value.tags)};
    }
  }

  const existingNames = response.data.existingNames;
  const existingTags = new Set<string>(response.data.existingTags);

  return {
    speakerInfo,
    existingNames,
    existingTags
  }
}
