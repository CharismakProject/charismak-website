"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { exportPriceItemsCsv, importPriceItemsCsv } from "@/lib/pricing/csv";
import {
  createMarketPriceList,
  loadMarketSettings,
  saveMarketSettings,
  type PriceMarketSettings,
} from "@/lib/pricing/market-store";
import { CONSTRUCTION_MARKETS, getConstructionMarket } from "@/lib/pricing/markets";
import type { PriceCategory, PriceItem } from "@/lib/pricing/models";
import {
  PRICE_LIBRARY_UPDATED_EVENT,
  addPriceItem,
  loadPriceItems,
  resetPriceLibrary,
  savePriceItems,
  updatePriceItem,
} from "@/lib/pricing/store";

const categories: Array<{ id: "all" | PriceCategory; label: string }> = [
  { id: "all", label: "All prices" },
  { id: "material", label: "Materials" },
  { id: "labour", label: "Labour" },
  { id: "plant", label: "Plant" },
  { id: "subcontract", label: "Subcontract" },
];

const money = (value: number | null, currency = "NGN") =>
  value === null
    ? "Not priced"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(value);

export default function PriceLibrary({
  onOpenEstimate,
}: {
  onOpenEstimate: () => void;
}) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [filter, setFilter] = useState<"all" | PriceCategory>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [marketSettings, setMarketSettings] = useState<PriceMarketSettings>(() => loadMarketSettings());
  const [checkingSources, setCheckingSources] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(20);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setItems(loadPriceItems());
    refresh();
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (marketSettings.updateMode !== "automatic") return;
    const lastCheck = marketSettings.lastCheckedAt
      ? new Date(marketSettings.lastCheckedAt).getTime()
      : 0;
    if (Date.now() - lastCheck < 24 * 60 * 60 * 1000) return;
    let cancelled = false;
    fetch(`/api/pricing/providers?country=${marketSettings.countryCode}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Price-source service did not respond.")))
      .then((result: { checkedAt: string; message: string }) => {
        if (cancelled) return;
        const next = saveMarketSettings({ ...marketSettings, lastCheckedAt: result.checkedAt });
        setMarketSettings(next);
        setMessage(`Automatic source check: ${result.message}`);
      })
      .catch(() => {
        if (!cancelled) setMessage("Automatic price-source check could not be completed.");
      });
    return () => { cancelled = true; };
  }, [marketSettings]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const categoryMatches = filter === "all" || item.category === filter;
      const searchMatches =
        !term ||
        `${item.code} ${item.description} ${item.location} ${item.source}`
          .toLowerCase()
          .includes(term);
      return categoryMatches && searchMatches;
    });
  }, [filter, items, search]);

  useEffect(() => setVisibleLimit(20), [filter, search]);

  const displayedItems = visibleItems.slice(0, visibleLimit);

  const missingCount = items.filter((item) => item.rate === null).length;
  const market = getConstructionMarket(marketSettings.countryCode);

  const update = (id: string, patch: Partial<PriceItem>) => {
    setItems(updatePriceItem(id, patch));
    setMessage("Price saved. Open draft estimates recalculate automatically.");
  };

  const addItem = () => {
    const item = addPriceItem();
    setItems(loadPriceItems());
    setFilter("all");
    setSearch(item.code);
    setMessage("Custom price item added. Update its description, unit and rate.");
  };

  const exportCsv = () => {
    const blob = new Blob([exportPriceItemsCsv(items)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `charismak-price-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Price list exported. Edit it in Excel and import it again when ready.");
  };

  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = importPriceItemsCsv(await file.text(), items);
      savePriceItems(imported);
      setItems(imported);
      setMessage(`${imported.length} price rows loaded. Draft estimates recalculated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import price list.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const reset = () => {
    if (!window.confirm("Restore the Nigeria starter reference prices? Your manually entered prices will be replaced.")) return;
    setItems(resetPriceLibrary());
    setMessage("Nigeria starter references restored. Verify them before commercial use.");
  };

  const activateMarket = () => {
    const selected = getConstructionMarket(marketSettings.countryCode);
    const warning = selected.countryCode === "NG"
      ? "Load the Nigeria starter reference prices for this city?"
      : `Switch to ${selected.country}? Nigeria rates will be cleared because no verified exact ${selected.country} supplier feed is connected yet.`;
    if (!window.confirm(warning)) return;
    const nextSettings = saveMarketSettings({
      ...marketSettings,
      currency: selected.currency,
    });
    const nextItems = createMarketPriceList(items, nextSettings);
    savePriceItems(nextItems);
    setItems(nextItems);
    setMarketSettings(nextSettings);
    setMessage(`${selected.country} market selected. ${selected.countryCode === "NG" ? "Starter references loaded." : "Import or enter verified local prices before commercial use."}`);
  };

  const checkSources = async () => {
    setCheckingSources(true);
    try {
      const response = await fetch(`/api/pricing/providers?country=${marketSettings.countryCode}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Price-source service did not respond.");
      const result = await response.json() as { checkedAt: string; message: string };
      const next = saveMarketSettings({ ...marketSettings, lastCheckedAt: result.checkedAt });
      setMarketSettings(next);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check price sources.");
    } finally {
      setCheckingSources(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-[#071E33] p-6 text-white shadow-[0_24px_70px_rgba(7,30,51,0.18)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E7B34B]">Project price intelligence</p>
            <h2 className="mt-3 text-3xl font-bold">Price Library</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Maintain material, labour, plant and subcontract prices once. Starter references, analysed rates and verified market updates remain visibly separated.
            </p>
          </div>
          <button type="button" onClick={onOpenEstimate} className="rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white">Open Estimate Builder</button>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">Price items</span><strong className="mt-1 block text-2xl">{items.length}</strong></div>
          <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">Priced</span><strong className="mt-1 block text-2xl">{items.length - missingCount}</strong></div>
          <div className={`rounded-2xl p-4 ${missingCount ? "bg-[#C8320A]" : "bg-[#167C5A]"}`}><span className="text-xs text-white/70">Awaiting price</span><strong className="mt-1 block text-2xl">{missingCount}</strong></div>
        </div>
      </section>

      <details className="group rounded-[28px] border border-[#d6dfe9] bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C8320A]">Market intelligence</p><h3 className="mt-1 text-lg font-bold">{market.country} · {marketSettings.city}</h3><p className="mt-1 text-xs text-[#526579]">{marketSettings.updateMode} checks · {marketSettings.lastCheckedAt ? `last checked ${new Date(marketSettings.lastCheckedAt).toLocaleString("en-NG")}` : "not checked yet"}</p></div><span className="rounded-full bg-[#EEF3F8] px-4 py-2 text-xs font-bold text-[#0D3B66] group-open:bg-[#0D3B66] group-open:text-white">Settings +</span></summary>
        <div className="border-t border-[#DFE6EE] p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr_auto_auto] xl:items-end">
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#526579]">Country<select value={marketSettings.countryCode} onChange={(event) => { const nextMarket = getConstructionMarket(event.target.value); setMarketSettings((current) => ({ ...current, countryCode: nextMarket.countryCode, currency: nextMarket.currency, city: nextMarket.defaultCity })); }} className="mt-2 w-full rounded-2xl border border-[#CCD7E3] px-4 py-3 text-sm font-normal normal-case tracking-normal text-[#071E33]">{CONSTRUCTION_MARKETS.map((item) => <option key={item.countryCode} value={item.countryCode}>{item.country}</option>)}</select></label>
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#526579]">City / market<input value={marketSettings.city} onChange={(event) => setMarketSettings((current) => ({ ...current, city: event.target.value }))} className="mt-2 w-full rounded-2xl border border-[#CCD7E3] px-4 py-3 text-sm font-normal normal-case tracking-normal text-[#071E33]" /></label>
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#526579]">Update mode<select value={marketSettings.updateMode} onChange={(event) => setMarketSettings((current) => ({ ...current, updateMode: event.target.value as PriceMarketSettings["updateMode"] }))} className="mt-2 w-full rounded-2xl border border-[#CCD7E3] px-4 py-3 text-sm font-normal normal-case tracking-normal text-[#071E33]"><option value="automatic">Automatic checks</option><option value="review">Review before applying</option><option value="manual">Manual only</option></select></label>
          <button type="button" onClick={activateMarket} className="rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white">Use market</button>
          <button type="button" onClick={checkSources} disabled={checkingSources} className="rounded-full border border-[#0D3B66] px-5 py-3 text-sm font-bold text-[#0D3B66] disabled:opacity-50">{checkingSources ? "Checking…" : "Check sources"}</button>
        </div>
        <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-[#F4F7FA] p-4 text-xs leading-5 text-[#526579] sm:flex-row sm:items-center sm:justify-between"><p><strong className="text-[#071E33]">{market.providerName}</strong><br />Official index coverage registered. Exact supplier selling prices require a verified feed, quotation or approved import.</p><a href={market.providerUrl} target="_blank" rel="noreferrer" className="font-bold text-[#0D3B66]">Open official source ↗</a></div>
        </div>
      </details>

      <section className="rounded-[28px] border border-[#d6dfe9] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category.id} type="button" onClick={() => setFilter(category.id)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === category.id ? "bg-[#0D3B66] text-white" : "bg-[#EEF3F8] text-[#526579]"}`}>{category.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search price list" className="min-w-[220px] rounded-full border border-[#CCD7E3] px-4 py-2 text-sm" />
            <button type="button" onClick={addItem} className="rounded-full bg-[#C8320A] px-4 py-2 text-sm font-bold text-white">Add Item</button>
            <button type="button" onClick={exportCsv} className="rounded-full border border-[#0D3B66] px-4 py-2 text-sm font-bold text-[#0D3B66]">Export CSV</button>
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full border border-[#0D3B66] px-4 py-2 text-sm font-bold text-[#0D3B66]">Import CSV</button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => importCsv(event.target.files?.[0])} />
          </div>
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-[#FFF7E3] px-4 py-3 text-sm text-[#795E16]">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#d6dfe9] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full border-collapse text-sm">
            <thead><tr className="bg-[#0D3B66] text-left text-[11px] uppercase tracking-[0.08em] text-white"><th className="p-3">Code</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Unit</th><th className="p-3 text-right">Current rate</th><th className="p-3">Location</th><th className="p-3">Source</th><th className="p-3">Updated</th></tr></thead>
            <tbody>
              {displayedItems.map((item) => (
                <tr key={item.id} className="border-b border-[#DFE6EE] align-top hover:bg-[#F8FAFC]">
                  <td className="p-3"><input value={item.code} onChange={(event) => update(item.id, { code: event.target.value })} className="w-24 rounded-xl border border-[#CCD7E3] px-3 py-2 font-semibold" /></td>
                  <td className="p-3"><input value={item.description} onChange={(event) => update(item.id, { description: event.target.value })} className="w-72 rounded-xl border border-[#CCD7E3] px-3 py-2" /></td>
                  <td className="p-3"><select value={item.category} onChange={(event) => update(item.id, { category: event.target.value as PriceCategory })} className="rounded-xl border border-[#CCD7E3] px-3 py-2"><option value="material">Material</option><option value="labour">Labour</option><option value="plant">Plant</option><option value="subcontract">Subcontract</option></select></td>
                  <td className="p-3"><input value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value })} className="w-20 rounded-xl border border-[#CCD7E3] px-3 py-2" /></td>
                  <td className="p-3"><input aria-label={`Rate for ${item.description}`} type="number" min="0" step="0.01" value={item.rate ?? ""} placeholder="Enter price" onChange={(event) => update(item.id, { rate: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0), confidence: "manual" })} className={`w-36 rounded-xl border px-3 py-2 text-right font-bold ${item.rate === null ? "border-[#E3A58F] bg-[#FFF8F5] text-[#C8320A]" : "border-[#CCD7E3] bg-white text-[#071E33]"}`} /><p className="mt-1 text-right text-[10px] text-[#526579]">Default: {money(item.defaultRate ?? null, item.currency)} · {item.confidence ?? "manual"}</p></td>
                  <td className="p-3"><input value={item.location} onChange={(event) => update(item.id, { location: event.target.value })} className="w-28 rounded-xl border border-[#CCD7E3] px-3 py-2" /></td>
                  <td className="p-3"><input value={item.source} onChange={(event) => update(item.id, { source: event.target.value })} className="w-60 rounded-xl border border-[#CCD7E3] px-3 py-2" /></td>
                  <td className="p-3 text-xs leading-5 text-[#526579]">{new Date(item.updatedAt).toLocaleDateString("en-NG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#DFE6EE] bg-[#F8FAFC] p-5 text-sm text-[#526579] sm:flex-row sm:items-center sm:justify-between"><div><p>Showing {Math.min(displayedItems.length, visibleItems.length)} of {visibleItems.length} matching resources. Starter references are functional defaults, not verified live quotations.</p>{displayedItems.length < visibleItems.length ? <button type="button" onClick={() => setVisibleLimit((current) => current + 20)} className="mt-2 font-bold text-[#0D3B66]">Load 20 more ↓</button> : null}</div><button type="button" onClick={reset} className="text-left font-semibold text-[#C8320A]">Restore Nigeria starter references</button></div>
      </section>
    </div>
  );
}
