"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, PackageSearch, Search, Truck } from "lucide-react";
import type { PriceCategory, PriceItem } from "@/lib/pricing/models";
import { formatPriceRange, getPriceHistorySummary } from "@/lib/pricing/price-history";
import { loadPriceItems, PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";

const categories: Array<{ id: "all" | PriceCategory; label: string }> = [
  { id: "all", label: "All" }, { id: "material", label: "Materials" }, { id: "labour", label: "Labour" }, { id: "plant", label: "Plant" }, { id: "subcontract", label: "Subcontract" },
];

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

  return (
    <div>
      <section className="relative overflow-hidden bg-[#071E33] p-7 text-white md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_15%,rgba(200,164,93,0.14),transparent_24rem)]" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Nigeria Building Cost Reference</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Material and labour prices in units people actually buy.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">See technical measurement and practical buying equivalents together—m³, tonnes, truck capacity, bags, sheets, bar lengths, pieces and labour points.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/estimator" className="inline-flex min-h-11 items-center gap-2 bg-[#C8A45D] px-5 py-3 text-sm font-bold text-[#071E33] transition hover:bg-white">Estimate a building <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Find a supplier <Truck className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="border-x border-b border-[#C8A45D]/30 bg-[#FFFDF7] p-5 text-xs leading-6 text-[#66501D]">
        <p className="flex items-start gap-2"><AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#C8A45D]" /><span><strong>Planning references—not live quotations.</strong> When more than one recent price is still within its validity period, Charismak shows the valid market range. Expired prices are removed from the live range automatically and retained only in price history. Verify with suppliers before ordering or contracting work.</span></p>
      </section>

      <section className="mt-8 border border-[#0D3B66]/10 bg-white p-5 shadow-[0_8px_28px_rgba(7,30,51,0.05)]">
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`px-4 py-2 text-xs font-bold transition ${category === item.id ? "bg-[#0D3B66] text-white" : "border border-[#0D3B66]/10 bg-[#F7F8FA] text-[#3A4653] hover:border-[#C8A45D]"}`}>{item.label}</button>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px]">
          <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-[#3A4653]/55" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, BRC, sand, labour…" className="min-h-11 w-full border border-[#0D3B66]/15 pl-10 pr-3 text-sm" /></label>
          <select aria-label="Price location" value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-11 border border-[#0D3B66]/15 px-3 text-sm"><option value="all">All available locations</option>{locations.slice(1).map((value) => <option key={value}>{value}</option>)}</select>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((item) => {
          const summary = getPriceHistorySummary(item);
          const livePrice = formatPriceRange(item);
          const latestDate = summary.latestValid?.recordedAt ?? summary.latestRecorded?.recordedAt ?? item.updatedAt;
          return (
            <article key={item.id} className="bg-white p-6 shadow-[0_10px_35px_rgba(7,30,51,0.06)]">
              <div className="flex items-start justify-between gap-3"><span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#C8A45D]">{item.category}</span><span className="text-[10px] font-semibold text-[#3A4653]/55">{item.code}</span></div>
              <h2 className="mt-4 min-h-12 text-base font-semibold leading-6 text-[#071E33]">{item.description}</h2>
              <div className="mt-4 border-l border-[#C8A45D] bg-[#F7F8FA] p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#3A4653]/65">Reference per {item.unit}</span>
                <strong className={`mt-1 block text-xl ${livePrice ? "text-[#071E33]" : "text-[#8B6B23]"}`}>{livePrice ?? "Price update required"}</strong>
                <span className="mt-1 block text-[10px] text-[#3A4653]/55">{item.location} · latest {new Date(latestDate).toLocaleDateString("en-NG")}</span>
                {summary.currentCount > 1 ? <span className="mt-2 inline-flex bg-[#EAF4EF] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#225B3D]">{summary.currentCount} valid prices in range</span> : summary.currentCount === 1 ? <span className="mt-2 inline-flex bg-[#EEF3F7] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#0D3B66]">Current valid price</span> : <span className="mt-2 inline-flex bg-[#FFF4E5] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#875B14]">Last price expired</span>}
              </div>
              <div className="mt-4 flex gap-3 border-t border-[#0D3B66]/10 pt-4"><PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#0D3B66]" /><p className="text-[11px] leading-5 text-[#3A4653]">{buyingGuide(item)}</p></div>
            </article>
          );
        })}
      </section>

      {!results.length ? <section className="mt-6 border border-dashed border-[#0D3B66]/20 bg-white p-8 text-center text-sm text-[#3A4653]">No matching price items. Try a broader search.</section> : null}
    </div>
  );
}