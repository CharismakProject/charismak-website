import type { BlogArticle } from "./blog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

export type BlogPostStatus = "draft" | "published";

export type ManagedBlogArticle = BlogArticle & {
  id: string;
  status: BlogPostStatus;
  updatedAt: string;
  contentType: "news" | "learning";
  imageUrl: string | null;
  imageAlt: string | null;
  featured: boolean;
  author: string;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  read_time: string;
  sections: BlogArticle["sections"];
  status: BlogPostStatus;
  updated_at: string;
  content_type?: "news" | "learning" | null;
  image_url?: string | null;
  image_alt?: string | null;
  featured?: boolean | null;
  author?: string | null;
};

const inferContentType = (row: BlogPostRow): "news" | "learning" => {
  if (row.content_type === "news" || row.content_type === "learning") return row.content_type;
  const category = row.category.toLowerCase();
  return ["news", "market update", "industry", "regulation", "project update"]
    .some((term) => category.includes(term)) ? "news" : "learning";
};

export const blogRowToArticle = (row: BlogPostRow): ManagedBlogArticle => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  category: row.category,
  publishedAt: row.published_at,
  readTime: row.read_time,
  sections: Array.isArray(row.sections) ? row.sections : [],
  status: row.status,
  updatedAt: row.updated_at,
  contentType: inferContentType(row),
  imageUrl: row.image_url ?? null,
  imageAlt: row.image_alt ?? null,
  featured: Boolean(row.featured),
  author: row.author?.trim() || "Charismak Editorial Desk",
});

const publicHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
};

async function readRows(query: string): Promise<BlogPostRow[] | null> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts?${query}`, {
      headers: publicHeaders,
      next: { revalidate: 300, tags: ["blog-posts"] },
    });
    if (!response.ok) return null;
    return await response.json() as BlogPostRow[];
  } catch {
    return null;
  }
}

export async function loadPublishedBlogArticles(): Promise<ManagedBlogArticle[] | null> {
  const rows = await readRows("select=*&status=eq.published&order=published_at.desc");
  return rows?.map(blogRowToArticle) ?? null;
}

export async function loadPublishedBlogArticle(slug: string): Promise<{ databaseAvailable: boolean; article: ManagedBlogArticle | null }> {
  const rows = await readRows(`select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return {
    databaseAvailable: rows !== null,
    article: rows?.[0] ? blogRowToArticle(rows[0]) : null,
  };
}
