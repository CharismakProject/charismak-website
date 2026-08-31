"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, ImagePlus, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Row = {
  slug: string;
  title: string;
  hero_title: string | null;
  public_category: string;
  engagement_tag: string;
  role: string;
  organisation: string;
  location: string;
  project_status: string;
  client: string | null;
  summary: string;
  attribution: string | null;
  cover_url: string | null;
  hero_images: string[];
  gallery_images: string[];
  videos: string[];
  services: string[];
  featured: boolean;
  published: boolean;
  display_order: number;
};

const blank = (): Row => ({
  slug: "",
  title: "",
  hero_title: "",
  public_category: "Charismak Project",
  engagement_tag: "Direct Contract",
  role: "Main Contractor",
  organisation: "Charismak Project Nigeria Limited",
  location: "Abuja, Nigeria",
  project_status: "Ongoing",
  client: "",
  summary: "",
  attribution: "",
  cover_url: "",
  hero_images: [],
  gallery_images: [],
  videos: [],
  services: [],
  featured: false,
  published: false,
  display_order: 100,
});

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export default function ProjectManager() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    if (!client) return;
    setLoading(true);
    const { data, error: loadError } = await client.from("website_projects").select("*").order("display_order").order("updated_at", { ascending: false });
    if (loadError) setError(loadError.message);
    setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); setLoading(false); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); setLoading(false); return; }
      setAuth("ready");
      await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.title, row.location, row.role, row.organisation, row.project_status].join(" ").toLowerCase().includes(q));
  }, [rows, query]);

  const edit = (row: Row) => { setSelected({ ...row, hero_images: [...(row.hero_images || [])], gallery_images: [...(row.gallery_images || [])], videos: [...(row.videos || [])], services: [...(row.services || [])] }); setOriginalSlug(row.slug); setMessage(""); setError(""); };
  const create = () => { setSelected(blank()); setOriginalSlug(null); setMessage(""); setError(""); };

  const upload = async (files: FileList | null, target: "cover" | "hero" | "gallery") => {
    if (!client || !selected || !files?.length) return;
    setBusy(true); setError("");
    try {
      const slug = selected.slug || slugify(selected.title) || "project";
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `projects/${slug}/${target}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadError } = await client.storage.from("content-media").upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        urls.push(client.storage.from("content-media").getPublicUrl(path).data.publicUrl);
      }
      if (target === "cover") setSelected({ ...selected, cover_url: urls[0] });
      if (target === "hero") setSelected({ ...selected, hero_images: [...selected.hero_images, ...urls] });
      if (target === "gallery") setSelected({ ...selected, gallery_images: [...selected.gallery_images, ...urls] });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!client || !selected) return;
    const slug = slugify(selected.slug || selected.title);
    if (!slug || !selected.title.trim() || !selected.summary.trim()) { setError("Project title, slug and summary are required."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: session } = await client.auth.getSession();
      const payload = { ...selected, slug, updated_at: new Date().toISOString(), updated_by: session.session?.user.email || null };
      if (originalSlug && originalSlug !== slug) {
        const { error: insertError } = await client.from("website_projects").insert(payload);
        if (insertError) throw insertError;
        const { error: deleteError } = await client.from("website_projects").delete().eq("slug", originalSlug);
        if (deleteError) throw deleteError;
      } else {
        const { error: saveError } = await client.from("website_projects").upsert(payload, { onConflict: "slug" });
        if (saveError) throw saveError;
      }
      setMessage(selected.published ? "Project saved and published." : "Project saved as unpublished.");
      setSelected(null); setOriginalSlug(null); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save project."); }
    finally { setBusy(false); }
  };

  const remove = async (row: Row) => {
    if (!client || !window.confirm(`Remove ${row.title} from the website CMS?`)) return;
    setBusy(true); setError("");
    const { error: deleteError } = await client.from("website_projects").delete().eq("slug", row.slug);
    if (deleteError) setError(deleteError.message); else { setMessage("Project removed."); await load(); }
    setBusy(false);
  };

  if (auth === "checking") return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-2xl rounded-3xl border border-[#F0C4BA] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#071E33]">Administrator sign-in required</h1><p className="mt-3 text-sm text-[#617286]">Open the Admin Control Centre and sign in with an authorised Charismak account.</p><Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#071E33] px-5 py-3 text-sm font-black text-white">Go to Admin</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#A82B05]">Website CMS</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Projects</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Add, edit, publish, hide or remove projects without changing website code.</p></div><button type="button" onClick={create} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white"><Plus className="h-4 w-4" /> Add project</button></div>
      {message ? <div className="mt-5 flex gap-2 rounded-xl bg-[#EAF7EF] p-4 text-sm text-[#197447]"><CheckCircle2 className="h-5 w-5" />{message}</div> : null}
      {error ? <div className="mt-5 rounded-xl bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</div> : null}

      <label className="relative mt-6 block max-w-xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#0D3B66]" /></label>

      {loading ? <div className="mt-10 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" /> Loading projects…</div> : rows.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8"><h2 className="text-xl font-black text-[#071E33]">CMS is ready</h2><p className="mt-2 text-sm leading-6 text-[#617286]">No project records have been imported yet. The current public portfolio is still using the migration fallback until the cleaned projects are seeded.</p></div> : <div className="mt-6 grid gap-3">{filtered.map((row) => <article key={row.slug} className="flex flex-col gap-4 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#071E33]">{row.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${row.published ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F1F3F5] text-[#617286]"}`}>{row.published ? "Published" : "Hidden"}</span>{row.featured ? <span className="rounded-full bg-[#FFF8DD] px-2.5 py-1 text-[10px] font-black text-[#7C5C08]">Featured</span> : null}</div><p className="mt-1 text-xs text-[#617286]">{row.location} · {row.role} · {row.project_status}</p></div><div className="flex gap-2"><Link href={`/projects/${row.slug}`} target="_blank" className="grid h-10 w-10 place-items-center rounded-lg border border-[#DCE4EC] text-[#0D3B66]" aria-label="View public project"><ExternalLink className="h-4 w-4" /></Link><button type="button" onClick={() => edit(row)} className="rounded-lg bg-[#0D3B66] px-4 text-xs font-black text-white">Edit</button><button type="button" onClick={() => void remove(row)} className="grid h-10 w-10 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]" aria-label="Remove project"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}

      {selected ? <div className="fixed inset-0 z-[170] overflow-y-auto bg-[#071E33]/75 p-3 backdrop-blur-sm sm:p-6"><section className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DCE4EC] bg-white px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Project editor</p><h2 className="mt-1 text-xl font-black text-[#071E33]">{originalSlug ? "Edit project" : "New project"}</h2></div><button type="button" onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-[#071E33] text-white"><X className="h-5 w-5" /></button></header><div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
        <Field label="Project title *"><input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value, slug: originalSlug ? selected.slug : slugify(e.target.value) })} className="input" /></Field>
        <Field label="URL slug *"><input value={selected.slug} onChange={(e) => setSelected({ ...selected, slug: slugify(e.target.value) })} className="input" /></Field>
        <Field label="Hero subtitle"><input value={selected.hero_title || ""} onChange={(e) => setSelected({ ...selected, hero_title: e.target.value })} className="input" /></Field>
        <Field label="Location"><input value={selected.location} onChange={(e) => setSelected({ ...selected, location: e.target.value })} className="input" /></Field>
        <Field label="Portfolio type"><select value={selected.public_category} onChange={(e) => setSelected({ ...selected, public_category: e.target.value })} className="input"><option>Charismak Project</option><option>MD Professional Experience</option></select></Field>
        <Field label="Engagement"><select value={selected.engagement_tag} onChange={(e) => setSelected({ ...selected, engagement_tag: e.target.value })} className="input"><option>Direct Contract</option><option>Subcontract</option><option>Consultancy</option><option>Supervision</option><option>Quantity Surveying</option><option>Expatriate Experience</option></select></Field>
        <Field label="Role"><input value={selected.role} onChange={(e) => setSelected({ ...selected, role: e.target.value })} className="input" /></Field>
        <Field label="Organisation"><input value={selected.organisation} onChange={(e) => setSelected({ ...selected, organisation: e.target.value })} className="input" /></Field>
        <Field label="Project status"><input value={selected.project_status} onChange={(e) => setSelected({ ...selected, project_status: e.target.value })} className="input" /></Field>
        <Field label="Client"><input value={selected.client || ""} onChange={(e) => setSelected({ ...selected, client: e.target.value })} className="input" /></Field>
        <Field label="Display order"><input type="number" value={selected.display_order} onChange={(e) => setSelected({ ...selected, display_order: Number(e.target.value) })} className="input" /></Field>
        <div className="flex items-center gap-5 pt-6"><label className="flex items-center gap-2 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={selected.published} onChange={(e) => setSelected({ ...selected, published: e.target.checked })} /> Published</label><label className="flex items-center gap-2 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={selected.featured} onChange={(e) => setSelected({ ...selected, featured: e.target.checked })} /> Featured</label></div>
        <Field label="Project summary *" wide><textarea rows={5} value={selected.summary} onChange={(e) => setSelected({ ...selected, summary: e.target.value })} className="input py-3" /></Field>
        <Field label="Services / scope — one per line" wide><textarea rows={5} value={selected.services.join("\n")} onChange={(e) => setSelected({ ...selected, services: lines(e.target.value) })} className="input py-3" /></Field>
        <Field label="Cover image" wide><div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 text-xs font-black text-[#0D3B66]"><ImagePlus className="h-4 w-4" /> Upload cover<input type="file" accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files, "cover")} /></label>{selected.cover_url ? <a href={selected.cover_url} target="_blank" className="text-xs font-bold text-[#0D3B66]">View current cover</a> : null}</div></Field>
        <Field label={`Hero images (${selected.hero_images.length})`} wide><MediaEditor urls={selected.hero_images} onRemove={(url) => setSelected({ ...selected, hero_images: selected.hero_images.filter((item) => item !== url) })} /><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 text-xs font-black text-[#0D3B66]"><ImagePlus className="h-4 w-4" /> Add hero image<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files, "hero")} /></label></Field>
        <Field label={`Gallery images (${selected.gallery_images.length})`} wide><MediaEditor urls={selected.gallery_images} onRemove={(url) => setSelected({ ...selected, gallery_images: selected.gallery_images.filter((item) => item !== url) })} /><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F5F7FA] px-4 py-3 text-xs font-black text-[#0D3B66]"><ImagePlus className="h-4 w-4" /> Add gallery images<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => void upload(e.target.files, "gallery")} /></label></Field>
      </div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-[#DCE4EC] bg-white px-5 py-4"><button type="button" onClick={() => setSelected(null)} className="min-h-11 rounded-xl border border-[#DCE4EC] px-5 text-sm font-black text-[#526579]">Cancel</button><button type="button" disabled={busy} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save project</button></footer></section></div> : null}
      <style jsx global>{`.input{min-height:3rem;width:100%;border:1px solid #DCE4EC;border-radius:.75rem;padding-left:1rem;padding-right:1rem;font-size:.875rem;color:#071E33;outline:none;background:white}.input:focus{border-color:#0D3B66}`}</style>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span>{children}</label>; }
function MediaEditor({ urls, onRemove }: { urls: string[]; onRemove: (url: string) => void }) { return <div className="grid gap-2 sm:grid-cols-2">{urls.map((url) => <div key={url} className="flex items-center gap-2 rounded-xl border border-[#DCE4EC] p-2"><img src={url} alt="Project media" className="h-14 w-20 rounded-lg object-cover" /><span className="min-w-0 flex-1 truncate text-[10px] text-[#617286]">{url}</span><button type="button" onClick={() => onRemove(url)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>; }
