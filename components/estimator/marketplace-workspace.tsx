"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Hammer, MapPin, PackageSearch, Search, Star, Store } from "lucide-react";

import type { Bill } from "@/lib/billing/models";
import { loadMarketplaceProfiles, type MarketplaceProfile, type MarketplaceProfileType } from "@/lib/platform/marketplace";
import type { UniversalProject } from "@/lib/projects/models";

const marketplaceUrl = "https://www.charismakproject.com/marketplace";

export default function EstimatorMarketplaceWorkspace({ project, bill }: { project: UniversalProject | null; bill: Bill | null }) {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [type, setType] = useState<"all" | MarketplaceProfileType>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadMarketplaceProfiles().then((items) => setProfiles(items.filter((item) => item.status === "approved" && !item.isDemo)));
  }, []);

  const requirements = useMemo(() => bill?.materials.slice(0, 6).map((item) => `${item.description} · ${item.purchaseQuantity.toLocaleString()} ${item.unit}`) ?? [], [bill]);
  const results = useMemo(() => profiles.filter((profile) => {
    const haystack = `${profile.businessName} ${profile.category} ${profile.location} ${profile.serviceArea} ${profile.products.join(" ")}`.toLowerCase();
    return (type === "all" || profile.type === type) && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  }), [profiles, query, type]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C8320A]">Estimator procurement support</p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="text-2xl font-bold text-[#081B36] md:text-3xl">Find suppliers and artisans for your estimate</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">The app reads approved marketplace information from the Charismak website. Account registration, public profiles and reviews remain on the website.</p></div>
          <a href={marketplaceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-5 py-3 text-sm font-bold text-[#175FC4]">Open marketplace website <ExternalLink className="h-4 w-4" /></a>
        </div>
      </section>

      {project ? <section className="rounded-2xl border border-[#DCE4EC] bg-[#081B36] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E7B34B]">Current project</p><h2 className="mt-1 text-lg font-bold">{project.name}</h2><p className="mt-1 text-xs text-white/60">{project.location} · supplier and artisan matches can be compared against this project.</p>{requirements.length ? <div className="mt-4 flex flex-wrap gap-2">{requirements.map((item) => <span key={item} className="rounded-full bg-white/10 px-3 py-2 text-[10px] text-white/80">{item}</span>)}</div> : <p className="mt-4 text-xs text-white/60">Create or open a BOQ material schedule to see project purchasing requirements here.</p>}</section> : null}

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5"><div className="grid gap-3 md:grid-cols-[auto_1fr]"><div className="grid grid-cols-3 rounded-xl bg-[#F2F5F8] p-1">{(["all", "supplier", "artisan"] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-2.5 text-xs font-bold capitalize ${type === value ? "bg-white text-[#081B36] shadow-sm" : "text-[#617286]"}`}>{value === "all" ? "Everyone" : `${value}s`}</button>)}</div><label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by material, trade or location" className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm" /></label></div></section>

      {results.length ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((profile) => { const Icon = profile.type === "supplier" ? Store : Hammer; const url = `${marketplaceUrl}?search=${encodeURIComponent(profile.businessName)}`; return <article key={profile.id} className="flex flex-col rounded-2xl border border-[#DCE4EC] bg-white p-5"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${profile.type === "supplier" ? "bg-[#EAF2FF] text-[#175FC4]" : "bg-[#FFF4E4] text-[#B45B09]"}`}><Icon className="h-5 w-5" /></span>{profile.verified ? <span className="rounded-full bg-[#E9F8F1] px-2.5 py-1 text-[9px] font-bold uppercase text-[#087A50]">Verified</span> : null}</div><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#C8320A]">{profile.category}</p><h2 className="mt-1 text-lg font-bold text-[#081B36]">{profile.businessName}</h2><p className="mt-2 flex items-start gap-1.5 text-xs text-[#617286]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{profile.location} · serves {profile.serviceArea}</p>{profile.products.length ? <div className="mt-4 space-y-1.5 rounded-xl bg-[#F8FAFC] p-3">{profile.products.slice(0, 4).map((product) => <p key={product} className="text-[11px] font-semibold text-[#42576D]">• {product}</p>)}</div> : null}<div className="mt-auto pt-4"><p className="flex items-center gap-1 text-xs text-[#617286]"><Star className="h-3.5 w-3.5 fill-[#E7B34B] text-[#E7B34B]" />{profile.reviewCount ? `${profile.rating.toFixed(1)} · ${profile.reviewCount} reviews` : "No public reviews yet"}</p><a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#081B36] px-3 text-xs font-bold text-white">View full profile on website <ExternalLink className="h-3.5 w-3.5" /></a></div></article>; })}</section> : <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center"><PackageSearch className="mx-auto h-8 w-8 text-[#617286]" /><h2 className="mt-3 text-lg font-bold text-[#081B36]">No approved marketplace profiles available yet</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#617286]">Supplier and artisan accounts are created and managed on the website. Approved profiles will automatically become available to the estimator.</p><a href={marketplaceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white">Visit marketplace website <ExternalLink className="h-4 w-4" /></a></section>}
    </div>
  );
}
