"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Eye,
  Loader2,
  LogIn,
  MapPin,
  PackageSearch,
  Save,
  Store,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { isAdminEmail } from "@/lib/auth/admin";
import { loadPriceItems } from "@/lib/pricing/store";
import type { PriceItem } from "@/lib/pricing/models";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Batch = {
  id: string;
  supplier_id: string | null;
  supplier_name: string;
  supplier_phone: string | null;
  supplier_email: string | null;
  supplier_location: string | null;
  form_id: string | null;
  form_title: string | null;
  response_sheet: string | null;
  source_row: number | null;
  source_submission_id: string | null;
  status: "pending" | "review" | "approved" | "rejected";
  reviewer_notes: string | null;
  submitted_at: string;
  raw_payload: Record<string, unknown>;
};

type Profile = {
  id: string;
  supplier_code: string;
  business_name: string;
  contact_person: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string;
  delivery_areas: string | null;
  categories: string[];
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
  match_confidence: number | null;
  status: "pending" | "approved" | "rejected";
  marketplace_offer_id: string | null;
};

type AuthState = "checking" | "signed-out" | "forbidden" | "ready";

const money = (value: number | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(value);

function NumberInput({ value, onChange, placeholder }: { value: number | null; onChange: (value: number | null) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
      placeholder={placeholder}
      className="min-h-10 w-full rounded-lg border border-[#DCE4EC] bg-white px-3 text-xs text-[#071E33] outline-none focus:border-[#0D3B66]"
    />
  );
}

export default function SupplierReviewPanel({ batchId }: { batchId: string }) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [adminEmail, setAdminEmail] = useState("");
  const [email, setEmail] = useState("md@charismakproject.com");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [batch, setBatch] = useState<Batch | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const client = getSupabaseBrowserClient();

  useEffect(() => {
    setPriceItems(loadPriceItems());
  }, []);

  const loadReview = async () => {
    if (!client || !batchId) return;
    setLoading(true);
    setError("");
    const { data: batchData, error: batchError } = await client
      .from("supplier_review_batches")
      .select("*")
      .eq("id", batchId)
      .single();
    if (batchError || !batchData) {
      setError(batchError?.message || "Submission not found.");
      setLoading(false);
      return;
    }
    const typedBatch = batchData as Batch;
    setBatch(typedBatch);
    setNotes(typedBatch.reviewer_notes || "");

    const { data: lineData, error: lineError } = await client
      .from("supplier_review_lines")
      .select("*")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: true });
    if (lineError) setError(lineError.message);
    setLines((lineData || []) as Line[]);

    if (typedBatch.supplier_id) {
      const { data: profileData } = await client
        .from("supplier_profiles")
        .select("*")
        .eq("id", typedBatch.supplier_id)
        .single();
      setProfile((profileData as Profile | null) || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!client) {
      setAuthState("forbidden");
      setLoading(false);
      return;
    }
    let mounted = true;
    const boot = async () => {
      const { data } = await client.auth.getSession();
      const currentEmail = data.session?.user.email || "";
      if (!mounted) return;
      if (!data.session) {
        setAuthState("signed-out");
        setLoading(false);
        return;
      }
      if (!isAdminEmail(currentEmail)) {
        setAdminEmail(currentEmail);
        setAuthState("forbidden");
        setLoading(false);
        return;
      }
      setAdminEmail(currentEmail);
      setAuthState("ready");
      await loadReview();
    };
    void boot();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const signIn = async () => {
    if (!client) return;
    setAuthError("");
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setAuthError(signInError?.message || "Unable to sign in.");
      return;
    }
    if (!isAdminEmail(data.user.email)) {
      setAdminEmail(data.user.email || "");
      setAuthState("forbidden");
      return;
    }
    setAdminEmail(data.user.email || "");
    setAuthState("ready");
    await loadReview();
  };

  const updateLine = <K extends keyof Line>(id: string, key: K, value: Line[K]) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, [key]: value } : line)));
  };

  const saveReview = async (nextStatus: "review" | "rejected" = "review") => {
    if (!client || !batch) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      for (const line of lines) {
        const { error: lineError } = await client
          .from("supplier_review_lines")
          .update({
            catalogue_item_id: line.catalogue_item_id || null,
            product_name: line.product_name,
            specification: line.specification || null,
            brand: line.brand || null,
            quoted_unit: line.quoted_unit,
            unit_price: line.unit_price,
            bulk_price: line.bulk_price,
            minimum_qty: line.minimum_qty,
            delivery_fee: line.delivery_fee,
            delivery_included: line.delivery_included,
            location: line.location || null,
            service_area: line.service_area || null,
            availability: line.availability || null,
            valid_until: line.valid_until || null,
            supplier_remarks: line.supplier_remarks || null,
            status: nextStatus === "rejected" ? "rejected" : line.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", line.id);
        if (lineError) throw lineError;
      }
      const now = new Date().toISOString();
      const { error: batchError } = await client
        .from("supplier_review_batches")
        .update({
          status: nextStatus,
          reviewer_notes: notes || null,
          reviewed_at: nextStatus === "rejected" ? now : null,
          reviewed_by_email: adminEmail,
          updated_at: now,
        })
        .eq("id", batch.id);
      if (batchError) throw batchError;
      setBatch({ ...batch, status: nextStatus, reviewer_notes: notes || null });
      setMessage(nextStatus === "rejected" ? "Submission rejected. Nothing was published." : "Review saved. Nothing has been published yet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save review.");
    } finally {
      setBusy(false);
    }
  };

  const approvableLines = useMemo(
    () => lines.filter((line) => line.unit_price != null && line.unit_price > 0),
    [lines],
  );
  const missingMappings = approvableLines.filter((line) => !line.catalogue_item_id);

  const approveAndPublish = async () => {
    if (!client || !batch) return;
    setError("");
    setMessage("");
    if (!approvableLines.length) {
      setError("There is no parsed price line to publish yet.");
      return;
    }
    if (missingMappings.length) {
      setError(`Map ${missingMappings.length} price line${missingMappings.length === 1 ? "" : "s"} to a Price List item before approving.`);
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      for (const line of approvableLines) {
        const offerPayload = {
          source_submission_id: `${batch.source_submission_id || batch.id}:${line.id}`,
          supplier_id: profile?.id || batch.supplier_id || null,
          supplier_name: profile?.business_name || batch.supplier_name,
          catalogue_item_id: line.catalogue_item_id,
          product_name: line.product_name,
          specification: line.specification || null,
          brand: line.brand || null,
          quoted_unit: line.quoted_unit || "item",
          unit_price: line.unit_price,
          bulk_price: line.bulk_price,
          minimum_qty: line.minimum_qty,
          delivery_fee: line.delivery_fee,
          delivery_included: line.delivery_included,
          location: line.location || profile?.location || batch.supplier_location || "Nigeria",
          service_area: line.service_area || profile?.delivery_areas || null,
          availability: line.availability || null,
          phone: profile?.phone || batch.supplier_phone || null,
          whatsapp: profile?.whatsapp || profile?.phone || batch.supplier_phone || null,
          email: profile?.email || batch.supplier_email || null,
          valid_until: line.valid_until || null,
          supplier_remarks: line.supplier_remarks || null,
          status: "approved",
          source_type: "google_form",
          submitted_at: batch.submitted_at,
          published_at: now,
          updated_at: now,
        };

        let offerId = line.marketplace_offer_id;
        if (offerId) {
          const { error: updateError } = await client.from("supplier_marketplace_offers").update(offerPayload).eq("id", offerId);
          if (updateError) throw updateError;
        } else {
          const { data: offer, error: insertError } = await client
            .from("supplier_marketplace_offers")
            .insert(offerPayload)
            .select("id")
            .single();
          if (insertError || !offer) throw insertError || new Error("Marketplace offer was not created.");
          offerId = String(offer.id);
        }

        const { error: lineError } = await client
          .from("supplier_review_lines")
          .update({
            catalogue_item_id: line.catalogue_item_id,
            product_name: line.product_name,
            specification: line.specification || null,
            brand: line.brand || null,
            quoted_unit: line.quoted_unit,
            unit_price: line.unit_price,
            bulk_price: line.bulk_price,
            minimum_qty: line.minimum_qty,
            delivery_fee: line.delivery_fee,
            delivery_included: line.delivery_included,
            location: line.location || null,
            service_area: line.service_area || null,
            availability: line.availability || null,
            valid_until: line.valid_until || null,
            supplier_remarks: line.supplier_remarks || null,
            status: "approved",
            marketplace_offer_id: offerId,
            updated_at: now,
          })
          .eq("id", line.id);
        if (lineError) throw lineError;
      }

      const { error: batchError } = await client
        .from("supplier_review_batches")
        .update({
          status: "approved",
          reviewer_notes: notes || null,
          reviewed_at: now,
          reviewed_by_email: adminEmail,
          updated_at: now,
        })
        .eq("id", batch.id);
      if (batchError) throw batchError;

      setBatch({ ...batch, status: "approved", reviewer_notes: notes || null });
      setLines((current) => current.map((line) => approvableLines.some((approved) => approved.id === line.id) ? { ...line, status: "approved" } : line));
      setMessage(`${approvableLines.length} supplier price${approvableLines.length === 1 ? "" : "s"} published. The Prices page will now read them from the marketplace data.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to approve and publish.");
    } finally {
      setBusy(false);
    }
  };

  if (authState === "checking") {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  if (authState === "signed-out") {
    return (
      <section className="mx-auto max-w-lg rounded-[2rem] border border-[#DCE4EC] bg-white p-6 shadow-[0_20px_60px_rgba(7,30,51,0.08)] md:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071E33] text-white"><LogIn className="h-5 w-5" /></div>
        <h1 className="mt-5 text-2xl font-black text-[#071E33]">Charismak supplier review</h1>
        <p className="mt-2 text-sm leading-6 text-[#617286]">Sign in with an authorised Charismak account to review this supplier price update.</p>
        <div className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
          <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
          {authError ? <p className="rounded-xl bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{authError}</p> : null}
          <button type="button" onClick={signIn} className="min-h-12 w-full rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white">Sign in & review</button>
        </div>
      </section>
    );
  }

  if (authState === "forbidden") {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-[#F1C8C0] bg-white p-8 text-center">
        <XCircle className="mx-auto h-10 w-10 text-[#A82B05]" />
        <h1 className="mt-4 text-2xl font-black text-[#071E33]">Review access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-[#617286]">{adminEmail ? `${adminEmail} is not authorised to review supplier prices.` : "Supplier review requires a Charismak administrator account."}</p>
      </section>
    );
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  if (!batch) {
    return (
      <section className="rounded-3xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-[#7A8B9E]" />
        <h1 className="mt-4 text-2xl font-black text-[#071E33]">Submission not found</h1>
        <p className="mt-2 text-sm text-[#617286]">{error || "This review link may be invalid."}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/prices" className="inline-flex items-center gap-2 text-sm font-bold text-[#0D3B66]"><ArrowLeft className="h-4 w-4" />Back to Prices</Link>
        <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${batch.status === "approved" ? "bg-[#EAF7EF] text-[#197447]" : batch.status === "rejected" ? "bg-[#FFF1EE] text-[#A82B05]" : "bg-[#FFF7E7] text-[#8A6500]"}`}>{batch.status}</span>
      </div>

      <section className="overflow-hidden rounded-[2rem] bg-[#071E33] text-white shadow-[0_20px_60px_rgba(7,30,51,0.15)]">
        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Supplier price review</p><h1 className="mt-3 text-3xl font-black">{profile?.business_name || batch.supplier_name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65"><span>{profile?.supplier_code || "Supplier profile"}</span><span>{profile?.phone || batch.supplier_phone || "No phone"}</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#F2B544]" />{profile?.location || batch.supplier_location || "Nigeria"}</span></div>{profile?.delivery_areas ? <p className="mt-2 text-xs text-white/55">Delivery areas: {profile.delivery_areas}</p> : null}</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right"><span className="block text-[9px] font-black uppercase tracking-[0.14em] text-white/50">Received</span><strong className="mt-1 block text-sm">{new Date(batch.submitted_at).toLocaleString("en-NG")}</strong><span className="mt-1 block text-[10px] text-white/50">{batch.form_title || batch.form_id || "Supplier form"}</span></div>
        </div>
      </section>

      {error ? <div className="flex items-start gap-2 rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {message ? <div className="flex items-start gap-2 rounded-xl border border-[#CFE4D7] bg-[#F3FBF6] px-4 py-3 text-sm text-[#197447]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null}

      <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Price lines</p><h2 className="mt-2 text-2xl font-black text-[#071E33]">Check what will appear under each material</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Map every supplier price to the correct Charismak Price List item. Approval publishes the supplier profile, price and delivery details under that material.</p></div><div className="rounded-xl bg-[#F7F9FB] px-4 py-3 text-xs text-[#617286]"><strong className="text-[#071E33]">{lines.length}</strong> parsed line{lines.length === 1 ? "" : "s"}</div></div>

        {lines.length ? (
          <div className="mt-6 space-y-4">
            {lines.map((line, index) => {
              const mapped = priceItems.find((item) => item.id === line.catalogue_item_id);
              return (
                <article key={line.id} className="rounded-2xl border border-[#DCE4EC] bg-[#FBFCFD] p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#A82B05]">Line {index + 1}</p><h3 className="mt-1 text-lg font-black text-[#071E33]">{line.product_name}</h3>{line.specification ? <p className="mt-1 text-xs text-[#617286]">{line.specification}</p> : null}</div><div className="text-right"><strong className="text-lg text-[#0D3B66]">{money(line.unit_price)}</strong><span className="block text-[10px] text-[#7A8B9E]">per {line.quoted_unit}</span></div></div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="md:col-span-2"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Price List material *</span><select value={line.catalogue_item_id || ""} onChange={(event) => updateLine(line.id, "catalogue_item_id", event.target.value || null)} className={`min-h-10 w-full rounded-lg border bg-white px-3 text-xs font-bold outline-none ${line.catalogue_item_id ? "border-[#C8D8E8] text-[#071E33]" : "border-[#E5B5A9] text-[#A82B05]"}`}><option value="">Choose the material this price belongs to…</option>{priceItems.map((item) => <option key={item.id} value={item.id}>{item.description}{item.specification ? ` — ${item.specification}` : ""} ({item.marketUnit || item.unit})</option>)}</select>{mapped ? <span className="mt-1 block text-[10px] text-[#197447]">Will publish under: {mapped.description}</span> : null}</label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Brand / make</span><input value={line.brand || ""} onChange={(event) => updateLine(line.id, "brand", event.target.value || null)} className="min-h-10 w-full rounded-lg border border-[#DCE4EC] bg-white px-3 text-xs outline-none" /></label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Quoted unit</span><input value={line.quoted_unit} onChange={(event) => updateLine(line.id, "quoted_unit", event.target.value)} className="min-h-10 w-full rounded-lg border border-[#DCE4EC] bg-white px-3 text-xs outline-none" /></label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Unit price</span><NumberInput value={line.unit_price} onChange={(value) => updateLine(line.id, "unit_price", value)} /></label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Bulk price</span><NumberInput value={line.bulk_price} onChange={(value) => updateLine(line.id, "bulk_price", value)} /></label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Location</span><input value={line.location || profile?.location || batch.supplier_location || ""} onChange={(event) => updateLine(line.id, "location", event.target.value || null)} className="min-h-10 w-full rounded-lg border border-[#DCE4EC] bg-white px-3 text-xs outline-none" /></label>
                    <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#617286]">Availability</span><input value={line.availability || ""} onChange={(event) => updateLine(line.id, "availability", event.target.value || null)} placeholder="In stock / on order" className="min-h-10 w-full rounded-lg border border-[#DCE4EC] bg-white px-3 text-xs outline-none" /></label>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#B8C7D6] p-8 text-center"><Store className="mx-auto h-8 w-8 text-[#7A8B9E]" /><h3 className="mt-3 font-black text-[#071E33]">No price lines were parsed automatically</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#617286]">The raw form response is still saved. This submission needs manual interpretation before anything can be published.</p></div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 md:p-7"><label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Reviewer notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional internal note…" className="w-full rounded-xl border border-[#DCE4EC] p-4 text-sm outline-none focus:border-[#0D3B66]" /></label><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-[#617286]">{missingMappings.length ? <span className="font-bold text-[#A82B05]">{missingMappings.length} mapped material{missingMappings.length === 1 ? " is" : "s are"} still required before publishing.</span> : approvableLines.length ? <span className="font-bold text-[#197447]">Ready to publish {approvableLines.length} supplier price{approvableLines.length === 1 ? "" : "s"}.</span> : "No publishable price lines yet."}</div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void saveReview("rejected")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E6B7AD] px-4 text-xs font-black text-[#A82B05] disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button><button type="button" disabled={busy} onClick={() => void saveReview("review")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C8D3DE] px-4 text-xs font-black text-[#071E33] disabled:opacity-50"><Save className="h-4 w-4" />Save review</button><button type="button" disabled={busy || Boolean(missingMappings.length) || !approvableLines.length} onClick={approveAndPublish} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#197447] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"><BadgeCheck className="h-4 w-4" />{busy ? "Publishing…" : "Approve & publish"}</button></div></div></section>

      {batch.status === "approved" && approvableLines.some((line) => line.catalogue_item_id) ? <section className="rounded-2xl border border-[#CFE4D7] bg-[#F3FBF6] p-5"><div className="flex items-start gap-3"><Eye className="mt-0.5 h-5 w-5 text-[#197447]" /><div><strong className="text-[#071E33]">Published supplier prices</strong><p className="mt-1 text-sm leading-6 text-[#617286]">Open the relevant Price List material to see this supplier alongside other available suppliers.</p><div className="mt-3 flex flex-wrap gap-2">{Array.from(new Set(approvableLines.map((line) => line.catalogue_item_id).filter(Boolean))).map((itemId) => <Link key={itemId} href={`/prices/${itemId}`} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-[#0D3B66] shadow-sm">View {priceItems.find((item) => item.id === itemId)?.description || itemId} →</Link>)}</div></div></div></section> : null}
    </div>
  );
}
