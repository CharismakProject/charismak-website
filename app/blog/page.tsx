import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";

import BlogAdminLink from "@/components/blog/blog-admin-link";
import { blogArticles } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";

export const metadata = {
  title: "Construction Cost & Building Guides",
  description: "Plain-language Nigerian construction cost, BOQ, materials and procurement guides for homeowners and professionals.",
};
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const databaseArticles = await loadPublishedBlogArticles();
  const articles = databaseArticles ?? blogArticles;

  return (
    <main className="min-h-screen bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Charismak Journal</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Construction knowledge
            <span className="mt-2 block text-[#E8C77F]">made practical.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            Cost guides, construction news, materials, BOQ explanations and practical ideas for homeowners, builders and professionals.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/estimator" className="inline-flex items-center gap-2 bg-[#0D3B66] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">Estimate a project <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/prices" className="inline-flex items-center gap-2 border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Check price references</Link>
            <BlogAdminLink />
          </div>
        </div>
      </section>

      {articles.length ? (
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="mb-10 grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Latest Articles</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-5xl">Learn before you build.</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#3A4653] lg:justify-self-end">Useful information connected to the decisions people make before, during and after construction.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article key={article.slug} className="group flex flex-col bg-white p-7 shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,30,51,0.11)]">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F7F8FA] text-[#0D3B66]"><BookOpen className="h-5 w-5" /></span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C8A45D]">{article.category}</p>
                </div>
                <h2 className="mt-7 text-xl font-semibold leading-7 text-[#071E33]">{article.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#3A4653]">{article.excerpt}</p>
                <div className="mt-auto pt-7">
                  <p className="flex items-center gap-2 text-[10px] text-[#3A4653]/60"><CalendarDays className="h-3.5 w-3.5" />{new Date(article.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} · {article.readTime}</p>
                  <Link href={`/blog/${article.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66] transition group-hover:text-[#C8A45D]">Read article <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-[#0D3B66]" />
          <h2 className="mt-4 text-2xl font-semibold text-[#071E33]">Construction articles are being prepared</h2>
          <p className="mt-3 text-sm leading-6 text-[#3A4653]">Please check back for the latest Charismak construction news and practical guides.</p>
        </section>
      )}
    </main>
  );
}
