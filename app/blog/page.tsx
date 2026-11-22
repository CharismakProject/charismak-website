import Link from "next/link";
import { ArrowRight, ImageIcon, Newspaper } from "lucide-react";

import BlogAdminLink from "@/components/blog/blog-admin-link";
import { blogArticles, type BlogArticle } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";
import { isNewsArticle } from "@/lib/content/news";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Constru News Channel | Construction News",
  description: "Construction news from Nigeria and around the world: projects, markets, materials, regulation and the building industry.",
  path: "/blog",
  keywords: ["construction news", "Nigeria construction news", "global construction news", "building industry news"],
});
export const revalidate = 300;

const formattedDate = (value: string) => new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

function StoryImage({ article, className }: { article: BlogArticle; className: string }) {
  return article.imageUrl
    ? <img src={article.imageUrl} alt={article.imageAlt || article.title} className={className} />
    : <div className="grid h-full place-items-center bg-[#EEF2F6]"><ImageIcon className="h-8 w-8 text-[#071E33]/20" /></div>;
}

export default async function BlogPage() {
  const articles = (await loadPublishedBlogArticles()) ?? blogArticles;
  const news = articles.filter(isNewsArticle).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const [lead, ...rest] = news;

  return (
    <main className="cx-skin min-h-screen bg-[#F7F8FA] pt-20">
      <section className="border-b border-black/10 bg-white px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#A82B05]"><Newspaper className="h-4 w-4" /> Constru News Channel</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[#071E33] md:text-6xl">Construction news, Nigeria and worldwide.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#3A4653]">Projects, markets, materials, regulation and the people shaping the building industry.</p>
          </div>
          <div className="flex flex-wrap gap-3"><Link href="/courses" className="inline-flex items-center gap-2 border border-black/15 px-5 py-3 text-sm font-bold text-[#071E33] hover:bg-[#071E33] hover:text-white">Courses &amp; study guides <ArrowRight className="h-4 w-4" /></Link><BlogAdminLink /></div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          {!lead ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
              <span className="inline-block rounded-full border border-[#C8A45D] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#C8A45D]">Coming soon</span>
              <h2 className="mt-4 text-2xl font-semibold text-[#071E33]">The first stories are on the way.</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#3A4653]">Construction news from Nigeria and around the world will appear here.</p>
            </div>
          ) : (
            <>
              <article className="group grid gap-6 border-b border-black/10 pb-10 lg:grid-cols-[1.3fr_1fr]">
                <Link href={`/blog/${lead.slug}`} className="block aspect-[16/9] overflow-hidden rounded-xl bg-[#EEF2F6]"><StoryImage article={lead} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /></Link>
                <div className="self-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#A82B05]">{lead.category}</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#071E33]"><Link href={`/blog/${lead.slug}`} className="hover:text-[#A82B05]">{lead.title}</Link></h2>
                  <p className="mt-3 text-base leading-7 text-[#3A4653]">{lead.excerpt}</p>
                  <p className="mt-4 text-xs text-[#3A4653]/70">{formattedDate(lead.publishedAt)} · {lead.readTime}</p>
                </div>
              </article>
              {rest.length ? (
                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((article) => (
                    <article key={article.slug} className="group overflow-hidden rounded-xl border border-black/10 bg-white">
                      <Link href={`/blog/${article.slug}`} className="block h-48 overflow-hidden bg-[#EEF2F6]"><StoryImage article={article} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /></Link>
                      <div className="p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A82B05]">{article.category}</p>
                        <h3 className="mt-2 text-lg font-semibold leading-7 text-[#071E33]"><Link href={`/blog/${article.slug}`} className="hover:text-[#A82B05]">{article.title}</Link></h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#3A4653]">{article.excerpt}</p>
                        <p className="mt-4 text-[11px] text-[#3A4653]/70">{formattedDate(article.publishedAt)} · {article.readTime}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
