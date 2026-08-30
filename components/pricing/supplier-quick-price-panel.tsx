"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  PackageSearch,
  PencilLine,
  Plus,
  Search,
  X,
} from "lucide-react";

import { getSupplierProfile, type SupplierProfile } from "@/lib/platform/supplier-profiles";
import {
  getSupplierOwnPriceItems,
  submitSupplierSinglePrice,
  type SupplierOwnPriceItem,
} from "@/lib/platform/supplier-quick-update";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

type Draft = {
  catalogueItemId: string | null;
  catalogueCode: string | null;
  productName: string;
  specification: string;
  brand: string;
  quotedUnit: string;
  unitPrice: string;
  previousPrice: number | null;
  location: string;
  remarks: string;
};

const blankDraft = (location = ""): Draft => ({
  catalogueItemId: null,
  catalogueCode: null,
  productName: "",
  specification: "",
  brand: "",
  quotedUnit: "",
  unitPrice: "",
  previousPrice: null,
  location,
  remarks: "",
});

const money = (value: number | null) =>
  value == null
    ? "No previous price"
    : `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export default function SupplierQuickPricePanel() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SupplierOwnPriceItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let knownToken = "";

    const syncProfile = async () => {
      const token = window.localStorage.getItem(PROFILE_TOKEN_KEY) || "";
      if (token === knownToken) return;
      knownToken = token;
      if (!token) {
        if (!cancelled) setProfile(null);
        return;
      }
      try {
        const next = await getSupplierProfile(token);
        if (!cancelled) setProfile(next);
      } catch {
        if (!cancelled) setProfile(null);
      }
    };

    void syncProfile();
    const timer = window.setInterval(() => void syncProfile(), 1200);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const loadItems = async (nextProfile = profile) => {
    if (!nextProfile) return;
    setLoading(true);
    setError("");
    try {
      setItems(await getSupplierOwnPriceItems(nextProfile.accessToken));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load previous prices.");
    } finally {
      setLoading(false);
    }
  };

  const openPanel = () => {
    if (!profile) return;
    setOpen(true);
    setDraft(null);
    setSuccess(null);
    setQuery("");
    void loadItems(profile);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 30);
    return items
      .filter((item) =>
        [
          item.productName,
          item.specification,
          item.brand,
          item.quotedUnit,
          item.catalogueCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 30);
  }, [items, query]);

  const chooseItem = (item: SupplierOwnPriceItem) => {
    setSuccess(null);
    setError("");
    setDraft({
      catalogueItemId: item.catalogueItemId,
      catalogueCode: item.catalogueCode,
      productName: item.productName,
      specification: item.specification || "",
      brand: item.brand || "",
      quotedUnit: item.quotedUnit,
      unitPrice: "",
      previousPrice: item.currentPrice,
      location: item.location || profile?.location || "",
      remarks: "",
    });
  };

  const startNewItem = () => {
    setSuccess(null);
    setError("");
    setDraft(blankDraft(profile?.location || ""));
  };

  const submit = async () => {
    if (!profile || !draft) return;
    const nextPrice = Number(draft.unitPrice.replace(/[₦,\s]/g, ""));
    if (!draft.productName.trim() || !draft.quotedUnit.trim() || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError("Enter the material, selling unit and new price.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitSupplierSinglePrice({
        accessToken: profile.accessToken,
        catalogueItemId: draft.catalogueItemId,
        catalogueCode: draft.catalogueCode,
        productName: draft.productName.trim(),
        specification: draft.specification.trim(),
        brand: draft.brand.trim(),
        quotedUnit: draft.quotedUnit.trim(),
        unitPrice: nextPrice,
        previousPrice: draft.previousPrice,
        location: draft.location.trim() || profile.location,
        remarks: draft.remarks.trim(),
      });
      setSuccess(`${draft.productName} updated to ₦${nextPrice.toLocaleString("en-NG")} / ${draft.quotedUnit}.`);
      setDraft(null);
      setQuery("");
      await loadItems(profile);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit the price update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-[115] inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#A82B05] px-5 text-sm font-black text-white shadow-[0_18px_45px_rgba(85,24,8,0.28)] transition hover:bg-[#8B1E00] sm:left-auto sm:right-6 sm:w-auto sm:min-w-[220px]"
      >
        <PencilLine className="h-5 w-5" />
        Update one price
      </button>

      {open ? (
        <div className="fixed inset-0 z-[160] overflow-hidden bg-[#071E33]/70 backdrop-blur-sm">
          <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-5">
            <section className="flex max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-[1.75rem]">
              <header className="shrink-0 border-b border-[#E0E7EE] bg-white px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Quick price change</p>
                    <h2 className="mt-1 truncate text-lg font-black text-[#071E33] sm:text-xl">{profile.businessName}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#071E33] text-white"
                    aria-label="Close quick price update"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                {success ? (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#BFE2CD] bg-[#F0FAF4] p-4 text-sm leading-6 text-[#17613C]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div><strong className="block">Price sent for review</strong>{success} You’ll see the current listed price after Charismak approves it.</div>
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-5 rounded-2xl border border-[#F0C4BA] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</div>
                ) : null}

                {draft ? (
                  <div>
                    <button type="button" onClick={() => setDraft(null)} className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#0D3B66]">
                      <ArrowLeft className="h-4 w-4" /> Back to my materials
                    </button>

                    <div className="rounded-2xl bg-[#F5F8FB] p-4">
                      <p className="text-xs font-bold text-[#617286]">Previous / current price</p>
                      <p className="mt-1 text-2xl font-black text-[#071E33]">{money(draft.previousPrice)}{draft.previousPrice != null ? ` / ${draft.quotedUnit}` : ""}</p>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Material / item *</span>
                        <input value={draft.productName} onChange={(e) => setDraft({ ...draft, productName: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" placeholder="e.g. Y12 reinforcement bar" />
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Specification / size</span>
                        <input value={draft.specification} onChange={(e) => setDraft({ ...draft, specification: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" placeholder="e.g. Y12, 12m" />
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Brand / make</span>
                        <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Selling unit *</span>
                        <input value={draft.quotedUnit} onChange={(e) => setDraft({ ...draft, quotedUnit: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" placeholder="50kg bag, piece, 12m length..." />
                      </label>
                      <label>
                        <span className="mb-2 block text-xs font-black text-[#071E33]">New price (₦) *</span>
                        <input inputMode="decimal" value={draft.unitPrice} onChange={(e) => setDraft({ ...draft, unitPrice: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base font-bold outline-none focus:border-[#0D3B66]" placeholder="0" />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Price location</span>
                        <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-base outline-none focus:border-[#0D3B66]" />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-2 block text-xs font-black text-[#071E33]">Remark</span>
                        <textarea value={draft.remarks} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} rows={3} className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-base outline-none focus:border-[#0D3B66]" placeholder="Bulk quantity, delivery condition, availability..." />
                      </label>
                    </div>

                    <button type="button" disabled={submitting} onClick={() => void submit()} className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {submitting ? "Sending price…" : "Submit new price"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-2xl bg-[#071E33] p-4 text-white sm:p-5">
                      <h3 className="text-xl font-black">What price changed?</h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">Search a material you’ve supplied before. You only need to change that item — no full category form.</p>
                      <label className="relative mt-4 block">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A8B9E]" />
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Y12, cement, PPR 25mm, tiles..." className="min-h-13 w-full rounded-xl bg-white pl-12 pr-4 text-base text-[#071E33] outline-none" />
                      </label>
                    </div>

                    {loading ? (
                      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" />Loading your materials…</div>
                    ) : items.length ? (
                      <div className="mt-4 space-y-2">
                        {filtered.length ? filtered.map((item, index) => (
                          <button key={`${item.catalogueItemId || item.catalogueCode || item.productName}-${index}`} type="button" onClick={() => chooseItem(item)} className="flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 text-left transition hover:border-[#C8A45D]">
                            <span className="min-w-0">
                              <strong className="block text-sm leading-5 text-[#071E33]">{item.productName}</strong>
                              <span className="mt-1 block text-xs leading-5 text-[#617286]">{[item.specification, item.brand, item.quotedUnit].filter(Boolean).join(" · ")}</span>
                              <span className="mt-1 block text-xs font-black text-[#A82B05]">{money(item.currentPrice)}{item.currentPrice != null ? ` / ${item.quotedUnit}` : ""}</span>
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-[#0D3B66]" />
                          </button>
                        )) : <div className="rounded-2xl bg-[#F5F8FB] p-5 text-center text-sm text-[#617286]">No previous item matches “{query}”.</div>}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl bg-[#F5F8FB] p-5 text-center">
                        <PackageSearch className="mx-auto h-8 w-8 text-[#7A8B9E]" />
                        <p className="mt-3 text-sm font-black text-[#071E33]">No previous material history yet</p>
                        <p className="mt-1 text-xs leading-5 text-[#617286]">You can still add a material below. Once prices have been submitted, they’ll appear here for one-tap updates.</p>
                      </div>
                    )}

                    <button type="button" onClick={startNewItem} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#B9C7D4] bg-white px-4 text-sm font-black text-[#0D3B66] sm:w-auto">
                      <Plus className="h-4 w-4" /> Add another material / item
                    </button>
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-[#E0E7EE] bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-center text-[11px] leading-5 text-[#617286] sm:px-6 sm:pb-3 sm:text-left">
                Single-item updates still go through Charismak review before changing the public supplier price.
              </footer>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
