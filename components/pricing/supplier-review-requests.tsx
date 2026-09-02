"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Mail, MessageCircle, RefreshCw, ShieldCheck, X } from "lucide-react";

import type { SupplierProfile } from "@/lib/platform/supplier-profiles";
import {
  getSupplierReviewWorkspace,
  markSupplierUpdating,
  startSupplierAdminAuthorization,
  verifySupplierAdminAuthorization,
  type SupplierPriceProposal,
  type SupplierPriceReviewRequest,
  type SupplierReviewOffer,
} from "@/lib/platform/supplier-review-requests";

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const activeStatuses = new Set(["awaiting_supplier", "awaiting_code", "admin_authorized", "supplier_updating"]);

type Draft = { price: string; unit: string; specification: string; brand: string; location: string; validUntil: string; remarks: string };
const draftFrom = (offer: SupplierReviewOffer): Draft => ({ price: String(offer.unit_price), unit: offer.quoted_unit, specification: offer.specification || "", brand: offer.brand || "", location: offer.location, validUntil: offer.valid_until || "", remarks: offer.supplier_remarks || "" });
const proposalFrom = (offer: SupplierReviewOffer, draft: Draft): SupplierPriceProposal => ({
  product_name: offer.product_name,
  specification: draft.specification.trim() || null,
  brand: draft.brand.trim() || null,
  quoted_unit: draft.unit.trim(),
  unit_price: Number(draft.price),
  bulk_price: offer.bulk_price,
  minimum_qty: offer.minimum_qty,
  delivery_fee: offer.delivery_fee,
  delivery_included: offer.delivery_included,
  location: draft.location.trim(),
  service_area: offer.service_area,
  availability: offer.availability,
  valid_until: draft.validUntil || null,
  supplier_remarks: draft.remarks.trim() || null,
});

export default function SupplierReviewRequests({ profile, onUpdateMyself }: { profile: SupplierProfile; onUpdateMyself: () => void }) {
  const [offers, setOffers] = useState<SupplierReviewOffer[]>([]);
  const [requests, setRequests] = useState<SupplierPriceReviewRequest[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [proposalOfferId, setProposalOfferId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailVerification, setEmailVerification] = useState<{ requestId: string; productName: string } | null>(null);
  const [emailCode, setEmailCode] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getSupplierReviewWorkspace(profile.accessToken);
      setOffers(data.offers);
      setRequests(data.requests);
      if (!selectedOfferId) {
        const current = data.offers.find((offer) => offer.status === "approved");
        if (current) setSelectedOfferId(current.id);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review requests could not be loaded.");
    }
  }, [profile.accessToken, selectedOfferId]);

  useEffect(() => { void load(); }, [load]);

  const activeRequests = useMemo(() => requests.filter((request) => activeStatuses.has(request.status)), [requests]);
  const adminRequests = activeRequests.filter((request) => request.requested_by === "admin");
  const currentOffers = offers.filter((offer) => offer.status === "approved");

  const openProposal = (offer: SupplierReviewOffer) => {
    setProposalOfferId(offer.id);
    setDraft(draftFrom(offer));
    setError("");
    setMessage("");
  };

  const startAuthorization = async (offer: SupplierReviewOffer, channel: "whatsapp" | "email", request?: SupplierPriceReviewRequest, supplierProposal?: SupplierPriceProposal) => {
    setBusy(`${offer.id}:${channel}`);
    setError("");
    setMessage("");
    setEmailVerification(null);
    try {
      const result = await startSupplierAdminAuthorization({
        accessToken: profile.accessToken,
        offerId: offer.id,
        channel,
        reason: request?.reason || undefined,
        proposedPatch: supplierProposal,
      });
      const productName = String(result.productName || offer.product_name);
      const proposalSummary = String(result.proposalSummary || "Exact proposed change recorded.");
      if (channel === "whatsapp") {
        const code = String(result.code || "");
        const adminNumber = String(result.adminWhatsApp || "+2347066619598").replace(/\D/g, "").replace(/^0/, "234");
        const text = [
          "CHARISMAK EXACT PRICE CHANGE AUTHORISATION",
          `Supplier: ${profile.businessName} (${profile.supplierCode})`,
          proposalSummary,
          `Confirmation code: ${code}`,
          "I authorise Charismak to apply only the exact change shown above. Any different value requires a new authorisation.",
        ].join("\n");
        window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        setMessage("WhatsApp opened with the exact proposed change and confirmation code. Charismak cannot apply different values with this code.");
      } else {
        setEmailVerification({ requestId: String(result.requestId || ""), productName });
        setMessage("A 6-digit code and the exact proposed change were sent to your registered email. Confirm only if every value is correct.");
      }
      setProposalOfferId(null);
      setDraft(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authorization could not be started.");
    } finally {
      setBusy("");
    }
  };

  const submitProposal = async (offer: SupplierReviewOffer, channel: "whatsapp" | "email") => {
    if (!draft) return;
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0 || !draft.unit.trim() || !draft.location.trim()) {
      setError("Enter a valid proposed price, unit and location.");
      return;
    }
    await startAuthorization(offer, channel, undefined, proposalFrom(offer, draft));
  };

  const verifyEmail = async () => {
    if (!emailVerification || !/^\d{6}$/.test(emailCode)) { setError("Enter the 6-digit code sent to your email."); return; }
    setBusy("verify-email");
    setError("");
    try {
      await verifySupplierAdminAuthorization({ accessToken: profile.accessToken, requestId: emailVerification.requestId, code: emailCode });
      setEmailVerification(null);
      setEmailCode("");
      setMessage("Confirmed. Charismak may apply only the exact proposed change you approved, within 30 minutes. A different value needs a new authorisation.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Code could not be verified.");
    } finally { setBusy(""); }
  };

  const updateMyself = async (request: SupplierPriceReviewRequest) => {
    setBusy(`self:${request.id}`);
    setError("");
    try {
      await markSupplierUpdating(profile.accessToken, request.id);
      onUpdateMyself();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review request could not be updated.");
    } finally { setBusy(""); }
  };

  if (!adminRequests.length && !currentOffers.length) return null;

  return (
    <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A82B05]">Price ownership</p><h3 className="mt-2 text-xl font-black text-[#071E33]">Review & exact authorisation</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Your price remains yours. Charismak can apply a change only after you see and approve the exact new values.</p></div><button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#526579]"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>

      {error ? <p className="mt-4 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-3 text-sm text-[#8B1E00]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-[#BFE2CD] bg-[#F0FAF4] p-3 text-sm leading-6 text-[#17613C]">{message}</p> : null}

      {adminRequests.length ? <div className="mt-5 space-y-3">{adminRequests.map((request) => {
        const offer = request.offer;
        return <div key={request.id} className="rounded-2xl border border-[#E5D39A] bg-[#FFF9E9] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8A6510]"><Clock3 className="h-3.5 w-3.5" />Charismak requested review</span><strong className="mt-2 block text-sm text-[#071E33]">{offer?.product_name || "Supplier price"}</strong>{offer ? <span className="mt-1 block text-xs text-[#617286]">Current: {money(Number(offer.unit_price))} / {offer.quoted_unit}</span> : null}{request.reason ? <p className="mt-2 text-xs leading-5 text-[#617286]">Reason: {request.reason}</p> : null}</div><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase text-[#8A6510]">{request.status.replaceAll("_", " ")}</span></div>
          {offer && request.proposed_patch ? <ProposalSummary before={request.before_snapshot || offer} after={request.proposed_patch} /> : null}
          {offer && request.status === "awaiting_supplier" ? <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void updateMyself(request)} className="min-h-10 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white">I&apos;ll update it myself</button>{request.proposed_patch ? <><button type="button" disabled={Boolean(busy)} onClick={() => void startAuthorization(offer, "whatsapp", request)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><MessageCircle className="h-3.5 w-3.5" />Approve exact change by WhatsApp</button><button type="button" disabled={Boolean(busy) || !profile.email} onClick={() => void startAuthorization(offer, "email", request)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66] disabled:opacity-40"><Mail className="h-3.5 w-3.5" />Approve exact change by email</button></> : <button type="button" onClick={() => openProposal(offer)} className="min-h-10 rounded-xl border border-[#C9D8E7] bg-white px-4 text-xs font-black text-[#0D3B66]">Prepare exact change for Charismak</button>}</div> : request.status === "admin_authorized" ? <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#197447]"><ShieldCheck className="h-4 w-4" />Exact change authorised. Charismak cannot alter it before applying.</p> : null}</div>;
      })}</div> : null}

      {emailVerification ? <div className="mt-5 rounded-2xl border border-[#C9D8E7] bg-[#F4F8FC] p-4"><p className="text-xs font-black text-[#071E33]">Confirm exact change for {emailVerification.productName}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input inputMode="numeric" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit email code" className="min-h-11 flex-1 rounded-xl border border-[#C9D8E7] bg-white px-4 text-sm outline-none" /><button type="button" disabled={busy === "verify-email"} onClick={() => void verifyEmail()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-xs font-black text-white">{busy === "verify-email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Confirm exact change</button></div></div> : null}

      {proposalOfferId && draft ? (() => { const offer = currentOffers.find((item) => item.id === proposalOfferId); return offer ? <ProposalEditor offer={offer} draft={draft} setDraft={setDraft} profile={profile} busy={Boolean(busy)} onWhatsApp={() => void submitProposal(offer, "whatsapp")} onEmail={() => void submitProposal(offer, "email")} onCancel={() => { setProposalOfferId(null); setDraft(null); }} /> : null; })() : null}

      {currentOffers.length ? <div className="mt-5 border-t border-[#E7ECF1] pt-5"><p className="text-xs font-black text-[#071E33]">Want Charismak to make a price correction for you?</p><p className="mt-1 text-xs leading-5 text-[#617286]">Choose the price and enter the exact new values first. You will then confirm that exact proposal by WhatsApp or email.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={selectedOfferId} onChange={(event) => setSelectedOfferId(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-[#DCE4EC] bg-white px-3 text-sm text-[#071E33] outline-none"><option value="">Choose a current price…</option>{currentOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.product_name} — {money(Number(offer.unit_price))}/{offer.quoted_unit}</option>)}</select><button type="button" disabled={!selectedOfferId} onClick={() => { const offer = currentOffers.find((item) => item.id === selectedOfferId); if (offer) openProposal(offer); }} className="min-h-11 rounded-xl bg-[#0D3B66] px-5 text-xs font-black text-white disabled:opacity-40">Prepare exact change</button></div></div> : null}
    </section>
  );
}

function ProposalSummary({ before, after }: { before: SupplierPriceProposal; after: SupplierPriceProposal }) {
  const rows = [
    ["Price", `${money(Number(before.unit_price))} / ${before.quoted_unit}`, `${money(Number(after.unit_price))} / ${after.quoted_unit}`],
    ["Specification", before.specification || "—", after.specification || "—"],
    ["Brand", before.brand || "—", after.brand || "—"],
    ["Location", before.location, after.location],
    ["Valid until", before.valid_until || "—", after.valid_until || "—"],
  ].filter((row) => row[1] !== row[2]);
  return <div className="mt-4 rounded-xl border border-[#E5D39A] bg-white p-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8A6510]">Exact change to approve</p>{rows.length ? <div className="mt-2 space-y-1.5">{rows.map((row) => <p key={row[0]} className="text-xs text-[#526579]"><strong className="text-[#071E33]">{row[0]}:</strong> {row[1]} → <strong>{row[2]}</strong></p>)}</div> : <p className="mt-2 text-xs text-[#617286]">No visible change.</p>}</div>;
}

function ProposalEditor({ offer, draft, setDraft, profile, busy, onWhatsApp, onEmail, onCancel }: { offer: SupplierReviewOffer; draft: Draft; setDraft: (draft: Draft) => void; profile: SupplierProfile; busy: boolean; onWhatsApp: () => void; onEmail: () => void; onCancel: () => void }) {
  return <div className="mt-5 rounded-2xl border border-[#C9D8E7] bg-[#F7FAFD] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0D3B66]">Exact proposed change</p><h4 className="mt-1 text-base font-black text-[#071E33]">{offer.product_name}</h4><p className="mt-1 text-xs text-[#617286]">Current: {money(Number(offer.unit_price))} / {offer.quoted_unit}</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DCE4EC] bg-white"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="New price (₦)" value={draft.price} onChange={(value) => setDraft({ ...draft, price: value })} type="number" /><Field label="Unit" value={draft.unit} onChange={(value) => setDraft({ ...draft, unit: value })} /><Field label="Specification" value={draft.specification} onChange={(value) => setDraft({ ...draft, specification: value })} /><Field label="Brand" value={draft.brand} onChange={(value) => setDraft({ ...draft, brand: value })} /><Field label="Location" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} /><Field label="Valid until" value={draft.validUntil} onChange={(value) => setDraft({ ...draft, validUntil: value })} type="date" /><div className="sm:col-span-2"><Field label="Remarks" value={draft.remarks} onChange={(value) => setDraft({ ...draft, remarks: value })} /></div></div><p className="mt-4 text-xs leading-5 text-[#617286]">Your confirmation will be tied to exactly these values. Charismak cannot substitute another price, unit, brand, specification, location or validity date.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={onWhatsApp} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white disabled:opacity-50"><MessageCircle className="h-4 w-4" />Confirm via WhatsApp</button><button type="button" disabled={busy || !profile.email} onClick={onEmail} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9D8E7] bg-white px-4 text-xs font-black text-[#0D3B66] disabled:opacity-40"><Mail className="h-4 w-4" />Confirm via email</button></div></div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D6E0E9] bg-white px-3 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}