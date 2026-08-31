"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  Hammer,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Search,
  Star,
  Store,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import {
  loadMarketplaceProfiles,
  MARKETPLACE_UPDATED_EVENT,
  submitMarketplaceReview,
  type MarketplaceProfile,
  type MarketplaceProfileType,
} from "@/lib/platform/marketplace";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "Not stated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const whatsappHref = (phone: string, businessName: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (!digits) return "#";
  const text = encodeURIComponent(`Hello ${businessName}, I found your supplier profile on Charismak and would like to request current product / service information.`);
  return `https://wa.me/${digits}?text=${text}`;
};

export default function MarketplaceDirectory({ embedded = false }: { embedded?: boolean }) {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [type, setType] = useState<"all" | MarketplaceProfileType>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null);
  const [reviewProfile, setReviewProfile] = useState<MarketplaceProfile | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => void loadMarketplaceProfiles().then(setProfiles);
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");
    const initialType = params.get("type");
    if (initialSearch) setQuery(initialSearch);
    if (initialType === "supplier" || initialType === "artisan") setType(initialType);
    refresh();
    window.addEventListener(MARKETPLACE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(MARKETPLACE_UPDATED_EVENT, refresh);
  }, []);

  const results = useMemo(() => profiles.filter((profile) => {
    const offerText = profile.offers.map((offer) => `${offer.productName} ${offer.quotedUnit}`).join(" ");
    const haystack = `${profile.businessName} ${profile.category} ${profile.categories.join(" ")} ${profile.description} ${profile.products.join(" ")} ${offerText}`.toLowerCase();
    return (type === "all" || profile.type === type)
      && (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (!location.trim() || `${profile.location} ${profile.serviceArea}`.toLowerCase().includes(location.trim().toLowerCase()));
  }), [profiles, type, query, location]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!reviewProfile || !reviewerName.trim() || reviewComment.trim().length < 10) {
      setReviewMessage("Add your name and a factual comment of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    const response = await submitMarketplaceReview(reviewProfile.id, reviewerName.trim(), reviewRating, reviewComment.trim());
    setSubmitting(false);
    setReviewMessage(response.submitted ? "Review submitted and connected to this profile." : "Review saved on this device; shared review publishing is being enabled separately.");
    setProfiles(await loadMarketplaceProfiles());
  };

  return (
    <div className="space-y-5">
      <section className={`overflow-hidden rounded-2xl ${embedded ? "border border-[#DCE4EC] bg-white" : "bg-[#081B36] text-white"} p-5 md:p-7`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${embedded ? "text-[#C8320A]" : "text-[#E7B34B]"}`}>Connected construction marketplace</p>
            <h1 className={`mt-1 text-2xl font-bold md:text-3xl ${embedded ? "text-[#081B36]" : "text-white"}`}>Find suppliers and skilled artisans</h1>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${embedded ? "text-[#617286]" : "text-white/70"}`}>Active profiles created through the Charismak supplier portal appear here automatically. Open any profile to see the business details, products, approved prices and service area.</p>
          </div>
          <Link href="/supplier-prices" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${embedded ? "bg-[#081B36] text-white" : "bg-[#E7B34B] text-[#081B36]"}`}>
            <UserPlus className="h-4 w-4" />Create supplier / artisan profile
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[auto_1fr_0.6fr]">
          <div className="grid grid-cols-3 rounded-xl bg-[#F2F5F8] p-1">{(["all", "supplier", "artisan"] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-2.5 text-xs font-bold capitalize ${type === value ? "bg-white text-[#081B36] shadow-sm" : "text-[#617286]"}`}>{value === "all" ? "Everyone" : `${value}s`}</button>)}</div>
          <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cement, BRC mesh, plumber, carpenter…" className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm" /></label>
          <label className="relative"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location or service area" className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm" /></label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((profile) => {
          const Icon = profile.type === "supplier" ? Store : Hammer;
          return (
            <article key={profile.id} className="flex flex-col rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_24px_rgba(7,30,51,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${profile.type === "supplier" ? "bg-[#EAF2FF] text-[#175FC4]" : "bg-[#FFF4E4] text-[#B45B09]"}`}><Icon className="h-5 w-5" /></span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${profile.isDemo ? "bg-[#EEF2F6] text-[#617286]" : profile.verified ? "bg-[#E9F8F1] text-[#087A50]" : "bg-[#EAF8F0] text-[#197447]"}`}>{profile.isDemo ? "Sample listing" : profile.verified ? "Verified" : "Active profile"}</span>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#C8320A]">{profile.category}</p>
              <h2 className="mt-1 text-lg font-bold text-[#081B36]">{profile.businessName}</h2>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#617286]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{profile.location} · serves {profile.serviceArea}</p>
              <p className="mt-3 text-xs leading-5 text-[#617286]">{profile.description}</p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7A8B9E]">Products / services</p>
                {profile.products.length ? profile.products.slice(0, 4).map((product) => <p key={product} className="text-[11px] font-semibold text-[#42576D]">• {product}</p>) : <p className="text-[11px] text-[#617286]">No approved product listing published yet.</p>}
                {profile.products.length > 4 ? <p className="pt-1 text-[10px] font-bold text-[#175FC4]">+ {profile.products.length - 4} more on full profile</p> : null}
              </div>
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1 text-[#617286]"><Star className="h-3.5 w-3.5 fill-[#E7B34B] text-[#E7B34B]" />{profile.reviewCount ? `${profile.rating.toFixed(1)} · ${profile.reviewCount} reviews` : "No reviews yet"}</span><span className="capitalize text-[#617286]">{profile.type}</span></div>
                <button type="button" onClick={() => setSelectedProfile(profile)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 text-xs font-bold text-white transition hover:bg-[#0D3B66]"><Eye className="h-4 w-4" />View full profile</button>
                {!profile.isDemo ? (
                  <button type="button" onClick={() => { setReviewProfile(profile); setReviewMessage(null); }} className="mt-2 w-full rounded-xl bg-[#F4F7FA] px-3 py-2.5 text-xs font-bold text-[#175FC4]">Review this {profile.type}</button>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {!results.length ? <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center"><PackageSearch className="mx-auto h-7 w-7 text-[#617286]" /><h2 className="mt-3 font-bold text-[#081B36]">No matching profile yet</h2><p className="mt-1 text-xs text-[#617286]">Try another location or category.</p><Link href="/supplier-prices" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#081B36] px-4 text-xs font-bold text-white">Create a profile</Link></section> : null}

      {selectedProfile ? <SupplierProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} onReview={() => { setReviewProfile(selectedProfile); setSelectedProfile(null); setReviewMessage(null); }} /> : null}

      {reviewProfile ? <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-[#020B16]/65 p-3 backdrop-blur-sm"><form onSubmit={submitReview} className="my-6 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C8320A]">Marketplace review</p><h2 className="mt-1 text-xl font-bold text-[#081B36]">Review {reviewProfile.businessName}</h2><p className="mt-1 text-xs text-[#617286]">Keep reviews factual: quality, delivery, timing and communication.</p></div><button type="button" onClick={() => setReviewProfile(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#DCE4EC] text-[#617286]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-3"><Field label="Your name" value={reviewerName} onChange={setReviewerName} /><label className="text-xs font-semibold text-[#526579]">Rating<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-[#CAD5E0] px-3 py-3 text-sm">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></label><label className="text-xs font-semibold text-[#526579]">Your experience<textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-[#CAD5E0] px-3 py-3 text-sm" placeholder="What was supplied or done? How was the quality and timing?" /></label></div>{reviewMessage ? <p className="mt-4 rounded-xl bg-[#F4F7FA] p-3 text-xs leading-5 text-[#526579]">{reviewMessage}</p> : null}<button type="submit" disabled={submitting} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit review"}</button></form></div> : null}
    </div>
  );
}

function SupplierProfileModal({ profile, onClose, onReview }: { profile: MarketplaceProfile; onClose: () => void; onReview: () => void }) {
  const Icon = profile.type === "supplier" ? Store : Hammer;
  const whatsapp = profile.whatsapp || profile.phone;

  return (
    <div className="fixed inset-0 z-[105] overflow-y-auto bg-[#020B16]/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl md:my-8 md:rounded-[2rem]">
        <div className="relative overflow-hidden bg-[#081B36] p-5 text-white md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(231,179,75,0.20),transparent_28rem)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#E7B34B]"><Icon className="h-5 w-5" /></span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#E7B34B]">{profile.type}</span>
                {!profile.isDemo ? <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F8F1] px-2.5 py-1 text-[9px] font-bold uppercase text-[#087A50]"><BadgeCheck className="h-3 w-3" />Active profile</span> : null}
              </div>
              <h2 className="mt-4 break-words text-2xl font-black md:text-4xl">{profile.businessName}</h2>
              <p className="mt-2 text-sm text-white/70">{profile.category}</p>
            </div>
            <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-4 md:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C8320A]">Business details</p>
              <dl className="mt-4 space-y-3 text-sm">
                {profile.supplierCode ? <DetailRow label="Supplier code" value={profile.supplierCode} /> : null}
                {profile.contactPerson ? <DetailRow label="Contact person" value={profile.contactPerson} icon={<UserRound className="h-4 w-4" />} /> : null}
                <DetailRow label="Location" value={profile.location} icon={<MapPin className="h-4 w-4" />} />
                <DetailRow label="Delivery / service area" value={profile.serviceArea} />
                {profile.createdAt ? <DetailRow label="Profile created" value={formatDate(profile.createdAt)} icon={<CalendarDays className="h-4 w-4" />} /> : null}
              </dl>
            </section>

            {profile.categories.length ? <section className="rounded-2xl border border-[#DCE4EC] p-4 md:p-5"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Supply categories</p><div className="mt-3 flex flex-wrap gap-2">{profile.categories.map((category) => <span key={category} className="rounded-full bg-[#EEF4FA] px-3 py-1.5 text-xs font-bold text-[#0D3B66]">{category}</span>)}</div></section> : null}

            {!profile.isDemo ? <section className="rounded-2xl border border-[#DCE4EC] p-4 md:p-5"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Contact supplier</p><div className="mt-3 grid gap-2 sm:grid-cols-2">
              {profile.phone ? <a href={`tel:${profile.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 text-xs font-bold text-white"><Phone className="h-4 w-4" />Call</a> : null}
              {whatsapp ? <a href={whatsappHref(whatsapp, profile.businessName)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-bold text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a> : null}
              {profile.email ? <a href={`mailto:${profile.email}?subject=${encodeURIComponent(`Quote request from Charismak for ${profile.businessName}`)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-4 text-xs font-bold text-[#081B36] sm:col-span-2"><Mail className="h-4 w-4" />{profile.email}</a> : null}
            </div><button type="button" onClick={onReview} className="mt-3 w-full rounded-xl bg-[#F4F7FA] px-3 py-3 text-xs font-bold text-[#175FC4]">Review this {profile.type}</button></section> : null}
          </div>

          <div className="space-y-5">
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C8320A]">About this profile</p>
              <p className="mt-3 text-sm leading-7 text-[#526579]">{profile.description}</p>
            </section>

            <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Products / services</p><h3 className="mt-1 text-xl font-black text-[#081B36]">Approved marketplace listings</h3></div>
                <span className="rounded-full bg-[#F3F6F9] px-3 py-1.5 text-xs font-bold text-[#526579]">{profile.offers.length} current</span>
              </div>

              {profile.offers.length ? <div className="mt-4 space-y-3">{profile.offers.map((offer) => <div key={offer.id} className="rounded-xl border border-[#E1E8EF] bg-[#F8FAFC] p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><strong className="block text-sm text-[#081B36]">{offer.productName}</strong>{offer.brand || offer.specification ? <span className="mt-1 block text-xs text-[#617286]">{[offer.brand, offer.specification].filter(Boolean).join(" · ")}</span> : null}<span className="mt-1 block text-xs text-[#617286]">Quoted unit: {offer.quotedUnit}{offer.location ? ` · ${offer.location}` : ""}</span></div><strong className="text-lg text-[#A82B05]">{money(offer.price)}</strong></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E1E8EF] pt-3 text-[10px] text-[#7A8B9E]"><span>Valid from {formatDate(offer.validFrom)}</span><span>Valid until {formatDate(offer.validUntil)}</span>{offer.availability ? <span>{offer.availability}</span> : null}{offer.deliveryIncluded === true ? <span>Delivery included</span> : offer.deliveryFee != null ? <span>Delivery {money(offer.deliveryFee)}</span> : null}</div></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[#B8C7D6] bg-[#F8FAFC] p-5 text-center"><PackageSearch className="mx-auto h-6 w-6 text-[#7A8B9E]" /><p className="mt-2 text-sm font-bold text-[#081B36]">No approved product price published yet</p><p className="mt-1 text-xs leading-5 text-[#617286]">This supplier profile is active, but its product / service submissions have not yet been approved for public display.</p></div>}

              {!profile.offers.length && profile.products.length ? <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Listed products / services</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{profile.products.map((product) => <div key={product} className="rounded-xl bg-[#F3F6F9] px-3 py-2.5 text-xs font-semibold text-[#42576D]">{product}</div>)}</div></div> : null}
            </section>

            <section className="rounded-2xl bg-[#F8FAFC] p-4 text-xs leading-6 text-[#617286]">
              <strong className="text-[#081B36]">Marketplace note:</strong> approved supplier prices are reference quotations submitted through Charismak. Buyers should confirm current stock, delivery, final specification and payment terms directly with the supplier before purchase.
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3"><dt className="text-xs font-semibold text-[#7A8B9E]">{label}</dt><dd className="flex min-w-0 items-start gap-2 break-words font-semibold text-[#081B36]">{icon ? <span className="mt-0.5 shrink-0 text-[#C8320A]">{icon}</span> : null}<span>{value}</span></dd></div>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="text-xs font-semibold text-[#526579]">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[#CAD5E0] px-3 py-3 text-sm" /></label>;
}
