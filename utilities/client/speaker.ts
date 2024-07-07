import { getCategoryPublicRoot } from "utilities/metadata-utils"

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

async function getVideoRef(category: string, id: string): Promise<any> {
    return (await getCategoryPublicRoot(category)).child(`v/${id}`);
}

async function getExistingRef(category: string): Promise<any> {
    return (await getCategoryPublicRoot(category)).child('existing');
}

export async function loadSpeakerControlInfo(category: string, videoId: string) : Promise<SpeakerControlInfo> {
  const videoRef = await getVideoRef(category, videoId);
  const existingRef = await getExistingRef(category);

  const speakerInfo = {};
  const videoData = videoRef.val();
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

  const existingOptions = existingRef.val();

  const existingNames = {...existingOptions?.names};
  const existingTags = new Set<string>();
  if (existingOptions?.tags) {
    Object.keys(existingOptions.tags).forEach(tag => existingTags.add(tag));
  }

  return {speakerInfo, existingNames, existingTags};
}
