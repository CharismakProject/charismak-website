import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";

import { blogArticles } from "@/lib/content/blog";
import { loadPublishedBlogArticle } from "@/lib/content/blog-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

async function findArticle(slug: string) {
  const result = await loadPublishedBlogArticle(slug);
  return result.databaseAvailable ? result.article : blogArticles.find((item) => item.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  return article ? { title: article.title, description: article.excerpt } : { title: "Guide Not Found" };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#F7F8FA] pt-20">
      <article>
        <header className="relative overflow-hidden bg-[#071E33] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_28rem)]" />
          <div className="relative mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-white/68 transition hover:text-[#F2B544]"><ArrowLeft className="h-4 w-4" />All articles</Link>
            <p className="mt-9 text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">{article.category}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">{article.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/72">{article.excerpt}</p>
            <p className="mt-6 flex items-center gap-2 text-xs text-white/52"><CalendarDays className="h-4 w-4" />{new Date(article.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} · {article.readTime}</p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
          <div className="space-y-12 bg-white p-7 shadow-[0_12px_40px_rgba(7,30,51,0.06)] md:p-12">
            {article.sections.map((section, index) => (
              <section key={section.heading} className="border-t border-[#0D3B66]/10 pt-8 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-xs font-bold tracking-[0.2em] text-[#C8A45D]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#071E33]">{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-[#3A4653]">{paragraph}</p>)}
                    {section.points ? (
                      <ul className="mt-6 space-y-3 bg-[#F7F8FA] p-6 text-sm leading-7 text-[#3A4653]">
                        {section.points.map((point) => <li key={point} className="flex gap-3"><span className="font-bold text-[#C8A45D]">•</span>{point}</li>)}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}

            <aside className="bg-[#071E33] p-7 text-white md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F2B544]">Put The Guide To Work</p>
              <h2 className="mt-4 text-2xl font-semibold">Use this information in a real estimate.</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">Start with simple questions, upload a plan for review, enter measured quantities or import an existing BOQ.</p>
              <Link href="/estimator/app#projects" className="mt-6 inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] transition hover:bg-white">Open the estimator <ArrowRight className="h-4 w-4" /></Link>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
