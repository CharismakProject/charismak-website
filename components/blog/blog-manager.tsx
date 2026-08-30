"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  BookOpen,
  Edit3,
  ExternalLink,
  FilePlus2,
  ImageIcon,
  Loader2,
  LogOut,
  Save,
  Send,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { blogRowToArticle, type BlogPostStatus, type ManagedBlogArticle } from "@/lib/content/blog-data";
import type { BlogArticle } from "@/lib/content/blog";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type EditorState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  contentType: "news" | "learning";
  publishedAt: string;
  readTime: string;
  author: string;
  imageUrl: string;
  imageAlt: string;
  featured: boolean;
  body: string;
};

const emptyEditor = (): EditorState => ({
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  category: "Construction news",
  contentType: "news",
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: "5 min read",
  author: "Charismak Editorial Desk",
  imageUrl: "",
  imageAlt: "",
  featured: false,
  body: "## What happened\n\nWrite the first paragraph here.\n\n## What it means for construction\n\nExplain the practical effect for homeowners and professionals.\n\n- Add an important point\n- Add another important point",
});

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

function parseBody(body: string): BlogArticle["sections"] {
  const sections: BlogArticle["sections"] = [];
  let current: BlogArticle["sections"][number] = { heading: "Overview", paragraphs: [], points: [] };
  const push = () => {
    if (current.paragraphs.length || current.points?.length) {
      sections.push({ ...current, points: current.points?.length ? current.points : undefined });
    }
  };

  body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    if (line.startsWith("## ")) {
      push();
      current = { heading: line.slice(3).trim() || "Section", paragraphs: [], points: [] };
    } else if (line.startsWith("- ")) {
      current.points?.push(line.slice(2).trim());
    } else {
      current.paragraphs.push(line);
    }
  });
  push();
  return sections;
}

function formatBody(sections: BlogArticle["sections"]) {
  return sections.map((section) => [
    `## ${section.heading}`,
    ...section.paragraphs,
    ...(section.points ?? []).map((point) => `- ${point}`),
  ].join("\n\n")).join("\n\n");
}

export default function BlogManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [posts, setPosts] = useState<ManagedBlogArticle[]>([]);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [filter, setFilter] = useState<"all" | "news" | "learning" | "draft">("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!client) {
      setLoadingSession(false);
      return;
    }
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoadingSession(false);
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadingSession(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const admin = isAdminEmail(session?.user.email);

  const loadPosts = async () => {
    if (!client || !admin) return;
    const { data, error } = await client.from("blog_posts").select("*").order("updated_at", { ascending: false });
    if (error) {
      setMessage(error.message);
      return;
    }
    setPosts(((data ?? []) as Parameters<typeof blogRowToArticle>[0][]).map(blogRowToArticle));
  };

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const filteredPosts = useMemo(() => posts.filter((post) => {
    if (filter === "all") return true;
    if (filter === "draft") return post.status === "draft";
    return post.contentType === filter;
  }), [posts, filter]);

  const requestSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !email.trim()) return;
    setBusy(true);
    const cleanEmail = email.trim().toLowerCase();
    if (!isAdminEmail(cleanEmail)) {
      setMessage("Use an authorised Charismak administrator email.");
      setBusy(false);
      return;
    }
    const { error } = await client.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${window.location.origin}/blog/manage`, shouldCreateUser: true },
    });
    setBusy(false);
    setMessage(error ? error.message : "Check your email and use the secure sign-in link to open Content Management.");
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !client) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Article image must be 8 MB or smaller.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const articleSlug = slugify(editor.slug || editor.title) || "draft";
      const path = `articles/${articleSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await client.storage.from("content-media").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = client.storage.from("content-media").getPublicUrl(path);
      setEditor((current) => ({ ...current, imageUrl: data.publicUrl, imageAlt: current.imageAlt || current.title }));
      setMessage("Cover image uploaded. Save or publish the article to keep it attached.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload article image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const savePost = async (status: BlogPostStatus) => {
    if (!client || !admin) return;
    const slug = slugify(editor.slug || editor.title);
    const sections = parseBody(editor.body);
    if (!editor.title.trim() || !slug || !editor.excerpt.trim() || !sections.length) {
      setMessage("Add a title, excerpt and article body before saving.");
      return;
    }
    setBusy(true);
    setMessage("");
    const record = {
      slug,
      title: editor.title.trim(),
      excerpt: editor.excerpt.trim(),
      category: editor.category.trim() || (editor.contentType === "news" ? "Construction news" : "Learning guide"),
      content_type: editor.contentType,
      published_at: new Date(`${editor.publishedAt}T12:00:00.000Z`).toISOString(),
      read_time: editor.readTime.trim() || "5 min read",
      sections,
      status,
      image_url: editor.imageUrl.trim() || null,
      image_alt: editor.imageAlt.trim() || editor.title.trim(),
      featured: editor.featured,
      author: editor.author.trim() || "Charismak Editorial Desk",
      updated_at: new Date().toISOString(),
    };
    const request = editor.id
      ? client.from("blog_posts").update(record).eq("id", editor.id)
      : client.from("blog_posts").insert(record);
    const { error } = await request;
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setEditor(emptyEditor());
    setMessage(status === "published" ? "Article published on News & Learning." : "Draft saved.");
    await loadPosts();
  };

  const editPost = (post: ManagedBlogArticle) => {
    setEditor({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      contentType: post.contentType,
      publishedAt: post.publishedAt.slice(0, 10),
      readTime: post.readTime,
      author: post.author,
      imageUrl: post.imageUrl || "",
      imageAlt: post.imageAlt || "",
      featured: post.featured,
      body: formatBody(post.sections),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStatus = async (post: ManagedBlogArticle, status: BlogPostStatus) => {
    if (!client || !admin) return;
    const { error } = await client.from("blog_posts").update({ status, updated_at: new Date().toISOString() }).eq("id", post.id);
    setMessage(error ? error.message : status === "published" ? "Article published." : "Article moved back to Drafts.");
    if (!error) await loadPosts();
  };

  const removePost = async (post: ManagedBlogArticle) => {
    if (!client || !admin || !window.confirm(`Permanently remove “${post.title}”?`)) return;
    const { error } = await client.from("blog_posts").delete().eq("id", post.id);
    setMessage(error ? error.message : "Article permanently removed.");
    if (!error) {
      if (editor.id === post.id) setEditor(emptyEditor());
      await loadPosts();
    }
  };

  if (loadingSession) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] pt-20"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></main>;

  if (!session) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] px-5 pb-16 pt-28">
        <section className="mx-auto max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-7 shadow-sm">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[#175FC4]"><ArrowLeft className="h-4 w-4" />Admin Control Centre</Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#C8320A]">Administrator access</p>
          <h1 className="mt-2 text-3xl font-black text-[#081B36]">News & Learning Content</h1>
          <p className="mt-3 text-sm leading-6 text-[#617286]">Sign in with an approved Charismak administrator email to create, edit, publish and remove website content.</p>
          <form onSubmit={requestSignIn} className="mt-7 space-y-4">
            <label className="block text-sm font-bold text-[#081B36]">Administrator email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label>
            <button disabled={busy} className="w-full rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send secure sign-in link"}</button>
          </form>
          {message ? <p className="mt-4 rounded-xl bg-[#FFF7E3] p-4 text-sm text-[#795E16]">{message}</p> : null}
        </section>
      </main>
    );
  }

  if (!admin) {
    return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] px-5 pt-20"><section className="max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#081B36]">Administrator access only</h1><p className="mt-3 text-sm leading-6 text-[#617286]">{session.user.email} is signed in but is not approved to manage Charismak content.</p><button onClick={() => void client?.auth.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white"><LogOut className="h-4 w-4" />Sign out</button></section></main>;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 pb-20 pt-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-[#081B36] p-6 text-white md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70"><ArrowLeft className="h-4 w-4" />Admin Control Centre</Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#E7B34B]">Website publishing</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">News & Learning Content</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Run Charismak like a construction newsroom and learning centre: cover images, news/guides, drafts, featured stories and publishing control.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/blog" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-xs font-black"><ExternalLink className="h-4 w-4" />View public channel</Link>
            <button onClick={() => void client?.auth.signOut()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#081B36]"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </header>

        {message ? <p className="mt-5 rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4 text-sm text-[#74520D]">{message}</p> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-3xl border border-[#DCE4EC] bg-white p-5 shadow-sm md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8320A]">{editor.id ? "Edit content" : "New content"}</p><h2 className="mt-1 text-2xl font-black text-[#081B36]">Write and publish</h2></div>
              {editor.id ? <button onClick={() => setEditor(emptyEditor())} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#F1F5F8] px-4 text-xs font-bold text-[#081B36]"><FilePlus2 className="h-4 w-4" />New</button> : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 grid gap-4 sm:grid-cols-[180px_1fr]">
                <div>
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-[#DCE4EC] bg-[#F1F4F7]">
                    {editor.imageUrl ? <img src={editor.imageUrl} alt={editor.imageAlt || editor.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-center"><div><ImageIcon className="mx-auto h-8 w-8 text-[#9AA8B6]" /><p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8B9E]">No cover image</p></div></div>}
                  </div>
                  <label className="mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-3 text-xs font-black text-white"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload cover"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void uploadImage(event)} className="hidden" /></label>
                  {editor.imageUrl ? <button type="button" onClick={() => setEditor((current) => ({ ...current, imageUrl: "", imageAlt: "" }))} className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] text-xs font-bold text-[#A82B05]"><X className="h-3.5 w-3.5" />Remove</button> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm font-bold text-[#081B36]">Content type<select value={editor.contentType} onChange={(event) => setEditor((current) => ({ ...current, contentType: event.target.value as "news" | "learning" }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] bg-white px-4 font-normal"><option value="news">News / market update</option><option value="learning">Learning guide / article</option></select></label>
                  <label className="sm:col-span-2 text-sm font-bold text-[#081B36]">Image alt text<input value={editor.imageAlt} onChange={(event) => setEditor((current) => ({ ...current, imageAlt: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
                  <label className="sm:col-span-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#C9D5E1] px-4 text-sm font-bold text-[#081B36]"><input type="checkbox" checked={editor.featured} onChange={(event) => setEditor((current) => ({ ...current, featured: event.target.checked }))} /><Star className="h-4 w-4 text-[#C8A45D]" />Feature this story</label>
                </div>
              </div>

              <label className="text-sm font-bold text-[#081B36] md:col-span-2">Title<input value={editor.title} onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value), imageAlt: current.imageAlt || event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36]">URL slug<input value={editor.slug} onChange={(event) => setEditor((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36]">Category<input value={editor.category} onChange={(event) => setEditor((current) => ({ ...current, category: event.target.value }))} placeholder="Construction news, Materials, BOQ..." className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36]">Publication date<input type="date" value={editor.publishedAt} onChange={(event) => setEditor((current) => ({ ...current, publishedAt: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36]">Reading time<input value={editor.readTime} onChange={(event) => setEditor((current) => ({ ...current, readTime: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36] md:col-span-2">Author / desk<input value={editor.author} onChange={(event) => setEditor((current) => ({ ...current, author: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[#C9D5E1] px-4 font-normal" /></label>
              <label className="text-sm font-bold text-[#081B36] md:col-span-2">Short summary<textarea rows={3} value={editor.excerpt} onChange={(event) => setEditor((current) => ({ ...current, excerpt: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal leading-6" /></label>
              <label className="text-sm font-bold text-[#081B36] md:col-span-2">Article body<span className="ml-2 text-xs font-normal text-[#617286]">Use ## for headings and - for bullet points.</span><textarea rows={18} value={editor.body} onChange={(event) => setEditor((current) => ({ ...current, body: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-mono text-sm font-normal leading-6" /></label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button disabled={busy || uploading} onClick={() => void savePost("draft")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#081B36] px-5 text-sm font-bold text-[#081B36] disabled:opacity-50"><Save className="h-4 w-4" />Save draft</button>
              <button disabled={busy || uploading} onClick={() => void savePost("published")} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C8320A] px-5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Publish</button>
            </div>
          </section>

          <aside className="rounded-3xl border border-[#DCE4EC] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8320A]">Content library</p><h2 className="mt-1 text-2xl font-black text-[#081B36]">{posts.length} managed items</h2></div>
              <div className="flex flex-wrap gap-1 rounded-xl bg-[#F1F4F7] p-1">{(["all", "news", "learning", "draft"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase ${filter === value ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}>{value}</button>)}</div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredPosts.map((post) => (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-[#FBFCFD]">
                  <div className="grid sm:grid-cols-[120px_1fr]">
                    <div className="min-h-[100px] bg-[#EEF2F6]">{post.imageUrl ? <img src={post.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full min-h-[100px] place-items-center"><ImageIcon className="h-6 w-6 text-[#9AA8B6]" /></div>}</div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${post.contentType === "news" ? "bg-[#FFF0EC] text-[#A82B05]" : "bg-[#EAF2FF] text-[#175FC4]"}`}>{post.contentType}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${post.status === "published" ? "bg-[#EAF8F0] text-[#197447]" : "bg-[#FFF4D8] text-[#8A5A00]"}`}>{post.status}</span>{post.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E3] px-2 py-1 text-[9px] font-black text-[#8A5A00]"><Star className="h-3 w-3" />Featured</span> : null}</div>
                      <h3 className="mt-3 text-base font-black leading-6 text-[#081B36]">{post.title}</h3>
                      <p className="mt-1 text-xs text-[#617286]">{post.category} · {post.readTime}</p>
                      <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => editPost(post)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#C9D5E1] px-3 text-xs font-bold text-[#081B36]"><Edit3 className="h-3.5 w-3.5" />Edit</button>{post.status === "published" ? <button onClick={() => void setStatus(post, "draft")} className="min-h-9 rounded-lg border border-[#E2CF9E] px-3 text-xs font-bold text-[#795E16]">Unpublish</button> : <button onClick={() => void setStatus(post, "published")} className="min-h-9 rounded-lg bg-[#197447] px-3 text-xs font-bold text-white">Publish</button>}<Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#C9D5E1] px-3 text-xs font-bold text-[#175FC4]"><ExternalLink className="h-3.5 w-3.5" />View</Link><button onClick={() => void removePost(post)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#E7B6AC] px-3 text-xs font-bold text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" />Delete</button></div>
                    </div>
                  </div>
                </article>
              ))}
              {!filteredPosts.length ? <div className="rounded-2xl border border-dashed border-[#C9D5E1] p-8 text-center"><BookOpen className="mx-auto h-7 w-7 text-[#9AA8B6]" /><p className="mt-3 text-sm font-bold text-[#617286]">No content in this view yet.</p></div> : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
