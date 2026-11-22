"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowDown, ArrowLeft, ArrowUp, FileUp, ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import type { Course, CourseLesson, CourseLevel } from "@/lib/content/courses-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const emptyCourse = (): Partial<Course> => ({ title: "", slug: "", summary: "", level: "beginner", audience: "Students", status: "draft", sort_order: 100, cover_image_url: null, guide_pdf_url: null, guide_pdf_name: null });
const emptyLesson = (position: number): Partial<CourseLesson> => ({ title: "", summary: "", body: "", video_url: "", pdf_url: null, position, status: "published" });
const storagePath = (name: string) => `courses/${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
const input = "mt-1.5 w-full rounded-xl border border-[#C9D5E1] bg-white px-3 py-2.5 text-sm text-[#081B36] outline-none focus:border-[#0D3B66]";

/** Admin page: create courses, add ordered lessons, upload a cover image and PDF study guides, publish. */
export default function CourseManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [course, setCourse] = useState<Partial<Course> | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [lesson, setLesson] = useState<Partial<CourseLesson> | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    void client.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = client.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [client]);
  const admin = isAdminEmail(session?.user.email);

  const loadCourses = useCallback(async () => {
    if (!client || !admin) return;
    const { data, error } = await client.from("courses").select("*").order("sort_order").order("updated_at", { ascending: false });
    if (error) setMessage(`Could not load courses: ${error.message}`); else setCourses((data ?? []) as Course[]);
  }, [client, admin]);
  useEffect(() => { void loadCourses(); }, [loadCourses]);

  const loadLessons = useCallback(async (courseId: string) => {
    if (!client) return;
    const { data, error } = await client.from("course_lessons").select("*").eq("course_id", courseId).order("position");
    if (error) setMessage(`Could not load lessons: ${error.message}`); else setLessons((data ?? []) as CourseLesson[]);
  }, [client]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!client) return;
    const clean = email.trim().toLowerCase();
    if (!isAdminEmail(clean)) { setMessage("Use an authorised Charismak administrator email."); return; }
    setBusy(true);
    const { error } = await client.auth.signInWithOtp({ email: clean, options: { emailRedirectTo: `${window.location.origin}/courses/manage`, shouldCreateUser: true } });
    setBusy(false);
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
  };

  const upload = async (bucket: "content-media" | "study-guides", file: File) => {
    if (!client) return null;
    const path = storagePath(file.name);
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) { setMessage(`Upload failed: ${error.message}`); return null; }
    return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };
  const onFile = (bucket: "content-media" | "study-guides", apply: (url: string, file: File) => void) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (bucket === "study-guides" && file.type !== "application/pdf") { setMessage("Study guides must be PDF files."); return; }
    if (bucket === "content-media" && !file.type.startsWith("image/")) { setMessage("Choose an image file."); return; }
    setBusy(true); setMessage("Uploading…");
    const url = await upload(bucket, file);
    setBusy(false);
    if (url) { apply(url, file); setMessage("Uploaded. Remember to save."); }
  };

  const saveCourse = async () => {
    if (!client || !course) return;
    const record = { title: (course.title ?? "").trim(), slug: slugify(course.slug || course.title || ""), summary: (course.summary ?? "").trim(), level: course.level ?? "beginner", audience: course.audience || null, cover_image_url: course.cover_image_url || null, guide_pdf_url: course.guide_pdf_url || null, guide_pdf_name: course.guide_pdf_name || null, status: course.status ?? "draft", sort_order: Number(course.sort_order) || 100, updated_at: new Date().toISOString() };
    if (record.title.length < 5 || record.summary.length < 20 || !record.slug) { setMessage("A course needs a title (5+ characters) and a summary (20+ characters)."); return; }
    setBusy(true);
    const result = course.id ? await client.from("courses").update(record).eq("id", course.id).select().single() : await client.from("courses").insert(record).select().single();
    setBusy(false);
    if (result.error) { setMessage(`Could not save: ${result.error.message}`); return; }
    setCourse(result.data as Course);
    setMessage(record.status === "published" ? "Saved and published. It appears on /courses within about 5 minutes." : "Saved as a draft (not public).");
    void loadCourses();
    void loadLessons((result.data as Course).id);
  };

  const deleteCourse = async () => {
    if (!client || !course?.id || !window.confirm(`Delete "${course.title}" and all its lessons? This cannot be undone.`)) return;
    const { error } = await client.from("courses").delete().eq("id", course.id);
    if (error) { setMessage(`Could not delete: ${error.message}`); return; }
    setCourse(null); setLessons([]); setMessage("Course deleted."); void loadCourses();
  };

  const saveLesson = async () => {
    if (!client || !course?.id || !lesson) return;
    const record = { course_id: course.id, position: Number(lesson.position) || lessons.length + 1, title: (lesson.title ?? "").trim(), summary: lesson.summary || null, body: lesson.body ?? "", video_url: lesson.video_url || null, pdf_url: lesson.pdf_url || null, status: lesson.status ?? "published", updated_at: new Date().toISOString() };
    if (record.title.length < 3) { setMessage("A lesson needs a title."); return; }
    setBusy(true);
    const { error } = lesson.id ? await client.from("course_lessons").update(record).eq("id", lesson.id) : await client.from("course_lessons").insert(record);
    setBusy(false);
    if (error) { setMessage(`Could not save the lesson: ${error.message}`); return; }
    setLesson(null); setMessage("Lesson saved."); void loadLessons(course.id);
  };

  const moveLesson = async (index: number, delta: number) => {
    if (!client || !course?.id) return;
    const a = lessons[index], b = lessons[index + delta];
    if (!a || !b) return;
    await client.from("course_lessons").update({ position: b.position }).eq("id", a.id);
    await client.from("course_lessons").update({ position: a.position }).eq("id", b.id);
    void loadLessons(course.id);
  };
  const deleteLesson = async (item: CourseLesson) => {
    if (!client || !course?.id || !window.confirm(`Delete lesson "${item.title}"?`)) return;
    await client.from("course_lessons").delete().eq("id", item.id);
    void loadLessons(course.id);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] pt-20"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></main>;
  if (!session || !admin) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] px-5 pb-16 pt-28">
        <section className="mx-auto max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-7 shadow-sm">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#175FC4]"><ArrowLeft className="h-4 w-4" />Admin Control Centre</Link>
          <h1 className="mt-6 text-3xl font-black text-[#081B36]">Courses & study guides</h1>
          <p className="mt-3 text-sm leading-6 text-[#617286]">{session ? "This account is not a Charismak administrator." : "Sign in with an approved Charismak administrator email to create and publish courses."}</p>
          {!session ? (
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-[#081B36]">Administrator email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
              <button disabled={busy} className="w-full rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send secure sign-in link"}</button>
            </form>
          ) : null}
          {message ? <p className="mt-4 rounded-xl bg-[#FFF7E3] p-4 text-sm text-[#795E16]">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#175FC4]"><ArrowLeft className="h-4 w-4" />Admin Control Centre</Link>
            <h1 className="mt-2 text-3xl font-black text-[#081B36]">Courses & study guides</h1>
            <p className="text-sm text-[#617286]">Create a course, add its lessons in order, attach a PDF study guide, then publish. <Link href="/blog/manage" className="font-bold text-[#175FC4]">News manager →</Link></p>
          </div>
          <button type="button" onClick={() => { setCourse(emptyCourse()); setLessons([]); setLesson(null); }} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B66] px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New course</button>
        </div>
        {message ? <p className="mt-4 rounded-xl bg-[#FFF7E3] p-3 text-sm text-[#795E16]">{message}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {courses.map((item) => (
              <button key={item.id} type="button" onClick={() => { setCourse(item); setLesson(null); void loadLessons(item.id); }} className={`block w-full rounded-xl border p-3 text-left text-sm ${course?.id === item.id ? "border-[#0D3B66] bg-white" : "border-[#DCE4EC] bg-white/60 hover:bg-white"}`}>
                <span className="block font-bold text-[#081B36]">{item.title}</span>
                <span className={`text-[11px] font-bold ${item.status === "published" ? "text-[#15803D]" : "text-[#8A6200]"}`}>{item.status === "published" ? "Published" : "Draft"}</span>
              </button>
            ))}
            {!courses.length ? <p className="text-sm text-[#617286]">No courses yet — press “New course”.</p> : null}
          </aside>

          {course ? (
            <section className="space-y-6">
              <div className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
                <h2 className="text-lg font-black text-[#081B36]">{course.id ? "Edit course" : "New course"}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-bold text-[#081B36] md:col-span-2">Title<input className={input} value={course.title ?? ""} onChange={(e) => setCourse({ ...course, title: e.target.value, slug: course.id ? course.slug : slugify(e.target.value) })} /></label>
                  <label className="text-sm font-bold text-[#081B36]">Web address<input className={input} value={course.slug ?? ""} onChange={(e) => setCourse({ ...course, slug: slugify(e.target.value) })} /><span className="text-[11px] font-normal text-[#617286]">/courses/{course.slug || "…"}</span></label>
                  <label className="text-sm font-bold text-[#081B36]">Level<select className={input} value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value as CourseLevel })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                  <label className="text-sm font-bold text-[#081B36]">Who it is for<input className={input} value={course.audience ?? ""} onChange={(e) => setCourse({ ...course, audience: e.target.value })} placeholder="e.g. QS students, site supervisors" /></label>
                  <label className="text-sm font-bold text-[#081B36]">Order on the courses page<input type="number" className={input} value={course.sort_order ?? 100} onChange={(e) => setCourse({ ...course, sort_order: Number(e.target.value) })} /></label>
                  <label className="text-sm font-bold text-[#081B36] md:col-span-2">Summary<textarea rows={3} className={input} value={course.summary ?? ""} onChange={(e) => setCourse({ ...course, summary: e.target.value })} /></label>
                  <div className="text-sm font-bold text-[#081B36]">Cover image
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#C9D5E1] px-3 py-2.5 text-xs text-[#0D3B66]"><ImagePlus className="h-4 w-4" />{course.cover_image_url ? "Replace image" : "Upload image"}<input type="file" accept="image/*" className="sr-only" onChange={onFile("content-media", (url) => setCourse((c) => ({ ...c, cover_image_url: url })))} /></label>
                    {course.cover_image_url ? <img src={course.cover_image_url} alt="" className="mt-2 h-20 rounded object-cover" /> : null}
                  </div>
                  <div className="text-sm font-bold text-[#081B36]">Study guide (PDF)
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#C9D5E1] px-3 py-2.5 text-xs text-[#0D3B66]"><FileUp className="h-4 w-4" />{course.guide_pdf_url ? "Replace PDF" : "Upload PDF"}<input type="file" accept="application/pdf" className="sr-only" onChange={onFile("study-guides", (url, file) => setCourse((c) => ({ ...c, guide_pdf_url: url, guide_pdf_name: file.name })))} /></label>
                    {course.guide_pdf_url ? <a href={course.guide_pdf_url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-[#175FC4] underline">{course.guide_pdf_name || "Current guide"}</a> : null}
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#081B36] md:col-span-2"><input type="checkbox" checked={course.status === "published"} onChange={(e) => setCourse({ ...course, status: e.target.checked ? "published" : "draft" })} /> Published (visible to the public)</label>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void saveCourse()} className="inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Save course</button>
                  {course.id && course.status === "published" ? <Link href={`/courses/${course.slug}`} target="_blank" className="rounded-xl border border-[#C9D5E1] px-4 py-3 text-sm font-bold text-[#0D3B66]">View on site</Link> : null}
                  {course.id ? <button type="button" onClick={() => void deleteCourse()} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#B42318]"><Trash2 className="h-4 w-4" /> Delete course</button> : null}
                </div>
              </div>

              {course.id ? (
                <div className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-[#081B36]">Lessons</h2>
                    <button type="button" onClick={() => setLesson(emptyLesson((lessons.at(-1)?.position ?? 0) + 1))} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3B66] px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add lesson</button>
                  </div>
                  <ol className="mt-3 divide-y divide-[#EEF2F6]">
                    {lessons.map((item, i) => (
                      <li key={item.id} className="flex items-center gap-2 py-2.5 text-sm">
                        <span className="w-6 font-bold text-[#C8A45D]">{i + 1}</span>
                        <button type="button" onClick={() => setLesson(item)} className="flex-1 text-left font-bold text-[#081B36] hover:text-[#175FC4]">{item.title}{item.status === "draft" ? <span className="ml-2 text-[11px] text-[#8A6200]">draft</span> : null}</button>
                        <button type="button" aria-label="Move up" onClick={() => void moveLesson(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" aria-label="Move down" onClick={() => void moveLesson(i, 1)} disabled={i === lessons.length - 1} className="p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                        <button type="button" aria-label="Delete lesson" onClick={() => void deleteLesson(item)} className="p-1 text-[#B42318]"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                    {!lessons.length ? <li className="py-3 text-sm text-[#617286]">No lessons yet.</li> : null}
                  </ol>

                  {lesson ? (
                    <div className="mt-4 grid gap-4 rounded-xl bg-[#F7F9FB] p-4 md:grid-cols-2">
                      <label className="text-sm font-bold text-[#081B36] md:col-span-2">Lesson title<input className={input} value={lesson.title ?? ""} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} /></label>
                      <label className="text-sm font-bold text-[#081B36] md:col-span-2">Short summary<input className={input} value={lesson.summary ?? ""} onChange={(e) => setLesson({ ...lesson, summary: e.target.value })} /></label>
                      <label className="text-sm font-bold text-[#081B36] md:col-span-2">Lesson text<span className="ml-2 text-xs font-normal text-[#617286]">Start a line with ## for a heading and - for a bullet point. Leave a blank line between paragraphs.</span><textarea rows={14} className={`${input} font-mono`} value={lesson.body ?? ""} onChange={(e) => setLesson({ ...lesson, body: e.target.value })} /></label>
                      <label className="text-sm font-bold text-[#081B36]">Video link (YouTube or Vimeo, optional)<input className={input} value={lesson.video_url ?? ""} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} /></label>
                      <div className="text-sm font-bold text-[#081B36]">Lesson notes (PDF, optional)
                        <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#C9D5E1] bg-white px-3 py-2.5 text-xs text-[#0D3B66]"><FileUp className="h-4 w-4" />{lesson.pdf_url ? "Replace PDF" : "Upload PDF"}<input type="file" accept="application/pdf" className="sr-only" onChange={onFile("study-guides", (url) => setLesson((l) => ({ ...l, pdf_url: url })))} /></label>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-bold text-[#081B36]"><input type="checkbox" checked={lesson.status !== "draft"} onChange={(e) => setLesson({ ...lesson, status: e.target.checked ? "published" : "draft" })} /> Show this lesson</label>
                      <div className="flex gap-2 md:col-span-2">
                        <button type="button" disabled={busy} onClick={() => void saveLesson()} className="inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Save lesson</button>
                        <button type="button" onClick={() => setLesson(null)} className="rounded-xl px-4 py-3 text-sm font-bold text-[#617286]">Cancel</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : <p className="text-sm text-[#617286]">Save the course first, then add its lessons.</p>}
            </section>
          ) : <p className="text-sm text-[#617286]">Choose a course on the left, or create a new one.</p>}
        </div>
      </div>
    </main>
  );
}
