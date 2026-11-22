import type { BlogArticle } from "@/lib/content/blog";

/** News stories go on the Constru News Channel (/blog); everything else is a learning guide listed on /courses. */
export const isNewsArticle = (article: BlogArticle) => {
  if (article.contentType) return article.contentType === "news";
  return ["construction news", "market update", "industry", "regulation", "project update", "market news"].some((category) => article.category.toLowerCase().includes(category));
};
