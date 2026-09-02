"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Loader2, MapPin, MessageCircle, PackageSearch, Save, ShieldCheck, XCircle } from "lucide-react";

import { loadPriceItems } from "@/lib/pricing/store";
import type { PriceItem } from "@/lib/pricing/models";
import { DEFAULT_SUPPLIER_PRICE_VALIDITY_DAYS } from "@/lib/platform/supplier-offers";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Batch = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_phone: string | null;
  supplier_email: string | null;
  supplier_location: string | null;
  form_id: string | null;
  form_title: string | null;
  source_submission_id: string | null;
  status: "pending" | "review" | "approved" | "rejected";
  reviewer_notes: string | null;
  submitted_at: string;
};

type Profile = {
  id: string;
  supplier_code: string;
  business_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string;
  delivery_areas: string | null;
};

type Line = {
  id: string;
  batch_id: string;
  catalogue_item_id: string | null;
  catalogue_code: string | null;
  product_name: string;
  specification: string | null;
  brand: string | null;
  quoted_unit: string;
  unit_price: number | null;
  bulk_price: number | null;
  minimum_qty: number | null;
  delivery_fee: number | null;
  delivery_included: boolean | null;
  location: string | null;
  service_area: string | null;
  availability: string | null;
  valid_until: string | null;
  supplier_remarks: string | null;
  status: "pending" | "approved" | "rejected";
  marketplace_offer_id: string | null;
};

const money = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const fallbackValidity = (base?: string | null) => {
  const date = base ? new Date(base) : new Date();
  const safe = Number.isFinite(date.getTime()) ? date : new Date();
  safe.setUTCDate(safe.getUTCDate() + DEFAULT_SUPPLIER_PRICE_VALIDITY_DAYS);
  return safe.toISOString().slice(0, 10);
};

export default function SupplierOwnedReviewPanel({ batchId }: { batchId: string }) {
  const client = getSupabaseBrowserClient();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { setPriceItems(loadPriceItems()); }, []);

  const load = async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    const { data: batchData, error: batchError } = await client.from("supplier_review_batches").select("id,supplier_id,supplier_name,supplier_phone,supplier_email,supplier_location,form_id,form_title,source_submission_id,status,reviewer_notes,submitted_at").eq("id", batchId).single();
    if (batchError || !batchData) {
      setError(batchError?.message || "Submission not found.");
      setLoading(false);
      return;
    }
    const nextBatch = batchData as Batch;
    if (!nextBatch.supplier_id) {
      setError("This review is not linked to a supplier profile.");
      setLoading(false);
      return;
    }
    const [lineResult, profileResult] = await Promise.all([
      client.from("supplier_review_lines").select("id,batch_id,catalogue_item_id,catalogue_code,product_name,specification,brand,quoted_unit,unit_price,bulk_price,minimum_qty,delivery_fee,delivery_included,location,service_area,availability,valid_until,supplier_remarks,status,marketplace_offer_id").eq("batch_id", batchId).order("created_at", { ascending: true }),
      client.from("supplier_profiles").select("id,supplier_code,business_name,phone,whatsapp,email,location,delivery_areas").eq("id", nextBatch.supplier_id).single(),
    ]);
    if (lineResult.error) setError(lineResult.error.message);
    setBatch(nextBatch);
    setNotes(nextBatch.reviewer_notes || "");
    setLines((lineResult.data || []) as Line[]);
    setProfile((profileResult.data as Profile | null) || null);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [batchId]);

  const mappedCount = useMemo(() => lines.filter((line) => Boolean(line.catalogue_item_id)).length, [lines]);
  const approvable = lines.filter((line) => line.unit_price != null && Number(line.unit_price) > 0);
  const missingMappings = approvable.filter((line) => !line.catalogue_item_id);

  const mapLine = (lineId: string, catalogueItemId: string) => {
    const item = priceItems.find((entry) => entry.id === catalogueItemId);
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, catalogue_item_id: catalogueItemId || null, catalogue_code: item?.code || line.catalogue_code } : line));
  };

  const saveMappings = async () => {
    if (!client || !batch) return;
    setBusy(true);
    setError("");
    try {
      for (const line of lines) {
        const { error: lineError } = await client.from("supplier_review_lines").update({ catalogue_item_id: line.catalogue_item_id || null, catalogue_code: line.catalogue_code || null, updated_at: new Date().toISOString() }).eq("id", line.id);
        if (lineError) throw lineError;
      }
      const { error: batchError } = await client.from("supplier_review_batches").update({ reviewer_notes: notes.trim() || null, status: batch.status === "pending" ? "review" : batch.status, updated_at: new Date().toISOString() }).eq("id", batch.id);
      if (batchError) throw batchError;
      setMessage("Internal material mapping saved. Supplier-submitted values were not changed.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Mapping could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const requestCorrection = async () => {
    if (!client || !batch || !profile) return;
    const reason = window.prompt("What should the supplier check or correct?", notes || "Please review and resubmit the highlighted price information.");
    if (reason === null) return;
    setBusy(true);
    setError("");
    const { error: updateError } = await client.from("supplier_review_batches").update({ status: "review", reviewer_notes: reason.trim() || "Supplier correction requested.", updated_at: new Date().toISOString() }).eq("id", batch.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    const raw = profile.whatsapp || profile.phone;
    const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
    const text = [
      `Hello ${profile.business_name},`,
      "Charismak has reviewed your price submission and needs you to check/correct it.",
      `Submission: ${batch.form_title || batch.form_id || batch.id}`,
      reason.trim() ? `Review note: ${reason.trim()}` : "",
      "For your protection, Charismak cannot rewrite values attached to your supplier profile. Please sign in and submit the corrected price yourself.",
      "https://www.charismakproject.com/supplier-prices",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setMessage("Supplier correction requested. The submitted values remain unchanged until the supplier sends a new update.");
    await load();
  };

  const reject = async () => {
    if (!client || !batch || !window.confirm("Reject this supplier submission? Nothing will be published.")) return;
    setBusy(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const { error: lineError } = await client.from("supplier_review_lines").update({ status: "rejected", updated_at: now }).eq("batch_id", batch.id);
      if (lineError) throw lineError;
      const { error: batchError } = await client.from("supplier_review_batches").update({ status: "rejected", reviewer_notes: notes.trim() || null, reviewed_at: now, updated_at: now }).eq("id", batch.id);
      if (batchError) throw batchError;
      setMessage("Submission rejected. Nothing was published.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Submission could not be rejected.");
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!client || !batch || !profile) return;
    if (!approvable.length) {
      setError("There is no valid supplier price line to publish.");
      return;
    }
    if (missingMappings.length) {
      setError(`Map ${missingMappings.length} price line${missingMappings.length === 1 ? "" : "s"} to the correct Price List material first.`);
      return;
    }
    if (batch.status === "approved") {
      setError("This submission is already approved.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const nonce = Date.now();
      for (const [index, line] of approvable.entries()) {
        const location = line.location || profile.location || batch.supplier_location || "Nigeria";
        const validUntil = line.valid_until || fallbackValidity(batch.submitted_at);

        await client.from("supplier_marketplace_offers").update({ status: "expired", valid_until: new Date(Date.now() - 86400000).toISOString().slice(0, 10), updated_at: now })
          .eq("supplier_id", profile.id)
          .eq("catalogue_item_id", line.catalogue_item_id!)
          .eq("status", "approved");

        const { data: offer, error: insertError } = await client.from("supplier_marketplace_offers").insert({
          source_submission_id: `${batch.source_submission_id || batch.id}:${line.id}:${nonce}-${index}`,
          supplier_id: profile.id,
          supplier_name: profile.business_name,
          catalogue_item_id: line.catalogue_item_id,
          product_name: line.product_name,
          specification: line.specification,
          brand: line.brand,
          quoted_unit: line.quoted_unit,
          unit_price: line.unit_price,
          bulk_price: line.bulk_price,
          minimum_qty: line.minimum_qty,
          delivery_fee: line.delivery_fee,
          delivery_included: line.delivery_included,
          location,
          service_area: line.service_area || profile.delivery_areas,
          availability: line.availability,
          phone: profile.phone,
          whatsapp: profile.whatsapp || profile.phone,
          email: profile.email,
          valid_until: validUntil,
          supplier_remarks: line.supplier_remarks,
          status: "approved",
          source_type: "supplier_submission",
          submitted_at: batch.submitted_at,
          published_at: now,
          updated_at: now,
        }).select("id").single();
        if (insertError || !offer) throw insertError || new Error("Marketplace offer could not be created.");

        const { error: lineError } = await client.from("supplier_review_lines").update({
          catalogue_item_id: line.catalogue_item_id,
          catalogue_code: line.catalogue_code,
          status: "approved",
          marketplace_offer_id: offer.id,
          updated_at: now,
        }).eq("id", line.id);
        if (lineError) throw lineError;
      }
      const { error: batchError } = await client.from("supplier_review_batches").update({ status: "approved", reviewer_notes: notes.trim() || null, reviewed_at: now, updated_at: now }).eq("id", batch.id);
      if (batchError) throw batchError;
      setMessage(`${approvable.length} supplier price${approvable.length === 1 ? "" : "s"} approved exactly as submitted. Admin did not alter seller-owned values.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Supplier prices could not be approved.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (!batch || !profile) return <div className="rounded-2xl border border-[#F1C8C0] bg-[#FFF4F1] p-5 text-sm text-[#8B1E00]">{error || "Supplier submission not found."}</div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/supplier-reviews" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]"><ArrowLeft className="h-4 w-4" />Back to Supplier Reviews</Link><span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${batch.status === "approved" ? "bg-[#EAF7EF] text-[#197447]" : batch.status === "rejected" ? "bg-[#FFF1EE] text-[#A82B05]" : "bg-[#FFF7E7] text-[#8A6500]"}`}>{batch.status}</span></div>

    <section className="overflow-hidden rounded-[2rem] bg-[#071E33] text-white"><div className="grid gap-5 p-6 md:p-8 lg:grid-cols-[1fr_auto]"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Owner-controlled supplier submission</p><h1 className="mt-3 text-3xl font-black">{profile.business_name}</h1><div className="mt-3 flex flex-wrap gap-4 text-xs text-white/65"><span>{profile.supplier_code}</span><span>{profile.phone}</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#F2B544]" />{profile.location}</span></div></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs"><strong className="block text-[#F2B544]">Admin cannot edit seller values</strong><span className="mt-1 block max-w-xs leading-5 text-white/65">You may map the material, approve/reject, request correction, or remove a published price later.</span></div></div></section>

    {error ? <div className="flex items-start gap-2 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
    {message ? <div className="flex items-start gap-2 rounded-xl border border-[#CFE4D7] bg-[#F3FBF6] p-4 text-sm text-[#197447]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null}

    <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 md:p-7"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Supplier-owned values</p><h2 className="mt-2 text-2xl font-black text-[#071E33]">Review without rewriting the seller&apos;s submission</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">Only the Charismak material mapping below is editable. Price, specification, brand, unit, delivery terms and validity remain exactly as the supplier submitted them.</p></div><span className="rounded-xl bg-[#F7F9FB] px-4 py-3 text-xs font-black text-[#526579]">{mappedCount}/{lines.length} mapped</span></div>

      {lines.length ? <div className="mt-6 space-y-4">{lines.map((line, index) => {
        const mapped = priceItems.find((item) => item.id === line.catalogue_item_id);
        return <article key={line.id} className="rounded-2xl border border-[#DCE4EC] bg-[#FBFCFD] p-4 md:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A82B05]">Line {index + 1}</p><h3 className="mt-1 text-lg font-black text-[#071E33]">{line.product_name}</h3><p className="mt-1 text-xs text-[#617286]">{[line.brand, line.specification].filter(Boolean).join(" · ") || "No additional specification"}</p></div><div className="md:text-right"><strong className="text-xl text-[#0D3B66]">{money(line.unit_price)}</strong><span className="block text-xs text-[#7A8B9E]">per {line.quoted_unit}</span></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Read label="Bulk price" value={money(line.bulk_price)} /><Read label="Minimum qty" value={line.minimum_qty == null ? "—" : String(line.minimum_qty)} /><Read label="Delivery" value={line.delivery_included == null ? "Not stated" : line.delivery_included ? "Included" : line.delivery_fee == null ? "Not included" : money(line.delivery_fee)} /><Read label="Location" value={line.location || profile.location} /><Read label="Availability" value={line.availability || "Not stated"} /><Read label="Valid until" value={line.valid_until || "Supplier did not state — platform validity applies on publication"} /><div className="sm:col-span-2"><Read label="Supplier remarks" value={line.supplier_remarks || "—"} /></div></div>
          <label className="mt-4 block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Charismak Price List material *</span><select value={line.catalogue_item_id || ""} disabled={batch.status === "approved" || batch.status === "rejected"} onChange={(event) => mapLine(line.id, event.target.value)} className={`min-h-11 w-full rounded-xl border bg-white px-3 text-xs font-bold outline-none ${line.catalogue_item_id ? "border-[#C8D8E8] text-[#071E33]" : "border-[#E5B5A9] text-[#A82B05]"}`}><option value="">Choose the material this supplier price belongs to…</option>{priceItems.map((item) => <option key={item.id} value={item.id}>{item.description}{item.specification ? ` — ${item.specification}` : ""} ({item.marketUnit || item.unit})</option>)}</select>{mapped ? <span className="mt-1 block text-[10px] text-[#197447]">Internal mapping: {mapped.description}</span> : null}</label>
        </article>;
      })}</div> : <div className="mt-6 rounded-xl border border-dashed border-[#CBD7E2] p-6 text-center"><PackageSearch className="mx-auto h-6 w-6 text-[#7A8B9E]" /><p className="mt-2 text-sm text-[#617286]">No parsed supplier price lines were found.</p></div>}

      <label className="mt-5 block"><span className="mb-2 block text-xs font-black text-[#071E33]">Admin review note</span><textarea value={notes} disabled={batch.status === "approved" || batch.status === "rejected"} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-xl border border-[#DCE4EC] bg-white p-3 text-sm outline-none focus:border-[#0D3B66]" placeholder="Reason for requesting correction, mapping note, or internal review comment…" /></label>

      {batch.status !== "approved" && batch.status !== "rejected" ? <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void saveMappings()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD7E2] px-4 text-xs font-black text-[#0D3B66]">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save mapping only</button><button type="button" disabled={busy} onClick={() => void requestCorrection()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D3B66] px-4 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />Request supplier correction</button><button type="button" disabled={busy} onClick={() => void approve()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><BadgeCheck className="h-4 w-4" />Approve exact submission</button><button type="button" disabled={busy} onClick={() => void reject()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E5B7AE] bg-[#FFF7F5] px-4 text-xs font-black text-[#A82B05]"><XCircle className="h-4 w-4" />Reject</button></div> : <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#197447]"><ShieldCheck className="h-4 w-4" />This linked supplier submission is closed. Seller-owned values remain locked.</p>}
    </section>
  </div>;
}

function Read({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#E5EAF0] bg-white px-3 py-2.5"><span className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#7A8B9E]">{label}</span><strong className="mt-1 block text-xs leading-5 text-[#071E33]">{value}</strong></div>; }
