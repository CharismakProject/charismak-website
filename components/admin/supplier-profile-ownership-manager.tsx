"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clock3, KeyRound, Loader2, MessageCircle, PackageSearch, RefreshCw, Search, ShieldCheck, Store, Trash2, UserCheck } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type SupplierStatus = "active" | "inactive" | "blocked";
type SupplierRow = {
  id: string; supplier_code: string; business_name: string; contact_person: string | null; phone: string; whatsapp: string | null; email: string | null; location: string; delivery_areas: string | null; categories: string[] | null; status: SupplierStatus; created_at: string; updated_at: string; last_login_at: string | null; pin_reset_allowed_until: string | null; pin_reset_released_at: string | null; pin_reset_released_by: string | null;
};
type OfferRow = { id: string; product_name: string; specification: string | null; brand: string | null; quoted_unit: string; unit_price: number; location: string; status: string; valid_until: string | null; updated_at: string; };
type SubmissionRow = { id: string; batch_id: string; product_name: string; quoted_unit: string; unit_price: number; status: string; updated_at: string; batchTitle: string; submittedAt: string; };
type BatchRow = { id: string; form_title: string | null; status: string; submitted_at: string; };

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const categoryLabel = (value: string) => SUPPLIER_FORMS.find((form) => form.id === value)?.shortTitle || value;
const resetWindowOpen = (profile: SupplierRow) => Boolean(profile.pin_reset_allowed_until && new Date(profile.pin_reset_allowed_until).getTime() > Date.now());
const whatsappHref = (profile: SupplierRow) => {
  const digits = (profile.whatsapp || profile.phone || "").replace(/\D/g, "").replace(/^0/, "234");
  const message = [`Hello ${profile.business_name},`, `Charismak is contacting you about supplier account ${profile.supplier_code}.`, "Your supplier profile details and prices are owner-controlled. If a review is needed, please sign in to update them or authorise a specific price change.", "https://www.charismakproject.com/supplier-prices"].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function SupplierProfileOwnershipManager() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [auth, setAuth] = useState<"checking" | "ready" | "forbidden">("checking");
  const [profiles, setProfiles] = useState<SupplierRow[]>([]);
  const [selected, setSelected] = useState<SupplierRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true); setError("");
    const { data, error: loadError } = await client.from("supplier_profiles").select("id,supplier_code,business_name,contact_person,phone,whatsapp,email,location,delivery_areas,categories,status,created_at,updated_at,last_login_at,pin_reset_allowed_until,pin_reset_released_at,pin_reset_released_by").order("updated_at", { ascending: false });
    setLoading(false);
    if (loadError) { setError(loadError.message); return; }
    const rows = (data || []) as SupplierRow[];
    setProfiles(rows);
    setSelected((current) => current ? rows.find((row) => row.id === current.id) || null : rows[0] || null);
  }, [client]);

  const loadDetails = useCallback(async (supplierId: string) => {
    if (!client) return;
    setLoadingDetails(true);
    const [offerResult, batchResult] = await Promise.all([
      client.from("supplier_marketplace_offers").select("id,product_name,specification,brand,quoted_unit,unit_price,location,status,valid_until,updated_at").eq("supplier_id", supplierId).order("updated_at", { ascending: false }).limit(100),
      client.from("supplier_review_batches").select("id,form_title,status,submitted_at").eq("supplier_id", supplierId).order("submitted_at", { ascending: false }).limit(30),
    ]);
    if (offerResult.error) setError(offerResult.error.message);
    setOffers((offerResult.data || []) as OfferRow[]);
    if (batchResult.error) { setError(batchResult.error.message); setSubmissions([]); setLoadingDetails(false); return; }
    const batches = (batchResult.data || []) as BatchRow[];
    if (!batches.length) { setSubmissions([]); setLoadingDetails(false); return; }
    const { data: lineData, error: lineError } = await client.from("supplier_review_lines").select("id,batch_id,product_name,quoted_unit,unit_price,status,updated_at").in("batch_id", batches.map((row) => row.id)).order("updated_at", { ascending: false }).limit(200);
    if (lineError) setError(lineError.message);
    const byBatch = new Map(batches.map((batch) => [batch.id, batch]));
    setSubmissions((lineData || []).map((line) => ({ ...line, batchTitle: byBatch.get(line.batch_id)?.form_title || "Supplier price update", submittedAt: byBatch.get(line.batch_id)?.submitted_at || line.updated_at })) as SubmissionRow[]);
    setLoadingDetails(false);
  }, [client]);

  useEffect(() => {
    if (!client) { setAuth("forbidden"); setLoading(false); return; }
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session || !isAdminEmail(data.session.user.email)) { setAuth("forbidden"); setLoading(false); return; }
      setAuth("ready"); await load();
    });
  }, [client, load]);
  useEffect(() => { if (selected?.id && auth === "ready") void loadDetails(selected.id); }, [selected?.id, auth, loadDetails]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((profile) => [profile.business_name, profile.supplier_code, profile.phone, profile.whatsapp, profile.email, profile.location, ...(profile.categories || [])].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [profiles, query]);
  const currentOffers = offers.filter((offer) => offer.status === "approved" && (!offer.valid_until || offer.valid_until >= new Date().toISOString().slice(0, 10)));

  const releasePin = async () => {
    if (!client || !selected || !window.confirm(`Allow ${selected.business_name} to create a new PIN for 30 minutes? Only continue after verifying the request from the registered WhatsApp or phone number.`)) return;
    setBusy(true); setError(""); setMessage("");
    const { data: sessionData } = await client.auth.getSession();
    const { error: resetError } = await client.from("supplier_profiles").update({ account_pin_hash: null, account_pin_salt: null, account_pin_version: 2, login_failed_attempts: 0, login_locked_until: null, access_token: crypto.randomUUID(), pin_reset_allowed_until: new Date(Date.now() + 30 * 60_000).toISOString(), pin_reset_released_at: new Date().toISOString(), pin_reset_released_by: sessionData.session?.user.email || "Charismak admin", updated_at: new Date().toISOString() }).eq("id", selected.id);
    setBusy(false);
    if (resetError) { setError(resetError.message); return; }
    setMessage("Verified PIN reset enabled for 30 minutes. No supplier business details were changed."); await load();
  };

  const removeProfile = async () => {
    if (!client || !selected || !window.confirm(`Remove ${selected.business_name} from the active supplier marketplace?\n\nThe profile and price history will be retained internally, but the supplier account will become inactive and current prices will be removed.`)) return;
    setBusy(true); setError(""); setMessage("");
    const { error: removeError } = await client.rpc("admin_remove_supplier_profile", { p_supplier_id: selected.id });
    setBusy(false);
    if (removeError) { setError(removeError.message); return; }
    setMessage("Supplier profile removed from active use. Historical records were retained."); await load(); if (selected) await loadDetails(selected.id);
  };

  if (auth === "checking") return <div className="mx-auto grid min-h-[260px] max-w-7xl place-items-center px-4"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (auth === "forbidden") return <section className="mx-auto max-w-3xl px-4 py-14 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-[#A82B05]" /><h1 className="mt-4 text-2xl font-black text-[#071E33]">Administrator access required</h1></section>;

  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Supplier administration</p><h1 className="mt-2 text-3xl font-black text-[#071E33]">Supplier Profiles</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">Supplier business details are owner-controlled. Admin can review the record, contact the supplier, remove the profile, and release a verified PIN reset — but cannot edit the supplier&apos;s business information.</p></div><button type="button" onClick={() => { void load(); if (selected) void loadDetails(selected.id); }} disabled={loading || loadingDetails} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] bg-white px-4 text-xs font-black text-[#0D3B66]"><RefreshCw className={`h-4 w-4 ${loading || loadingDetails ? "animate-spin" : ""}`} />Refresh</button></div>
    {message ? <p className="mt-5 rounded-xl border border-[#BFE2CD] bg-[#F0FAF4] p-4 text-sm text-[#17613C]">{message}</p> : null}{error ? <p className="mt-5 rounded-xl border border-[#F0C4BA] bg-[#FFF4F1] p-4 text-sm text-[#8B1E00]">{error}</p> : null}
    <div className="mt-7 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4"><label className="relative block"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, phone, location…" className="min-h-12 w-full rounded-xl border border-[#DCE4EC] pl-11 pr-4 text-sm outline-none focus:border-[#0D3B66]" /></label><div className="mt-3 max-h-[760px] space-y-2 overflow-y-auto pr-1">{visible.map((profile) => <button key={profile.id} type="button" onClick={() => { setSelected(profile); setMessage(""); setError(""); }} className={`w-full rounded-xl border p-3 text-left ${selected?.id === profile.id ? "border-[#0D3B66] bg-[#F1F6FB]" : "border-[#E3E9EF] bg-white"}`}><strong className="block text-sm text-[#071E33]">{profile.business_name}</strong><span className="mt-1 block text-xs text-[#617286]">{profile.supplier_code} · {profile.location}</span><div className="mt-2 flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${profile.status === "active" ? "bg-[#EAF8F0] text-[#197447]" : "bg-[#F1F3F5] text-[#617286]"}`}>{profile.status}</span>{resetWindowOpen(profile) ? <span className="text-[9px] font-black uppercase text-[#A82B05]">PIN reset open</span> : null}</div></button>)}</div></section>
      <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 sm:p-7">{selected ? <><div className="flex flex-col gap-3 border-b border-[#E5EAF0] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex items-center gap-2 text-xs font-black text-[#A82B05]"><Store className="h-4 w-4" />{selected.supplier_code}</span><h2 className="mt-2 text-2xl font-black text-[#071E33]">{selected.business_name}</h2><p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#197447]"><UserCheck className="h-4 w-4" />Owner-controlled profile</p></div><a href={whatsappHref(selected)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><MessageCircle className="h-4 w-4" />WhatsApp supplier</a></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><ReadField label="Business name" value={selected.business_name} /><ReadField label="Contact person" value={selected.contact_person || "—"} /><ReadField label="Phone" value={selected.phone} /><ReadField label="WhatsApp" value={selected.whatsapp || selected.phone} /><ReadField label="Email" value={selected.email || "—"} /><ReadField label="Main location" value={selected.location} /><div className="sm:col-span-2"><ReadField label="Delivery / service areas" value={selected.delivery_areas || "—"} /></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{(selected.categories || []).length ? (selected.categories || []).map((category) => <span key={category} className="rounded-full bg-[#EEF4FA] px-3 py-1.5 text-xs font-bold text-[#0D3B66]">{categoryLabel(category)}</span>) : <span className="text-xs text-[#617286]">No categories saved.</span>}</div>
        <section className="mt-7 rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-4 sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#197447]">Current public offers</p><h3 className="mt-1 text-xl font-black text-[#071E33]">Approved products & prices</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#526579]">{currentOffers.length} current</span></div>{loadingDetails ? <div className="grid min-h-24 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : currentOffers.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{currentOffers.map((offer) => <div key={offer.id} className="rounded-xl border border-[#DFE7EE] bg-white p-4"><div className="flex justify-between gap-3"><div><strong className="block text-sm text-[#071E33]">{offer.product_name}</strong><p className="mt-1 text-xs text-[#617286]">{[offer.brand, offer.specification].filter(Boolean).join(" · ") || "No additional specification"}</p></div><BadgeCheck className="h-5 w-5 text-[#197447]" /></div><strong className="mt-3 block text-lg text-[#A82B05]">{money(Number(offer.unit_price))} / {offer.quoted_unit}</strong></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#CBD7E2] bg-white p-5 text-center"><PackageSearch className="mx-auto h-6 w-6 text-[#7A8B9E]" /><p className="mt-2 text-sm font-bold text-[#071E33]">No current approved price</p></div>}</section>
        <section className="mt-5 rounded-2xl border border-[#DCE4EC] p-4 sm:p-5"><h3 className="text-lg font-black text-[#071E33]">Recent supplier submissions</h3>{submissions.length ? <div className="mt-4 space-y-2">{submissions.slice(0, 20).map((line) => <div key={line.id} className="grid gap-2 rounded-xl bg-[#F8FAFC] p-3 text-xs sm:grid-cols-[1fr_auto] sm:items-center"><div><strong className="text-[#071E33]">{line.product_name}</strong><p className="mt-1 text-[#617286]">{line.batchTitle} · <Clock3 className="inline h-3 w-3" /> {new Date(line.submittedAt).toLocaleDateString("en-NG")}</p></div><span className="font-black text-[#A82B05]">{money(Number(line.unit_price))}/{line.quoted_unit} · {line.status}</span></div>)}</div> : <p className="mt-3 text-sm text-[#617286]">No submission history attached yet.</p>}</section>
        <div className="mt-6 flex flex-col gap-3 border-t border-[#E5EAF0] pt-5 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => void releasePin()} disabled={busy || selected.status !== "active"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D4DEE8] px-5 text-sm font-black text-[#0D3B66] disabled:opacity-40"><KeyRound className="h-4 w-4" />Allow verified PIN reset</button>{selected.status === "active" ? <button type="button" onClick={() => void removeProfile()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E2B6AC] bg-[#FFF7F5] px-5 text-sm font-black text-[#A82B05]"><Trash2 className="h-4 w-4" />Delete / remove profile</button> : null}</div><p className="mt-3 text-xs leading-5 text-[#617286]">To correct business details, ask the supplier to sign in and edit their own profile. Admin does not have a business-detail edit form.</p>
      </> : <div className="grid min-h-[360px] place-items-center text-center"><Store className="h-8 w-8 text-[#7A8B9E]" /></div>}</section>
    </div>
  </div>;
}

function ReadField({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#E1E7ED] bg-[#F8FAFC] px-4 py-3"><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8B9E]">{label}</span><strong className="mt-1 block break-words text-sm text-[#071E33]">{value}</strong></div>; }
