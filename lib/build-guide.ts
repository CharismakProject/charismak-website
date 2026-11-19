import fs from "node:fs";
import path from "node:path";

/**
 * Building Guide content lives in content/build-guide/*.json (one file per page) so it can be edited
 * without touching code. Read at build time; a malformed file fails the build with a clear message.
 */
export type GuidePage = {
  slug: string;
  order: number;
  kind: "stage" | "guide";
  title: string;
  headline: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  duration: string;
  whatHappens: string[];
  problems: string[];
  questions: string[];
  photoCheckpoints: string[];
};

const DIR = path.join(process.cwd(), "content", "build-guide");
const LISTS = ["whatHappens", "problems", "questions", "photoCheckpoints"] as const;
const TEXTS = ["slug", "title", "headline", "seoTitle", "seoDescription", "summary", "duration"] as const;

function parse(file: string): GuidePage {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  } catch (error) {
    throw new Error(`Building Guide: ${file} is not valid JSON (${error instanceof Error ? error.message : error}).`);
  }
  for (const key of TEXTS) if (typeof data[key] !== "string" || !(data[key] as string).trim()) throw new Error(`Building Guide: ${file} needs a "${key}" text.`);
  for (const key of LISTS) if (!Array.isArray(data[key]) || !(data[key] as unknown[]).every((item) => typeof item === "string")) throw new Error(`Building Guide: ${file} needs "${key}" as a list of texts.`);
  if (!/^[a-z0-9-]+$/.test(data.slug as string)) throw new Error(`Building Guide: ${file} slug must be lower-case letters, numbers and dashes.`);
  return { ...(data as unknown as GuidePage), order: Number(data.order) || 99, kind: data.kind === "guide" ? "guide" : "stage" };
}

let cache: GuidePage[] | null = null;
export function getGuidePages(): GuidePage[] {
  if (cache) return cache;
  const pages = fs.readdirSync(DIR).filter((file) => file.endsWith(".json")).map(parse).sort((a, b) => a.order - b.order);
  const slugs = new Set<string>();
  for (const page of pages) {
    if (slugs.has(page.slug)) throw new Error(`Building Guide: two files use the slug "${page.slug}".`);
    slugs.add(page.slug);
  }
  cache = pages;
  return pages;
}

export const getGuidePage = (slug: string) => getGuidePages().find((page) => page.slug === slug) ?? null;
