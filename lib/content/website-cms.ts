import { createClient } from "@supabase/supabase-js";

import { people, services, type Person, type Project } from "@/app/site-data";
import { publicProjects as fallbackProjects } from "@/lib/content/public-projects";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

const publicClient = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const strings = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

export type ManagedWebsiteProject = Project & { published: boolean; displayOrder: number };
export type ManagedWebsitePerson = Person & { id: string; published: boolean; displayOrder: number };
export type ManagedWebsiteContent = { contentKey: string; section: string; label: string; value: unknown; published: boolean; displayOrder: number };
export type ManagedWebsiteService = { id: string; title: string; description: string; iconKey: string; published: boolean; displayOrder: number };

const rowToProject = (row: Record<string, unknown>): ManagedWebsiteProject => ({
  slug: String(row.slug ?? ""), title: String(row.title ?? "Untitled project"), heroTitle: row.hero_title ? String(row.hero_title) : undefined,
  publicCategory: String(row.public_category ?? "Charismak Project") as Project["publicCategory"], engagementTag: String(row.engagement_tag ?? "Direct Contract") as Project["engagementTag"],
  role: String(row.role ?? "Main Contractor"), organisation: String(row.organisation ?? "Charismak Project Nigeria Limited"), location: String(row.location ?? "Abuja, Nigeria"), status: String(row.project_status ?? "Ongoing"), client: row.client ? String(row.client) : undefined,
  summary: String(row.summary ?? ""), attribution: String(row.attribution ?? ""), cover: String(row.cover_url ?? ""), heroImages: strings(row.hero_images), images: strings(row.gallery_images), videos: strings(row.videos), services: strings(row.services), featured: Boolean(row.featured), showOnProjectsPage: Boolean(row.published), published: Boolean(row.published), displayOrder: Number(row.display_order ?? 100),
});

const rowToPerson = (row: Record<string, unknown>): ManagedWebsitePerson => ({
  id: String(row.id ?? ""), name: String(row.name ?? ""), role: String(row.role ?? ""), image: String(row.image_url ?? ""), group: String(row.group_name ?? "Supporting Team") as Person["group"], category: String(row.category ?? "Project Delivery"), bio: String(row.bio ?? ""), published: Boolean(row.published), displayOrder: Number(row.display_order ?? 100),
});

export async function loadPublishedProjects(): Promise<Project[]> {
  try { const { data, error } = await publicClient().from("website_projects").select("*").eq("published", true).order("display_order", { ascending: true }).order("updated_at", { ascending: false }); if (error || !data?.length) return fallbackProjects; return (data as Record<string, unknown>[]).map(rowToProject); } catch { return fallbackProjects; }
}

export async function loadPublishedProject(slug: string): Promise<Project | null> {
  try { const { data, error } = await publicClient().from("website_projects").select("*").eq("slug", slug).eq("published", true).maybeSingle(); if (!error && data) return rowToProject(data as Record<string, unknown>); } catch { /* fallback */ }
  return fallbackProjects.find((project) => project.slug === slug) ?? null;
}

export async function loadPublishedPeople(): Promise<Person[]> {
  try { const { data, error } = await publicClient().from("website_people").select("*").eq("published", true).order("display_order", { ascending: true }); if (error || !data?.length) return people; return (data as Record<string, unknown>[]).map(rowToPerson); } catch { return people; }
}

export async function loadWebsiteContent(section?: string): Promise<ManagedWebsiteContent[]> {
  try {
    let query = publicClient().from("website_content").select("*").eq("published", true);
    if (section) query = query.eq("section", section);
    const { data, error } = await query.order("display_order", { ascending: true });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((row) => ({ contentKey: String(row.content_key ?? ""), section: String(row.section ?? ""), label: String(row.label ?? ""), value: row.value, published: Boolean(row.published), displayOrder: Number(row.display_order ?? 100) }));
  } catch { return []; }
}

export async function loadPublishedServices(): Promise<ManagedWebsiteService[]> {
  try {
    const { data, error } = await publicClient().from("website_services").select("*").eq("published", true).order("display_order", { ascending: true });
    if (error || !data?.length) throw error || new Error("No managed services");
    return (data as Record<string, unknown>[]).map((row) => ({ id: String(row.id ?? ""), title: String(row.title ?? ""), description: String(row.description ?? ""), iconKey: String(row.icon_key ?? "building"), published: Boolean(row.published), displayOrder: Number(row.display_order ?? 100) }));
  } catch {
    return services.map((service, index) => ({ id: `fallback-${index}`, title: service.title, description: service.description, iconKey: ["building","hardhat","hammer","clipboard","factory","wrench","drafting","home"][index] || "building", published: true, displayOrder: (index + 1) * 10 }));
  }
}
