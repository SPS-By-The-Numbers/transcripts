import * as Constants from 'config/constants';
import { MetadataRoute } from 'next';
import { getAllVideosForCategory } from 'utilities/metadata-utils';
import { getVideoPath } from 'utilities/path-utils';

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

  for (const category of Constants.ALL_CATEGORIES) {
    const videos = await getAllVideosForCategory(category);

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
