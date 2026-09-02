"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Mail, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";

import type { SupplierProfile } from "@/lib/platform/supplier-profiles";
import {
  getSupplierReviewWorkspace,
  markSupplierUpdating,
  startSupplierAdminAuthorization,
  verifySupplierAdminAuthorization,
  type SupplierPriceReviewRequest,
  type SupplierReviewOffer,
} from "@/lib/platform/supplier-review-requests";

const money = (value: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
}).format(value);

const activeStatuses = new Set(["awaiting_supplier", "awaiting_code", "admin_authorized", "supplier_updating"]);

export default function SupplierReviewRequests({ profile, onUpdateMyself }: { profile: SupplierProfile; onUpdateMyself: () => void }) {
  const [offers, setOffers] = useState<SupplierReviewOffer[]>([]);
  const [requests, setRequests] = useState<SupplierPriceReviewRequest[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
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

  const startAuthorization = async (offerId: string, channel: "whatsapp" | "email", reason?: string) => {
    setBusy(`${offerId}:${channel}`);
    setError("");
    setMessage("");
    setEmailVerification(null);
    try {
      const result = await startSupplierAdminAuthorization({ accessToken: profile.accessToken, offerId, channel, reason });
      const productName = String(result.productName || "this price");
      if (channel === "whatsapp") {
        const code = String(result.code || "");
        const adminNumber = String(result.adminWhatsApp || "+2347066619598").replace(/\D/g, "").replace(/^0/, "234");
        const requestId = String(result.requestId || "");
        const text = [
          "CHARISMAK PRICE UPDATE AUTHORISATION",
          `Supplier: ${profile.businessName} (${profile.supplierCode})`,
          `Price: ${productName}`,
          `Request: ${requestId}`,
          `Confirmation code: ${code}`,
          "I authorise Charismak to make one change to this price only. This permission expires after verification and is consumed after one edit.",
        ].join("\n");
        window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
        setMessage("WhatsApp opened with your one-time confirmation code. Send the prepared message to Charismak. Admin still cannot edit until the code is verified.");
      } else {
        setEmailVerification({ requestId: String(result.requestId || ""), productName });
        setMessage("A 6-digit code was sent to your registered email. Enter it below to give Charismak one-time permission for this price.");
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authorization could not be started.");
    } finally {
      setBusy("");
    }
  };

  const verifyEmail = async () => {
    if (!emailVerification || !/^\d{6}$/.test(emailCode)) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    setBusy("verify-email");
    setError("");
    try {
      await verifySupplierAdminAuthorization({ accessToken: profile.accessToken, requestId: emailVerification.requestId, code: emailCode });
      setEmailVerification(null);
      setEmailCode("");
      setMessage("Confirmed. Charismak now has one-time permission to edit this price for 30 minutes. The permission is consumed after one edit.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Code could not be verified.");
    } finally {
      setBusy("");
    }
  };

  const updateMyself = async (request: SupplierPriceReviewRequest) => {
    setBusy(`self:${request.id}`);
    setError("");
    try {
      await markSupplierUpdating(profile.accessToken, request.id);
      onUpdateMyself();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review request could not be updated.");
    } finally {
      setBusy("");
    }
  };

  if (!adminRequests.length && !currentOffers.length) return null;

  return (
    <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A82B05]">Price ownership</p><h3 className="mt-2 text-xl font-black text-[#071E33]">Price review & authorisation</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Your prices belong to your supplier profile. You can update them yourself, or give Charismak temporary permission for one specific price.</p></div>
        <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] px-3.5 text-xs font-black text-[#526579]"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-3 text-sm text-[#8B1E00]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-[#BFE2CD] bg-[#F0FAF4] p-3 text-sm leading-6 text-[#17613C]">{message}</p> : null}

      {adminRequests.length ? <div className="mt-5 space-y-3">{adminRequests.map((request) => {
        const offer = request.offer;
        return <div key={request.id} className="rounded-2xl border border-[#E5D39A] bg-[#FFF9E9] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8A6510]"><Clock3 className="h-3.5 w-3.5" />Charismak requested a review</span><strong className="mt-2 block text-sm text-[#071E33]">{offer?.product_name || "Supplier price"}</strong>{offer ? <span className="mt-1 block text-xs text-[#617286]">{money(Number(offer.unit_price))} / {offer.quoted_unit}</span> : null}{request.reason ? <p className="mt-2 text-xs leading-5 text-[#617286]">Reason: {request.reason}</p> : null}</div><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase text-[#8A6510]">{request.status.replaceAll("_", " ")}</span></div>{offer && request.status !== "admin_authorized" ? <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void updateMyself(request)} className="min-h-10 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white">I&apos;ll update it myself</button><button type="button" disabled={Boolean(busy)} onClick={() => void startAuthorization(offer.id, "whatsapp", request.reason || undefined)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><MessageCircle className="h-3.5 w-3.5" />Authorise by WhatsApp</button><button type="button" disabled={Boolean(busy) || !profile.email} onClick={() => void startAuthorization(offer.id, "email", request.reason || undefined)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66] disabled:opacity-40"><Mail className="h-3.5 w-3.5" />Authorise by email</button></div> : request.status === "admin_authorized" ? <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#197447]"><ShieldCheck className="h-4 w-4" />Charismak has temporary one-time permission for this price.</p> : null}</div>;
      })}</div> : null}

      {emailVerification ? <div className="mt-5 rounded-2xl border border-[#C9D8E7] bg-[#F4F8FC] p-4"><p className="text-xs font-black text-[#071E33]">Confirm {emailVerification.productName}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input inputMode="numeric" maxLength={6} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit email code" className="min-h-11 flex-1 rounded-xl border border-[#C9D8E7] bg-white px-4 text-sm outline-none" /><button type="button" disabled={busy === "verify-email"} onClick={() => void verifyEmail()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-xs font-black text-white">{busy === "verify-email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Confirm permission</button></div></div> : null}

      {currentOffers.length ? <div className="mt-5 border-t border-[#E7ECF1] pt-5"><p className="text-xs font-black text-[#071E33]">Need Charismak to update a price for you?</p><p className="mt-1 text-xs leading-5 text-[#617286]">Choose the exact price, then confirm by WhatsApp or your registered email. Permission is for that price only.</p><div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]"><select value={selectedOfferId} onChange={(event) => setSelectedOfferId(event.target.value)} className="min-h-11 rounded-xl border border-[#DCE4EC] bg-white px-3 text-sm text-[#071E33] outline-none"><option value="">Choose a current price…</option>{currentOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.product_name} — {money(Number(offer.unit_price))}/{offer.quoted_unit}</option>)}</select><button type="button" disabled={!selectedOfferId || Boolean(busy)} onClick={() => void startAuthorization(selectedOfferId, "whatsapp")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white disabled:opacity-40"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button><button type="button" disabled={!selectedOfferId || Boolean(busy) || !profile.email} onClick={() => void startAuthorization(selectedOfferId, "email")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-black text-[#0D3B66] disabled:opacity-40"><Mail className="h-3.5 w-3.5" />Email</button></div></div> : null}
    </section>
  );
}
