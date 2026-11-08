"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  Hammer,
  History,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Search,
  Store,
  TrendingUp,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import AnimatedNaira from "@/components/ui/animated-naira";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import {
  loadMarketplaceDirectory,
  type MarketplaceOffer,
  type MarketplaceProfile,
  type MarketplaceProfileType,
} from "@/lib/platform/marketplace";
import { RATE_LOCATIONS, ZONES, getLocation } from "@/lib/rates/locations";

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

const whatsappHref = (phone: string, businessName: string, product?: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (!digits) return "#";
  const ask = product ? ` I would like today's price and availability for ${product}.` : " I would like to make an enquiry.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hello ${businessName}, I found your profile on Charismak.${ask}`)}`;
};

const MATERIAL_CHIPS = ["Cement", "Block", "Steel", "Sand", "Granite", "Roofing", "Tiles", "Paint", "Plumbing", "Electrical", "Carpenter", "Labour"];

const PRICE_PAGE_IDS = new Set(DEFAULT_PRICE_ITEMS.map((item) => item.id));

const darkInput =
  "min-h-12 w-full rounded-xl border px-4 text-sm font-semibold outline-none bg-white/10! text-white! border-white/15! placeholder:text-white/40! focus:border-[#F2B544]!";

type PriceGroup = {
  id: string;
  name: string;
  unit: string;
  low: number;
  mid: number;
  high: number;
  count: number;
  latest: string;
  expired: boolean;
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Groups offers by catalogue item and unit so like is only compared with like. */
function groupPrices(offers: MarketplaceOffer[], expired: boolean): PriceGroup[] {
  const groups = new Map<string, MarketplaceOffer[]>();
  for (const offer of offers) {
    const key = `${offer.catalogueItemId}|${offer.quotedUnit.toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), offer]);
  }
  return Array.from(groups.values())
    .map((items) => {
      const prices = items.map((item) => item.price);
      return {
        id: items[0].catalogueItemId,
        name: items[0].productName,
        unit: items[0].quotedUnit,
        low: Math.min(...prices),
        mid: median(prices),
        high: Math.max(...prices),
        count: items.length,
        latest: items.map((item) => item.validUntil).sort().at(-1) ?? "",
        expired,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const servesState = (profile: MarketplaceProfile, stateId: string) => {
  if (!stateId) return true;
  if (profile.stateId === stateId) return true;
  const area = profile.serviceArea.toLowerCase();
  if (/nationwide|all states|across nigeria|every ?where|all over/.test(area)) return true;
  const loc = getLocation(stateId);
  return area.includes(loc.name.toLowerCase()) || area.includes(loc.capital.toLowerCase());
};

export default function MarketplaceDirectory() {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [type, setType] = useState<"all" | MarketplaceProfileType>("all");
  const [query, setQuery] = useState("");
  const [stateId, setStateId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState("");

  const refresh = () => {
    setLoadState("loading");
    void loadMarketplaceDirectory().then((result) => {
      setProfiles(result.profiles);
      setLoadState(result.status);
      setLoadMessage(result.status === "error" ? result.message : "");
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");
    const initialType = params.get("type");
    const initialState = params.get("state");
    if (initialSearch) setQuery(initialSearch);
    if (initialType === "supplier" || initialType === "artisan") setType(initialType);
    if (initialState && RATE_LOCATIONS.some((loc) => loc.id === initialState)) setStateId(initialState);
    refresh();
  }, []);

  const matchesQuery = (profile: MarketplaceProfile) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const offerText = [...profile.offers, ...profile.pastOffers]
      .map((offer) => `${offer.productName} ${offer.brand || ""} ${offer.specification || ""}`)
      .join(" ");
    return `${profile.businessName} ${profile.category} ${profile.categories.join(" ")} ${(profile.searchTerms ?? []).join(" ")} ${offerText}`
      .toLowerCase()
      .includes(q);
  };

  const results = useMemo(
    () => profiles.filter((p) => (type === "all" || p.type === type) && servesState(p, stateId) && matchesQuery(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profiles, type, query, stateId],
  );

  const stateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const loc of RATE_LOCATIONS) counts.set(loc.id, profiles.filter((p) => servesState(p, loc.id)).length);
    return counts;
  }, [profiles]);

  const q = query.trim().toLowerCase();
  const offerMatches = (offer: MarketplaceOffer) =>
    !q || `${offer.productName} ${offer.brand || ""} ${offer.specification || ""}`.toLowerCase().includes(q);
  const currentGroups = groupPrices(results.flatMap((p) => p.offers.filter(offerMatches)), false);
  const pastGroups = groupPrices(results.flatMap((p) => p.pastOffers.filter(offerMatches)), true);
  const priceGroups = currentGroups.length ? currentGroups : pastGroups;
  const currentCount = profiles.reduce((sum, p) => sum + p.offers.length, 0);
  const statesCovered = new Set(profiles.map((p) => p.stateId).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <Stat label="Listed businesses" value={loadState === "ok" ? String(profiles.length) : "—"} />
        <Stat label="Current prices" value={loadState === "ok" ? String(currentCount) : "—"} />
        <Stat label="States covered" value={loadState === "ok" ? String(statesCovered) : "—"} />
        <Link
          href="/supplier-prices"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F2B544] px-4 text-xs font-black text-[#071E33] transition hover:bg-[#FFD07A]"
        >
          <UserPlus className="h-4 w-4" /> List your business
        </Link>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur md:p-5">
        <div className="grid gap-3 lg:grid-cols-[auto_1fr_260px]">
          <div className="flex rounded-xl bg-white/5 p-1" role="group" aria-label="Listing type">
            {(["all", "supplier", "artisan"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={`min-h-10 flex-1 rounded-lg px-4 text-xs font-black capitalize transition ${
                  type === value ? "bg-[#F2B544] text-[#071E33]" : "text-white/65 hover:text-white"
                }`}
              >
                {value === "all" ? "All" : `${value}s`}
              </button>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">Search materials, trades or businesses</span>
            <Search className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-white/45" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cement, steel, tiles, plumber..."
              className={`${darkInput} pl-9!`}
            />
          </label>
          <label className="relative">
            <span className="sr-only">State</span>
            <MapPin className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-[#F2B544]" />
            <select
              value={stateId}
              onChange={(event) => setStateId(event.target.value)}
              className={`${darkInput} pl-9! [&_option]:bg-[#071E33] [&_optgroup]:bg-[#071E33]`}
            >
              <option value="">All states</option>
              {ZONES.map((zone) => (
                <optgroup key={zone} label={zone}>
                  {RATE_LOCATIONS.filter((loc) => loc.zone === zone).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({stateCounts.get(loc.id) ?? 0})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MATERIAL_CHIPS.map((chip) => {
            const active = q === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(active ? "" : chip)}
                aria-pressed={active}
                className={`min-h-9 rounded-full border px-3 text-[11px] font-bold transition ${
                  active
                    ? "border-[#F2B544] bg-[#F2B544] text-[#071E33]"
                    : "border-white/15 text-white/70 hover:border-white/35 hover:text-white"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </section>

      {/* Price check */}
      {loadState === "ok" && priceGroups.length ? (
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-black text-white">
              {currentGroups.length ? (
                <TrendingUp className="h-4 w-4 text-[#38BDA8]" />
              ) : (
                <History className="h-4 w-4 text-white/50" />
              )}
              {currentGroups.length ? "Live supplier price check" : "Last quoted supplier prices"}
            </h2>
            <span className="text-[11px] text-white/50">
              {currentGroups.length ? "Current approved quotes · lowest / middle / highest" : "Expired quotes — reference only"}
            </span>
          </div>
          {!currentGroups.length ? (
            <p className="mt-2 rounded-xl bg-[#3A2A0B] px-3 py-2 text-[11px] leading-5 text-[#F7D58C]">
              No supplier price on file is current for this search. These are the last approved quotes, shown for reference only — ask the supplier for today&apos;s price.
            </p>
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {priceGroups.slice(0, 6).map((group) => (
              <article
                key={`${group.id}-${group.unit}`}
                className={`rounded-xl border p-4 ${group.expired ? "border-white/10 bg-white/[0.02] opacity-80" : "border-[#38BDA8]/30 bg-[#0B2A2A]/40"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-white">{group.name}</strong>
                    <span className="text-[11px] text-white/50">
                      per {group.unit} · {group.count} quote{group.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {PRICE_PAGE_IDS.has(group.id) ? (
                    <Link href={`/prices/${encodeURIComponent(group.id)}`} className="shrink-0 text-[11px] font-bold text-[#F2B544] hover:underline">
                      Market ref →
                    </Link>
                  ) : null}
                </div>
                <div className={`mt-3 text-2xl font-black ${group.expired ? "text-white/60" : "text-white"}`}>
                  {group.expired ? money(group.mid) : <AnimatedNaira value={group.mid} />}
                </div>
                {group.count > 1 ? (
                  <PriceBar low={group.low} mid={group.mid} high={group.high} muted={group.expired} />
                ) : null}
                <p className="mt-2 text-[10px] text-white/45">
                  {group.expired ? `Expired · last valid ${formatDate(group.latest)}` : `Valid to ${formatDate(group.latest)}`}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Listings */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((profile) => {
          const Icon = profile.type === "supplier" ? Store : Hammer;
          const shownCategories = profile.categories.slice(0, 3);
          const lastQuote = profile.pastOffers[0];
          const contact = profile.whatsapp || profile.phone;
          const state = profile.stateId ? getLocation(profile.stateId).name : null;

          return (
            <article
              key={profile.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-[#F2B544]/50 hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    profile.type === "supplier" ? "bg-[#12345A] text-[#8CC2FF]" : "bg-[#3A2A0B] text-[#F7D58C]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                  {profile.type}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-black text-white">{profile.businessName}</h2>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-white/55">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F2B544]" />
                {state ?? profile.location}
                {state && profile.location && !profile.location.toLowerCase().startsWith(state.toLowerCase().replace("fct ", ""))
                  ? ` · ${profile.location}`
                  : ""}
              </p>

              {shownCategories.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {shownCategories.map((category) => (
                    <span key={category} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-white/75">
                      {category}
                    </span>
                  ))}
                  {profile.categories.length > 3 ? (
                    <span className="px-1 py-1 text-[10px] font-bold text-white/45">+{profile.categories.length - 3} more</span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 rounded-xl bg-black/20 px-3 py-2.5 text-xs">
                {profile.offers.length ? (
                  <span className="font-bold text-[#9BE7C4]">
                    {profile.offers.length} current price{profile.offers.length === 1 ? "" : "s"} · from {money(Math.min(...profile.offers.map((o) => o.price)))}
                  </span>
                ) : lastQuote ? (
                  <span className="text-white/55">
                    <History className="mr-1 inline h-3.5 w-3.5" />
                    Last quoted {money(lastQuote.price)} / {lastQuote.quotedUnit} for {lastQuote.productName} · expired {formatDate(lastQuote.validUntil)}
                  </span>
                ) : (
                  <span className="text-white/55">No price listed — ask for a quote</span>
                )}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                {contact ? (
                  <a
                    href={whatsappHref(contact, profile.businessName, profile.offers[0]?.productName ?? lastQuote?.productName)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#197447] px-3 text-xs font-black text-white transition hover:bg-[#1F8A55]"
                  >
                    <MessageCircle className="h-4 w-4" /> Enquire
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedProfile(profile)}
                  className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-black text-white transition hover:border-[#F2B544] ${contact ? "" : "col-span-2"}`}
                >
                  <Eye className="h-4 w-4" /> Profile
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {loadState === "loading" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-white/60" role="status">
          Loading suppliers and artisans…
        </section>
      ) : loadState === "error" ? (
        <section className="rounded-2xl border border-[#F1C9BE] bg-[#FFF6F3] p-8 text-center" role="alert">
          <h2 className="font-bold text-[#081B36]">Directory unavailable</h2>
          <p className="mt-2 text-sm text-[#617286]">{loadMessage}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={refresh} className="min-h-11 rounded-xl bg-[#081B36] px-5 text-xs font-bold text-white">Try again</button>
            <Link href="/contact?subject=Help%20finding%20a%20supplier" className="inline-flex min-h-11 items-center rounded-xl border border-[#DCE4EC] bg-white px-5 text-xs font-bold text-[#081B36]">Ask Charismak to help</Link>
          </div>
        </section>
      ) : !results.length ? (
        <section className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-8 text-center">
          <PackageSearch className="mx-auto h-7 w-7 text-white/50" />
          <h2 className="mt-3 font-bold text-white">{profiles.length ? "No matches found" : "No approved listings yet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            {profiles.length
              ? `None of the ${profiles.length} listed businesses match this search${stateId ? ` in ${getLocation(stateId).name}` : ""}. Try a broader material, trade or another state.`
              : "No supplier or artisan profiles have been approved yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {query || stateId || type !== "all" ? (
              <button type="button" onClick={() => { setQuery(""); setStateId(""); setType("all"); }} className="min-h-11 rounded-xl border border-white/20 px-5 text-xs font-bold text-white">Clear filters</button>
            ) : null}
            <Link href="/contact?subject=Help%20finding%20a%20supplier" className="inline-flex min-h-11 items-center rounded-xl bg-[#F2B544] px-5 text-xs font-black text-[#071E33]">Ask Charismak to find one</Link>
          </div>
        </section>
      ) : null}

      {selectedProfile ? (
        <SupplierProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white/60">
      <strong className="text-base text-white">{value}</strong> {label}
    </span>
  );
}

function PriceBar({ low, mid, high, muted }: { low: number; mid: number; high: number; muted: boolean }) {
  const pos = high > low ? ((mid - low) / (high - low)) * 100 : 50;
  return (
    <div className="mt-2">
      <div className={`relative h-1.5 rounded-full ${muted ? "bg-white/10" : "bg-gradient-to-r from-[#38BDA8] via-[#F2B544] to-[#F29644]"}`}>
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#071E33] bg-white" style={{ left: `${pos}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/50">
        <span>{money(low)}</span>
        <span>{money(high)}</span>
      </div>
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

            {profile.pastOffers.length ? (
              <section className="mt-4 rounded-2xl border border-[#E1E8EF] bg-[#F8FAFC] p-4 md:p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">
                  <History className="h-3.5 w-3.5" /> Price history · expired
                </p>
                <p className="mt-1 text-xs text-[#617286]">Reference only. Ask the supplier for today&apos;s price.</p>
                <ul className="mt-3 divide-y divide-[#E1E8EF] text-sm">
                  {profile.pastOffers.map((offer) => (
                    <li key={offer.id} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block font-semibold text-[#425466]">{offer.productName}</span>
                        <span className="text-[11px] text-[#7A8B9E]">per {offer.quotedUnit} · expired {formatDate(offer.validUntil)}</span>
                      </span>
                      <span className="shrink-0 font-bold text-[#687583]">{money(offer.price)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

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
