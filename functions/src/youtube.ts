import * as Constants from 'config/constants';
import { Innertube, YTNodes } from 'youtubei.js';

import type { VideoId } from "common/params";

let global_youtube_promise : Promise<Innertube> | null;

type Video = YTNodes.CompactVideo | YTNodes.GridVideo | YTNodes.PlaylistPanelVideo | YTNodes.PlaylistVideo | YTNodes.ReelItem | YTNodes.Video | YTNodes.WatchCardCompactVideo | YTNodes.ShortsLockupView | YTNodes.LockupView;

// Newer YouTube layouts return channel/playlist entries as LockupView nodes,
// which carry the video id in `content_id` rather than `id`. Normalize both
// shapes to a plain video id, skipping non-video (e.g. Shorts, playlist) items.
function extractVideoId(vid : Video) : VideoId | null {
  if (vid.is(YTNodes.LockupView)) {
    return vid.content_type === 'VIDEO' ? (vid.content_id as VideoId) : null;
  }
  if ('id' in vid) {
    return vid.id as VideoId;
  }
  return null;
}

async function getYoutube() {
  if (!global_youtube_promise) {
    global_youtube_promise = Innertube.create({generate_session_locally: true})
      .catch(err => { global_youtube_promise = null; throw err; });
  }
  return global_youtube_promise;
}

export async function getVideo(videoId : VideoId) {
  const youtube = await getYoutube();
  return await youtube.getInfo(videoId);
}

export async function getVideosForCategory(category : string) : Promise<VideoId[]> {
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

  return results
    .map(extractVideoId)
    .filter((id) : id is VideoId => id !== null);
}
