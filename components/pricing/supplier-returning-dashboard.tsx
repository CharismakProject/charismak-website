"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Layers3,
  Loader2,
  MapPin,
  PackagePlus,
  RefreshCw,
  Search,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";

import type { SupplierProfile } from "@/lib/platform/supplier-profiles";
import { getSupplierOwnPriceItems, submitSupplierSinglePrice, type SupplierOwnPriceItem } from "@/lib/platform/supplier-quick-update";
import { syncCatalogueFromCloud } from "@/lib/pricing/catalogue-cloud";
import type { PriceItem } from "@/lib/pricing/models";
import { loadPriceItems } from "@/lib/pricing/store";

type Props = {
  profile: SupplierProfile;
  showWhatsAppAccess?: boolean;
  onDismissWhatsAppAccess?: () => void;
  onBulkUpdate: () => void;
  onManageProfile: () => void;
};

type Draft = {
  catalogueItemId: string | null;
  catalogueCode: string | null;
  productName: string;
  specification: string;
  brand: string;
  quotedUnit: string;
  unitOptions: string[];
  unitPrice: string;
  previousPrice: number | null;
  location: string;
  remarks: string;
};

const money = (value: number | null) => value == null ? "No previous price" : `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const unitAliases: Record<string, string[]> = {
  "cement-50kg": ["50 kg bag"],
  "block-225": ["piece"],
  "reinforcement-steel": ["12 m length", "tonne"],
  "sharp-sand": ["10 tonne tipper", "20 tonne tipper", "30 tonne tipper"],
  "granite-aggregate": ["tonne", "10 tonne tipper", "20 tonne tipper", "30 tonne tipper"],
  "floor-tile": ["carton"],
  "formwork-sheet": ["sheet"],
  "ppr-pipe-25": ["length"],
  "longspan-roof-sheet": ["linear metre", "cut sheet"],
  "concrete-mixer": ["hire/day", "hire/week", "purchase unit"],
};

const distinct = (values: Array<string | null | undefined>) => Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
function itemUnits(item: PriceItem) {
  const technicalFallback = item.unit === "nr" ? "piece" : item.unit;
  return distinct([...(unitAliases[item.id] ?? []), item.marketUnit, ...(item.marketUnitOptions ?? []), technicalFallback]).slice(0, 8);
}
function previousFor(item: PriceItem, ownItems: SupplierOwnPriceItem[]) {
  return ownItems.find((own) => own.catalogueItemId === item.id) ?? ownItems.find((own) => own.catalogueCode && own.catalogueCode === item.code) ?? null;
}

const supplierWhatsAppAccessHref = (profile: SupplierProfile) => {
  const raw = profile.whatsapp || profile.phone;
  const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
  const returnUrl = typeof window === "undefined" ? "https://www.charismakproject.com/supplier-prices" : `${window.location.origin}/supplier-prices`;
  const message = ["Charismak supplier account", `Business: ${profile.businessName}`, `Supplier code: ${profile.supplierCode}`, `Price update link: ${returnUrl}`, "Keep your PIN private."].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function SupplierReturningDashboard({ profile, showWhatsAppAccess = false, onDismissWhatsAppAccess, onBulkUpdate, onManageProfile }: Props) {
  const [ownItems, setOwnItems] = useState<SupplierOwnPriceItem[]>([]);
  const [catalogue, setCatalogue] = useState<PriceItem[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"catalogue" | "mine">("catalogue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await syncCatalogueFromCloud();
      setOwnItems(await getSupplierOwnPriceItems(profile.accessToken));
      setCatalogue(loadPriceItems().filter((item) => item.active && item.countryCode !== "DJ"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Prices could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [profile.accessToken]);

  useEffect(() => { void load(); }, [load]);

  const visibleCatalogue = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = view === "mine" ? catalogue.filter((item) => previousFor(item, ownItems)) : catalogue;
    if (!q) return source.slice(0, 80);
    return source.filter((item) => [item.description, item.code, item.specification, item.brand, item.marketUnit, ...(item.marketUnitOptions ?? [])].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 80);
  }, [catalogue, ownItems, query, view]);

  const choose = (item: PriceItem) => {
    const previous = previousFor(item, ownItems);
    const options = itemUnits(item);
    setDraft({ catalogueItemId: item.id, catalogueCode: item.code, productName: item.description, specification: item.specification || "", brand: item.brand || previous?.brand || "", quotedUnit: previous?.quotedUnit || options[0] || "item", unitOptions: options, unitPrice: "", previousPrice: previous?.currentPrice ?? null, location: previous?.location || profile.location, remarks: "" });
    setError("");
    setSuccess("");
  };

  const addMissing = () => {
    setDraft({ catalogueItemId: null, catalogueCode: null, productName: query.trim(), specification: "", brand: "", quotedUnit: "piece", unitOptions: ["piece", "bag", "carton", "length", "sheet", "tonne", "tipper", "hire/day"], unitPrice: "", previousPrice: null, location: profile.location, remarks: "Missing catalogue item — please review and map/add to catalogue." });
    setError("");
  };

  const submit = async () => {
    if (!draft) return;
    const unitPrice = Number(draft.unitPrice.replace(/[₦,\s]/g, ""));
    if (!draft.productName.trim() || !draft.quotedUnit.trim() || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError("Enter a valid item, unit and price.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitSupplierSinglePrice({ accessToken: profile.accessToken, catalogueItemId: draft.catalogueItemId, catalogueCode: draft.catalogueCode, productName: draft.productName.trim(), specification: draft.specification.trim(), brand: draft.brand.trim(), quotedUnit: draft.quotedUnit.trim(), unitPrice, previousPrice: draft.previousPrice, location: draft.location.trim() || profile.location, remarks: draft.remarks.trim() });
      setSuccess(`${draft.productName} — ₦${unitPrice.toLocaleString("en-NG")} / ${draft.quotedUnit}`);
      setDraft(null);
      setQuery("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Price could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      {showWhatsAppAccess ? <section className="relative rounded-[1.5rem] border border-[#BFE2CD] bg-[#F0FAF4] p-5 sm:p-6"><button type="button" onClick={onDismissWhatsAppAccess} aria-label="Dismiss" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-[#526579]"><X className="h-4 w-4" /></button><div className="pr-10"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#197447]">Profile created</p><h2 className="mt-2 text-xl font-black text-[#071E33]">Save your supplier link.</h2><a href={supplierWhatsAppAccessHref(profile)} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#197447] px-5 text-sm font-black text-white"><MessageCircle className="h-4 w-4" />Save to WhatsApp</a></div></section> : null}

      {!profile.categories.length ? <section className="flex flex-col gap-3 rounded-2xl border border-[#E8D49A] bg-[#FFF9E9] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#526579]"><strong className="text-[#071E33]">Your profile is missing supply categories.</strong> Add what your business supplies so buyers can find you.</p><button type="button" onClick={onManageProfile} className="min-h-10 shrink-0 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white">Complete profile</button></section> : null}

      <section className="rounded-[1.5rem] bg-[#071E33] p-5 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]"><UserRound className="h-4 w-4" />{profile.supplierCode}</span><h1 className="mt-4 text-3xl font-black sm:text-4xl">{profile.businessName}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Keep your listed prices current.</p></div><button type="button" onClick={onManageProfile} className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black">Edit profile</button></div>
        <div className="mt-5 grid gap-2 text-xs text-white/70 sm:grid-cols-3"><span className="rounded-xl bg-white/7 px-3 py-3">{profile.phone}</span><span className="rounded-xl bg-white/7 px-3 py-3">{profile.email || "Email not added"}</span><span className="inline-flex items-center gap-2 rounded-xl bg-white/7 px-3 py-3"><MapPin className="h-3.5 w-3.5 text-[#F2B544]" />{profile.location}</span></div>
      </section>

      {success ? <section className="flex items-start gap-3 rounded-2xl border border-[#BFE2CD] bg-[#F0FAF4] p-4 text-sm leading-6 text-[#17613C]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><strong className="block">Submitted for review</strong>{success}</div></section> : null}
      {error ? <section className="rounded-2xl border border-[#F0C4BA] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</section> : null}

      <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-7">
        {draft ? <div><button type="button" onClick={() => setDraft(null)} className="text-sm font-black text-[#0D3B66]">← Back</button><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2 rounded-2xl bg-[#F4F7FA] p-4"><span className="text-xs text-[#617286]">Price update</span><strong className="mt-1 block text-xl text-[#071E33]">{draft.productName}</strong><span className="mt-2 block text-xs text-[#617286]">Previous: {money(draft.previousPrice)}</span></div><Field label="Item" value={draft.productName} onChange={(value) => setDraft({ ...draft, productName: value })} disabled={Boolean(draft.catalogueItemId)} /><Field label="Specification / size" value={draft.specification} onChange={(value) => setDraft({ ...draft, specification: value })} /><Field label="Brand / make" value={draft.brand} onChange={(value) => setDraft({ ...draft, brand: value })} /><label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Selling unit *</span><select value={draft.quotedUnit} onChange={(event) => setDraft({ ...draft, quotedUnit: event.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66]">{draft.unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label><Field label="Current price (₦)" value={draft.unitPrice} onChange={(value) => setDraft({ ...draft, unitPrice: value })} inputMode="decimal" /><Field label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} /><label className="block sm:col-span-2"><span className="mb-2 block text-xs font-black text-[#071E33]">Delivery / availability notes</span><textarea rows={3} value={draft.remarks} onChange={(event) => setDraft({ ...draft, remarks: event.target.value })} className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-base text-[#071E33] outline-none focus:border-[#0D3B66]" /></label></div><button type="button" onClick={() => void submit()} disabled={submitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{submitting ? "Submitting…" : "Submit price"}</button></div> : <div><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Prices</p><h2 className="mt-2 text-2xl font-black text-[#071E33]">Update a price</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#617286]">Find the item in the catalogue, then add your current selling price.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div><div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3F6F9] p-1.5"><button type="button" onClick={() => setView("catalogue")} className={`min-h-10 rounded-lg text-xs font-black ${view === "catalogue" ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}>Catalogue</button><button type="button" onClick={() => setView("mine")} className={`min-h-10 rounded-lg text-xs font-black ${view === "mine" ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}>My items ({ownItems.length})</button></div><label className="relative mt-4 block"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, Y12, blocks, tiles, PPR..." className="min-h-14 w-full rounded-2xl border border-[#CBD7E2] pl-12 pr-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>{loading ? <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" />Loading…</div> : visibleCatalogue.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{visibleCatalogue.map((item) => { const previous = previousFor(item, ownItems); return <button key={item.id} type="button" onClick={() => choose(item)} className="flex min-h-[92px] items-center justify-between gap-3 rounded-2xl border border-[#DCE4EC] p-4 text-left transition hover:border-[#C8A45D]"><span><strong className="block text-sm leading-5 text-[#071E33]">{item.description}</strong><span className="mt-1 block text-xs leading-5 text-[#617286]">{[item.specification, itemUnits(item).slice(0, 3).join(" / ")].filter(Boolean).join(" · ")}</span>{previous ? <span className="mt-1 block text-xs font-black text-[#197447]">Last price: {money(previous.currentPrice)} / {previous.quotedUnit}</span> : null}</span><ChevronRight className="h-5 w-5 shrink-0 text-[#A82B05]" /></button>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#CBD7E2] bg-[#F8FAFC] p-6 text-center"><PackagePlus className="mx-auto h-8 w-8 text-[#7A8B9E]" /><h3 className="mt-3 font-black text-[#071E33]">Can’t find the item?</h3></div>}<button type="button" onClick={addMissing} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#0D3B66] bg-[#F2F7FC] px-5 text-sm font-black text-[#0D3B66] sm:w-auto"><PackagePlus className="h-4 w-4" />Add missing item</button></div>}
      </section>

      {!draft ? <section className="rounded-[1.5rem] border border-[#E2E8EE] bg-[#F7F9FB] p-4 sm:rounded-[2rem] sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#0D3B66] shadow-sm"><Layers3 className="h-5 w-5" /></span><div><h3 className="text-sm font-black text-[#071E33]">Update several prices</h3><p className="mt-1 text-xs leading-5 text-[#617286]">Use the bulk form for a larger price list.</p></div></div><button type="button" onClick={onBulkUpdate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white">Bulk update <ChevronRight className="h-4 w-4" /></button></div></section> : null}
    </div>
  );
}

function Field({ label, value, onChange, inputMode = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "text" | "decimal"; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">{label}</span><input value={value} disabled={disabled} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white px-4 text-base text-[#071E33] outline-none disabled:bg-[#F3F6F9] disabled:text-[#617286] focus:border-[#0D3B66]" /></label>;
}
