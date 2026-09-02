import type { ReactNode } from "react";

import { blogArticles } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";

export const revalidate = 300;

export async function generateStaticParams() {
  const databaseArticles = await loadPublishedBlogArticles();
  const articles = databaseArticles?.length ? databaseArticles : blogArticles;
  return articles.map((article) => ({ slug: article.slug }));
}

export default function BlogArticleLayout({ children }: { children: ReactNode }) {
  return children;
}
