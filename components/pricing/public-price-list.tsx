"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, PackageSearch, Search, Truck } from "lucide-react";

import type { PriceCategory, PriceItem } from "@/lib/pricing/models";
import { loadPriceItems, PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";

const categories: Array<{ id: "all" | PriceCategory; label: string }> = [
  { id: "all", label: "All" }, { id: "material", label: "Materials" }, { id: "labour", label: "Labour" }, { id: "plant", label: "Plant" }, { id: "subcontract", label: "Subcontract" },
];

const money = (value: number | null, currency: string) => value === null ? "Price required" : new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const buyingGuide = (item: PriceItem) => {
  if (item.id === "sharp-sand") return "Technical: 1 m³ ≈ 1.6 tonnes. Ask suppliers for a named truck capacity such as 5, 10 or 20 m³.";
  if (item.id === "granite-aggregate") return "Technical: 1 m³ ≈ 1.5 tonnes. Compare 10, 20 or 30-tonne truck quotes using the supplier's actual capacity.";
  if (item.id === "cement-50kg") return "20 bags = approximately 1 tonne of cement. Order and count by sealed 50 kg bags.";
  if (item.id === "reinforcement-steel") return "Usually purchased by tonne or 12 m bar length. A Y12 bar is approximately 10.66 kg per 12 m length.";
  if (item.id.startsWith("brc-")) return "Purchased by full 2.4 × 4.8 m sheet. The estimator adds laps and rounds up to complete sheets.";
  if (item.id === "block-225") return "Purchased by piece; compare supplier quotations per 100 blocks and confirm delivery/breakage allowance.";
  if (item.unit === "m²") return "Measured technically per square metre; supplier packaging or labour gang output can be compared separately.";
  return `Priced per ${item.unit}. Confirm brand, specification, delivery and minimum order with the supplier.`;
};

export default function PublicPriceList() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [category, setCategory] = useState<"all" | PriceCategory>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");

  useEffect(() => {
    const refresh = () => setItems(loadPriceItems().filter((item) => item.countryCode === "NG" && item.active));
    refresh();
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
  }, []);

  const locations = useMemo(() => ["all", ...new Set(items.map((item) => item.location).filter(Boolean))], [items]);
  const results = useMemo(() => items.filter((item) => (category === "all" || item.category === category) && (location === "all" || item.location === location) && (!query.trim() || `${item.code} ${item.description} ${item.unit}`.toLowerCase().includes(query.trim().toLowerCase()))), [items, category, location, query]);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-[#081B36] p-6 text-white md:p-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Nigeria building cost reference</p><h1 className="mt-2 max-w-4xl text-3xl font-black md:text-5xl">Material and labour prices in units people actually buy</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">See the technical measurement and the practical buying equivalent together—m³, tonnes, truck capacity, bags, BRC sheets, bar lengths, pieces and labour points.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/estimator" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E7B34B] px-5 py-3 text-sm font-bold text-[#081B36]">Estimate a building <ArrowRight className="h-4 w-4" /></Link><Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white">Find a supplier <Truck className="h-4 w-4" /></Link></div></section>

    <section className="rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#74520D]"><p className="flex items-start gap-2"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" /><span><strong>Planning references—not live quotations.</strong> Prices vary by city, brand, season, exchange rate, quantity and delivery distance. Verify with suppliers before ordering or contracting work.</span></p></section>

    <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5"><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`rounded-full px-4 py-2 text-xs font-bold ${category === item.id ? "bg-[#081B36] text-white" : "bg-[#EEF2F6] text-[#526579]"}`}>{item.label}</button>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]"><label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, BRC, sand, labour…" className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm" /></label><select aria-label="Price location" value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-11 rounded-xl border border-[#CAD5E0] px-3 text-sm"><option value="all">All available locations</option>{locations.slice(1).map((value) => <option key={value}>{value}</option>)}</select></div></section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((item) => <article key={item.id} className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-[#EEF2F6] px-2.5 py-1 text-[9px] font-bold uppercase text-[#617286]">{item.category}</span><span className="text-[10px] font-semibold text-[#7A8B9E]">{item.code}</span></div><h2 className="mt-4 min-h-12 text-base font-bold leading-6 text-[#081B36]">{item.description}</h2><div className="mt-3 rounded-xl bg-[#F5F8FB] p-4"><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#617286]">Reference per {item.unit}</span><strong className={`mt-1 block text-xl ${item.rate === null ? "text-[#B45B09]" : "text-[#081B36]"}`}>{money(item.rate, item.currency)}</strong><span className="mt-1 block text-[10px] text-[#7A8B9E]">{item.location} · {new Date(item.updatedAt).toLocaleDateString("en-NG")}</span></div><div className="mt-3 flex gap-2 rounded-xl border border-[#E3EAF0] p-3"><PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#175FC4]" /><p className="text-[11px] leading-5 text-[#526579]">{buyingGuide(item)}</p></div></article>)}</section>
    {!results.length ? <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center text-sm text-[#617286]">No matching price items. Try a broader search.</section> : null}
  </div>;
}
