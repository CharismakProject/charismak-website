"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Store,
  Tags,
  UsersRound,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ReviewBatch = {
  id: string;
  supplier_name: string;
  supplier_location: string | null;
  form_title: string | null;
  status: "pending" | "review" | "approved" | "rejected";
  submitted_at: string;
};

type SupplierProfile = {
  id: string;
  supplier_code: string;
  business_name: string;
  phone: string;
  location: string;
  status: string;
  updated_at: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published";
  updated_at: string;
};

type AuthState = "checking" | "signed-out" | "forbidden" | "ready";

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(date)
    : "—";
};

const statusClass: Record<ReviewBatch["status"], string> = {
  pending: "bg-[#FFF4D8] text-[#8A5A00]",
  review: "bg-[#EAF2FF] text-[#175FC4]",
  approved: "bg-[#EAF8F0] text-[#197447]",
  rejected: "bg-[#FFF0EC] text-[#9C2D0A]",
};

export default function AdminDashboard() {
  const client = getSupabaseBrowserClient();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [adminEmail, setAdminEmail] = useState("");
  const [email, setEmail] = useState("md@charismakproject.com");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [reviews, setReviews] = useState<ReviewBatch[]>([]);
  const [profiles, setProfiles] = useState<SupplierProfile[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [openReviewCount, setOpenReviewCount] = useState(0);
  const [activeProfileCount, setActiveProfileCount] = useState(0);
  const [publishedPostCount, setPublishedPostCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadDashboard = async () => {
    if (!client) return;
    setLoading(true);
    setDataError("");
    try {
      const [reviewRows, profileRows, postRows, reviewTotal, profileTotal, postTotal] = await Promise.all([
        client.from("supplier_review_batches").select("id,supplier_name,supplier_location,form_title,status,submitted_at").order("submitted_at", { ascending: false }).limit(8),
        client.from("supplier_profiles").select("id,supplier_code,business_name,phone,location,status,updated_at").order("updated_at", { ascending: false }).limit(6),
        client.from("blog_posts").select("id,slug,title,category,status,updated_at").order("updated_at", { ascending: false }).limit(6),
        client.from("supplier_review_batches").select("id", { count: "exact", head: true }).in("status", ["pending", "review"]),
        client.from("supplier_profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        client.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);

      if (reviewRows.error) throw reviewRows.error;
      if (profileRows.error) throw profileRows.error;
      if (postRows.error && postRows.error.code !== "PGRST205") throw postRows.error;

      setReviews((reviewRows.data || []) as ReviewBatch[]);
      setProfiles((profileRows.data || []) as SupplierProfile[]);
      setPosts((postRows.data || []) as BlogPost[]);
      setOpenReviewCount(reviewTotal.count || 0);
      setActiveProfileCount(profileTotal.count || 0);
      setPublishedPostCount(postTotal.count || 0);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!client) {
      setAuthState("forbidden");
      return;
    }
    let mounted = true;
    void client.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const currentEmail = data.session?.user.email || "";
      if (!data.session) {
        setAuthState("signed-out");
        return;
      }
      if (!isAdminEmail(currentEmail)) {
        setAdminEmail(currentEmail);
        setAuthState("forbidden");
        return;
      }
      setAdminEmail(currentEmail);
      setAuthState("ready");
      await loadDashboard();
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const signIn = async () => {
    if (!client) return;
    setAuthError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!isAdminEmail(cleanEmail)) {
      setAuthError("Use an authorised Charismak reviewer email.");
      return;
    }
    const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) {
      setAuthError(error?.message || "Unable to sign in.");
      return;
    }
    if (!isAdminEmail(data.user.email)) {
      await client.auth.signOut();
      setAuthError("This account is not authorised for Charismak administration.");
      return;
    }
    setAdminEmail(data.user.email || cleanEmail);
    setAuthState("ready");
    await loadDashboard();
  };

  const signOut = async () => {
    if (client) await client.auth.signOut();
    setReviews([]);
    setProfiles([]);
    setPosts([]);
    setAdminEmail("");
    setAuthState("signed-out");
  };

  const copySupplierLink = async () => {
    try {
      const url = `${window.location.origin}/supplier-prices`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (authState === "checking") {
    return <div className="grid min-h-[65vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  if (authState === "signed-out") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 md:px-8">
        <section className="rounded-[1.75rem] border border-[#DCE4EC] bg-white p-6 shadow-[0_20px_60px_rgba(7,30,51,0.08)] sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071E33] text-white"><ShieldCheck className="h-5 w-5" /></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Private Charismak workspace</p>
          <h1 className="mt-2 text-3xl font-black text-[#071E33]">Admin Control Centre</h1>
          <p className="mt-3 text-sm leading-6 text-[#617286]">Use the same reviewer account used for supplier-price approvals and Price Admin.</p>
          <div className="mt-6 space-y-4">
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="Reviewer email" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void signIn(); }} type="password" autoComplete="current-password" placeholder="Reviewer password" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
            {authError ? <p className="rounded-xl bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{authError}</p> : null}
            <button type="button" onClick={() => void signIn()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white"><LogIn className="h-4 w-4" /> Sign in</button>
          </div>
        </section>
      </div>
    );
  }

  if (authState === "forbidden") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 md:px-8">
        <section className="rounded-[1.75rem] border border-[#F1C8C0] bg-white p-7 shadow-[0_20px_60px_rgba(7,30,51,0.08)]">
          <ShieldCheck className="h-8 w-8 text-[#A82B05]" />
          <h1 className="mt-4 text-2xl font-black text-[#071E33]">Admin access restricted</h1>
          <p className="mt-3 text-sm leading-6 text-[#617286]">{adminEmail ? `${adminEmail} is signed in but is not an authorised Charismak administrator.` : "The administration service is unavailable."}</p>
          <button type="button" onClick={() => void signOut()} className="mt-5 rounded-xl bg-[#071E33] px-5 py-3 text-sm font-black text-white">Sign out</button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] p-6 text-white shadow-[0_26px_80px_rgba(7,30,51,0.18)] md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(200,164,93,0.22),transparent_28rem)]" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2B544]">Charismak private administration</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">Admin Control Centre</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">Manage supplier activity, prices, marketplace tools and editorial publishing from one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={loading} onClick={() => void loadDashboard()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
            <button type="button" onClick={() => void signOut()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#071E33]"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
        <p className="relative mt-5 text-xs text-white/45">Signed in as {adminEmail}</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF2FF] text-[#175FC4]"><ClipboardCheck className="h-5 w-5" /></span><strong className="text-3xl font-black text-[#071E33]">{openReviewCount}</strong></div><p className="mt-4 text-sm font-black text-[#071E33]">Open supplier reviews</p><p className="mt-1 text-xs leading-5 text-[#617286]">Pending or under review.</p></article>
        <article className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8F0] text-[#197447]"><UsersRound className="h-5 w-5" /></span><strong className="text-3xl font-black text-[#071E33]">{activeProfileCount}</strong></div><p className="mt-4 text-sm font-black text-[#071E33]">Active supplier profiles</p><p className="mt-1 text-xs leading-5 text-[#617286]">Reusable supplier identities.</p></article>
        <article className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF4D8] text-[#8A5A00]"><BookOpen className="h-5 w-5" /></span><strong className="text-3xl font-black text-[#071E33]">{publishedPostCount}</strong></div><p className="mt-4 text-sm font-black text-[#071E33]">Published articles</p><p className="mt-1 text-xs leading-5 text-[#617286]">News and learning content live on the site.</p></article>
        <article className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF0EC] text-[#A82B05]"><Store className="h-5 w-5" /></span><p className="mt-4 text-sm font-black text-[#071E33]">Supplier Portal</p><p className="mt-1 text-xs leading-5 text-[#617286]">Send suppliers here to create profiles or update rates.</p><div className="mt-4 flex gap-3"><Link href="/supplier-prices" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-black text-[#0D3B66]">Open <ExternalLink className="h-3.5 w-3.5" /></Link><button type="button" onClick={() => void copySupplierLink()} className="inline-flex items-center gap-1.5 text-xs font-black text-[#A82B05]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy link"}</button></div></article>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/price-admin" className="group rounded-2xl bg-[#0D3B66] p-5 text-white"><Tags className="h-5 w-5 text-[#F2B544]" /><h2 className="mt-5 text-lg font-black">Price Management</h2><p className="mt-2 text-xs leading-5 text-white/65">Review and maintain Charismak market-price references.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black">Open Price Admin <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></Link>
        <Link href="/blog/manage" className="group rounded-2xl bg-[#071E33] p-5 text-white"><BookOpen className="h-5 w-5 text-[#F2B544]" /><h2 className="mt-5 text-lg font-black">News & Learning Publisher</h2><p className="mt-2 text-xs leading-5 text-white/65">Create, edit, draft, publish and remove construction articles.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black">Manage Blog <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></Link>
        <Link href="/marketplace" target="_blank" className="group rounded-2xl border border-[#DCE4EC] bg-white p-5"><Store className="h-5 w-5 text-[#0D3B66]" /><h2 className="mt-5 text-lg font-black text-[#071E33]">Marketplace</h2><p className="mt-2 text-xs leading-5 text-[#617286]">Review the public supplier and service discovery experience.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#0D3B66]">Open Marketplace <ArrowRight className="h-3.5 w-3.5" /></span></Link>
        <Link href="/estimator" target="_blank" className="group rounded-2xl border border-[#DCE4EC] bg-white p-5"><ClipboardCheck className="h-5 w-5 text-[#0D3B66]" /><h2 className="mt-5 text-lg font-black text-[#071E33]">Estimator Tools</h2><p className="mt-2 text-xs leading-5 text-[#617286]">Review Quick, Detailed and Material Estimate as visitors see them.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#0D3B66]">Open Estimator <ArrowRight className="h-3.5 w-3.5" /></span></Link>
      </section>

      {dataError ? <div className="mt-6 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{dataError}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[1.75rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_12px_40px_rgba(7,30,51,0.05)] md:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Supplier submissions</p>
          <h2 className="mt-2 text-2xl font-black text-[#071E33]">Recent price-review batches</h2>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-[#DCE4EC] text-[10px] uppercase tracking-[0.12em] text-[#617286]"><th className="pb-3 pr-4">Supplier</th><th className="pb-3 pr-4">Submission</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id} className="border-b border-[#EDF1F4] last:border-0"><td className="py-4 pr-4"><strong className="block text-[#071E33]">{review.supplier_name}</strong><span className="mt-1 block text-xs text-[#617286]">{review.supplier_location || dateLabel(review.submitted_at)}</span></td><td className="py-4 pr-4 text-xs text-[#526579]">{review.form_title || "Supplier price update"}</td><td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass[review.status]}`}>{review.status}</span></td><td className="py-4 text-right"><Link href={`/supplier-review/${review.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#071E33] px-3 text-xs font-black text-white">Review <ArrowRight className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody></table>{!loading && !reviews.length ? <p className="py-8 text-center text-sm text-[#617286]">No supplier-review submissions yet.</p> : null}</div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-[#DCE4EC] bg-white p-5 md:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Recent suppliers</p><div className="mt-4 space-y-3">{profiles.map((profile) => <div key={profile.id} className="rounded-xl bg-[#F7F9FB] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#071E33]">{profile.business_name}</p><p className="mt-1 text-xs text-[#617286]">{profile.supplier_code} · {profile.location}</p></div><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-[#197447]">{profile.status}</span></div></div>)}</div>{!loading && !profiles.length ? <p className="mt-4 text-sm text-[#617286]">No supplier profiles yet.</p> : null}</section>
          <section className="rounded-[1.75rem] border border-[#DCE4EC] bg-white p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Editorial</p><h2 className="mt-2 text-lg font-black text-[#071E33]">Recent articles</h2></div><Link href="/blog/manage" className="text-xs font-black text-[#0D3B66]">Manage</Link></div><div className="mt-4 space-y-3">{posts.map((post) => <div key={post.id} className="rounded-xl bg-[#F7F9FB] p-3"><p className="text-sm font-black leading-5 text-[#071E33]">{post.title}</p><div className="mt-2 flex items-center justify-between gap-3 text-[10px]"><span className="text-[#617286]">{post.category}</span><span className={`rounded-full px-2 py-1 font-black uppercase ${post.status === "published" ? "bg-[#EAF8F0] text-[#197447]" : "bg-[#FFF4D8] text-[#8A5A00]"}`}>{post.status}</span></div></div>)}</div>{!loading && !posts.length ? <p className="mt-4 text-sm text-[#617286]">No managed articles yet.</p> : null}</section>
        </div>
      </div>
    </div>
  );
}
