import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";

import { blogArticles } from "@/lib/content/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return blogArticles.map((article) => ({ slug: article.slug })); }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = blogArticles.find((item) => item.slug === slug);
  return article ? { title: article.title, description: article.excerpt } : { title: "Guide Not Found" };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = blogArticles.find((item) => item.slug === slug);
  if (!article) notFound();
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><article><header className="bg-[#081B36] text-white"><div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70"><ArrowLeft className="h-4 w-4" />All guides</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#E7B34B]">{article.category}</p><h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{article.title}</h1><p className="mt-5 text-base leading-8 text-white/72">{article.excerpt}</p><p className="mt-5 flex items-center gap-2 text-xs text-white/55"><CalendarDays className="h-4 w-4" />{new Date(article.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} · {article.readTime}</p></div></header><div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14"><div className="space-y-10 rounded-2xl border border-[#DCE4EC] bg-white p-6 md:p-10">{article.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-bold text-[#081B36]">{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-[#526579]">{paragraph}</p>)}{section.points ? <ul className="mt-5 space-y-3 rounded-xl bg-[#F5F8FB] p-5 text-sm leading-6 text-[#42576D]">{section.points.map((point) => <li key={point} className="flex gap-3"><span className="font-black text-[#C8320A]">•</span>{point}</li>)}</ul> : null}</section>)}<aside className="rounded-2xl bg-[#081B36] p-6 text-white"><h2 className="text-xl font-bold">Use this guide in a real estimate</h2><p className="mt-2 text-sm leading-6 text-white/70">Start with simple questions, upload a plan for review, enter measured quantities or import an existing BOQ.</p><Link href="/estimator/app#projects" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#E7B34B] px-5 py-3 text-sm font-bold text-[#081B36]">Open the estimator <ArrowRight className="h-4 w-4" /></Link></aside></div></div></article></main>;
}
