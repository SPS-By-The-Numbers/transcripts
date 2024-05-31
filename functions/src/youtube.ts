import { Innertube } from 'youtubei.js';

let global_youtube : Innertube | null;

async function getYoutube() {
  if (!global_youtube) {
    global_youtube = await Innertube.create({generate_session_locally: true});
  }
  return global_youtube;
}

async function getVideosForCategory(category : string) {
  const youtube = await getYoutube();

  const results = [];
  let feed = null;

  if (category === "sps-board") {
    const channel = await youtube.getChannel("UC07MVxpRKdDJmqwWDGYqotA");
    const videos = await channel.getVideos();
    results.push(...videos.videos);

    if (videos.has_continuation) {
      feed = await videos.getContinuation();
    }
  } else if (category === "seattle-city-council") {
    feed = await youtube.getPlaylist("PLhfhh0Ed-ZC2d0zuuzyCf1gaPaKfH4k4f");
    results.push(...feed.videos);
  }

  while (feed?.has_continuation) {
    feed = await feed.getContinuation();
    results.push(...feed.videos);
  }

  return results;
}

export { getVideosForCategory };
