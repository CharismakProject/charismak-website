import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileDown } from "lucide-react";

import LessonBody from "@/components/courses/lesson-body";
import { loadPublishedCourse } from "@/lib/content/courses-data";
import { createSeoMetadata } from "@/lib/seo";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string; lesson: string }> };

async function find(params: Props["params"]) {
  const { slug, lesson } = await params;
  const { course, lessons } = await loadPublishedCourse(slug);
  const index = lessons.findIndex((item) => String(item.position) === lesson);
  return { course, lessons, index, current: index >= 0 ? lessons[index] : null };
}

export async function generateMetadata({ params }: Props) {
  const { course, current } = await find(params);
  if (!course || !current) return {};
  return createSeoMetadata({ title: `${current.title} — ${course.title}`, description: (current.summary || course.summary).slice(0, 160), path: `/courses/${course.slug}/${current.position}`, type: "article" });
}

/** An embeddable link for YouTube/Vimeo videos; other links are shown as a plain link. */
function embed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  return vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
}

export default async function LessonPage({ params }: Props) {
  const { course, lessons, index, current } = await find(params);
  if (!course || !current) notFound();
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const video = current.video_url ? embed(current.video_url) : null;
  return (
    <main className="cx-skin overflow-hidden bg-white pt-20">
      <section className="bg-[#071E33] px-5 py-12 text-white md:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> {course.title}</Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[#F2B544]">Lesson {index + 1} of {lessons.length}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{current.title}</h1>
          {current.summary ? <p className="mt-4 leading-8 text-white/72">{current.summary}</p> : null}
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        {video ? <div className="mb-8 aspect-video overflow-hidden bg-black"><iframe src={video} title={current.title} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div> : current.video_url ? <p className="mb-6"><a href={current.video_url} target="_blank" rel="noreferrer" className="font-bold text-[#0D3B66] underline">Watch the lesson video</a></p> : null}
        <LessonBody body={current.body} />
        {current.pdf_url || course.guide_pdf_url ? (
          <div className="mt-10 flex flex-wrap gap-3">
            {current.pdf_url ? <a href={current.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white"><FileDown className="h-4 w-4" /> Lesson notes (PDF)</a> : null}
            {course.guide_pdf_url ? <a href={course.guide_pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#0D3B66]/25 px-5 py-3 text-sm font-bold text-[#0D3B66]"><FileDown className="h-4 w-4" /> Course study guide (PDF)</a> : null}
          </div>
        ) : null}
      </article>
      <nav aria-label="Lessons" className="mx-auto grid max-w-3xl gap-px bg-[#0D3B66]/10 md:grid-cols-2">
        {prev ? <Link href={`/courses/${course.slug}/${prev.position}`} className="flex items-center gap-3 bg-white p-6 hover:bg-[#F7F8FA]"><ArrowLeft className="h-5 w-5 text-[#C8A45D]" /><span><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Previous</span><span className="font-semibold text-[#071E33]">{prev.title}</span></span></Link> : <span className="bg-white" />}
        {next ? <Link href={`/courses/${course.slug}/${next.position}`} className="flex items-center justify-end gap-3 bg-white p-6 text-right hover:bg-[#F7F8FA]"><span><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Next</span><span className="font-semibold text-[#071E33]">{next.title}</span></span><ArrowRight className="h-5 w-5 text-[#C8A45D]" /></Link> : <Link href={`/courses/${course.slug}`} className="flex items-center justify-end gap-3 bg-white p-6 text-right font-semibold text-[#071E33] hover:bg-[#F7F8FA]">Course complete — back to the course <ArrowRight className="h-5 w-5 text-[#C8A45D]" /></Link>}
      </nav>
    </main>
  );
}
