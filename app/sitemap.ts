import type { MetadataRoute } from "next";

import { blogArticles } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";
import { loadPublishedProjects } from "@/lib/content/website-cms";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import { RATE_BANK_ITEMS } from "@/lib/rates/defaults";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/projects", changeFrequency: "weekly", priority: 0.9 },
  { path: "/leadership", changeFrequency: "monthly", priority: 0.6 },
  { path: "/vision", changeFrequency: "monthly", priority: 0.55 },
  { path: "/hse", changeFrequency: "monthly", priority: 0.6 },
  { path: "/estimator", changeFrequency: "monthly", priority: 0.9 },
  { path: "/estimator/detailed", changeFrequency: "monthly", priority: 0.9 },
  { path: "/estimator/materials", changeFrequency: "monthly", priority: 0.9 },
  { path: "/prices", changeFrequency: "daily", priority: 0.95 },
  { path: "/rates", changeFrequency: "weekly", priority: 0.95 },
  { path: "/marketplace", changeFrequency: "daily", priority: 0.85 },
  { path: "/marketplace-safety", changeFrequency: "yearly", priority: 0.35 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/quote", changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, managedArticles] = await Promise.all([
    loadPublishedProjects().catch(() => []),
    loadPublishedBlogArticles().catch(() => null),
  ]);

  const articles = managedArticles ?? blogArticles;

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...projects
      .filter((project) => project.showOnProjectsPage !== false)
      .map((project) => ({
        url: absoluteUrl(`/projects/${project.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...RATE_BANK_ITEMS.map((item) => ({
      url: absoluteUrl(`/rates/${item.slug}`),
      lastModified: new Date(item.lastReviewed),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...DEFAULT_PRICE_ITEMS.filter((item) => item.active).map((item) => ({
      url: absoluteUrl(`/prices/${item.id}`),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
