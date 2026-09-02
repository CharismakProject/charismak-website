"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, History, KeyRound, Loader2, MessageCircle, Pencil, RefreshCw, Save, Search, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Commercial = {
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
};

type Offer = Commercial & {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  phone: string | null;
  whatsapp: string | null;
  status: "approved" | "expired";
  updated_at: string;
};

type ReviewRequest = {
  id: string;
  offer_id: string;
  requested_by: "admin" | "supplier";
  reason: string | null;
  status: "awaiting_supplier" | "awaiting_code" | "admin_authorized" | "supplier_updating" | "completed" | "cancelled" | "expired";
  authorization_channel: "whatsapp" | "email" | null;
  authorization_expires_at: string | null;
  consumed_at: string | null;
  proposed_patch: Commercial | null;
  proposed_patch_hash: string | null;
  proposed_by: "admin" | "supplier" | null;
  proposed_at: string | null;
  authorized_patch_hash: string | null;
  before_snapshot: Commercial | null;
  created_at: string;
};

type HistoryRow = { id: string; offer_id: string; unit_price: number; quoted_unit: string; change_type: string; changed_by_email: string | null; archived_at: string };
type Draft = { product_name: string; specification: string; brand: string; quoted_unit: string; unit_price: string; bulk_price: string; minimum_qty: string; delivery_fee: string; delivery_included: "" | "true" | "false"; location: string; service_area: string; availability: string; valid_until: string; supplier_remarks: string };
type Filter = "current" | "removed" | "all";

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const today = () => new Date().toISOString().slice(0, 10);
const currentOffer = (offer: Offer) => offer.status === "approved" && (!offer.valid_until || offer.valid_until >= today());
const toDraft = (offer: Commercial): Draft => ({ product_name: offer.product_name, specification: offer.specification || "", brand: offer.brand || "", quoted_unit: offer.quoted_unit, unit_price: String(offer.unit_price), bulk_price: offer.bulk_price == null ? "" : String(offer.bulk_price), minimum_qty: offer.minimum_qty == null ? "" : String(offer.minimum_qty), delivery_fee: offer.delivery_fee == null ? "" : String(offer.delivery_fee), delivery_included: offer.delivery_included == null ? "" : String(offer.delivery_included) as Draft["delivery_included"], location: offer.location, service_area: offer.service_area || "", availability: offer.availability || "", valid_until: offer.valid_until || "", supplier_remarks: offer.supplier_remarks || "" });
const patchFrom = (draft: Draft) => ({ product_name: draft.product_name.trim(), specification: draft.specification.trim() || null, brand: draft.brand.trim() || null, quoted_unit: draft.quoted_unit.trim(), unit_price: Number(draft.unit_price), bulk_price: draft.bulk_price === "" ? null : Number(draft.bulk_price), minimum_qty: draft.minimum_qty === "" ? null : Number(draft.minimum_qty), delivery_fee: draft.delivery_fee === "" ? null : Number(draft.delivery_fee), delivery_included: draft.delivery_included === "" ? null : draft.delivery_included === "true", location: draft.location.trim(), service_area: draft.service_area.trim() || null, availability: draft.availability.trim() || null, valid_until: draft.valid_until || null, supplier_remarks: draft.supplier_remarks.trim() || null });
const authorizationActive = (request?: ReviewRequest) => Boolean(request?.status === "admin_authorized" && !request.consumed_at && request.authorization_expires_at && new Date(request.authorization_expires_at).getTime() > Date.now() && request.proposed_patch_hash && request.authorized_patch_hash === request.proposed_patch_hash);

export default function SupplierPriceOwnershipManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [auth, setAuth] = useState<"checking" | "forbidden" | "ready">("checking");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [batchByOffer, setBatchByOffer] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("current");
  const [query, setQuery] = useState("");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [codeRequestId, setCodeRequestId] = useState<string | null>(null);
  const [sellerCode, setSellerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!client) return;
    setLoading(true); setError("");
    const { data, error: offerError } = await client.from("supplier_marketplace_offers").select("id,supplier_id,supplier_name,product_name,specification,brand,quoted_unit,unit_price,bulk_price,minimum_qty,delivery_fee,delivery_included,location,service_area,availability,valid_until,supplier_remarks,phone,whatsapp,status,updated_at").in("status", ["approved", "expired"]).order("updated_at", { ascending: false }).limit(500);
    if (offerError) { setError(offerError.message); setLoading(false); return; }
    const nextOffers = (data || []) as Offer[];
    setOffers(nextOffers);
    const ids = nextOffers.map((offer) => offer.id);
    if (!ids.length) { setRequests([]); setHistory([]); setBatchByOffer({}); setLoading(false); return; }
    const [requestResult, historyResult, lineResult] = await Promise.all([
      client.from("supplier_price_review_requests").select("id,offer_id,requested_by,reason,status,authorization_channel,authorization_expires_at,consumed_at,proposed_patch,proposed_patch_hash,proposed_by,proposed_at,authorized_patch_hash,before_snapshot,created_at").in("offer_id", ids).order("created_at", { ascending: false }).limit(1000),
      client.from("supplier_marketplace_offer_history").select("id,offer_id,unit_price,quoted_unit,change_type,changed_by_email,archived_at").in("offer_id", ids).order("archived_at", { ascending: false }).limit(1000),
      client.from("supplier_review_lines").select("marketplace_offer_id,batch_id").in("marketplace_offer_id", ids),
    ]);
    if (!requestResult.error) setRequests((requestResult.data || []) as ReviewRequest[]);
    if (!historyResult.error) setHistory((historyResult.data || []) as HistoryRow[]);
    const mapping: Record<string, string> = {};
    for (const row of lineResult.data || []) if (row.marketplace_offer_id && row.batch_id) mapping[String(row.marketplace_offer_id)] = String(row.batch_id);
    setBatchByOffer(mapping);
    setLoading(false);
  };

  useEffect(() => {
    if (!client) { setAuth("forbidden"); setLoading(false); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); setLoading(false); return; }
      setAuth("ready"); await load();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const latestRequest = (offerId: string) => requests.find((request) => request.offer_id === offerId);
  const visible = offers.filter((offer) => {
    const current = currentOffer(offer);
    if (filter === "current" && !current) return false;
    if (filter === "removed" && current) return false;
    const q = query.trim().toLowerCase();
    return !q || [offer.supplier_name, offer.product_name, offer.specification, offer.brand, offer.location].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const requestSellerReview = async (offer: Offer) => {
    if (!client || !offer.supplier_id) return;
    const reason = window.prompt(`Why should ${offer.supplier_name} review ${offer.product_name}?`, "Please confirm or update this price.");
    if (reason === null) return;
    setBusyId(offer.id); setError(""); setMessage("");
    const { error: requestError } = await client.rpc("admin_request_supplier_price_review", { p_offer_id: offer.id, p_reason: reason.trim() || null });
    if (requestError) { setError(requestError.message); setBusyId(null); return; }
    setMessage("Seller review requested. No commercial value has been changed.");
    await load(); setBusyId(null);
    const raw = offer.whatsapp || offer.phone;
    if (raw) {
      const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
      const text = [`Hello ${offer.supplier_name},`, "Charismak has requested a review of your listed price.", `${offer.product_name}: ${money(Number(offer.unit_price))} / ${offer.quoted_unit}`, reason.trim() ? `Reason: ${reason.trim()}` : "", "Please sign in to update it yourself or prepare and authorise an exact change for Charismak.", "https://www.charismakproject.com/supplier-prices"].filter(Boolean).join("\n");
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const beginProposal = (offer: Offer) => { setProposalId(offer.id); setEditId(null); setDraft(toDraft(offer)); setError(""); setMessage(""); };
  const beginUnclaimedEdit = (offer: Offer) => { if (offer.supplier_id) return; setEditId(offer.id); setProposalId(null); setDraft(toDraft(offer)); setError(""); setMessage(""); };

  const submitProposal = async (offer: Offer) => {
    if (!client || !draft) return;
    const patch = patchFrom(draft);
    if (!patch.product_name || !patch.quoted_unit || !patch.location || !Number.isFinite(patch.unit_price) || patch.unit_price <= 0) { setError("Enter a valid product, unit, location and proposed price."); return; }
    const reason = window.prompt("Reason for this proposed change", "Proposed supplier price correction.");
    if (reason === null) return;
    setBusyId(offer.id); setError(""); setMessage("");
    const { error: proposalError } = await client.rpc("admin_propose_supplier_price_change", { p_offer_id: offer.id, p_patch: patch, p_reason: reason.trim() || null });
    if (proposalError) { setError(proposalError.message); setBusyId(null); return; }
    setProposalId(null); setDraft(null); setMessage("Exact proposal saved. Seller must see and authorise these exact values before Charismak can apply them.");
    await load(); setBusyId(null);
    const raw = offer.whatsapp || offer.phone;
    if (raw) {
      const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
      const text = [`Hello ${offer.supplier_name},`, `Charismak proposes this exact change for ${offer.product_name}:`, `${money(Number(offer.unit_price))} / ${offer.quoted_unit} → ${money(Number(patch.unit_price))} / ${patch.quoted_unit}`, patch.specification !== offer.specification ? `Specification: ${offer.specification || "—"} → ${patch.specification || "—"}` : "", patch.brand !== offer.brand ? `Brand: ${offer.brand || "—"} → ${patch.brand || "—"}` : "", reason.trim() ? `Reason: ${reason.trim()}` : "", "Please sign in to review the exact proposal. Charismak cannot apply different values with your authorisation.", "https://www.charismakproject.com/supplier-prices"].filter(Boolean).join("\n");
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  const verifySellerCode = async (request: ReviewRequest) => {
    if (!client || !/^\d{6}$/.test(sellerCode)) { setError("Enter the 6-digit code sent by the seller on WhatsApp."); return; }
    setBusyId(request.offer_id); setError("");
    const { data, error: verifyError } = await client.rpc("admin_verify_supplier_price_authorization", { p_request_id: request.id, p_code: sellerCode });
    if (verifyError) { setError(verifyError.message); setBusyId(null); return; }
    const result = data as { verified?: boolean; error?: string; remaining_attempts?: number } | null;
    if (!result?.verified) { setError(`${result?.error || "Seller code was not verified."}${typeof result?.remaining_attempts === "number" ? ` ${result.remaining_attempts} attempts remaining.` : ""}`); await load(); setBusyId(null); return; }
    setSellerCode(""); setCodeRequestId(null); setMessage("Seller confirmed the exact proposal. Admin can now apply only that exact change within 30 minutes.");
    await load(); setBusyId(null);
  };

  const applyAuthorized = async (request: ReviewRequest) => {
    if (!client || !authorizationActive(request) || !request.proposed_patch) return;
    if (!window.confirm("Apply exactly the seller-authorised change shown here?\n\nNo values can be altered during this step.")) return;
    setBusyId(request.offer_id); setError(""); setMessage("");
    const { error: applyError } = await client.rpc("admin_apply_authorized_supplier_price_change", { p_request_id: request.id });
    if (applyError) { setError(applyError.message); setBusyId(null); return; }
    setMessage("Exact seller-authorised change applied. The authorisation is now consumed and the previous price remains in history.");
    await load(); setBusyId(null);
  };

  const saveUnclaimed = async (offer: Offer) => {
    if (!client || !draft || offer.supplier_id) return;
    const patch = patchFrom(draft);
    if (!patch.product_name || !patch.quoted_unit || !patch.location || !Number.isFinite(patch.unit_price) || patch.unit_price <= 0) { setError("Enter a valid product, unit, location and price."); return; }
    setBusyId(offer.id); setError("");
    const { error: updateError } = await client.rpc("admin_update_supplier_marketplace_offer", { p_offer_id: offer.id, p_patch: patch });
    if (updateError) { setError(updateError.message); setBusyId(null); return; }
    setEditId(null); setDraft(null); setMessage("Unclaimed price updated by admin. Previous version retained in history."); await load(); setBusyId(null);
  };

  const removeOffer = async (offer: Offer) => {
    if (!client || !window.confirm(`Remove ${offer.product_name} from the live marketplace?\n\nThe approved history will be retained.`)) return;
    setBusyId(offer.id); setError("");
    const { error: removeError } = await client.rpc("admin_remove_supplier_marketplace_offer", { p_offer_id: offer.id });
    if (removeError) { setError(removeError.message); setBusyId(null); return; }
    setMessage("Price removed from the live marketplace. Audit history retained."); setProposalId(null); setEditId(null); setDraft(null); await load(); setBusyId(null);
  };

  if (auth === "checking") return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <div className="mx-auto max-w-xl px-4 py-16 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator sign-in required</h1><Link href="/admin" className="mt-5 inline-flex rounded-xl bg-[#071E33] px-5 py-3 text-sm font-black text-white">Go to Control Centre</Link></div>;

  const currentCount = offers.filter(currentOffer).length;
  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A82B05]">Supplier administration</p><h1 className="mt-2 text-3xl font-black text-[#071E33] md:text-4xl">Approved Supplier Prices</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#617286]">Admin may remove any listing, but cannot rewrite a supplier-owned price. For an owned price, create an exact proposal, let the seller see it, verify their confirmation, then apply that proposal unchanged.</p></div><button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    {error ? <p className="mt-5 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}
    {message ? <p className="mt-5 rounded-xl border border-[#BFE3CD] bg-[#EDF9F2] px-4 py-3 text-sm text-[#17653F]">{message}</p> : null}
    <div className="mt-6 flex flex-wrap gap-2"><FilterButton active={filter === "current"} onClick={() => setFilter("current")}>Current ({currentCount})</FilterButton><FilterButton active={filter === "removed"} onClick={() => setFilter("removed")}>Removed / expired ({offers.length - currentCount})</FilterButton><FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All ({offers.length})</FilterButton></div>
    <label className="relative mt-4 block max-w-2xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, product, brand or location…" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#0D3B66]" /></label>

    {loading ? <div className="mt-8 flex items-center gap-2 text-sm text-[#617286]"><Loader2 className="h-5 w-5 animate-spin" />Loading prices…</div> : <div className="mt-6 space-y-4">{visible.map((offer) => {
      const request = latestRequest(offer.id); const owned = Boolean(offer.supplier_id); const current = currentOffer(offer); const authorised = authorizationActive(request); const offerHistory = history.filter((row) => row.offer_id === offer.id);
      return <article key={offer.id} className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_30px_rgba(7,30,51,0.04)]">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start md:p-6"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#071E33]">{offer.product_name}</h2><Badge text={current ? "CURRENT" : "REMOVED / EXPIRED"} good={current} /><Badge text={owned ? "SUPPLIER-OWNED" : "UNCLAIMED / ADMIN-MANAGED"} good={!owned} />{authorised ? <Badge text="EXACT CHANGE AUTHORISED" good /> : null}</div><p className="mt-1 text-sm font-semibold text-[#0D3B66]">{offer.supplier_name}</p><p className="mt-3 text-sm text-[#526579]"><strong className="text-[#071E33]">{money(Number(offer.unit_price))}</strong> / {offer.quoted_unit} · {offer.location}{offer.valid_until ? ` · valid to ${offer.valid_until}` : ""}</p>{request ? <p className="mt-2 text-xs text-[#617286]">Review: <strong className="text-[#071E33]">{request.status.replaceAll("_", " ")}</strong>{request.reason ? ` · ${request.reason}` : ""}</p> : null}{request?.proposed_patch ? <ProposalSummary before={request.before_snapshot || offer} after={request.proposed_patch} /> : null}</div>
        <div className="flex flex-wrap gap-2">{batchByOffer[offer.id] ? <Link href={`/supplier-review/${batchByOffer[offer.id]}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#0D3B66]">Original review <ArrowRight className="h-3.5 w-3.5" /></Link> : null}<button type="button" onClick={() => setHistoryId(historyId === offer.id ? null : offer.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#526579]"><History className="h-3.5 w-3.5" />History</button>{current && owned && !authorised ? <><button type="button" disabled={busyId === offer.id} onClick={() => void requestSellerReview(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C9D8E7] px-3.5 text-xs font-black text-[#0D3B66]"><UserCheck className="h-3.5 w-3.5" />Request review</button><button type="button" onClick={() => beginProposal(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0D3B66] px-3.5 text-xs font-black text-white"><Pencil className="h-3.5 w-3.5" />Propose exact change</button></> : null}{current && owned && request?.status === "awaiting_code" && request.authorization_channel === "whatsapp" ? <button type="button" onClick={() => { setCodeRequestId(codeRequestId === request.id ? null : request.id); setSellerCode(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C9D8E7] px-3.5 text-xs font-black text-[#0D3B66]"><KeyRound className="h-3.5 w-3.5" />Verify seller code</button> : null}{current && owned && authorised && request ? <button type="button" disabled={busyId === offer.id} onClick={() => void applyAuthorized(request)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#197447] px-3.5 text-xs font-black text-white"><CheckCircle2 className="h-3.5 w-3.5" />Apply authorised change</button> : null}{current && !owned ? <button type="button" onClick={() => beginUnclaimedEdit(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#197447] px-3.5 text-xs font-black text-white"><Pencil className="h-3.5 w-3.5" />Edit</button> : null}{current ? <button type="button" disabled={busyId === offer.id} onClick={() => void removeOffer(offer)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E5B7AE] bg-[#FFF7F5] px-3.5 text-xs font-black text-[#A82B05]"><Trash2 className="h-3.5 w-3.5" />Delete</button> : null}</div></div>
        {request && codeRequestId === request.id ? <div className="border-t border-[#E4EAF0] bg-[#F8FAFC] p-4 md:px-6"><p className="text-xs font-black text-[#071E33]">Verify the 6-digit WhatsApp code against the exact proposal shown above.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={sellerCode} inputMode="numeric" maxLength={6} onChange={(event) => setSellerCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="min-h-11 max-w-xs rounded-xl border border-[#C9D8E7] bg-white px-4 text-sm outline-none" /><button type="button" disabled={busyId === offer.id} onClick={() => void verifySellerCode(request)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />Verify exact proposal</button></div></div> : null}
        {proposalId === offer.id && draft ? <EditPanel title="Propose exact supplier change" note="This does not change the live price. The seller must see and approve these exact values first." draft={draft} setDraft={setDraft} busy={busyId === offer.id} onSave={() => void submitProposal(offer)} saveLabel="Send exact proposal" onCancel={() => { setProposalId(null); setDraft(null); }} /> : null}
        {editId === offer.id && draft ? <EditPanel title="Edit unclaimed price" note="No supplier profile owns this price, so admin may maintain it directly." draft={draft} setDraft={setDraft} busy={busyId === offer.id} onSave={() => void saveUnclaimed(offer)} saveLabel="Save price" onCancel={() => { setEditId(null); setDraft(null); }} /> : null}
        {historyId === offer.id ? <div className="border-t border-[#E5EAF0] p-5 text-xs text-[#617286] md:px-6">{offerHistory.length ? offerHistory.map((row) => <p key={row.id} className="mb-2 rounded-xl bg-[#F7F9FB] p-3"><strong className="text-[#071E33]">{money(Number(row.unit_price))}/{row.quoted_unit}</strong> · {row.change_type.replaceAll("_", " ")} · {new Date(row.archived_at).toLocaleString("en-NG")}{row.changed_by_email && row.changed_by_email !== "system" ? ` · ${row.changed_by_email}` : ""}</p>) : <p>No earlier version recorded.</p>}</div> : null}
      </article>;
    })}{!visible.length ? <div className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center text-sm text-[#617286]">No supplier prices match this selection.</div> : null}</div>}
  </div>;
}

function ProposalSummary({ before, after }: { before: Commercial; after: Commercial }) {
  const rows = [["Price", `${money(Number(before.unit_price))} / ${before.quoted_unit}`, `${money(Number(after.unit_price))} / ${after.quoted_unit}`], ["Specification", before.specification || "—", after.specification || "—"], ["Brand", before.brand || "—", after.brand || "—"], ["Location", before.location, after.location], ["Valid until", before.valid_until || "—", after.valid_until || "—"]].filter((row) => row[1] !== row[2]);
  return <div className="mt-3 rounded-xl border border-[#C9D8E7] bg-[#F7FAFD] p-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#0D3B66]">Exact proposal</p>{rows.length ? <div className="mt-2 space-y-1">{rows.map((row) => <p key={row[0]} className="text-xs text-[#526579]"><strong className="text-[#071E33]">{row[0]}:</strong> {row[1]} → <strong>{row[2]}</strong></p>)}</div> : <p className="mt-2 text-xs text-[#617286]">No visible change.</p>}</div>;
}

function EditPanel({ title, note, draft, setDraft, busy, onSave, saveLabel, onCancel }: { title: string; note: string; draft: Draft; setDraft: (draft: Draft) => void; busy: boolean; onSave: () => void; saveLabel: string; onCancel: () => void }) {
  return <div className="border-t border-[#DCE4EC] bg-[#F8FAFC] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#A82B05]">{title}</p><p className="mt-1 text-xs text-[#617286]">{note}</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4EC] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Product" value={draft.product_name} onChange={(v) => setDraft({ ...draft, product_name: v })} /><Field label="Specification" value={draft.specification} onChange={(v) => setDraft({ ...draft, specification: v })} /><Field label="Brand" value={draft.brand} onChange={(v) => setDraft({ ...draft, brand: v })} /><Field label="Unit" value={draft.quoted_unit} onChange={(v) => setDraft({ ...draft, quoted_unit: v })} /><Field label="Unit price (₦)" type="number" value={draft.unit_price} onChange={(v) => setDraft({ ...draft, unit_price: v })} /><Field label="Bulk price (₦)" type="number" value={draft.bulk_price} onChange={(v) => setDraft({ ...draft, bulk_price: v })} /><Field label="Minimum qty" type="number" value={draft.minimum_qty} onChange={(v) => setDraft({ ...draft, minimum_qty: v })} /><Field label="Delivery fee (₦)" type="number" value={draft.delivery_fee} onChange={(v) => setDraft({ ...draft, delivery_fee: v })} /><Field label="Location" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} /><Field label="Service area" value={draft.service_area} onChange={(v) => setDraft({ ...draft, service_area: v })} /><Field label="Availability" value={draft.availability} onChange={(v) => setDraft({ ...draft, availability: v })} /><Field label="Valid until" type="date" value={draft.valid_until} onChange={(v) => setDraft({ ...draft, valid_until: v })} /><label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Delivery included</span><select value={draft.delivery_included} onChange={(event) => setDraft({ ...draft, delivery_included: event.target.value as Draft["delivery_included"] })} className="min-h-11 w-full rounded-xl border border-[#D5DFE8] bg-white px-3 text-sm"><option value="">Not stated</option><option value="true">Yes</option><option value="false">No</option></select></label><div className="md:col-span-2 xl:col-span-3"><Field label="Supplier remarks" value={draft.supplier_remarks} onChange={(v) => setDraft({ ...draft, supplier_remarks: v })} /></div></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={onSave} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-5 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saveLabel}</button><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-[#DCE4EC] bg-white px-5 text-xs font-black text-[#526579]">Cancel</button></div></div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D5DFE8] bg-white px-3 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function Badge({ text, good }: { text: string; good: boolean }) { return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${good ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#F2F3F5] text-[#687583]"}`}>{text}</span>; }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2.5 text-xs font-black ${active ? "bg-[#071E33] text-white" : "border border-[#DCE4EC] bg-white text-[#526579]"}`}>{children}</button>; }