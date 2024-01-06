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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories: string[] = await getAllCategories();

  const videoPages: SiteMapEntry[] = [];

  for (const category of categories) {
    const videos = await getAllVideosForCategory(category);

    videoPages.push(...videos.map(v => ({
      url: getVideoPath(category, v.videoId),
      lastModified: v.publishDate,
      changeFrequency: 'yearly' as ChangeFrequency,
      priority: 1.0,
    })));
  }

  const datePages: SiteMapEntry[] = [];

  for (const category of categories) {
    const dates = await getDatesForCategory(category);

    datePages.push(...dates.map(d => ({
      url: getDatePath(category, d),
      lastModified: d,
      changeFrequency: 'weekly' as ChangeFrequency,
    })));
  }

  const categoryPages: SiteMapEntry[] = categories.map(c => ({
    url: getCategoryPath(c),
    changeFrequency: 'montly' as ChangeFrequency,
    // TODO: Add last-modified, either a hard-coded value, or something determined from changelog
  }));

  return [
    ...categoryPages,
    ...datePages,
    ...videoPages
  ];
}