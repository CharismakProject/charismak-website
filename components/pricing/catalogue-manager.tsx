"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Tags,
  Upload,
  X,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import {
  createCustomCatalogueItem,
  loadCatalogueRecords,
  saveCatalogueRecord,
  syncCatalogueFromCloud,
  uploadCatalogueImage,
  type CatalogueRecord,
} from "@/lib/pricing/catalogue-cloud";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import type { PriceCategory, PriceItem, PriceMarketMode } from "@/lib/pricing/models";
import { loadPriceItems } from "@/lib/pricing/store";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthState = "checking" | "signed-out" | "forbidden" | "ready";
type CategoryFilter = "all" | PriceCategory;

type Draft = {
  id: string;
  code: string;
  description: string;
  category: PriceCategory;
  unit: string;
  rate: string;
  currency: string;
  countryCode: string;
  region: string;
  location: string;
  source: string;
  sourceUrl: string;
  active: boolean;
  imageUrl: string;
  imageAlt: string;
  brand: string;
  specification: string;
  marketUnit: string;
  marketUnitOptions: string;
  marketMode: PriceMarketMode;
  marketNote: string;
  deliveryIncluded: "unknown" | "yes" | "no";
};

const categories: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "material", label: "Materials" },
  { id: "plant", label: "Equipment" },
  { id: "labour", label: "Labour" },
  { id: "subcontract", label: "Specialists" },
];

const categoryPrefix: Record<PriceCategory, string> = {
  material: "MAT",
  plant: "PLT",
  labour: "LAB",
  subcontract: "SUB",
};

const money = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

const toDraft = (item: PriceItem, preferMarketDisplay = false): Draft => {
  const market = JIJI_MARKET_SNAPSHOT[item.id];
  return {
    id: item.id,
    code: item.code,
    description: preferMarketDisplay && market?.marketName ? market.marketName : item.description,
    category: item.category,
    unit: item.unit,
    rate: item.rate === null ? "" : String(item.rate),
    currency: item.currency || "NGN",
    countryCode: item.countryCode || "NG",
    region: item.region || "",
    location: preferMarketDisplay && market?.location ? market.location : item.location,
    source: item.source || "Charismak catalogue",
    sourceUrl: item.sourceUrl || "",
    active: item.active,
    imageUrl: item.imageUrl || "",
    imageAlt: item.imageAlt || "",
    brand: item.brand || "",
    specification: item.specification || market?.specification || "",
    marketUnit: item.marketUnit || market?.unit || item.unit,
    marketUnitOptions: (item.marketUnitOptions || []).join(", "),
    marketMode: item.marketMode || (item.category === "labour" || item.category === "subcontract" ? "service" : "buy"),
    marketNote: item.marketNote || "",
    deliveryIncluded: item.deliveryIncluded === true ? "yes" : item.deliveryIncluded === false ? "no" : "unknown",
  };
};

const fromDraft = (draft: Draft, previous?: PriceItem | null): PriceItem => ({
  ...(previous || {} as PriceItem),
  id: draft.id,
  code: draft.code.trim(),
  description: draft.description.trim(),
  category: draft.category,
  unit: draft.unit.trim(),
  rate: draft.rate.trim() === "" ? null : Number(draft.rate),
  defaultRate: previous?.defaultRate ?? (draft.rate.trim() === "" ? null : Number(draft.rate)),
  currency: draft.currency.trim() || "NGN",
  countryCode: draft.countryCode.trim() || "NG",
  region: draft.region.trim() || undefined,
  location: draft.location.trim(),
  source: draft.source.trim() || "Charismak catalogue",
  sourceUrl: draft.sourceUrl.trim() || null,
  confidence: previous?.confidence || "manual",
  updatedAt: new Date().toISOString(),
  active: draft.active,
  imageUrl: draft.imageUrl.trim() || null,
  imageAlt: draft.imageAlt.trim() || null,
  brand: draft.brand.trim() || null,
  specification: draft.specification.trim() || null,
  priceLow: previous?.priceLow ?? null,
  priceHigh: previous?.priceHigh ?? null,
  sourceCount: previous?.sourceCount ?? null,
  deliveryIncluded: draft.deliveryIncluded === "yes" ? true : draft.deliveryIncluded === "no" ? false : null,
  marketUnit: draft.marketUnit.trim() || draft.unit.trim(),
  marketUnitOptions: draft.marketUnitOptions.split(",").map((value) => value.trim()).filter(Boolean),
  marketMode: draft.marketMode,
  marketNote: draft.marketNote.trim() || null,
});

export default function CatalogueManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [items, setItems] = useState<PriceItem[]>([]);
  const [records, setRecords] = useState<Record<string, CatalogueRecord>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      const cloudRows = await loadCatalogueRecords();
      await syncCatalogueFromCloud();
      setRecords(Object.fromEntries(cloudRows.map((record) => [record.id, record])));
      setItems(loadPriceItems().filter((item) => item.countryCode === "NG"));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh catalogue.");
    } finally {
      setBusy(false);
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
      const email = data.session?.user.email || "";
      if (!data.session) setAuthState("signed-out");
      else if (!isAdminEmail(email)) setAuthState("forbidden");
      else {
        setAuthState("ready");
        await refresh();
      }
    });
    return () => { mounted = false; };
  }, [client]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => showArchived || item.active)
      .filter((item) => category === "all" || item.category === category)
      .filter((item) => !q || [item.code, item.description, item.brand, item.specification, item.marketUnit, item.unit, item.location]
        .filter(Boolean).join(" ").toLowerCase().includes(q))
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [items, query, category, showArchived]);

  const selectItem = (item: PriceItem) => {
    setSelectedId(item.id);
    setIsNew(false);
    setDraft(toDraft(item, !records[item.id]));
    setMessage("");
    setError("");
  };

  const addItem = () => {
    const item = createCustomCatalogueItem();
    const existingCodes = new Set(items.map((entry) => entry.code));
    const prefix = category === "all" ? "MAT" : categoryPrefix[category];
    let index = 1;
    let code = `${prefix}-NEW-${String(index).padStart(3, "0")}`;
    while (existingCodes.has(code)) {
      index += 1;
      code = `${prefix}-NEW-${String(index).padStart(3, "0")}`;
    }
    item.code = code;
    if (category !== "all") item.category = category;
    setSelectedId(item.id);
    setIsNew(true);
    setDraft(toDraft(item));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!draft.description.trim() || !draft.code.trim() || !draft.unit.trim() || !draft.location.trim()) {
        throw new Error("Item name, code, QS unit and location are required.");
      }
      if (draft.rate.trim() && (!Number.isFinite(Number(draft.rate)) || Number(draft.rate) < 0)) {
        throw new Error("Enter a valid fallback/reference rate or leave it blank.");
      }
      const duplicateCode = items.find((item) => item.id !== draft.id && item.code.toLowerCase() === draft.code.trim().toLowerCase());
      if (duplicateCode) throw new Error(`Catalogue code ${draft.code.trim()} is already used by ${duplicateCode.description}.`);

      const previous = items.find((item) => item.id === draft.id) || null;
      const item = fromDraft(draft, previous);
      const custom = isNew || records[draft.id]?.isCustom || draft.id.startsWith("custom-");
      await saveCatalogueRecord(item, Boolean(custom));
      await refresh();
      setSelectedId(item.id);
      setIsNew(false);
      setDraft(toDraft(item));
      setMessage("Catalogue item saved. Public Prices and item-detail pages will use the updated metadata.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save catalogue item.");
    } finally {
      setBusy(false);
    }
  };

  const toggleArchive = async () => {
    if (!draft) return;
    const next = { ...draft, active: !draft.active };
    setDraft(next);
    setBusy(true);
    setError("");
    try {
      const previous = items.find((item) => item.id === draft.id) || null;
      await saveCatalogueRecord(fromDraft(next, previous), Boolean(isNew || records[draft.id]?.isCustom || draft.id.startsWith("custom-")));
      await refresh();
      setMessage(next.active ? "Item restored to the public catalogue." : "Item archived. It is hidden from the public catalogue but retained for history and estimator references.");
    } catch (archiveError) {
      setDraft(draft);
      setError(archiveError instanceof Error ? archiveError.message : "Unable to update item status.");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !draft) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadCatalogueImage(draft.id, file, "catalogue");
      setDraft((current) => current ? { ...current, imageUrl: url, imageAlt: current.imageAlt || current.description } : current);
      setMessage("Image uploaded. Save the catalogue item to publish it.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (authState === "checking") {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  if (authState === "signed-out") {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-[#DCE4EC] bg-white p-7 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-8 w-8 text-[#0D3B66]" />
        <h1 className="mt-4 text-2xl font-black text-[#071E33]">Sign in through Admin first</h1>
        <p className="mt-2 text-sm leading-6 text-[#617286]">Catalogue Management uses the same secure administrator session as the Admin Control Centre.</p>
        <Link href="/admin" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#071E33] px-5 text-sm font-black text-white">Open Admin</Link>
      </section>
    );
  }

  if (authState === "forbidden") {
    return <section className="mx-auto max-w-lg rounded-3xl border border-[#F1C8C0] bg-white p-7 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator access only</h1></section>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-[#071E33] p-5 text-white sm:p-7 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" />Admin Control Centre</Link>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#F2B544]">Catalogue Management</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Materials, equipment, labour & specialists</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">Manage what appears in the public Prices catalogue. Market price history remains in Price Management so catalogue metadata and rate updates stay controlled separately.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/price-admin" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-black text-white"><Tags className="h-4 w-4" />Price Management</Link>
            <button type="button" onClick={() => void refresh()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />Refresh</button>
            <button type="button" onClick={addItem} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#C8A45D] px-4 text-xs font-black text-[#071E33]"><PackagePlus className="h-4 w-4" />Add item</button>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-xl border border-[#B9E1C9] bg-[#F0FAF4] px-4 py-3 text-sm text-[#197447]">{message}</div> : null}
      {error ? <div className="rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</div> : null}

      <section className="grid gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 md:grid-cols-[1fr_auto_auto] md:p-5">
        <label className="relative min-w-0"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code, brand, specification..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] pl-12 pr-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} className="min-h-12 rounded-xl border border-[#DCE4EC] bg-white px-4 text-sm font-bold text-[#071E33]">{categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-bold text-[#071E33]"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />Show archived</label>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-[#071E33]">Catalogue</h2><span className="text-xs text-[#617286]">{filtered.length} items</span></div>
          <div className="mt-4 max-h-[68dvh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((item) => (
              <button key={item.id} type="button" onClick={() => selectItem(item)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-[#0D3B66] bg-[#EEF5FC]" : "border-[#E2E8EF] hover:border-[#B8C7D6]"}`}>
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F1F4F7]">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-[#9AA8B6]" />}
                  </div>
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-black text-[#071E33]">{item.description}</p>{!item.active ? <span className="rounded-full bg-[#F1F3F5] px-2 py-1 text-[9px] font-black text-[#617286]">ARCHIVED</span> : null}</div><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[#617286]">{item.code} · {item.category === "plant" ? "equipment" : item.category}</p><p className="mt-1 text-xs font-bold text-[#0D3B66]">{money(item.rate)} / {item.marketUnit || item.unit}</p></div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 sm:p-6">
          {!draft ? (
            <div className="grid min-h-[420px] place-items-center text-center"><div><PackagePlus className="mx-auto h-9 w-9 text-[#9AA8B6]" /><h2 className="mt-4 text-xl font-black text-[#071E33]">Select an item or add a new one</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#617286]">Catalogue fields control product identity and public presentation. Use Price Management for current market-price history.</p></div></div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">{isNew ? "New catalogue item" : draft.code}</p><h2 className="mt-1 text-2xl font-black text-[#071E33]">{draft.description || "Untitled item"}</h2></div>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${draft.active ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F1F3F5] text-[#617286]"}`}>{draft.active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{draft.active ? "Public" : "Archived"}</span>
              </div>

              <div className="grid gap-5 md:grid-cols-[190px_1fr]">
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#DCE4EC] bg-[#F1F4F7]">
                    {draft.imageUrl ? <img src={draft.imageUrl} alt={draft.imageAlt || draft.description} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-center"><div><ImageIcon className="mx-auto h-8 w-8 text-[#9AA8B6]" /><p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8B9E]">No product photo</p></div></div>}
                  </div>
                  <label className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-3 text-xs font-black text-white"><Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void uploadImage(event)} className="hidden" /></label>
                  {draft.imageUrl ? <button type="button" onClick={() => setDraft({ ...draft, imageUrl: "", imageAlt: "" })} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] text-xs font-bold text-[#A82B05]"><X className="h-3.5 w-3.5" />Remove image</button> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Public item name *</span><input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                  <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Catalogue code *</span><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                  <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Category *</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as PriceCategory, marketMode: event.target.value === "labour" || event.target.value === "subcontract" ? "service" : draft.marketMode })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-base"><option value="material">Material</option><option value="plant">Equipment / plant</option><option value="labour">Labour</option><option value="subcontract">Specialist / subcontract</option></select></label>
                  <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Brand / make</span><input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} placeholder="e.g. Dangote, BUA, Coleman" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                  <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Market mode</span><select value={draft.marketMode} onChange={(event) => setDraft({ ...draft, marketMode: event.target.value as PriceMarketMode })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-base"><option value="buy">Buy</option><option value="rent">Rent / hire</option><option value="buy-or-rent">Buy or rent</option><option value="service">Service</option></select></label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Specification / description</span><textarea rows={3} value={draft.specification} onChange={(event) => setDraft({ ...draft, specification: event.target.value })} className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-sm leading-6" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Buying unit *</span><input value={draft.marketUnit} onChange={(event) => setDraft({ ...draft, marketUnit: event.target.value })} placeholder="bag, piece, 12 m length, tonne..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">QS / technical unit *</span><input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} placeholder="kg, m, m², m³, nr..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Alternative buying units</span><input value={draft.marketUnitOptions} onChange={(event) => setDraft({ ...draft, marketUnitOptions: event.target.value })} placeholder="bag, pallet, tonne (comma-separated)" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Fallback/reference rate (₦)</span><input inputMode="decimal" value={draft.rate} onChange={(event) => setDraft({ ...draft, rate: event.target.value })} placeholder="Used if no current market rate exists" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Delivery included?</span><select value={draft.deliveryIncluded} onChange={(event) => setDraft({ ...draft, deliveryIncluded: event.target.value as Draft["deliveryIncluded"] })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-base"><option value="unknown">Not stated</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Location *</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Region/state</span><input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Source label</span><input value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Source URL</span><input value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Image alt text</span><input value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} placeholder="Describe the image for accessibility" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Public market / procurement note</span><textarea rows={4} value={draft.marketNote} onChange={(event) => setDraft({ ...draft, marketNote: event.target.value })} placeholder="Buying guidance, pack size, delivery notes, quality/specification warning..." className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-sm leading-6" /></label>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E2E8EF] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => void toggleArchive()} disabled={busy || isNew} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black disabled:opacity-40 ${draft.active ? "border-[#E7B6AC] text-[#A82B05]" : "border-[#B9E1C9] text-[#197447]"}`}>{draft.active ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}{draft.active ? "Archive item" : "Restore item"}</button>
                <button type="button" onClick={() => void save()} disabled={busy || uploading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-6 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save catalogue item</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
