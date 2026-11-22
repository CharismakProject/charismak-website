import Link from "next/link";
import { ArrowRight, BookOpen, FileDown, GraduationCap } from "lucide-react";

import { blogArticles } from "@/lib/content/blog";
import { loadPublishedBlogArticles } from "@/lib/content/blog-data";
import { LEVEL_LABEL, loadPublishedCourses } from "@/lib/content/courses-data";
import { isNewsArticle } from "@/lib/content/news";
import { createSeoMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = createSeoMetadata({
  title: "Construction Courses & Study Guides",
  description: "Free construction courses and study guides from Charismak: quantity surveying, building technology, site practice and estimating, written for students and professionals in Nigeria.",
  path: "/courses",
  keywords: ["construction course Nigeria", "quantity surveying study guide", "building technology notes", "construction students Nigeria"],
});

export default async function CoursesPage() {
  const [courses, articles] = await Promise.all([loadPublishedCourses(), loadPublishedBlogArticles()]);
  const guides = (articles ?? blogArticles).filter((article) => !isNewsArticle(article));
  return (
    <main className="cx-skin overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]"><GraduationCap className="h-4 w-4" /> Learning</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Courses & study guides</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 md:text-lg">Step-by-step lessons and downloadable study guides on quantity surveying, building technology and site practice — written for students and early-career professionals in Nigeria.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/blog" className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-sm font-bold text-white hover:border-white">Constru News Channel <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/construction-explorer" className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 text-sm font-bold text-white hover:border-white">Learn construction in 3D <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          {courses === null ? <p className="text-[#3A4653]">Courses could not be loaded right now. Please try again shortly.</p> : null}
          {courses && !courses.length ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
              <span className="inline-block rounded-full border border-[#C8A45D] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#C8A45D]">Coming soon</span>
              <h2 className="mt-4 text-2xl font-semibold text-[#071E33]">Courses and study guides are being prepared.</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#3A4653]">Lessons and downloadable PDF guides will appear here as soon as they are published.</p>
            </div>
          ) : null}
          {courses?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`} className="group flex flex-col overflow-hidden bg-white shadow-[0_10px_35px_rgba(7,30,51,0.06)] transition hover:-translate-y-1">
                  {course.cover_image_url ? <img src={course.cover_image_url} alt="" className="h-44 w-full object-cover" /> : <div className="grid h-44 place-items-center bg-[#0D3B66]"><BookOpen className="h-10 w-10 text-[#E8C77F]" /></div>}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{LEVEL_LABEL[course.level]}{course.audience ? ` · ${course.audience}` : ""}</p>
                    <h2 className="mt-3 text-xl font-semibold text-[#071E33] group-hover:text-[#0D3B66]">{course.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-7 text-[#3A4653]">{course.summary}</p>
                    <p className="mt-5 flex items-center gap-4 text-xs font-bold text-[#0D3B66]">
                      <span className="inline-flex items-center gap-1">Start course <ArrowRight className="h-4 w-4" /></span>
                      {course.guide_pdf_url ? <span className="inline-flex items-center gap-1 text-[#6A1400]"><FileDown className="h-4 w-4" /> Study guide</span> : null}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {guides.length ? (
        <section className="bg-white px-5 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C8A45D]"><BookOpen className="h-4 w-4" /> Free guides</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">Practical construction guides</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`} className="group rounded-xl border border-black/10 bg-[#F7F8FA] p-5 transition hover:bg-white hover:shadow-[0_10px_35px_rgba(7,30,51,0.06)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C8A45D]">{article.category}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-[#071E33] group-hover:text-[#0D3B66]">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#3A4653]">{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
