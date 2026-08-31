"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  History,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type OfferStatus = "pending" | "approved" | "rejected" | "expired";

type SupplierOffer = {
  id: string;
  supplier_name: string;
  product_name: string;
  specification: string | null;
  brand: string | null;
  quoted_unit: string;
  unit_price: number;
  bulk_price: number | null;
  minimum_qty: number | null;
  delivery_fee: number | null;
  delivery_included: boolean | null;
  location: string;
  service_area: string | null;
  availability: string | null;
  valid_until: string | null;
  supplier_remarks: string | null;
  status: OfferStatus;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
};

type OfferHistory = {
  id: string;
  offer_id: string;
  product_name: string;
  specification: string | null;
  brand: string | null;
  quoted_unit: string;
  unit_price: number;
  bulk_price: number | null;
  location: string;
  valid_from: string | null;
  valid_to: string | null;
  change_type: string;
  changed_by_email: string | null;
  archived_at: string;
};

type Draft = {
  product_name: string;
  specification: string;
  brand: string;
  quoted_unit: string;
  unit_price: string;
  bulk_price: string;
  minimum_qty: string;
  delivery_fee: string;
  delivery_included: "" | "true" | "false";
  location: string;
  service_area: string;
  availability: string;
  valid_until: string;
  supplier_remarks: string;
};

type Filter = "current" | "removed" | "all";
type AuthState = "checking" | "forbidden" | "ready";

const money = (value: number | null) => value == null
  ? "—"
  : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

const dateLabel = (value: string | null) => {
  if (!value) return "No date";
  const date = new Date(`${value.length === 10 ? `${value}T00:00:00` : value}`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(date)
    : value;
};

const toDraft = (offer: SupplierOffer): Draft => ({
  product_name: offer.product_name || "",
  specification: offer.specification || "",
  brand: offer.brand || "",
  quoted_unit: offer.quoted_unit || "",
  unit_price: String(offer.unit_price ?? ""),
  bulk_price: offer.bulk_price == null ? "" : String(offer.bulk_price),
  minimum_qty: offer.minimum_qty == null ? "" : String(offer.minimum_qty),
  delivery_fee: offer.delivery_fee == null ? "" : String(offer.delivery_fee),
  delivery_included: offer.delivery_included == null ? "" : String(offer.delivery_included) as Draft["delivery_included"],
  location: offer.location || "",
  service_area: offer.service_area || "",
  availability: offer.availability || "",
  valid_until: offer.valid_until || "",
  supplier_remarks: offer.supplier_remarks || "",
});

export default function SupplierPriceManager() {
  const client = getSupabaseBrowserClient();
  const [auth, setAuth] = useState<AuthState>("checking");
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [history, setHistory] = useState<OfferHistory[]>([]);
  const [batchByOffer, setBatchByOffer] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("current");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [historyOfferId, setHistoryOfferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    const { data: offerData, error: offerError } = await client
      .from("supplier_marketplace_offers")
      .select("id,supplier_name,product_name,specification,brand,quoted_unit,unit_price,bulk_price,minimum_qty,delivery_fee,delivery_included,location,service_area,availability,valid_until,supplier_remarks,status,submitted_at,published_at,updated_at")
      .in("status", ["approved", "expired"])
      .order("updated_at", { ascending: false })
      .limit(500);

    if (offerError) {
      setError(offerError.message);
      setLoading(false);
      return;
    }

    const typedOffers = (offerData || []) as SupplierOffer[];
    setOffers(typedOffers);

    const offerIds = typedOffers.map((offer) => offer.id);
    if (offerIds.length) {
      const [{ data: lineData }, { data: historyData, error: historyError }] = await Promise.all([
        client.from("supplier_review_lines").select("marketplace_offer_id,batch_id").in("marketplace_offer_id", offerIds),
        client.from("supplier_marketplace_offer_history").select("id,offer_id,product_name,specification,brand,quoted_unit,unit_price,bulk_price,location,valid_from,valid_to,change_type,changed_by_email,archived_at").in("offer_id", offerIds).order("archived_at", { ascending: false }).limit(1000),
      ]);

      const mapping: Record<string, string> = {};
      for (const row of lineData || []) {
        if (row.marketplace_offer_id && row.batch_id) mapping[String(row.marketplace_offer_id)] = String(row.batch_id);
      }
      setBatchByOffer(mapping);
      if (!historyError) setHistory((historyData || []) as OfferHistory[]);
    } else {
      setBatchByOffer({});
      setHistory([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!client) {
      setAuth("forbidden");
      setLoading(false);
      return;
    }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) {
        setAuth("forbidden");
        setLoading(false);
        return;
      }
      setAuth("ready");
      await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const current = offer.status === "approved" && (!offer.valid_until || offer.valid_until >= new Date().toISOString().slice(0, 10));
      if (filter === "current" && !current) return false;
      if (filter === "removed" && current) return false;
      if (!q) return true;
      return [offer.supplier_name, offer.product_name, offer.specification, offer.brand, offer.location, offer.quoted_unit]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [offers, filter, query]);

  const currentCount = offers.filter((offer) => offer.status === "approved" && (!offer.valid_until || offer.valid_until >= new Date().toISOString().slice(0, 10))).length;
  const removedCount = offers.length - currentCount;

  const beginEdit = (offer: SupplierOffer) => {
    setEditingId(offer.id);
    setDraft(toDraft(offer));
    setHistoryOfferId(null);
    setError("");
    setMessage("");
  };

  const saveEdit = async (offer: SupplierOffer) => {
    if (!client || !draft) return;
    if (!draft.product_name.trim() || !draft.quoted_unit.trim() || Number(draft.unit_price) <= 0) {
      setError("Product name, quoted unit and a price above zero are required.");
      return;
    }
    setBusyId(offer.id);
    setError("");
    setMessage("");
    const patch = {
      product_name: draft.product_name.trim(),
      specification: draft.specification.trim(),
      brand: draft.brand.trim(),
      quoted_unit: draft.quoted_unit.trim(),
      unit_price: Number(draft.unit_price),
      bulk_price: draft.bulk_price === "" ? null : Number(draft.bulk_price),
      minimum_qty: draft.minimum_qty === "" ? null : Number(draft.minimum_qty),
      delivery_fee: draft.delivery_fee === "" ? null : Number(draft.delivery_fee),
      delivery_included: draft.delivery_included === "" ? null : draft.delivery_included === "true",
      location: draft.location.trim(),
      service_area: draft.service_area.trim(),
      availability: draft.availability.trim(),
      valid_until: draft.valid_until,
      supplier_remarks: draft.supplier_remarks.trim(),
    };
    const { error: updateError } = await client.rpc("admin_update_supplier_marketplace_offer", {
      p_offer_id: offer.id,
      p_patch: patch,
    });
    if (updateError) {
      setError(updateError.message);
      setBusyId(null);
      return;
    }
    setEditingId(null);
    setDraft(null);
    setMessage("Approved supplier price updated. The previous version remains in history.");
    await load();
    setBusyId(null);
  };

  const removeOffer = async (offer: SupplierOffer) => {
    if (!client) return;
    const confirmed = window.confirm(`Delete ${offer.product_name} from ${offer.supplier_name}?\n\nIt will disappear from the current marketplace, but its approved history will be retained.`);
    if (!confirmed) return;
    setBusyId(offer.id);
    setError("");
    setMessage("");
    const { error: removeError } = await client.rpc("admin_remove_supplier_marketplace_offer", { p_offer_id: offer.id });
    if (removeError) {
      setError(removeError.message);
      setBusyId(null);
      return;
    }
    setMessage("Supplier price deleted from the current marketplace. Its audit history was retained.");
    if (editingId === offer.id) {
      setEditingId(null);
      setDraft(null);
    }
    await load();
    setBusyId(null);
  };

  if (auth === "checking") return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-xl px-4 py-16 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator sign-in required</h1><p className="mt-2 text-sm text-[#617286]">Sign in through the Charismak Admin Control Centre, then return to Approved Prices.</p><Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#071E33] px-5 py-3 text-sm font-black text-white">Go to Control Centre</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A82B05]">Supplier administration</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071E33] md:text-4xl">Approved Supplier Prices</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#617286]">Review prices after approval, correct a live offer, or remove it from the marketplace. Previous approved versions are retained automatically.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      {error ? <p className="mt-5 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}
      {message ? <p className="mt-5 rounded-xl border border-[#BFE3CD] bg-[#EDF9F2] px-4 py-3 text-sm text-[#17653F]">{message}</p> : null}

      <div className="mt-7 flex flex-wrap gap-2">
        <FilterButton active={filter === "current"} onClick={() => setFilter("current")}>Current ({currentCount})</FilterButton>
        <FilterButton active={filter === "removed"} onClick={() => setFilter("removed")}>Removed / Expired ({removedCount})</FilterButton>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All ({offers.length})</FilterButton>
      </div>

      <label className="relative mt-5 block max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, material, brand or location..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" />
      </label>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" /> Loading approved prices…</div>
      ) : visible.length ? (
        <div className="mt-6 space-y-4">
          {visible.map((offer) => {
            const current = offer.status === "approved" && (!offer.valid_until || offer.valid_until >= new Date().toISOString().slice(0, 10));
            const offerHistory = history.filter((item) => item.offer_id === offer.id);
            const editing = editingId === offer.id && draft;
            return (
              <article key={offer.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_30px_rgba(7,30,51,0.04)]">
                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start md:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-[#071E33]">{offer.product_name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${current ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F2F3F5] text-[#687583]"}`}>{current ? "CURRENT" : "REMOVED / EXPIRED"}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#0D3B66]">{offer.supplier_name}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#617286]">
                      <span><strong className="text-[#071E33]">{money(Number(offer.unit_price))}</strong> / {offer.quoted_unit}</span>
                      {offer.specification ? <span>{offer.specification}</span> : null}
                      {offer.brand ? <span>{offer.brand}</span> : null}
                      <span>{offer.location}</span>
                      <span>Valid to {dateLabel(offer.valid_until)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {batchByOffer[offer.id] ? <Link href={`/supplier-review/${batchByOffer[offer.id]}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#0D3B66]">Review <ArrowRight className="h-3.5 w-3.5" /></Link> : null}
                    <button type="button" onClick={() => setHistoryOfferId(historyOfferId === offer.id ? null : offer.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#526579]"><History className="h-3.5 w-3.5" /> History ({offerHistory.length})</button>
                    {current ? <button type="button" onClick={() => beginEdit(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0D3B66] px-3.5 text-xs font-black text-white"><Pencil className="h-3.5 w-3.5" /> Edit</button> : null}
                    {current ? <button type="button" disabled={busyId === offer.id} onClick={() => void removeOffer(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E5B7AE] bg-[#FFF7F5] px-3.5 text-xs font-black text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" /> Delete</button> : null}
                  </div>
                </div>

                {editing ? (
                  <div className="border-t border-[#DCE4EC] bg-[#F8FAFC] p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#A82B05]">Edit live price</p><p className="mt-1 text-xs text-[#617286]">Saving updates the public supplier offer immediately and archives the previous version.</p></div><button type="button" onClick={() => { setEditingId(null); setDraft(null); }} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4EC] bg-white text-[#526579]"><X className="h-4 w-4" /></button></div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Product name"><input value={draft.product_name} onChange={(e) => setDraft({ ...draft, product_name: e.target.value })} className={inputClass} /></Field>
                      <Field label="Specification"><input value={draft.specification} onChange={(e) => setDraft({ ...draft, specification: e.target.value })} className={inputClass} /></Field>
                      <Field label="Brand / make"><input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className={inputClass} /></Field>
                      <Field label="Quoted unit"><input value={draft.quoted_unit} onChange={(e) => setDraft({ ...draft, quoted_unit: e.target.value })} className={inputClass} /></Field>
                      <Field label="Unit price (₦)"><input type="number" min="0" value={draft.unit_price} onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })} className={inputClass} /></Field>
                      <Field label="Bulk price (₦)"><input type="number" min="0" value={draft.bulk_price} onChange={(e) => setDraft({ ...draft, bulk_price: e.target.value })} className={inputClass} /></Field>
                      <Field label="Minimum quantity"><input type="number" min="0" value={draft.minimum_qty} onChange={(e) => setDraft({ ...draft, minimum_qty: e.target.value })} className={inputClass} /></Field>
                      <Field label="Delivery fee (₦)"><input type="number" min="0" value={draft.delivery_fee} onChange={(e) => setDraft({ ...draft, delivery_fee: e.target.value })} className={inputClass} /></Field>
                      <Field label="Location"><input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className={inputClass} /></Field>
                      <Field label="Service area"><input value={draft.service_area} onChange={(e) => setDraft({ ...draft, service_area: e.target.value })} className={inputClass} /></Field>
                      <Field label="Availability"><input value={draft.availability} onChange={(e) => setDraft({ ...draft, availability: e.target.value })} className={inputClass} /></Field>
                      <Field label="Valid until"><input type="date" value={draft.valid_until} onChange={(e) => setDraft({ ...draft, valid_until: e.target.value })} className={inputClass} /></Field>
                      <Field label="Delivery included"><select value={draft.delivery_included} onChange={(e) => setDraft({ ...draft, delivery_included: e.target.value as Draft["delivery_included"] })} className={inputClass}><option value="">Not stated</option><option value="true">Yes</option><option value="false">No</option></select></Field>
                      <div className="md:col-span-2 xl:col-span-3"><Field label="Supplier remarks"><input value={draft.supplier_remarks} onChange={(e) => setDraft({ ...draft, supplier_remarks: e.target.value })} className={inputClass} /></Field></div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busyId === offer.id} onClick={() => void saveEdit(offer)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-5 text-xs font-black text-white">{busyId === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save live price</button><button type="button" onClick={() => { setEditingId(null); setDraft(null); }} className="inline-flex min-h-11 items-center rounded-xl border border-[#DCE4EC] bg-white px-5 text-xs font-black text-[#526579]">Cancel</button></div>
                  </div>
                ) : null}

                {historyOfferId === offer.id ? (
                  <div className="border-t border-[#DCE4EC] p-5 md:p-6">
                    <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#C08A13]" /><h3 className="text-sm font-black text-[#071E33]">Price history</h3></div>
                    {offerHistory.length ? <div className="mt-4 space-y-2">{offerHistory.map((item) => <div key={item.id} className="grid gap-2 rounded-xl bg-[#F6F8FA] p-4 text-xs text-[#526579] md:grid-cols-[1fr_auto] md:items-center"><div><span className="font-black text-[#071E33]">{money(Number(item.unit_price))} / {item.quoted_unit}</span>{item.specification ? ` · ${item.specification}` : ""}{item.brand ? ` · ${item.brand}` : ""}<p className="mt-1">{item.change_type.replaceAll("_", " ")} · archived {dateLabel(item.archived_at)}{item.changed_by_email && item.changed_by_email !== "system" ? ` · ${item.changed_by_email}` : ""}</p></div><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A8B9E]">Previous version</span></div>)}</div> : <p className="mt-3 text-xs text-[#7A8B9E]">No earlier version has been recorded yet.</p>}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center text-sm text-[#617286]">No supplier prices match this selection.</div>
      )}
    </div>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-[#D5DFE8] bg-white px-3 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">{label}</span>{children}</label>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2.5 text-xs font-black ${active ? "bg-[#071E33] text-white" : "border border-[#DCE4EC] bg-white text-[#526579]"}`}>{children}</button>;
}
