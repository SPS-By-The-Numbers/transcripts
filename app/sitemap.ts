import * as Constants from 'config/constants';
import { MetadataRoute } from 'next';
import { fetchEndpoint } from 'utilities/client/endpoint';
import { getVideoPath } from 'common/paths';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

type SiteMapEntry = {
    url: string;
    lastModified?: string | Date;
    changeFrequency?: ChangeFrequency;
    priority?: number;
};

function buildUrl(relativePath): string {
  return `${Constants.SITE_ROOT_URL}/${relativePath}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const videoPages: SiteMapEntry[] = [];

  const results = await Promise.all(Constants.ALL_CATEGORIES.map(
    category => fetchEndpoint('metadata', 'GET', {category})));
  for (const [i, category] of Constants.ALL_CATEGORIES.entries()) {
    const result = results[i];
    if (!result.ok) {
      console.error("Bad response: ", result);
      continue;
    }

    const videos = result.data;

    videoPages.push(...videos.map(v => ({
      url: buildUrl(getVideoPath(category, v.videoId)),
      lastModified: v.publishDate,
      changeFrequency: 'yearly' as ChangeFrequency,
      priority: 1.0,
    })));
  }

  return [
    ...videoPages
  ];
}
