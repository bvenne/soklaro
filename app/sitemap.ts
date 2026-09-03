import type { MetadataRoute } from 'next';
import { projectLinks } from '@/lib/project';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = projectLinks.site;
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/app`, changeFrequency: 'daily', priority: .9 },
    { url: `${base}/privacy`, changeFrequency: 'monthly', priority: .6 },
    { url: `${base}/impressum`, changeFrequency: 'yearly', priority: .3 },
  ];
}
