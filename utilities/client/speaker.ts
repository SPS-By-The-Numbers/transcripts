import { getCategoryPublicData } from "utilities/metadata-utils"

import type { SpeakerInfoData } from 'utilities/speaker-info'

type SpeakerControlInfo = {
  speakerInfo: SpeakerInfoData,
  existingNames: object,
  existingTags: Set<string>,
};

type DbInfoEntry ={
  name : string;
  tags : Array<string>;
};

export async function loadSpeakerControlInfo(category: string, videoId: string) : Promise<SpeakerControlInfo> {
  const videoData = await getCategoryPublicData(category, `v/${videoId}`);
  const existingOptions = await getCategoryPublicData(category, 'existing');

  const speakerInfo = {};
  if (videoData && videoData.speakerInfo) {
    for (const [k,v] of Object.entries(videoData.speakerInfo)) {
      const entry = v as DbInfoEntry;
      const n = entry?.name;
      const t = entry?.tags;
      speakerInfo[k] = speakerInfo[k] || {};
      if (n && speakerInfo[k].name === undefined) {
        speakerInfo[k].name = n;
      }
      if (t && speakerInfo[k].tags === undefined) {
        speakerInfo[k].tags = new Set<string>(t);
      }
    }
  }

  const existingNames = {...existingOptions?.names};
  const existingTags = new Set<string>();
  if (existingOptions?.tags) {
    Object.keys(existingOptions.tags).forEach(tag => existingTags.add(tag));
  }

  return {speakerInfo, existingNames, existingTags};
}
