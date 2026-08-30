"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Loader2,
  MapPin,
  PackagePlus,
  PackageSearch,
  PencilLine,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import type { SupplierProfile } from "@/lib/platform/supplier-profiles";
import {
  getSupplierOwnPriceItems,
  submitSupplierSinglePrice,
  type SupplierOwnPriceItem,
} from "@/lib/platform/supplier-quick-update";

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

type Props = {
  profile: SupplierProfile;
  onBulkUpdate: () => void;
  onManageProfile: () => void;
};

const money = (value: number | null) =>
  value == null
    ? "No previous price"
    : `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const newDraft = (profile: SupplierProfile): Draft => ({
  catalogueItemId: null,
  catalogueCode: null,
  productName: "",
  specification: "",
  brand: "",
  quotedUnit: "",
  unitPrice: "",
  previousPrice: null,
  location: profile.location,
  remarks: "",
});

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: "decimal" | "text";
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black text-[#071E33]">
        {label}{required ? " *" : ""}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 w-full min-w-0 rounded-xl border border-[#DCE4EC] bg-white px-4 text-base text-[#071E33] outline-none transition focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10"
      />
    </label>
  );
}

export default function SupplierReturningDashboard({
  profile,
  onBulkUpdate,
  onManageProfile,
}: Props) {
  const [items, setItems] = useState<SupplierOwnPriceItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getSupplierOwnPriceItems(profile.accessToken));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your previous prices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.accessToken]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q
      ? items.filter((item) =>
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
      : items;
    return source.slice(0, 40);
  }, [items, query]);

  const chooseItem = (item: SupplierOwnPriceItem) => {
    setSuccess("");
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
      location: item.location || profile.location,
      remarks: "",
    });
  };

  const submit = async () => {
    if (!draft) return;
    const unitPrice = Number(draft.unitPrice.replace(/[₦,\s]/g, ""));
    if (!draft.productName.trim() || !draft.quotedUnit.trim() || !Number.isFinite(unitPrice) || unitPrice <= 0) {
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
        unitPrice,
        previousPrice: draft.previousPrice,
        location: draft.location.trim() || profile.location,
        remarks: draft.remarks.trim(),
      });
      setSuccess(`${draft.productName} — ₦${unitPrice.toLocaleString("en-NG")} / ${draft.quotedUnit}`);
      setDraft(null);
      setQuery("");
      await loadItems();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send this price update.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden sm:space-y-7">
      <section className="overflow-hidden rounded-[1.4rem] bg-[#071E33] px-4 py-7 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] sm:rounded-[2rem] sm:px-6 sm:py-9 md:px-9 md:py-11">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
              <UserRound className="h-4 w-4" /> Returning supplier
            </span>
            <h1 className="mt-4 break-words text-3xl font-black leading-tight sm:text-4xl">
              Welcome back, {profile.businessName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
              Search the exact material whose price changed, enter the new price and submit. You do not need to complete the full category questionnaire again.
            </p>
          </div>
          <button
            type="button"
            onClick={onManageProfile}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black text-white sm:w-auto"
          >
            <PencilLine className="h-4 w-4" /> Manage profile
          </button>
        </div>

        <div className="mt-5 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
          <span className="rounded-xl bg-white/7 px-3 py-3">{profile.supplierCode}</span>
          <span className="rounded-xl bg-white/7 px-3 py-3">{profile.phone}</span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/7 px-3 py-3"><MapPin className="h-3.5 w-3.5 text-[#F2B544]" />{profile.location}</span>
        </div>
      </section>

      {success ? (
        <section className="flex items-start gap-3 rounded-2xl border border-[#BFE2CD] bg-[#F0FAF4] p-4 text-sm leading-6 text-[#17613C] sm:p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div><strong className="block">Price sent for review</strong>{success}. Once approved, it becomes your current listed price for that material.</div>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-[#F0C4BA] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</section>
      ) : null}

      <section className="rounded-[1.4rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-6 md:p-7">
        {draft ? (
          <div>
            <button
              type="button"
              onClick={() => { setDraft(null); setError(""); }}
              className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-[#0D3B66]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to material search
            </button>

            <div className="rounded-2xl bg-[#F4F7FA] p-4 sm:p-5">
              <p className="text-xs font-bold text-[#617286]">Previous / current price</p>
              <p className="mt-1 break-words text-2xl font-black text-[#071E33]">
                {money(draft.previousPrice)}{draft.previousPrice != null && draft.quotedUnit ? ` / ${draft.quotedUnit}` : ""}
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Material / item" required value={draft.productName} onChange={(value) => setDraft({ ...draft, productName: value })} placeholder="e.g. Y12 reinforcement bar" />
              </div>
              <Input label="Specification / size" value={draft.specification} onChange={(value) => setDraft({ ...draft, specification: value })} placeholder="e.g. Y12, 12m length" />
              <Input label="Brand / make" value={draft.brand} onChange={(value) => setDraft({ ...draft, brand: value })} placeholder="e.g. Dangote, Coleman" />
              <Input label="Selling unit" required value={draft.quotedUnit} onChange={(value) => setDraft({ ...draft, quotedUnit: value })} placeholder="50kg bag, piece, 12m length..." />
              <Input label="New price (₦)" required inputMode="decimal" value={draft.unitPrice} onChange={(value) => setDraft({ ...draft, unitPrice: value })} placeholder="0" />
              <div className="sm:col-span-2">
                <Input label="Price location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
              </div>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-black text-[#071E33]">Remark</span>
                <textarea
                  value={draft.remarks}
                  onChange={(event) => setDraft({ ...draft, remarks: event.target.value })}
                  rows={3}
                  placeholder="Availability, bulk quantity, delivery condition..."
                  className="w-full rounded-xl border border-[#DCE4EC] px-4 py-3 text-base text-[#071E33] outline-none focus:border-[#0D3B66]"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white disabled:opacity-50 sm:w-auto"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Sending price…" : "Submit price change"}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Quick price change</p>
                <h2 className="mt-2 text-2xl font-black text-[#071E33] sm:text-3xl">Which material price changed?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Search or select an item you have priced before. No cement, roofing, plumbing or other category questionnaire is required.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadItems()}
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-black text-[#0D3B66] sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            <label className="relative mt-5 block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A8B9E]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Y12, Dangote cement, PPR 25mm, 60×60 tiles..."
                className="min-h-14 w-full rounded-2xl border border-[#CBD7E2] bg-white pl-12 pr-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66] focus:ring-2 focus:ring-[#0D3B66]/10"
              />
            </label>

            {loading ? (
              <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" />Loading your materials…</div>
            ) : items.length && filtered.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {filtered.map((item, index) => (
                  <button
                    key={`${item.catalogueItemId || item.catalogueCode || item.productName}-${index}`}
                    type="button"
                    onClick={() => chooseItem(item)}
                    className="flex min-h-[88px] w-full items-center justify-between gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 text-left transition hover:border-[#C8A45D]"
                  >
                    <span className="min-w-0">
                      <strong className="block break-words text-sm leading-5 text-[#071E33]">{item.productName}</strong>
                      <span className="mt-1 block break-words text-xs leading-5 text-[#617286]">{[item.specification, item.brand, item.quotedUnit].filter(Boolean).join(" · ")}</span>
                      <span className="mt-1 block text-xs font-black text-[#A82B05]">{money(item.currentPrice)}{item.currentPrice != null ? ` / ${item.quotedUnit}` : ""}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#A82B05]" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[#CBD7E2] bg-[#F8FAFC] p-5 text-center sm:p-7">
                <PackageSearch className="mx-auto h-8 w-8 text-[#7A8B9E]" />
                <h3 className="mt-3 text-base font-black text-[#071E33]">{query ? "Not in your previous prices" : "No previous materials found yet"}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617286]">You can still add the material directly. It will go through the same Charismak review before publication.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setDraft(newDraft(profile)); setError(""); setSuccess(""); }}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#0D3B66] bg-[#F2F7FC] px-5 text-sm font-black text-[#0D3B66] sm:w-auto"
            >
              <PackagePlus className="h-4 w-4" /> Add another material / item
            </button>
          </div>
        )}
      </section>

      {!draft ? (
        <section className="rounded-[1.4rem] border border-[#E2E8EE] bg-[#F7F9FB] p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0D3B66] shadow-sm"><Layers3 className="h-5 w-5" /></span>
              <div>
                <h3 className="text-sm font-black text-[#071E33]">Updating many prices?</h3>
                <p className="mt-1 text-xs leading-5 text-[#617286]">Use the category forms only when you want to submit several items together.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBulkUpdate}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white sm:w-auto"
            >
              Bulk update multiple items <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}