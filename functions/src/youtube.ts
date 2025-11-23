import * as Constants from 'config/constants';
import { Innertube } from 'youtubei.js';

import type { YTNodes } from 'youtubei.js';
import type { VideoId } from "common/params";

let global_youtube : Innertube | null;

type Video = YTNodes.CompactVideo | YTNodes.GridVideo | YTNodes.PlaylistPanelVideo | YTNodes.PlaylistVideo | YTNodes.ReelItem | YTNodes.Video | YTNodes.WatchCardCompactVideo | YTNodes.ShortsLockupView;

async function getYoutube() {
  if (!global_youtube) {
    global_youtube = await Innertube.create({generate_session_locally: true});
  }
  return global_youtube;
}

export async function getVideo(videoId : VideoId) {
  const youtube = await getYoutube();
  return await youtube.getInfo(videoId);
}

export async function getVideosForCategory(category : string) : Promise<Video[]> {
  const youtube = await getYoutube();

  const results = new Array<Video>;
  let feed;

  const info = Constants.CATEGORY_CHANNEL_MAP[category];
  if (info) {
    if (info.type === 'channel') {
      const channel = await youtube.getChannel(info.id);
      const videos = await channel.getVideos();
      results.push(...videos.videos);

      if (videos.has_continuation) {
        feed = await videos.getContinuation();
      }
    } else if (info.type === 'playlist') {
      feed = await youtube.getPlaylist(info.id);
      results.push(...feed.videos);
    }
  }

  while (feed?.has_continuation) {
    feed = await feed.getContinuation();
    results.push(...feed.videos);
  }

  return results;
}
