import { MetadataRoute } from 'next';
import { getAllCategories, getAllVideosForCategory, getDatesForCategory } from 'utilities/metadata-utils';
import { getCategoryPath, getDatePath, getVideoPath } from 'utilities/path-utils';

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

type SiteMapEntry = {
    url: string;
    lastModified?: string | Date;
    changeFrequency?: ChangeFrequency;
    priority?: number;
};

// TODO: Move this to an environment variable
const hostName = 'https://transcripts.sps-by-the-numbers.com';

function buildUrl(relativePath): string {
  return `${hostName}/${relativePath}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories: string[] = await getAllCategories();

  const videoPages: SiteMapEntry[] = [];

  for (const category of categories) {
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
