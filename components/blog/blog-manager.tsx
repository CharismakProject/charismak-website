"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, Edit3, ExternalLink, FilePlus2, LogOut, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";

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
  publishedAt: string;
  readTime: string;
  body: string;
};

const emptyEditor = (): EditorState => ({
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  category: "Construction news",
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: "5 min read",
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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      setMessage(error.code === "PGRST205"
        ? "The blog database table has not been enabled yet. Run supabase/blog.sql once, then reload this page."
        : error.message);
      return;
    }
    setPosts(((data ?? []) as Parameters<typeof blogRowToArticle>[0][]).map(blogRowToArticle));
  };

  useEffect(() => {
    void loadPosts();
    // load is intentionally tied to authenticated administrator access.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const requestSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !email.trim()) return;
    setBusy(true);
    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/blog/manage`, shouldCreateUser: true },
    });
    setBusy(false);
    setMessage(error ? error.message : "Check your email and use the secure sign-in link to open the blog manager.");
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
    const record = {
      slug,
      title: editor.title.trim(),
      excerpt: editor.excerpt.trim(),
      category: editor.category.trim() || "Construction news",
      published_at: new Date(`${editor.publishedAt}T12:00:00.000Z`).toISOString(),
      read_time: editor.readTime.trim() || "5 min read",
      sections,
      status,
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
    setMessage(status === "published" ? "Article published on the website." : "Draft saved.");
    await loadPosts();
  };

  const editPost = (post: ManagedBlogArticle) => {
    setEditor({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt.slice(0, 10),
      readTime: post.readTime,
      body: formatBody(post.sections),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStatus = async (post: ManagedBlogArticle, status: BlogPostStatus) => {
    if (!client || !admin) return;
    const { error } = await client.from("blog_posts").update({ status, updated_at: new Date().toISOString() }).eq("id", post.id);
    setMessage(error ? error.message : status === "published" ? "Article published." : "Article removed from the public blog and kept as a draft.");
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

  if (loadingSession) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] pt-20"><p className="text-sm font-semibold text-[#526579]">Opening blog manager…</p></main>;

  if (!session) {
    return <main className="min-h-screen bg-[#F5F7FA] px-5 pb-16 pt-28"><section className="mx-auto max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-7 shadow-sm"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#175FC4]"><ArrowLeft className="h-4 w-4" />Back to blog</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#C8320A]">Administrator access</p><h1 className="mt-2 text-3xl font-black text-[#081B36]">Manage construction articles</h1><p className="mt-3 text-sm leading-6 text-[#617286]">Sign in with an approved Charismak administrator email to add, edit, publish or remove website articles.</p><form onSubmit={requestSignIn} className="mt-7 space-y-4"><label className="block text-sm font-bold text-[#081B36]">Administrator email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><button disabled={busy} className="w-full rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send secure sign-in link"}</button></form>{message ? <p className="mt-4 rounded-xl bg-[#FFF7E3] p-4 text-sm text-[#795E16]">{message}</p> : null}</section></main>;
  }

  if (!admin) {
    return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] px-5 pt-20"><section className="max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-8 text-center"><h1 className="text-2xl font-black text-[#081B36]">Administrator access only</h1><p className="mt-3 text-sm leading-6 text-[#617286]">{session.user.email} is signed in but is not approved to manage the Charismak blog.</p><button onClick={() => void client?.auth.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white"><LogOut className="h-4 w-4" />Sign out</button></section></main>;
  }

  return <main className="min-h-screen bg-[#F5F7FA] px-5 pb-20 pt-24 md:px-8"><div className="mx-auto max-w-7xl"><header className="flex flex-col gap-4 rounded-3xl bg-[#081B36] p-6 text-white md:flex-row md:items-end md:justify-between md:p-8"><div><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70"><ArrowLeft className="h-4 w-4" />View public blog</Link><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#E7B34B]">Website publishing</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Blog manager</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Create construction news and guides, keep work as drafts, and control exactly what readers can see.</p></div><button onClick={() => void client?.auth.signOut()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold"><LogOut className="h-4 w-4" />Sign out</button></header>

  {message ? <p className="mt-5 rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4 text-sm text-[#74520D]">{message}</p> : null}

  <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"><section className="rounded-3xl border border-[#DCE4EC] bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8320A]">{editor.id ? "Edit article" : "New article"}</p><h2 className="mt-1 text-2xl font-black text-[#081B36]">Write and publish</h2></div>{editor.id ? <button onClick={() => setEditor(emptyEditor())} className="inline-flex items-center gap-2 rounded-xl bg-[#F1F5F8] px-4 py-2 text-xs font-bold text-[#081B36]"><FilePlus2 className="h-4 w-4" />New article</button> : null}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-[#081B36] md:col-span-2">Title<input value={editor.title} onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value, slug: current.id ? current.slug : slugify(event.target.value) }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><label className="text-sm font-bold text-[#081B36]">URL slug<input value={editor.slug} onChange={(event) => setEditor((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><label className="text-sm font-bold text-[#081B36]">Category<input value={editor.category} onChange={(event) => setEditor((current) => ({ ...current, category: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><label className="text-sm font-bold text-[#081B36]">Publication date<input type="date" value={editor.publishedAt} onChange={(event) => setEditor((current) => ({ ...current, publishedAt: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><label className="text-sm font-bold text-[#081B36]">Reading time<input value={editor.readTime} onChange={(event) => setEditor((current) => ({ ...current, readTime: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal" /></label><label className="text-sm font-bold text-[#081B36] md:col-span-2">Short summary<textarea rows={3} value={editor.excerpt} onChange={(event) => setEditor((current) => ({ ...current, excerpt: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-normal leading-6" /></label><label className="text-sm font-bold text-[#081B36] md:col-span-2">Article body<span className="ml-2 text-xs font-normal text-[#617286]">Use ## for headings and - for bullet points.</span><textarea rows={18} value={editor.body} onChange={(event) => setEditor((current) => ({ ...current, body: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#C9D5E1] px-4 py-3 font-mono text-sm font-normal leading-6" /></label></div><div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} onClick={() => void savePost("draft")} className="inline-flex items-center gap-2 rounded-xl border border-[#081B36] px-5 py-3 text-sm font-bold text-[#081B36] disabled:opacity-50"><Save className="h-4 w-4" />Save draft</button><button disabled={busy} onClick={() => void savePost("published")} className="inline-flex items-center gap-2 rounded-xl bg-[#C8320A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Publish article</button></div></section>

  <section className="rounded-3xl border border-[#DCE4EC] bg-white p-5 shadow-sm md:p-7"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8320A]">All website articles</p><h2 className="mt-1 text-2xl font-black text-[#081B36]">Published and drafts</h2><div className="mt-6 space-y-3">{posts.length ? posts.map((post) => <article key={post.id} className="rounded-2xl border border-[#DCE4EC] p-4"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${post.status === "published" ? "bg-[#E9F8F1] text-[#087A50]" : "bg-[#FFF4E4] text-[#8A4A0A]"}`}>{post.status}</span><h3 className="mt-3 font-bold leading-6 text-[#081B36]">{post.title}</h3><p className="mt-1 text-xs text-[#617286]">{post.category} · {new Date(post.publishedAt).toLocaleDateString("en-NG")}</p></div>{post.status === "published" ? <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${post.title}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F1F5F8] text-[#175FC4]"><ExternalLink className="h-4 w-4" /></a> : null}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => editPost(post)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3F8] px-3 py-2 text-xs font-bold text-[#081B36]"><Edit3 className="h-3.5 w-3.5" />Edit</button><button onClick={() => void setStatus(post, post.status === "published" ? "draft" : "published")} className="rounded-lg bg-[#EEF3F8] px-3 py-2 text-xs font-bold text-[#175FC4]">{post.status === "published" ? "Unpublish" : "Publish"}</button><button onClick={() => void removePost(post)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF0EB] px-3 py-2 text-xs font-bold text-[#C8320A]"><Trash2 className="h-3.5 w-3.5" />Remove</button></div></article>) : <div className="rounded-2xl border border-dashed border-[#C9D5E1] p-8 text-center"><p className="font-bold text-[#081B36]">No database articles yet</p><p className="mt-2 text-sm leading-6 text-[#617286]">Create the first article or enable the supplied blog database script.</p></div>}</div></section></div></div></main>;
}
