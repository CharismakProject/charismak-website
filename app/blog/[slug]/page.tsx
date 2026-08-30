import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Newspaper, Share2 } from "lucide-react";
import { notFound } from "next/navigation";

import { blogArticles, type BlogArticle } from "@/lib/content/blog";
import { loadPublishedBlogArticle, loadPublishedBlogArticles } from "@/lib/content/blog-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

const newsCategories = ["construction news", "market update", "industry", "regulation", "project update", "market news"];
const isNewsArticle = (article: BlogArticle) => newsCategories.some((category) => article.category.toLowerCase().includes(category));

async function findArticle(slug: string) {
  const result = await loadPublishedBlogArticle(slug);
  return result.databaseAvailable ? result.article : blogArticles.find((item) => item.slug === slug) ?? null;
}

async function relatedArticles(article: BlogArticle) {
  const databaseArticles = await loadPublishedBlogArticles();
  const source = databaseArticles ?? blogArticles;
  return source
    .filter((item) => item.slug !== article.slug)
    .sort((a, b) => {
      const aMatch = a.category === article.category ? 1 : 0;
      const bMatch = b.category === article.category ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  return article ? { title: article.title, description: article.excerpt } : { title: "Article Not Found" };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();
  const related = await relatedArticles(article);
  const news = isNewsArticle(article);

  return (
    <main className="min-h-screen bg-[#F7F8FA] pt-20">
      <article>
        <header className="relative overflow-hidden bg-[#071E33] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_28rem)]" />
          <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-white/68 transition hover:text-[#F2B544]"><ArrowLeft className="h-4 w-4" />News & Learning</Link>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45"><span>Charismak Editorial Desk</span><span>•</span><span>Nigeria</span></div>
            </div>

            <div className="mt-9 max-w-5xl">
              <div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 bg-[#C8A45D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#071E33]">{news ? <Newspaper className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}{news ? "News" : "Learning"}</span><span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">{article.category}</span></div>
              <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] md:text-6xl">{article.title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 md:text-lg">{article.excerpt}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/52"><span className="font-bold text-white/75">By Charismak Editorial Desk</span><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Date(article.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span><span>{article.readTime}</span><span className="inline-flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5" />Share this article</span></div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-10 bg-white p-7 shadow-[0_12px_40px_rgba(7,30,51,0.06)] md:p-12">
            {article.sections.map((section, index) => (
              <section key={`${section.heading}-${index}`} className="border-t border-[#0D3B66]/10 pt-8 first:border-t-0 first:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Section {String(index + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#071E33] md:text-3xl">{section.heading}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => <p key={`${index}-${paragraphIndex}`} className="mt-5 text-base leading-8 text-[#3A4653]">{paragraph}</p>)}
                {section.points ? <ul className="mt-6 space-y-3 border-l-2 border-[#C8A45D] bg-[#FFF9ED] p-6 text-sm leading-7 text-[#5D4A20]">{section.points.map((point, pointIndex) => <li key={`${index}-${pointIndex}`} className="flex gap-3"><span className="font-bold text-[#C8A45D]">•</span><span>{point}</span></li>)}</ul> : null}
              </section>
            ))}

            <aside className="bg-[#071E33] p-7 text-white md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F2B544]">Put The Information To Work</p>
              <h2 className="mt-4 text-2xl font-semibold">Turn the article into a project decision.</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">Check current price references, calculate materials or develop a preliminary project estimate with Charismak's public construction tools.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Link href="/estimator" className="inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] transition hover:bg-white">Open estimator <ArrowRight className="h-4 w-4" /></Link><Link href="/prices" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-bold text-white">Check prices</Link></div>
            </aside>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <section className="border border-[#0D3B66]/10 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8320A]">About this desk</p><h2 className="mt-3 text-xl font-semibold text-[#071E33]">Charismak News & Learning</h2><p className="mt-3 text-sm leading-7 text-[#3A4653]">Practical Nigerian construction information covering market developments, cost planning, materials, procurement, BOQs and project delivery.</p></section>
            {related.length ? <section className="border border-[#0D3B66]/10 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Continue reading</p><div className="mt-3 divide-y divide-[#0D3B66]/10">{related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="group block py-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A4653]/50">{item.category}</p><h3 className="mt-2 text-sm font-semibold leading-6 text-[#071E33] transition group-hover:text-[#0D3B66]">{item.title}</h3><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#0D3B66]">Read <ArrowRight className="h-3 w-3" /></span></Link>)}</div></section> : null}
          </aside>
        </div>
      </article>
    </main>
  );
}
