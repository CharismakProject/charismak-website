/**
 * Courses & study guides (Learning). Stored in Supabase tables `courses` and `course_lessons`;
 * the public sees published items only (row-level security), admins manage them at /courses/manage.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type Course = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: CourseLevel;
  audience: string | null;
  cover_image_url: string | null;
  guide_pdf_url: string | null;
  guide_pdf_name: string | null;
  status: "draft" | "published";
  sort_order: number;
  updated_at: string;
};
export type CourseLesson = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string | null;
  body: string;
  video_url: string | null;
  pdf_url: string | null;
  status: "draft" | "published";
};

export const LEVEL_LABEL: Record<CourseLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

async function read<T>(table: string, query: string): Promise<T[] | null> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      next: { revalidate: 300, tags: ["courses"] },
    });
    if (!response.ok) return null;
    return (await response.json()) as T[];
  } catch {
    return null;
  }
}

export const loadPublishedCourses = () => read<Course>("courses", "select=*&status=eq.published&order=sort_order.asc,updated_at.desc");

export async function loadPublishedCourse(slug: string) {
  const courses = await read<Course>("courses", `select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  if (courses === null) return { available: false as const, course: null, lessons: [] as CourseLesson[] };
  const course = courses[0] ?? null;
  const lessons = course ? (await read<CourseLesson>("course_lessons", `select=*&course_id=eq.${course.id}&status=eq.published&order=position.asc`)) ?? [] : [];
  return { available: true as const, course, lessons };
}

/** Lesson text: "## Heading" starts a section, "- " or "* " lines are bullet points, blank lines split paragraphs. */
export type LessonBlock = { kind: "heading"; text: string } | { kind: "paragraph"; text: string } | { kind: "list"; items: string[] };
export function parseLessonBody(body: string): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    if (list.length) blocks.push({ kind: "list", items: list });
    paragraph = [];
    list = [];
  };
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (/^#{1,3}\s/.test(line)) { flush(); blocks.push({ kind: "heading", text: line.replace(/^#{1,3}\s+/, "") }); continue; }
    if (/^[-*•]\s+/.test(line)) { if (paragraph.length) { blocks.push({ kind: "paragraph", text: paragraph.join(" ") }); paragraph = []; } list.push(line.replace(/^[-*•]\s+/, "")); continue; }
    if (list.length) { blocks.push({ kind: "list", items: list }); list = []; }
    paragraph.push(line);
  }
  flush();
  return blocks;
}
