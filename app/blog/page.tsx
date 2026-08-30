import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Newspaper,
  Sparkles,
} from "lucide-react";

import BlogAdminLink from "@/components/blog/blog-admin-link";
import { blogArticles, type BlogArticle } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";

export const metadata = {
  title: "Construction News, Cost Guides & Learning | Charismak",
  description: "Nigeria-focused construction news, cost planning, materials, BOQ, procurement and practical learning for homeowners and industry professionals.",
};
export const dynamic = "force-dynamic";

const newsCategories = ["construction news", "market update", "industry", "regulation", "project update", "market news"];
const isNewsArticle = (article: BlogArticle) => newsCategories.some((category) => article.category.toLowerCase().includes(category));
const formattedDate = (value: string) => new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default async function BlogPage() {
  const databaseArticles = await loadPublishedBlogArticles();
  const articles = databaseArticles ?? blogArticles;
  const sorted = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const featured = sorted[0] ?? null;
  const latest = sorted.slice(1, 5);
  const newsroom = sorted.filter(isNewsArticle);
  const learning = sorted.filter((article) => !isNewsArticle(article));
  const topics = [...new Set(sorted.map((article) => article.category))];

  return (
    <main className="min-h-screen bg-[#F7F8FA] pt-20">
      <section className="border-b border-white/10 bg-[#071E33] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 md:px-8">
          <span className="text-[#F2B544]">Charismak News & Learning</span>
          <Link href="#latest" className="transition hover:text-white">Latest</Link>
          <Link href="#newsroom" className="transition hover:text-white">Newsroom</Link>
          <Link href="#learning" className="transition hover:text-white">Learning Centre</Link>
          <Link href="/prices" className="transition hover:text-white">Market Prices</Link>
          <Link href="/estimator" className="transition hover:text-white">Estimator</Link>
          <span className="ml-auto hidden md:block">Nigeria construction intelligence</span>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071E33] px-5 pb-12 pt-16 text-white md:px-8 md:pb-16 md:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.16),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Newsroom · Guides · Construction Intelligence</p>
              <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.01] tracking-[-0.05em] sm:text-6xl lg:text-7xl">Know what is changing.<span className="mt-2 block text-[#E8C77F]">Understand how to build.</span></h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">Construction news, market context and practical learning for people making real building, procurement and project decisions in Nigeria.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:max-w-sm lg:justify-end">
              <Link href="/estimator" className="inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] transition hover:bg-white">Estimate a project <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/prices" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Check prices</Link>
              <BlogAdminLink />
            </div>
          </div>
        </div>
      </section>

      {featured ? (
        <section id="latest" className="border-b border-[#0D3B66]/10 bg-white px-5 py-10 md:px-8 md:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#0D3B66]/10 pb-4">
              <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#C8320A]" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#071E33]">Latest</p></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]/50">Updated as Charismak publishes</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.28fr_0.72fr]">
              <article className="group border-b border-[#0D3B66]/10 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em]"><span className="bg-[#071E33] px-3 py-1.5 text-white">{isNewsArticle(featured) ? "News" : "Featured Guide"}</span><span className="text-[#C8A45D]">{featured.category}</span></div>
                <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#071E33] transition group-hover:text-[#0D3B66] md:text-5xl">{featured.title}</h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#3A4653]">{featured.excerpt}</p>
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"><p className="flex items-center gap-2 text-xs text-[#3A4653]/65"><CalendarDays className="h-4 w-4" />{formattedDate(featured.publishedAt)} · {featured.readTime}</p><Link href={`/blog/${featured.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]">Read full story <ArrowRight className="h-4 w-4" /></Link></div>
              </article>

              <aside>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">More recent</p>
                <div className="mt-3 divide-y divide-[#0D3B66]/10">
                  {latest.map((article) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="group block py-5 first:pt-2">
                      <div className="flex items-center justify-between gap-4"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8320A]">{article.category}</span><ChevronRight className="h-4 w-4 text-[#0D3B66]/35 transition group-hover:translate-x-1 group-hover:text-[#0D3B66]" /></div>
                      <h3 className="mt-2 text-lg font-semibold leading-6 text-[#071E33]">{article.title}</h3>
                      <p className="mt-2 text-[11px] text-[#3A4653]/55">{formattedDate(article.publishedAt)} · {article.readTime}</p>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[#0D3B66]/10 bg-[#F1F4F7] px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A4653]/55">Topics</span>
          {topics.map((topic) => <span key={topic} className="border border-[#0D3B66]/10 bg-white px-3 py-2 text-xs font-semibold text-[#071E33]">{topic}</span>)}
        </div>
      </section>

      <section id="newsroom" className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C8320A]"><Newspaper className="h-4 w-4" /> Newsroom</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#071E33] md:text-5xl">What is happening in construction.</h2></div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">Industry developments, market shifts, regulations, project news and changes that can affect how people design, procure and build.</p>
          </div>

          {newsroom.length ? (
            <div className="mt-10 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-2 xl:grid-cols-3">
              {newsroom.map((article) => (
                <article key={article.slug} className="group bg-white p-6 md:p-7"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C8320A]">{article.category}</p><h3 className="mt-4 text-xl font-semibold leading-7 text-[#071E33]">{article.title}</h3><p className="mt-3 text-sm leading-7 text-[#3A4653]">{article.excerpt}</p><div className="mt-6 border-t border-[#0D3B66]/10 pt-4"><p className="text-[10px] text-[#3A4653]/55">{formattedDate(article.publishedAt)} · {article.readTime}</p><Link href={`/blog/${article.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#C8A45D]">Read story <ArrowRight className="h-4 w-4" /></Link></div></article>
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-dashed border-[#0D3B66]/20 bg-white p-8 md:p-10"><Newspaper className="h-7 w-7 text-[#0D3B66]" /><h3 className="mt-4 text-2xl font-semibold text-[#071E33]">The newsroom is ready for live updates.</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#3A4653]">Publish an article under categories such as Construction news, Market update, Industry & regulation or Project update and it will automatically appear here.</p></div>
          )}
        </div>
      </section>

      <section id="learning" className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A45D]"><BookOpen className="h-4 w-4" /> Learning Centre</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#071E33] md:text-5xl">Practical construction knowledge.</h2></div><p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">Clear explanations for homeowners, contractors, suppliers, students and professionals—from BOQs and materials to estimating, procurement and site decisions.</p></div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {learning.map((article) => (
              <article key={article.slug} className="group flex min-h-[330px] flex-col border border-[#0D3B66]/10 bg-[#F7F8FA] p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_50px_rgba(7,30,51,0.09)]">
                <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center bg-[#071E33] text-[#F2B544]"><Sparkles className="h-4 w-4" /></span><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8A45D]">{article.category}</span></div>
                <h3 className="mt-6 text-xl font-semibold leading-7 text-[#071E33]">{article.title}</h3><p className="mt-3 text-sm leading-7 text-[#3A4653]">{article.excerpt}</p><div className="mt-auto pt-6"><p className="text-[10px] text-[#3A4653]/55">{formattedDate(article.publishedAt)} · {article.readTime}</p><Link href={`/blog/${article.slug}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#C8A45D]">Learn more <ArrowRight className="h-4 w-4" /></Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-14 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">From information to action</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Use the knowledge, check the market and estimate the work.</h2></div><div className="flex flex-wrap gap-3"><Link href="/prices" className="border border-white/20 px-5 py-3 text-sm font-bold">Price references</Link><Link href="/estimator" className="bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33]">Construction estimator</Link></div></div>
      </section>
    </main>
  );
}
