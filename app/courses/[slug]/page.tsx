import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileDown, PlayCircle } from "lucide-react";

import { LEVEL_LABEL, loadPublishedCourse } from "@/lib/content/courses-data";
import { createSeoMetadata } from "@/lib/seo";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { course } = await loadPublishedCourse((await params).slug);
  if (!course) return {};
  return createSeoMetadata({ title: `${course.title} — Charismak course`, description: course.summary.slice(0, 160), path: `/courses/${course.slug}`, type: "article" });
}

export default async function CoursePage({ params }: Props) {
  const { course, lessons } = await loadPublishedCourse((await params).slug);
  if (!course) notFound();
  return (
    <main className="cx-skin overflow-hidden bg-white pt-20">
      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Courses</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#F2B544]">{LEVEL_LABEL[course.level]}{course.audience ? ` · ${course.audience}` : ""} · {lessons.length} lesson{lessons.length === 1 ? "" : "s"}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{course.title}</h1>
          <p className="mt-5 max-w-3xl leading-8 text-white/72">{course.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {lessons[0] ? <Link href={`/courses/${course.slug}/${lessons[0].position}`} className="inline-flex items-center gap-2 bg-[#C8A45D] px-6 py-3 text-sm font-bold text-[#071E33] hover:bg-white">Start lesson 1 <ArrowRight className="h-4 w-4" /></Link> : null}
            {course.guide_pdf_url ? <a href={course.guide_pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-bold text-white hover:border-white"><FileDown className="h-4 w-4" /> Download study guide (PDF)</a> : null}
          </div>
        </div>
      </section>
      <section className="px-5 py-14 md:px-8">
        <ol className="mx-auto max-w-5xl divide-y divide-[#0D3B66]/10 border border-[#0D3B66]/10">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/courses/${course.slug}/${lesson.position}`} className="group flex items-start gap-5 p-6 hover:bg-[#F7F8FA]">
                <span className="text-sm font-bold tracking-[0.2em] text-[#C8A45D]">{String(lesson.position).padStart(2, "0")}</span>
                <span className="flex-1">
                  <span className="block text-lg font-semibold text-[#071E33] group-hover:text-[#0D3B66]">{lesson.title}</span>
                  {lesson.summary ? <span className="mt-1 block text-sm leading-7 text-[#3A4653]">{lesson.summary}</span> : null}
                </span>
                {lesson.video_url ? <PlayCircle className="h-5 w-5 shrink-0 text-[#0D3B66]" /> : null}
                <ArrowRight className="h-5 w-5 shrink-0 text-[#C8A45D]" />
              </Link>
            </li>
          ))}
          {!lessons.length ? <li className="p-6 text-[#3A4653]">Lessons are being added.</li> : null}
        </ol>
      </section>
    </main>
  );
}
