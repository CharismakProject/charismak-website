"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  Store,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import {
  loadMarketplaceProfiles,
  MARKETPLACE_UPDATED_EVENT,
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
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const whatsappHref = (phone: string, businessName: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (!digits) return "#";
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hello ${businessName}, I found your profile on Charismak and would like to make an enquiry.`,
  )}`;
};

export default function MarketplaceDirectory({ embedded = false }: { embedded?: boolean }) {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [type, setType] = useState<"all" | MarketplaceProfileType>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null);

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

  const results = useMemo(
    () =>
      profiles.filter((profile) => {
        const offerText = profile.offers
          .map(
            (offer) =>
              `${offer.productName} ${offer.brand || ""} ${offer.specification || ""} ${offer.quotedUnit}`,
          )
          .join(" ");
        const haystack = `${profile.businessName} ${profile.category} ${profile.categories.join(" ")} ${offerText}`.toLowerCase();
        return (
          (type === "all" || profile.type === type) &&
          (!query.trim() || haystack.includes(query.trim().toLowerCase())) &&
          (!location.trim() ||
            `${profile.location} ${profile.serviceArea}`.toLowerCase().includes(location.trim().toLowerCase()))
        );
      }),
    [profiles, type, query, location],
  );

  return (
    <div className="space-y-5">
      <section
        className={`overflow-hidden rounded-2xl ${
          embedded ? "border border-[#DCE4EC] bg-white" : "bg-[#081B36] text-white"
        } p-5 md:p-7`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.16em] ${
                embedded ? "text-[#C8320A]" : "text-[#E7B34B]"
              }`}
            >
              Supplier & artisan directory
            </p>
            <h1
              className={`mt-1 text-2xl font-bold md:text-3xl ${
                embedded ? "text-[#081B36]" : "text-white"
              }`}
            >
              Find construction suppliers and trade teams
            </h1>
            <p
              className={`mt-2 max-w-2xl text-sm leading-6 ${
                embedded ? "text-[#617286]" : "text-white/70"
              }`}
            >
              Search by material, service or location. Supplier prices shown here have passed through Charismak review.
            </p>
          </div>
          <Link
            href="/supplier-prices"
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${
              embedded ? "bg-[#081B36] text-white" : "bg-[#E7B34B] text-[#081B36]"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Join the directory
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[auto_1fr_0.6fr]">
          <div className="grid grid-cols-3 rounded-xl bg-[#F2F5F8] p-1">
            {(["all", "supplier", "artisan"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-lg px-3 py-2.5 text-xs font-bold capitalize ${
                  type === value ? "bg-white text-[#081B36] shadow-sm" : "text-[#617286]"
                }`}
              >
                {value === "all" ? "All" : `${value}s`}
              </button>
            ))}
          </div>
          <label className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cement, steel, plumbing, tiles, carpenter..."
              className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm"
            />
          </label>
          <label className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#7A8B9E]" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="min-h-11 w-full rounded-xl border border-[#CAD5E0] pl-10 pr-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((profile) => {
          const Icon = profile.type === "supplier" ? Store : Hammer;
          const shownCategories = profile.categories.slice(0, 3);

          return (
            <article
              key={profile.id}
              className="flex flex-col rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_24px_rgba(7,30,51,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl ${
                    profile.type === "supplier"
                      ? "bg-[#EAF2FF] text-[#175FC4]"
                      : "bg-[#FFF4E4] text-[#B45B09]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${
                    profile.isDemo ? "bg-[#EEF2F6] text-[#617286]" : "bg-[#EAF8F0] text-[#197447]"
                  }`}
                >
                  {profile.isDemo ? "Sample" : "Active"}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#081B36]">{profile.businessName}</h2>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#617286]">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {profile.location}
                {profile.serviceArea && profile.serviceArea !== profile.location
                  ? ` · ${profile.serviceArea}`
                  : ""}
              </p>

              <div className="mt-4 rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#7A8B9E]">
                  Supplies / services
                </p>
                {shownCategories.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {shownCategories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#42576D]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-[#617286]">Categories not added yet.</p>
                )}
                {profile.categories.length > 3 ? (
                  <p className="mt-2 text-[10px] font-bold text-[#175FC4]">
                    + {profile.categories.length - 3} more
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E1E8EF] px-3 py-2.5 text-xs">
                <span className="text-[#617286]">Approved price listings</span>
                <strong className="text-[#081B36]">{profile.offers.length}</strong>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-xs text-[#617286]">
                  <span>Public reviews not yet enabled</span>
                  <span className="capitalize">{profile.type}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProfile(profile)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 text-xs font-bold text-white transition hover:bg-[#0D3B66]"
                >
                  <Eye className="h-4 w-4" />
                  View profile
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {!results.length ? (
        <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center">
          <PackageSearch className="mx-auto h-7 w-7 text-[#617286]" />
          <h2 className="mt-3 font-bold text-[#081B36]">No matches found</h2>
          <p className="mt-1 text-xs text-[#617286]">Try another product, service or location.</p>
        </section>
      ) : null}

      {selectedProfile ? (
        <SupplierProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      ) : null}
    </div>
  );
}

function SupplierProfileModal({ profile, onClose }: { profile: MarketplaceProfile; onClose: () => void }) {
  const Icon = profile.type === "supplier" ? Store : Hammer;
  const whatsapp = profile.whatsapp || profile.phone;

  return (
    <div className="fixed inset-0 z-[105] overflow-y-auto bg-[#020B16]/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl md:my-8 md:rounded-[2rem]">
        <header className="relative overflow-hidden bg-[#081B36] p-5 text-white md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(231,179,75,0.20),transparent_28rem)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#E7B34B]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#E7B34B]">
                  {profile.type}
                </span>
                {!profile.isDemo ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F8F1] px-2.5 py-1 text-[9px] font-bold uppercase text-[#087A50]">
                    <BadgeCheck className="h-3 w-3" />
                    Active
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 break-words text-2xl font-black md:text-4xl">{profile.businessName}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close supplier profile"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-4 md:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C8320A]">Business details</p>
              <dl className="mt-4 space-y-3 text-sm">
                {profile.supplierCode ? <DetailRow label="Supplier code" value={profile.supplierCode} /> : null}
                {profile.contactPerson ? (
                  <DetailRow
                    label="Contact person"
                    value={profile.contactPerson}
                    icon={<UserRound className="h-4 w-4" />}
                  />
                ) : null}
                <DetailRow label="Location" value={profile.location} icon={<MapPin className="h-4 w-4" />} />
                <DetailRow label="Service area" value={profile.serviceArea} />
                {profile.createdAt ? (
                  <DetailRow
                    label="Joined"
                    value={formatDate(profile.createdAt)}
                    icon={<CalendarDays className="h-4 w-4" />}
                  />
                ) : null}
              </dl>
            </section>

            <section className="rounded-2xl border border-[#DCE4EC] p-4 md:p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">What they supply</p>
              {profile.categories.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-[#EEF4FA] px-3 py-1.5 text-xs font-bold text-[#0D3B66]"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#617286]">No categories listed yet.</p>
              )}
            </section>

            {!profile.isDemo ? (
              <section className="rounded-2xl border border-[#DCE4EC] p-4 md:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Contact</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 text-xs font-bold text-white"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  ) : null}
                  {whatsapp ? (
                    <a
                      href={whatsappHref(whatsapp, profile.businessName)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-bold text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  ) : null}
                  {profile.email ? (
                    <a
                      href={`mailto:${profile.email}?subject=${encodeURIComponent(`Enquiry for ${profile.businessName}`)}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-4 text-xs font-bold text-[#081B36] sm:col-span-2"
                    >
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <div>
            <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">Current prices</p>
                  <h3 className="mt-1 text-xl font-black text-[#081B36]">Approved price listings</h3>
                </div>
                <span className="rounded-full bg-[#F3F6F9] px-3 py-1.5 text-xs font-bold text-[#526579]">
                  {profile.offers.length}
                </span>
              </div>

              {profile.offers.length ? (
                <div className="mt-4 space-y-3">
                  {profile.offers.map((offer) => (
                    <div key={offer.id} className="rounded-xl border border-[#E1E8EF] bg-[#F8FAFC] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <strong className="block text-sm text-[#081B36]">{offer.productName}</strong>
                          {offer.brand || offer.specification ? (
                            <span className="mt-1 block text-xs text-[#617286]">
                              {[offer.brand, offer.specification].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-xs text-[#617286]">
                            {offer.quotedUnit}
                            {offer.location ? ` · ${offer.location}` : ""}
                          </span>
                        </div>
                        <strong className="text-lg text-[#A82B05]">{money(offer.price)}</strong>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E1E8EF] pt-3 text-[10px] text-[#7A8B9E]">
                        <span>Valid to {formatDate(offer.validUntil)}</span>
                        {offer.availability ? <span>{offer.availability}</span> : null}
                        {offer.deliveryIncluded === true ? (
                          <span>Delivery included</span>
                        ) : offer.deliveryFee != null ? (
                          <span>Delivery {money(offer.deliveryFee)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#B8C7D6] bg-[#F8FAFC] p-5 text-center">
                  <PackageSearch className="mx-auto h-6 w-6 text-[#7A8B9E]" />
                  <p className="mt-2 text-sm font-bold text-[#081B36]">No approved prices yet</p>
                </div>
              )}
            </section>

            <p className="mt-4 rounded-xl bg-[#F8FAFC] p-4 text-xs leading-6 text-[#617286]">
              Confirm stock, specification, delivery and final price directly with the supplier before placing an order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3">
      <dt className="text-xs font-semibold text-[#7A8B9E]">{label}</dt>
      <dd className="flex min-w-0 items-start gap-2 break-words font-semibold text-[#081B36]">
        {icon ? <span className="mt-0.5 shrink-0 text-[#C8320A]">{icon}</span> : null}
        <span>{value}</span>
      </dd>
    </div>
  );
}
