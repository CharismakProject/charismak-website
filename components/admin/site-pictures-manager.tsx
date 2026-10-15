"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Eye, ImagePlus, Loader2, RefreshCw, RotateCcw, Send, Star, Trash2, Upload, X } from "lucide-react";

import SiteUpdatesSlider from "@/components/home/site-updates-slider";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  MAX_SITE_PICTURE_BYTES,
  SITE_PICTURE_TYPES,
  pictureStatus,
  rowToSitePicture,
  statusFlags,
  type SitePicture,
  type SitePictureStatus,
} from "@/lib/content/site-pictures";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProjectOption = { slug: string; title: string; location: string; category: string; published: boolean };
type Upload = { name: string; state: "waiting" | "uploading" | "done" | "error"; message?: string };

const BUCKET = "content-media";
const today = () => new Date().toISOString().slice(0, 10);
const isCompany = (project?: ProjectOption) => project?.category === "Charismak Project";

/** Resize to at most 2000 px and re-encode as WebP (JPEG fallback) to keep uploads light. */
async function optimiseImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const blob = (await encode("image/webp")) ?? (await encode("image/jpeg"));
  if (!blob) throw new Error("The image could not be processed.");
  return blob;
}

const titleFromFile = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Site photo";

export default function SitePicturesManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [pictures, setPictures] = useState<SitePicture[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Upload form
  const [uploadProject, setUploadProject] = useState("");
  const [uploadDate, setUploadDate] = useState(today());
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);

  // Filters
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SitePictureStatus>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [editing, setEditing] = useState<SitePicture | null>(null);
  const [preview, setPreview] = useState<SitePicture | null>(null);

  const projectBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);

  const load = async () => {
    if (!client) return;
    setLoading(true);
    const [projectResult, pictureResult] = await Promise.all([
      client.from("website_projects").select("slug,title,location,public_category,published").order("display_order"),
      client.from("website_project_updates").select("*").order("update_date", { ascending: false }),
    ]);
    if (projectResult.error) setError(projectResult.error.message);
    setProjects(
      (projectResult.data ?? []).map((row) => ({
        slug: String(row.slug),
        title: String(row.title),
        location: String(row.location ?? ""),
        category: String(row.public_category ?? ""),
        published: Boolean(row.published),
      })),
    );
    if (pictureResult.error) setError(pictureResult.error.message);
    const rows = (pictureResult.data ?? []) as Record<string, unknown>[];
    setMigrationMissing(!pictureResult.error && rows.length > 0 ? !("archived" in rows[0]) : false);
    if (!pictureResult.error && rows.length === 0) {
      // Probe for the new columns when the table is empty.
      const probe = await client.from("website_project_updates").select("archived").limit(1);
      setMigrationMissing(Boolean(probe.error));
    }
    setPictures(rows.map(rowToSitePicture));
    setLoading(false);
  };

  useEffect(() => {
    if (!client) {
      setAuth("forbidden");
      setLoading(false);
      return;
    }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) {
        setAuth("forbidden");
        setLoading(false);
        return;
      }
      setToken(data.session.access_token);
      setEmail(data.session.user.email ?? "");
      setAuth("ready");
      await load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once after sign-in
  }, []);

  const refreshPublicPages = async () => {
    await fetch("/api/admin/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" }).catch(() => undefined);
  };

  const notify = (text: string) => {
    setMessage(text);
    setError("");
  };

  const fail = (text: string) => {
    setError(text);
    setMessage("");
  };

  const uploadFiles = async (fileList: FileList | null) => {
    if (!client || !fileList?.length) return;
    const project = projectBySlug.get(uploadProject);
    if (!project) return fail("Choose the project these photographs belong to before uploading.");
    const files = Array.from(fileList);
    setUploads(files.map((file) => ({ name: file.name, state: "waiting" })));
    let done = 0;
    for (const [index, file] of files.entries()) {
      const setState = (state: Upload["state"], text?: string) =>
        setUploads((current) => current.map((item, i) => (i === index ? { ...item, state, message: text } : item)));
      if (!SITE_PICTURE_TYPES.includes(file.type)) {
        setState("error", "Use JPEG, PNG or WebP. iPhone HEIC photos must be exported as JPEG first.");
        continue;
      }
      if (file.size > MAX_SITE_PICTURE_BYTES) {
        setState("error", "Larger than 10 MB.");
        continue;
      }
      setState("uploading");
      try {
        const blob = await optimiseImage(file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `site-pictures/${project.slug}/${uploadDate.slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
        const { error: storageError } = await client.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
        if (storageError) throw storageError;
        const imageUrl = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const title = titleFromFile(file.name);
        const { error: insertError } = await client.from("website_project_updates").insert({
          project_slug: project.slug,
          project_title: project.title,
          project_location: project.location,
          title,
          summary: "",
          image_url: imageUrl,
          storage_path: path,
          alt_text: "",
          update_date: new Date(`${uploadDate}T12:00:00Z`).toISOString(),
          featured: uploadFeatured,
          display_order: 100,
          published: false,
          archived: false,
          created_by: email,
          updated_by: email,
        });
        if (insertError) {
          await client.storage.from(BUCKET).remove([path]);
          throw insertError;
        }
        done += 1;
        setState("done");
      } catch (caught) {
        setState("error", caught instanceof Error ? caught.message : "Upload failed.");
      }
    }
    await load();
    if (done) notify(`${done} picture${done === 1 ? "" : "s"} uploaded as drafts. Add a caption and alt text, then publish.`);
  };

  const update = async (picture: SitePicture, changes: Record<string, unknown>, success: string) => {
    if (!client) return;
    setBusyId(picture.id);
    const { error: updateError } = await client
      .from("website_project_updates")
      .update({ ...changes, updated_at: new Date().toISOString(), updated_by: email })
      .eq("id", picture.id);
    setBusyId(null);
    if (updateError) return fail(updateError.message);
    await refreshPublicPages();
    await load();
    notify(success);
  };

  const setStatus = async (picture: SitePicture, status: SitePictureStatus) => {
    if (status === "published") {
      if (!picture.title.trim() || !picture.altText.trim()) return fail("Add a caption and alt text before publishing.");
      if (!isCompany(projectBySlug.get(picture.projectSlug))) {
        if (!window.confirm("This project is professional experience, not a Charismak company project. It will not appear in the homepage slider. Publish anyway?")) return;
      }
    }
    await update(picture, statusFlags(status), status === "published" ? "Published. The homepage refreshes within a few minutes." : status === "archived" ? "Archived and removed from public pages." : "Unpublished and moved back to drafts.");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const project = projectBySlug.get(editing.projectSlug);
    if (!project) return fail("Choose a valid project.");
    if (!editing.title.trim()) return fail("A caption is required.");
    if (editing.published && !editing.altText.trim()) return fail("Published pictures need alt text.");
    await update(
      editing,
      {
        title: editing.title.trim().slice(0, 160),
        summary: editing.summary.trim().slice(0, 600),
        alt_text: editing.altText.trim().slice(0, 200),
        update_date: new Date(`${editing.updateDate.slice(0, 10)}T12:00:00Z`).toISOString(),
        project_slug: project.slug,
        project_title: project.title,
        project_location: project.location,
        featured: editing.featured,
        display_order: Math.max(0, Math.min(999, Math.round(editing.displayOrder) || 100)),
      },
      "Picture details saved.",
    );
    setEditing(null);
  };

  const replaceImage = async (picture: SitePicture, file: File | undefined) => {
    if (!client || !file) return;
    if (!SITE_PICTURE_TYPES.includes(file.type) || file.size > MAX_SITE_PICTURE_BYTES) return fail("Use a JPEG, PNG or WebP image under 10 MB.");
    setBusyId(picture.id);
    try {
      const blob = await optimiseImage(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `site-pictures/${picture.projectSlug}/${picture.updateDate.slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
      const { error: storageError } = await client.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
      if (storageError) throw storageError;
      const oldPath = (await client.from("website_project_updates").select("storage_path").eq("id", picture.id).single()).data?.storage_path as string | undefined;
      await update(picture, { image_url: client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, storage_path: path }, "Image replaced.");
      if (oldPath) await client.storage.from(BUCKET).remove([oldPath]);
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Image replacement failed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (picture: SitePicture) => {
    if (!client) return;
    if (!window.confirm(`Permanently delete "${picture.title}"? The database record and the stored image file will both be removed. This cannot be undone.`)) return;
    setBusyId(picture.id);
    const path = (await client.from("website_project_updates").select("storage_path").eq("id", picture.id).single()).data?.storage_path as string | undefined;
    const { error: deleteError } = await client.from("website_project_updates").delete().eq("id", picture.id);
    if (deleteError) {
      setBusyId(null);
      return fail(deleteError.message);
    }
    // Pictures created before Site Pictures have no storage path; their files are shared with project galleries and are kept.
    if (path) {
      const { error: storageError } = await client.storage.from(BUCKET).remove([path]);
      if (storageError) setError(`Record deleted, but the file could not be removed: ${storageError.message}`);
    }
    setBusyId(null);
    await refreshPublicPages();
    await load();
    if (!path) notify("Record deleted. Its image is shared with the project gallery, so the file was kept.");
    else notify("Picture deleted.");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pictures.filter((picture) => {
      const date = picture.updateDate.slice(0, 10);
      return (
        (projectFilter === "all" || picture.projectSlug === projectFilter) &&
        (statusFilter === "all" || pictureStatus(picture) === statusFilter) &&
        (!featuredOnly || picture.featured) &&
        (!dateFrom || date >= dateFrom) &&
        (!dateTo || date <= dateTo) &&
        (!q || `${picture.title} ${picture.summary} ${picture.projectTitle}`.toLowerCase().includes(q))
      );
    });
  }, [pictures, query, projectFilter, statusFilter, featuredOnly, dateFrom, dateTo]);

  if (auth === "checking") return <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-10 text-sm text-[#617286]"><Loader2 className="h-4 w-4 animate-spin" /> Checking access…</div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-3xl px-4 py-10"><div className="rounded-2xl border border-[#F1C9BE] bg-white p-6"><h1 className="text-xl font-black text-[#071E33]">Administrator access required</h1><p className="mt-2 text-sm text-[#617286]">Sign in from the Control Centre with an authorised Charismak administrator email to manage site pictures.</p></div></div>;

  const companyProjects = projects.filter((project) => isCompany(project));
  const otherProjects = projects.filter((project) => !isCompany(project));
  const statusPill: Record<SitePictureStatus, string> = {
    draft: "bg-[#EEF2F6] text-[#526579]",
    published: "bg-[#EAF7EF] text-[#197447]",
    archived: "bg-[#FDECEA] text-[#8B1E00]",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#A82B05]">Site Updates &amp; Gallery</p>
          <h1 className="mt-1 text-3xl font-black text-[#071E33]">Site Pictures</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">
            Upload photographs from site, tag them to a project and publish them. Published pictures of Charismak company projects appear in the homepage slider: pinned pictures first (by display order), then newest first.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      {migrationMissing ? (
        <div className="rounded-2xl border border-[#E7C75D] bg-[#FFF9E7] p-4 text-sm text-[#5D4600]" role="alert">
          <strong>Database update required.</strong> Apply migration <code>20261015120000_site_pictures_management.sql</code> before uploading. Until then, pictures cannot be saved with featured, order, alt-text or archive details.
        </div>
      ) : null}
      {message ? <p className="rounded-xl bg-[#EAF7EF] px-4 py-3 text-sm text-[#197447]" role="status">{message}</p> : null}
      {error ? <p className="rounded-xl bg-[#FDECEA] px-4 py-3 text-sm text-[#8B1E00]" role="alert">{error}</p> : null}

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
        <h2 className="text-lg font-black text-[#071E33]">Upload pictures</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr_auto]">
          <label className="text-sm font-bold text-[#071E33]">
            Project
            <select value={uploadProject} onChange={(event) => setUploadProject(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] bg-white px-3 font-normal">
              <option value="">Choose a project…</option>
              <optgroup label="Charismak company projects (shown in homepage slider)">
                {companyProjects.map((project) => <option key={project.slug} value={project.slug}>{project.title} — {project.location}{project.published ? "" : " (hidden)"}</option>)}
              </optgroup>
              <optgroup label="MD professional experience (project page only)">
                {otherProjects.map((project) => <option key={project.slug} value={project.slug}>{project.title} — {project.location}{project.published ? "" : " (hidden)"}</option>)}
              </optgroup>
            </select>
          </label>
          <label className="text-sm font-bold text-[#071E33]">
            Date taken
            <input type="date" value={uploadDate} max={today()} onChange={(event) => setUploadDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] px-3 font-normal" />
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-bold text-[#071E33]">
            <input type="checkbox" checked={uploadFeatured} onChange={(event) => setUploadFeatured(event.target.checked)} /> Pin to homepage
          </label>
        </div>
        <label className={`mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-sm ${uploadProject && !migrationMissing ? "border-[#9DB3C8] text-[#0D3B66] hover:bg-[#F5F8FB]" : "cursor-not-allowed border-[#DCE4EC] text-[#9AA9B8]"}`}>
          <ImagePlus className="h-6 w-6" />
          <span className="font-bold">Choose photos from this device</span>
          <span className="text-xs text-[#617286]">JPEG, PNG or WebP · up to 10 MB each · resized to 2000 px before upload · saved as drafts</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!uploadProject || migrationMissing} className="hidden" onChange={(event) => { void uploadFiles(event.target.files); event.target.value = ""; }} />
        </label>
        {uploads.length ? (
          <ul className="mt-3 space-y-1 text-xs">
            {uploads.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex flex-wrap items-center gap-2">
                {item.state === "uploading" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0D3B66]" /> : <Upload className="h-3.5 w-3.5 text-[#9AA9B8]" />}
                <span className="font-bold text-[#071E33]">{item.name}</span>
                <span className={item.state === "error" ? "text-[#8B1E00]" : item.state === "done" ? "text-[#197447]" : "text-[#617286]"}>
                  {item.state === "done" ? "Uploaded as draft" : item.state === "error" ? item.message : item.state === "uploading" ? "Optimising and uploading…" : "Waiting"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
        <div className="grid gap-3 md:grid-cols-6">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captions…" aria-label="Search pictures" className="min-h-10 rounded-xl border border-[#C9D5E1] px-3 text-sm md:col-span-2" />
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label="Filter by project" className="min-h-10 rounded-xl border border-[#C9D5E1] bg-white px-3 text-sm">
            <option value="all">All projects</option>
            {projects.map((project) => <option key={project.slug} value={project.slug}>{project.title}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter by status" className="min-h-10 rounded-xl border border-[#C9D5E1] bg-white px-3 text-sm">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <div className="flex gap-2 md:col-span-2">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Taken from" className="min-h-10 w-full rounded-xl border border-[#C9D5E1] px-2 text-sm" />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Taken to" className="min-h-10 w-full rounded-xl border border-[#C9D5E1] px-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} /> Pinned only</label>
        </div>

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-4 w-4 animate-spin" /> Loading pictures…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[#B8C7D6] p-6 text-center text-sm text-[#617286]">
            {pictures.length ? "No pictures match these filters." : "No site pictures yet. Upload your first photographs above."}
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((picture) => {
              const status = pictureStatus(picture);
              const project = projectBySlug.get(picture.projectSlug);
              const busy = busyId === picture.id;
              return (
                <li key={picture.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white">
                  <div className="relative aspect-[4/3] bg-[#EEF2F6]">
                    <img src={picture.imageUrl} alt={picture.altText || picture.title} loading="lazy" className="h-full w-full object-cover" />
                    <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusPill[status]}`}>{status}</span>
                    {picture.featured ? <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#FFF8DD] px-2.5 py-1 text-[10px] font-black text-[#7C5C08]"><Star className="h-3 w-3" /> Pinned #{picture.displayOrder}</span> : null}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A82B05]">{project?.title ?? picture.projectTitle}{isCompany(project) ? "" : " · professional experience"}</p>
                    <h3 className="font-black leading-5 text-[#071E33]">{picture.title || "Untitled"}</h3>
                    <p className="text-xs text-[#617286]">Taken {picture.updateDate.slice(0, 10)}{picture.altText ? "" : " · alt text missing"}</p>
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      <button type="button" onClick={() => setEditing({ ...picture })} className="min-h-9 rounded-lg bg-[#0D3B66] px-3 text-xs font-bold text-white">Edit</button>
                      <button type="button" onClick={() => setPreview(picture)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#DCE4EC] px-3 text-xs font-bold text-[#0D3B66]"><Eye className="h-3.5 w-3.5" /> Preview</button>
                      {status === "published" ? (
                        <button type="button" disabled={busy} onClick={() => void setStatus(picture, "draft")} className="min-h-9 rounded-lg border border-[#E2CF9E] px-3 text-xs font-bold text-[#795E16]">Unpublish</button>
                      ) : status === "draft" ? (
                        <button type="button" disabled={busy} onClick={() => void setStatus(picture, "published")} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#197447] px-3 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" /> Publish</button>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => void setStatus(picture, "draft")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#DCE4EC] px-3 text-xs font-bold text-[#0D3B66]"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      )}
                      {status !== "archived" ? <button type="button" disabled={busy} onClick={() => void setStatus(picture, "archived")} aria-label="Archive" className="grid min-h-9 w-9 place-items-center rounded-lg border border-[#DCE4EC] text-[#526579]"><Archive className="h-3.5 w-3.5" /></button> : null}
                      <label className="grid min-h-9 w-9 cursor-pointer place-items-center rounded-lg border border-[#DCE4EC] text-[#526579]" aria-label="Replace image" title="Replace image">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void replaceImage(picture, event.target.files?.[0]); event.target.value = ""; }} />
                      </label>
                      <button type="button" disabled={busy} onClick={() => void remove(picture)} aria-label="Delete permanently" className="grid min-h-9 w-9 place-items-center rounded-lg bg-[#FFF1EE] text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" /></button>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin self-center text-[#0D3B66]" /> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#020B16]/60 p-4" role="dialog" aria-modal="true" aria-label="Edit picture">
          <div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#071E33]">Edit picture</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#071E33] sm:col-span-2">Caption / title<input value={editing.title} maxLength={160} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] px-3 font-normal" /></label>
              <label className="text-sm font-bold text-[#071E33] sm:col-span-2">Description of the work shown <span className="font-normal text-[#617286]">(optional)</span><textarea rows={3} maxLength={600} value={editing.summary} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-3 py-2 font-normal" /></label>
              <label className="text-sm font-bold text-[#071E33] sm:col-span-2">Alt text <span className="font-normal text-[#617286]">(what the photo shows, for screen readers — required to publish)</span><input value={editing.altText} maxLength={200} onChange={(event) => setEditing({ ...editing, altText: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] px-3 font-normal" /></label>
              <label className="text-sm font-bold text-[#071E33]">Project<select value={editing.projectSlug} onChange={(event) => setEditing({ ...editing, projectSlug: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] bg-white px-3 font-normal">{projects.map((project) => <option key={project.slug} value={project.slug}>{project.title} — {project.location}</option>)}</select></label>
              <label className="text-sm font-bold text-[#071E33]">Date taken<input type="date" max={today()} value={editing.updateDate.slice(0, 10)} onChange={(event) => setEditing({ ...editing, updateDate: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] px-3 font-normal" /></label>
              <label className="flex items-center gap-2 text-sm font-bold text-[#071E33]"><input type="checkbox" checked={editing.featured} onChange={(event) => setEditing({ ...editing, featured: event.target.checked })} /> Pin to homepage slider</label>
              <label className="text-sm font-bold text-[#071E33]">Pinned display order<input type="number" min={0} max={999} value={editing.displayOrder} onChange={(event) => setEditing({ ...editing, displayOrder: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-xl border border-[#C9D5E1] px-3 font-normal" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setPreview(editing)} className="min-h-11 rounded-xl border border-[#DCE4EC] px-4 text-sm font-bold text-[#0D3B66]">Preview</button>
              <button type="button" onClick={() => void saveEdit()} className="min-h-11 rounded-xl bg-[#071E33] px-5 text-sm font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#020B16]/70 p-4" role="dialog" aria-modal="true" aria-label="Homepage preview">
          <div className="mx-auto my-8 max-w-5xl">
            <div className="mb-3 flex items-center justify-between text-white"><p className="text-sm font-bold">Homepage slide preview</p><button type="button" onClick={() => setPreview(null)} aria-label="Close preview"><X className="h-5 w-5" /></button></div>
            <SiteUpdatesSlider
              slides={[{
                id: preview.id,
                image: preview.imageUrl,
                alt: preview.altText || preview.title,
                projectTitle: projectBySlug.get(preview.projectSlug)?.title ?? preview.projectTitle,
                location: projectBySlug.get(preview.projectSlug)?.location ?? preview.projectLocation,
                title: preview.title,
                summary: preview.summary,
                date: new Date(preview.updateDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
                href: `/projects/${preview.projectSlug}`,
              }]}
            />
            {!isCompany(projectBySlug.get(preview.projectSlug)) ? <p className="mt-3 text-sm text-[#F2B544]">This project is professional experience, so this picture will not appear in the homepage slider.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
