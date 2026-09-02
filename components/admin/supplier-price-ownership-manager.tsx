"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  History,
  KeyRound,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type OfferStatus = "pending" | "approved" | "rejected" | "expired";
type SupplierOffer = {
  id: string;
  supplier_id: string | null;
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
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  status: OfferStatus;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
};
type OfferHistory = {
  id: string;
  offer_id: string;
  product_name: string;
  quoted_unit: string;
  unit_price: number;
  change_type: string;
  changed_by_email: string | null;
  archived_at: string;
};
type ReviewRequest = {
  id: string;
  offer_id: string;
  requested_by: "admin" | "supplier";
  reason: string | null;
  status: "awaiting_supplier" | "awaiting_code" | "admin_authorized" | "supplier_updating" | "completed" | "cancelled" | "expired";
  authorization_channel: "whatsapp" | "email" | null;
  otp_expires_at: string | null;
  verified_at: string | null;
  authorization_expires_at: string | null;
  consumed_at: string | null;
  completed_at: string | null;
  admin_changed_by_email: string | null;
  created_at: string;
  updated_at: string;
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

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string | null) => {
  if (!value) return "No date";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: value.length > 10 ? "2-digit" : undefined, minute: value.length > 10 ? "2-digit" : undefined }).format(date) : value;
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
const currentOffer = (offer: SupplierOffer) => offer.status === "approved" && (!offer.valid_until || offer.valid_until >= new Date().toISOString().slice(0, 10));
const activeAuthorization = (request?: ReviewRequest) => Boolean(request?.status === "admin_authorized" && request.authorization_expires_at && new Date(request.authorization_expires_at).getTime() > Date.now() && !request.consumed_at);

export default function SupplierPriceOwnershipManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [history, setHistory] = useState<OfferHistory[]>([]);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [batchByOffer, setBatchByOffer] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("current");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [historyOfferId, setHistoryOfferId] = useState<string | null>(null);
  const [codeRequestId, setCodeRequestId] = useState<string | null>(null);
  const [sellerCode, setSellerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    const { data: offerData, error: offerError } = await client.from("supplier_marketplace_offers")
      .select("id,supplier_id,supplier_name,product_name,specification,brand,quoted_unit,unit_price,bulk_price,minimum_qty,delivery_fee,delivery_included,location,service_area,availability,valid_until,supplier_remarks,phone,whatsapp,email,status,submitted_at,published_at,updated_at")
      .in("status", ["approved", "expired"]).order("updated_at", { ascending: false }).limit(500);
    if (offerError) { setError(offerError.message); setLoading(false); return; }
    const typed = (offerData || []) as SupplierOffer[];
    setOffers(typed);
    const ids = typed.map((offer) => offer.id);
    if (!ids.length) { setHistory([]); setRequests([]); setBatchByOffer({}); setLoading(false); return; }

    const [lineResult, historyResult, requestResult] = await Promise.all([
      client.from("supplier_review_lines").select("marketplace_offer_id,batch_id").in("marketplace_offer_id", ids),
      client.from("supplier_marketplace_offer_history").select("id,offer_id,product_name,quoted_unit,unit_price,change_type,changed_by_email,archived_at").in("offer_id", ids).order("archived_at", { ascending: false }).limit(1000),
      client.from("supplier_price_review_requests").select("id,offer_id,requested_by,reason,status,authorization_channel,otp_expires_at,verified_at,authorization_expires_at,consumed_at,completed_at,admin_changed_by_email,created_at,updated_at").in("offer_id", ids).order("created_at", { ascending: false }).limit(1000),
    ]);
    const mapping: Record<string, string> = {};
    for (const row of lineResult.data || []) if (row.marketplace_offer_id && row.batch_id) mapping[String(row.marketplace_offer_id)] = String(row.batch_id);
    setBatchByOffer(mapping);
    if (!historyResult.error) setHistory((historyResult.data || []) as OfferHistory[]);
    if (!requestResult.error) setRequests((requestResult.data || []) as ReviewRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); setLoading(false); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); setLoading(false); return; }
      setAuth("ready");
      await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const latestRequest = (offerId: string) => requests.find((request) => request.offer_id === offerId);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const current = currentOffer(offer);
      if (filter === "current" && !current) return false;
      if (filter === "removed" && current) return false;
      if (!q) return true;
      return [offer.supplier_name, offer.product_name, offer.specification, offer.brand, offer.location, offer.quoted_unit].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [offers, filter, query]);

  const beginEdit = (offer: SupplierOffer) => {
    const owned = Boolean(offer.supplier_id);
    const request = latestRequest(offer.id);
    if (owned && !activeAuthorization(request)) {
      setError("This price belongs to a supplier profile. Request seller review or verify the seller's one-time authorization first.");
      return;
    }
    setEditingId(offer.id); setDraft(toDraft(offer)); setHistoryOfferId(null); setError(""); setMessage("");
  };

  const requestReview = async (offer: SupplierOffer) => {
    if (!client || !offer.supplier_id) return;
    const reason = window.prompt(`Why should ${offer.supplier_name} review ${offer.product_name}?`, "Please confirm or update this price.");
    if (reason === null) return;
    setBusyId(offer.id); setError(""); setMessage("");
    const { error: requestError } = await client.rpc("admin_request_supplier_price_review", { p_offer_id: offer.id, p_reason: reason.trim() || null });
    if (requestError) { setError(requestError.message); setBusyId(null); return; }
    setMessage("Review requested. The supplier can update the price themselves or authorise Charismak for this price only.");
    await load();
    setBusyId(null);

    const raw = offer.whatsapp || offer.phone;
    if (raw) {
      const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
      const text = [`Hello ${offer.supplier_name},`, "Charismak has requested that you review one of your listed prices.", `Item: ${offer.product_name}`, `Current price: ${money(Number(offer.unit_price))} / ${offer.quoted_unit}`, reason.trim() ? `Reason: ${reason.trim()}` : "", "Please sign in to your supplier account to update it yourself or authorise Charismak for this specific price.", "https://www.charismakproject.com/supplier-prices"].filter(Boolean).join("\n");
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const verifySellerCode = async (request: ReviewRequest) => {
    if (!client || !/^\d{6}$/.test(sellerCode)) { setError("Enter the 6-digit code received from the supplier on WhatsApp."); return; }
    setBusyId(request.offer_id); setError("");
    const { error: verifyError } = await client.rpc("admin_verify_supplier_price_authorization", { p_request_id: request.id, p_code: sellerCode });
    if (verifyError) { setError(verifyError.message); setBusyId(null); return; }
    setSellerCode(""); setCodeRequestId(null); setMessage("Seller authorization verified. One edit is allowed for this price for the next 30 minutes.");
    await load(); setBusyId(null);
  };

  const saveEdit = async (offer: SupplierOffer) => {
    if (!client || !draft) return;
    if (!draft.product_name.trim() || !draft.quoted_unit.trim() || Number(draft.unit_price) <= 0) { setError("Product name, quoted unit and a price above zero are required."); return; }
    setBusyId(offer.id); setError(""); setMessage("");
    const patch = {
      product_name: draft.product_name.trim(), specification: draft.specification.trim(), brand: draft.brand.trim(), quoted_unit: draft.quoted_unit.trim(), unit_price: Number(draft.unit_price),
      bulk_price: draft.bulk_price === "" ? null : Number(draft.bulk_price), minimum_qty: draft.minimum_qty === "" ? null : Number(draft.minimum_qty), delivery_fee: draft.delivery_fee === "" ? null : Number(draft.delivery_fee),
      delivery_included: draft.delivery_included === "" ? null : draft.delivery_included === "true", location: draft.location.trim(), service_area: draft.service_area.trim(), availability: draft.availability.trim(), valid_until: draft.valid_until, supplier_remarks: draft.supplier_remarks.trim(),
    };
    const { error: updateError } = await client.rpc("admin_update_supplier_marketplace_offer", { p_offer_id: offer.id, p_patch: patch });
    if (updateError) { setError(updateError.message); setBusyId(null); return; }
    setEditingId(null); setDraft(null);
    setMessage(offer.supplier_id ? "Seller-authorised update completed. The permission has been consumed and the previous version is retained in history." : "Unclaimed price updated. Previous version retained in history.");
    await load(); setBusyId(null);
  };

  const removeOffer = async (offer: SupplierOffer) => {
    if (!client || !window.confirm(`Delete ${offer.product_name} from ${offer.supplier_name}?\n\nIt will leave the live marketplace but remain in audit history.`)) return;
    setBusyId(offer.id); setError("");
    const { error: removeError } = await client.rpc("admin_remove_supplier_marketplace_offer", { p_offer_id: offer.id });
    if (removeError) { setError(removeError.message); setBusyId(null); return; }
    setMessage("Price removed from the current marketplace. Audit history retained.");
    setEditingId(null); setDraft(null); await load(); setBusyId(null);
  };

  if (auth === "checking") return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-xl px-4 py-16 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator sign-in required</h1><Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#071E33] px-5 py-3 text-sm font-black text-white">Go to Control Centre</Link></div>;

  const currentCount = offers.filter(currentOffer).length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A82B05]">Supplier administration</p><h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071E33] md:text-4xl">Approved Supplier Prices</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#617286]">Supplier-owned prices are read-only to admin unless the seller gives one-time authorisation. Unclaimed prices remain admin-managed. Admin can remove any live price.</p></div><button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
      {error ? <p className="mt-5 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}
      {message ? <p className="mt-5 rounded-xl border border-[#BFE3CD] bg-[#EDF9F2] px-4 py-3 text-sm text-[#17653F]">{message}</p> : null}
      <div className="mt-7 flex flex-wrap gap-2"><FilterButton active={filter === "current"} onClick={() => setFilter("current")}>Current ({currentCount})</FilterButton><FilterButton active={filter === "removed"} onClick={() => setFilter("removed")}>Removed / Expired ({offers.length - currentCount})</FilterButton><FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All ({offers.length})</FilterButton></div>
      <label className="relative mt-5 block max-w-2xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, material, brand or location..." className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>

      {loading ? <div className="mt-10 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" />Loading prices…</div> : visible.length ? <div className="mt-6 space-y-4">{visible.map((offer) => {
        const current = currentOffer(offer); const owned = Boolean(offer.supplier_id); const request = latestRequest(offer.id); const authorised = activeAuthorization(request); const offerHistory = history.filter((item) => item.offer_id === offer.id); const editing = editingId === offer.id && draft;
        return <article key={offer.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_30px_rgba(7,30,51,0.04)]">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start md:p-6"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#071E33]">{offer.product_name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${current ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F2F3F5] text-[#687583]"}`}>{current ? "CURRENT" : "REMOVED / EXPIRED"}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${owned ? "bg-[#EEF4FA] text-[#0D3B66]" : "bg-[#FFF7E7] text-[#8A6500]"}`}>{owned ? "SUPPLIER-OWNED" : "UNCLAIMED / ADMIN-MANAGED"}</span>{authorised ? <span className="rounded-full bg-[#EAF7EF] px-2.5 py-1 text-[10px] font-black text-[#197447]">ADMIN AUTHORISED</span> : null}</div><p className="mt-1 text-sm font-semibold text-[#0D3B66]">{offer.supplier_name}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#617286]"><span><strong className="text-[#071E33]">{money(Number(offer.unit_price))}</strong> / {offer.quoted_unit}</span>{offer.specification ? <span>{offer.specification}</span> : null}{offer.brand ? <span>{offer.brand}</span> : null}<span>{offer.location}</span><span>Valid to {dateLabel(offer.valid_until)}</span></div>{owned && request ? <p className="mt-3 text-xs text-[#526579]">Review: <strong className="text-[#071E33]">{request.status.replaceAll("_", " ")}</strong>{request.reason ? ` · ${request.reason}` : ""}{authorised ? ` · permission expires ${dateLabel(request.authorization_expires_at)}` : ""}</p> : null}</div>
          <div className="flex flex-wrap gap-2">{batchByOffer[offer.id] ? <Link href={`/supplier-review/${batchByOffer[offer.id]}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#0D3B66]">Review <ArrowRight className="h-3.5 w-3.5" /></Link> : null}<button type="button" onClick={() => setHistoryOfferId(historyOfferId === offer.id ? null : offer.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#526579]"><History className="h-3.5 w-3.5" />History ({offerHistory.length})</button>{current && owned && !authorised ? <button type="button" disabled={busyId === offer.id} onClick={() => void requestReview(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0D3B66] px-3.5 text-xs font-black text-white"><UserCheck className="h-3.5 w-3.5" />Request review</button> : null}{current && owned && request?.status === "awaiting_code" && request.authorization_channel === "whatsapp" ? <button type="button" onClick={() => { setCodeRequestId(codeRequestId === request.id ? null : request.id); setSellerCode(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C9D8E7] px-3.5 text-xs font-black text-[#0D3B66]"><KeyRound className="h-3.5 w-3.5" />Verify seller code</button> : null}{current && (!owned || authorised) ? <button type="button" onClick={() => beginEdit(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#197447] px-3.5 text-xs font-black text-white"><Pencil className="h-3.5 w-3.5" />{owned ? "Edit authorised price" : "Edit"}</button> : null}{current ? <button type="button" disabled={busyId === offer.id} onClick={() => void removeOffer(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E5B7AE] bg-[#FFF7F5] px-3.5 text-xs font-black text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" />Delete</button> : null}</div></div>
          {request && codeRequestId === request.id ? <div className="border-t border-[#E4EAF0] bg-[#F8FAFC] p-4 md:px-6"><p className="text-xs font-black text-[#071E33]">Enter the 6-digit code the seller sent to Charismak on WhatsApp.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input inputMode="numeric" maxLength={6} value={sellerCode} onChange={(event) => setSellerCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="min-h-11 max-w-xs rounded-xl border border-[#C9D8E7] bg-white px-4 text-sm outline-none" placeholder="000000" /><button type="button" disabled={busyId === offer.id} onClick={() => void verifySellerCode(request)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />Verify & unlock one edit</button></div></div> : null}
          {editing && draft ? <EditPanel offer={offer} draft={draft} setDraft={setDraft} busy={busyId === offer.id} onSave={() => void saveEdit(offer)} onCancel={() => { setEditingId(null); setDraft(null); }} /> : null}
          {historyOfferId === offer.id ? <div className="border-t border-[#DCE4EC] p-5 md:p-6"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#C08A13]" /><h3 className="text-sm font-black text-[#071E33]">Price & authorisation history</h3></div>{offerHistory.length ? <div className="mt-4 space-y-2">{offerHistory.map((item) => <div key={item.id} className="rounded-xl bg-[#F6F8FA] p-4 text-xs text-[#526579]"><strong className="text-[#071E33]">{money(Number(item.unit_price))} / {item.quoted_unit}</strong><p className="mt-1">{item.change_type.replaceAll("_", " ")} · {dateLabel(item.archived_at)}{item.changed_by_email && item.changed_by_email !== "system" ? ` · ${item.changed_by_email}` : ""}</p></div>)}</div> : <p className="mt-3 text-xs text-[#7A8B9E]">No earlier price version recorded.</p>}{requests.filter((item) => item.offer_id === offer.id).length ? <div className="mt-4 space-y-2">{requests.filter((item) => item.offer_id === offer.id).map((item) => <div key={item.id} className="rounded-xl border border-[#E0E7ED] p-4 text-xs text-[#526579]"><strong className="text-[#071E33]">{item.requested_by === "admin" ? "Admin review request" : "Supplier authorisation request"}</strong><p className="mt-1">{item.status.replaceAll("_", " ")} · created {dateLabel(item.created_at)}{item.authorization_channel ? ` · ${item.authorization_channel}` : ""}{item.admin_changed_by_email ? ` · changed by ${item.admin_changed_by_email}` : ""}</p></div>)}</div> : null}</div> : null}
        </article>;
      })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center text-sm text-[#617286]">No supplier prices match this selection.</div>}
    </div>
  );
}

function EditPanel({ offer, draft, setDraft, busy, onSave, onCancel }: { offer: SupplierOffer; draft: Draft; setDraft: (draft: Draft) => void; busy: boolean; onSave: () => void; onCancel: () => void }) {
  return <div className="border-t border-[#DCE4EC] bg-[#F8FAFC] p-5 md:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#A82B05]">{offer.supplier_id ? "Seller-authorised edit" : "Admin-managed price"}</p><p className="mt-1 text-xs text-[#617286]">{offer.supplier_id ? "This permission applies to this price only and is consumed after Save." : "No supplier profile owns this price, so admin may maintain it directly."}</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4EC] bg-white text-[#526579]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Product name" value={draft.product_name} onChange={(value) => setDraft({ ...draft, product_name: value })} /><TextField label="Specification" value={draft.specification} onChange={(value) => setDraft({ ...draft, specification: value })} /><TextField label="Brand / make" value={draft.brand} onChange={(value) => setDraft({ ...draft, brand: value })} /><TextField label="Quoted unit" value={draft.quoted_unit} onChange={(value) => setDraft({ ...draft, quoted_unit: value })} /><TextField label="Unit price (₦)" type="number" value={draft.unit_price} onChange={(value) => setDraft({ ...draft, unit_price: value })} /><TextField label="Bulk price (₦)" type="number" value={draft.bulk_price} onChange={(value) => setDraft({ ...draft, bulk_price: value })} /><TextField label="Minimum quantity" type="number" value={draft.minimum_qty} onChange={(value) => setDraft({ ...draft, minimum_qty: value })} /><TextField label="Delivery fee (₦)" type="number" value={draft.delivery_fee} onChange={(value) => setDraft({ ...draft, delivery_fee: value })} /><TextField label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} /><TextField label="Service area" value={draft.service_area} onChange={(value) => setDraft({ ...draft, service_area: value })} /><TextField label="Availability" value={draft.availability} onChange={(value) => setDraft({ ...draft, availability: value })} /><TextField label="Valid until" type="date" value={draft.valid_until} onChange={(value) => setDraft({ ...draft, valid_until: value })} /><label className="block"><span className={fieldLabel}>Delivery included</span><select value={draft.delivery_included} onChange={(event) => setDraft({ ...draft, delivery_included: event.target.value as Draft["delivery_included"] })} className={inputClass}><option value="">Not stated</option><option value="true">Yes</option><option value="false">No</option></select></label><div className="md:col-span-2 xl:col-span-3"><TextField label="Supplier remarks" value={draft.supplier_remarks} onChange={(value) => setDraft({ ...draft, supplier_remarks: value })} /></div></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={onSave} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-5 text-xs font-black text-white">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save price</button><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-[#DCE4EC] bg-white px-5 text-xs font-black text-[#526579]">Cancel</button></div></div>;
}
const inputClass = "min-h-11 w-full rounded-xl border border-[#D5DFE8] bg-white px-3 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]";
const fieldLabel = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]";
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className={fieldLabel}>{label}</span><input type={type} min={type === "number" ? "0" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>; }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2.5 text-xs font-black ${active ? "bg-[#071E33] text-white" : "border border-[#DCE4EC] bg-white text-[#526579]"}`}>{children}</button>; }
