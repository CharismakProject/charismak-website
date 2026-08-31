"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw, Search } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Review = {
  id: string;
  supplier_name: string;
  supplier_location: string | null;
  form_title: string | null;
  status: "pending" | "review" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
};

export default function SupplierReviewQueue() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [rows, setRows] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | Review["status"]>("pending");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!client) return;
    setLoading(true); setError("");
    const { data, error: loadError } = await client.from("supplier_review_batches").select("id,supplier_name,supplier_location,form_title,status,submitted_at,reviewed_at").order("submitted_at", { ascending: false }).limit(250);
    if (loadError) setError(loadError.message);
    setRows((data || []) as Review[]); setLoading(false);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); setLoading(false); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); setLoading(false); return; }
      setAuth("ready"); await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => (filter === "all" || row.status === filter) && (!q || [row.supplier_name,row.supplier_location,row.form_title].filter(Boolean).join(" ").toLowerCase().includes(q)));
  }, [rows, filter, query]);

  if (auth === "checking") return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (auth === "forbidden") return <div className="p-10 text-center text-[#617286]">Administrator sign-in required.</div>;

  const counts = rows.reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#A82B05]">Supplier administration</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Supplier Review Queue</h1><p className="mt-2 text-sm leading-6 text-[#617286]">Review, approve or reject submitted prices and remain inside the Admin workspace.</p></div><button onClick={()=>void load()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className="h-4 w-4"/> Refresh</button></div>
    {error ? <p className="mt-5 rounded-xl bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</p> : null}
    <div className="mt-6 flex flex-wrap gap-2">{(["pending","review","approved","rejected","all"] as const).map((value)=><button key={value} onClick={()=>setFilter(value)} className={`rounded-full px-4 py-2 text-xs font-black ${filter===value?"bg-[#071E33] text-white":"bg-white text-[#526579]"}`}>{value === "all" ? `All (${rows.length})` : `${value[0].toUpperCase()+value.slice(1)} (${counts[value] || 0})`}</button>)}</div>
    <label className="relative mt-5 block max-w-xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search supplier or form..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm outline-none"/></label>
    {loading ? <div className="mt-10 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin"/> Loading reviews…</div> : <div className="mt-6 space-y-3">{visible.length ? visible.map((row)=><Link key={row.id} href={`/supplier-review/${row.id}`} className="flex flex-col gap-4 rounded-2xl border border-[#DCE4EC] bg-white p-5 transition hover:border-[#C8A45D] sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#071E33]">{row.supplier_name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${row.status==="approved"?"bg-[#EAF7EF] text-[#197447]":row.status==="rejected"?"bg-[#FFF1EE] text-[#A82B05]":"bg-[#FFF7E7] text-[#8A6500]"}`}>{row.status}</span></div><p className="mt-1 text-xs text-[#617286]">{row.form_title || "Supplier price submission"}{row.supplier_location?` · ${row.supplier_location}`:""} · {new Date(row.submitted_at).toLocaleString("en-NG")}</p></div><span className="inline-flex items-center gap-2 text-xs font-black text-[#0D3B66]">Open review <ArrowRight className="h-4 w-4"/></span></Link>) : <div className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-sm text-[#617286]">No reviews match this selection.</div>}</div>}
  </div>;
}
