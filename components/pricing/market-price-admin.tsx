"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  History,
  Loader2,
  LogIn,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import {
  loadMarketPriceHistory,
  loadMarketPriceOverrides,
  saveMarketPriceOverride,
  type MarketPriceHistoryRow,
  type MarketPriceOverride,
} from "@/lib/pricing/market-overrides";
import { loadPriceItems } from "@/lib/pricing/store";
import type { PriceItem } from "@/lib/pricing/models";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Draft = {
  marketName: string;
  unit: string;
  priceLow: string;
  priceHigh: string;
  referenceRate: string;
  location: string;
  specification: string;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
  active: boolean;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const toDraft = (item: PriceItem, override?: MarketPriceOverride | null): Draft => {
  const market = JIJI_MARKET_SNAPSHOT[item.id];
  return {
    marketName: override?.marketName ?? market?.marketName ?? item.description,
    unit: override?.unit ?? market?.unit ?? item.marketUnit ?? item.unit,
    priceLow: String(override?.priceLow ?? market?.priceLow ?? item.rate ?? ""),
    priceHigh: String(override?.priceHigh ?? market?.priceHigh ?? item.rate ?? ""),
    referenceRate: String(override?.referenceRate ?? market?.reference ?? item.rate ?? ""),
    location: override?.location ?? market?.location ?? item.location,
    specification: override?.specification ?? market?.specification ?? item.specification ?? "",
    sourceLabel: override?.sourceLabel ?? "Charismak market review",
    sourceUrl: override?.sourceUrl ?? market?.primarySourceUrl ?? item.sourceUrl ?? "",
    note: override?.note ?? "",
    active: override?.active ?? true,
  };
};

export default function MarketPriceAdmin() {
  const client = getSupabaseBrowserClient();
  const [checking, setChecking] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [email, setEmail] = useState("info@charismakproject.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [items, setItems] = useState<PriceItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MarketPriceOverride>>({});
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<MarketPriceHistoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    setItems(loadPriceItems().filter((item) => item.countryCode === "NG" && item.active));
    const next = await loadMarketPriceOverrides({ includeInactive: true });
    setOverrides(next);
    return next;
  };

  useEffect(() => {
    if (!client) {
      setChecking(false);
      return;
    }
    let mounted = true;
    void client.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const currentEmail = data.session?.user.email || "";
      const ok = Boolean(data.session && isAdminEmail(currentEmail));
      setAuthorised(ok);
      if (ok) await refresh();
      if (mounted) setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, [client]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.code, item.description, item.unit, item.marketUnit, item.brand, item.specification]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, query]);

  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const choose = async (item: PriceItem) => {
    setSelectedId(item.id);
    setDraft(toDraft(item, overrides[item.id]));
    setMessage("");
    setError("");
    setHistory(await loadMarketPriceHistory(item.id));
  };

  const signIn = async () => {
    if (!client) return;
    setBusy(true);
    setLoginError("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!isAdminEmail(cleanEmail)) {
        setLoginError("Use an authorised Charismak reviewer email.");
        return;
      }
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (authError || !data.user || !isAdminEmail(data.user.email)) {
        setLoginError(authError?.message || "Unable to sign in.");
        return;
      }
      setAuthorised(true);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!selected || !draft) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const low = Number(draft.priceLow);
      const high = Number(draft.priceHigh);
      const reference = Number(draft.referenceRate);
      if (![low, high, reference].every(Number.isFinite) || low < 0 || high < low || reference < 0) {
        setError("Enter a valid low rate, high rate and reference rate. High rate cannot be below the low rate.");
        return;
      }
      if (!draft.unit.trim() || !draft.location.trim()) {
        setError("Unit and location are required.");
        return;
      }

      const saved = await saveMarketPriceOverride({
        itemId: selected.id,
        marketName: draft.marketName.trim() || selected.description,
        unit: draft.unit.trim(),
        priceLow: low,
        priceHigh: high,
        referenceRate: reference,
        location: draft.location.trim(),
        specification: draft.specification.trim() || null,
        sourceLabel: draft.sourceLabel.trim() || "Charismak market review",
        sourceUrl: draft.sourceUrl.trim() || null,
        note: draft.note.trim() || null,
        checkedAt: new Date().toISOString(),
        active: draft.active,
      });
      setOverrides((current) => ({ ...current, [saved.itemId]: saved }));
      setHistory(await loadMarketPriceHistory(selected.id));
      setMessage("Market price saved. The public Prices page now uses this Charismak rate instead of the older fallback snapshot.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save market price.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  if (!authorised) {
    return (
      <section className="mx-auto max-w-md rounded-[1.75rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_20px_60px_rgba(7,30,51,0.08)] sm:p-7">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071E33] text-white"><ShieldCheck className="h-5 w-5" /></div>
        <h1 className="mt-5 text-2xl font-black text-[#071E33]">Charismak Price Admin</h1>
        <p className="mt-2 text-sm leading-6 text-[#617286]">Use the same authorised Charismak reviewer account used for supplier approvals.</p>
        <div className="mt-6 space-y-4">
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="Reviewer email" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Reviewer password" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
          {loginError ? <p className="rounded-xl bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{loginError}</p> : null}
          <button type="button" disabled={busy} onClick={() => void signIn()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-[#071E33] p-5 text-white sm:p-7 md:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Private Charismak workspace</p>
        <h1 className="mt-3 text-3xl font-black">Market Price Admin</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">Update the Charismak market guide independently of supplier submissions. Every save is retained in price history.</p>
        <label className="relative mt-6 block max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, Y12, blocks, PPR, tiles..." className="min-h-14 w-full rounded-xl bg-white pl-12 pr-4 text-base text-[#071E33] outline-none" />
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[#071E33]">Catalogue</h2>
            <span className="text-xs text-[#617286]">{filtered.length} items</span>
          </div>
          <div className="mt-4 max-h-[65dvh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((item) => {
              const current = overrides[item.id];
              const fallback = JIJI_MARKET_SNAPSHOT[item.id];
              const low = current?.priceLow ?? fallback?.priceLow ?? item.rate;
              const high = current?.priceHigh ?? fallback?.priceHigh ?? item.rate;
              return (
                <button key={item.id} type="button" onClick={() => void choose(item)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-[#0D3B66] bg-[#EEF5FC]" : "border-[#E2E8EF] hover:border-[#B8C7D6]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-black text-[#071E33]">{item.description}</p><p className="mt-1 text-[11px] text-[#617286]">{item.code} · {current ? "Charismak backend" : fallback ? "Fallback snapshot" : "Catalogue reference"}</p></div>
                    {low != null ? <span className="shrink-0 text-right text-xs font-bold text-[#0D3B66]">{money(Number(low))}{high != null && Number(high) !== Number(low) ? <span className="block text-[10px] font-semibold text-[#7A8B9E]">to {money(Number(high))}</span> : null}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 sm:p-6">
          {!selected || !draft ? (
            <div className="grid min-h-80 place-items-center text-center"><div><Search className="mx-auto h-8 w-8 text-[#9AA8B6]" /><h2 className="mt-3 text-xl font-black text-[#071E33]">Select a material to edit</h2><p className="mt-2 text-sm text-[#617286]">Search the catalogue, then open an item to update its market guide.</p></div></div>
          ) : (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">{selected.code}</p><h2 className="mt-1 text-2xl font-black text-[#071E33]">{selected.description}</h2></div>
                {overrides[selected.id] ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EAF7EF] px-3 py-1.5 text-[10px] font-black text-[#197447]"><CheckCircle2 className="h-3.5 w-3.5" /> Backend rate active</span> : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Market display name</span><input value={draft.marketName} onChange={(e) => setDraft({ ...draft, marketName: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Low rate (₦)</span><input inputMode="decimal" value={draft.priceLow} onChange={(e) => setDraft({ ...draft, priceLow: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">High rate (₦)</span><input inputMode="decimal" value={draft.priceHigh} onChange={(e) => setDraft({ ...draft, priceHigh: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Typical / reference rate (₦)</span><input inputMode="decimal" value={draft.referenceRate} onChange={(e) => setDraft({ ...draft, referenceRate: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Buying unit</span><input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Location</span><input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label><span className="mb-2 block text-xs font-bold text-[#071E33]">Source label</span><input value={draft.sourceLabel} onChange={(e) => setDraft({ ...draft, sourceLabel: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Specification</span><input value={draft.specification} onChange={(e) => setDraft({ ...draft, specification: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Source URL (optional)</span><input value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#071E33]">Internal / market note</span><textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} rows={3} className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-base outline-none focus:border-[#0D3B66]" /></label>
                <label className="sm:col-span-2 flex min-h-12 items-center gap-3 rounded-xl border border-[#DCE4EC] px-4"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /><span className="text-sm font-bold text-[#071E33]">Show this Charismak market rate publicly</span></label>
              </div>

              {error ? <p className="mt-4 rounded-xl bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}
              {message ? <p className="mt-4 rounded-xl bg-[#F3FBF6] px-4 py-3 text-sm text-[#197447]">{message}</p> : null}
              <button type="button" disabled={busy} onClick={() => void save()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save market price
              </button>

              <div className="mt-7 border-t border-[#E2E8EF] pt-5">
                <div className="flex items-center gap-2"><History className="h-4 w-4 text-[#0D3B66]" /><h3 className="text-sm font-black text-[#071E33]">Price history</h3></div>
                {history.length ? <div className="mt-3 space-y-2">{history.slice(0, 8).map((entry) => <div key={entry.id} className="flex flex-col gap-1 rounded-xl bg-[#F8FAFC] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="font-bold text-[#071E33]">{money(entry.priceLow)} – {money(entry.priceHigh)} · ref {money(entry.referenceRate)}</span><span className="text-[#617286]">{new Date(entry.changedAt).toLocaleString("en-NG")}</span></div>)}</div> : <p className="mt-3 text-xs text-[#617286]">No saved backend history yet.</p>}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
