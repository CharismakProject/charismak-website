"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CalendarDays,
  ExternalLink,
  HardHat,
  ImageIcon,
  MapPin,
  Search,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import type { PriceCategory, PriceItem } from "@/lib/pricing/models";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { loadPriceItems, PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";
import {
  loadSupplierOfferSummaries,
  type SupplierOfferSummary,
} from "@/lib/platform/supplier-offers";

type CategoryFilter = "all" | PriceCategory;

const categories: Array<{ id: CategoryFilter; label: string; icon: typeof Boxes }> = [
  { id: "all", label: "All", icon: Boxes },
  { id: "material", label: "Materials", icon: Building2 },
  { id: "plant", label: "Equipment", icon: Wrench },
  { id: "labour", label: "Labour", icon: HardHat },
  { id: "subcontract", label: "Specialists", icon: Store },
];

const PAGE_SIZE = 30;

const initialItems = DEFAULT_PRICE_ITEMS.filter((item) => item.countryCode === "NG" && item.active);

const money = (value: number | null, currency = "NGN") =>
  value === null
    ? "Price being updated"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);

const searchText = (item: PriceItem) => {
  const market = JIJI_MARKET_SNAPSHOT[item.id];
  return [
    item.code,
    item.description,
    item.location,
    item.unit,
    item.marketUnit,
    item.brand,
    item.specification,
    market?.marketName,
    market?.specification,
    market?.unit,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const categoryLabel = (category: PriceCategory) => {
  if (category === "plant") return "Equipment";
  if (category === "subcontract") return "Specialist";
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export default function MarketPriceBrowser() {
  const [items, setItems] = useState<PriceItem[]>(initialItems);
  const [supplierSummaries, setSupplierSummaries] = useState<Record<string, SupplierOfferSummary>>({});
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const refresh = () =>
      setItems(loadPriceItems().filter((item) => item.countryCode === "NG" && item.active));

    refresh();
    void loadSupplierOfferSummaries().then(setSupplierSummaries);
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
  }, []);

  const locations = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => values.add(JIJI_MARKET_SNAPSHOT[item.id]?.location || item.location));
    return ["all", ...Array.from(values).filter(Boolean).sort()];
  }, [items]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const marketLocation = JIJI_MARKET_SNAPSHOT[item.id]?.location || item.location;
      return (
        (category === "all" || item.category === category) &&
        (location === "all" || marketLocation === location) &&
        (!q || searchText(item).includes(q))
      );
    });
  }, [items, category, location, query]);

  const liveCount = items.filter((item) => JIJI_MARKET_SNAPSHOT[item.id]).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] px-5 py-8 text-white md:px-9 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.22),transparent_28rem)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
            <BadgeCheck className="h-4 w-4" />
            Nigeria construction prices
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
            Check prices in the units people actually buy.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Search materials, labour and equipment by location. We show practical buying units alongside the technical units used for estimating.
          </p>

          <div className="mt-7 grid overflow-hidden rounded-2xl bg-white sm:grid-cols-[1fr_220px]">
            <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Search cement, Y12, granite, mixer, PPR..."
                className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm text-[#071E33] outline-none"
              />
            </label>
            <label className="relative">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <select
                value={location}
                onChange={(event) => { setLocation(event.target.value); setVisible(PAGE_SIZE); }}
                className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm font-bold text-[#071E33] outline-none"
              >
                <option value="all">All locations</option>
                {locations.slice(1).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Cement", "Y12", "9-inch block", "Sharp sand", "Granite", "60x60 tiles", "PPR", "Concrete mixer"].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setQuery(value); setVisible(PAGE_SIZE); }}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#C8A45D] hover:text-[#F2B544]"
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex w-max gap-2">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setCategory(id); setVisible(PAGE_SIZE); }}
              aria-pressed={category === id}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                category === id
                  ? "border-[#071E33] bg-[#071E33] text-white"
                  : "border-[#DCE4EC] bg-white text-[#071E33] hover:border-[#C8A45D]"
              }`}
            >
              <Icon className={`h-4 w-4 ${category === id ? "text-[#F2B544]" : "text-[#7A8B9E]"}`} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-black text-[#071E33] md:text-xl">{results.length} items</h2>
          <p className="text-xs text-[#617286]">{liveCount} with current market checks</p>
        </div>

        <ul className="divide-y divide-[#E4EAF0] overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white">
          {results.slice(0, visible).map((item) => {
            const market = JIJI_MARKET_SNAPSHOT[item.id];
            const localImage = item.imageUrl?.startsWith("/") ? item.imageUrl : null;
            const displayName = market?.marketName || item.description;
            const displayLocation = market?.location || item.location;
            const supplierSummary = supplierSummaries[item.id];
            const detailHref = `/prices/${encodeURIComponent(item.id)}`;
            const unit = market?.unit || item.marketUnit || item.unit;
            const spec = market?.specification || item.specification;
            const hasDetails = Boolean(market?.note || market?.alternatives?.length || market?.primarySourceUrl);

            return (
              <li key={item.id} className="px-4 py-4 md:px-5">
                <div className="flex items-start gap-3 md:items-center md:gap-4">
                  <Link
                    href={detailHref}
                    className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF2F6] sm:block"
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    {localImage ? (
                      <img src={localImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center">
                        <ImageIcon className="h-5 w-5 text-[#9AA9B8]" />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={detailHref} className="block font-black leading-6 text-[#071E33] hover:text-[#0D3B66]">
                      {displayName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-[#617286]">
                      {[spec, categoryLabel(item.category)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7A8B9E]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {displayLocation}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(market?.checkedAt || item.updatedAt).toLocaleDateString("en-NG")}
                      </span>
                      <span className={market ? "font-bold text-[#197447]" : "font-bold text-[#8B1E00]"}>
                        {market ? `Market checked · ${market.sourceCount} sources` : "Charismak reference"}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <strong className="block text-base text-[#071E33] md:text-lg">
                      {market ? money(market.reference) : money(item.rate, item.currency)}
                    </strong>
                    <span className="block text-[11px] font-bold text-[#617286]">per {unit}</span>
                    {market ? (
                      <span className="block text-[11px] text-[#7A8B9E]">
                        {money(market.priceLow)} – {money(market.priceHigh)}
                      </span>
                    ) : null}
                  </div>

                  <Link
                    href={detailHref}
                    aria-label={`Suppliers and prices for ${displayName}`}
                    className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#DCE4EC] text-[#0D3B66] transition hover:border-[#0D3B66] md:grid"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {supplierSummary || hasDetails ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:pl-[4.5rem]">
                    {supplierSummary ? (
                      <Link href={detailHref} className="inline-flex items-center gap-1.5 font-bold text-[#0D3B66]">
                        <Truck className="h-3.5 w-3.5" />
                        {supplierSummary.count} supplier offer{supplierSummary.count === 1 ? "" : "s"} from{" "}
                        {money(supplierSummary.lowestPrice)} / {supplierSummary.quotedUnit}
                      </Link>
                    ) : null}
                    {hasDetails ? (
                      <details className="group w-full">
                        <summary className="cursor-pointer list-none font-bold text-[#617286] hover:text-[#0D3B66]">
                          <span className="group-open:hidden">Other loads, notes & source +</span>
                          <span className="hidden group-open:inline">Hide details −</span>
                        </summary>
                        <div className="mt-2 space-y-2 rounded-xl bg-[#F6F8FA] p-3">
                          {market?.alternatives?.map((alt) => (
                            <div key={`${alt.label}-${alt.unit}`} className="flex justify-between gap-3">
                              <span className="text-[#3A4653]">
                                {alt.label} <span className="text-[#7A8B9E]">· {alt.unit}</span>
                              </span>
                              <strong className="text-[#0D3B66]">{money(alt.reference)}</strong>
                            </div>
                          ))}
                          {market?.note ? <p className="leading-5 text-[#617286]">{market.note}</p> : null}
                          {market?.primarySourceUrl ? (
                            <a
                              href={market.primarySourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-bold text-[#0D3B66]"
                            >
                              Market source <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {results.length > visible ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-full border border-[#DCE4EC] bg-white px-5 text-sm font-bold text-[#0D3B66] transition hover:border-[#0D3B66]"
          >
            Show more ({results.length - visible} remaining)
          </button>
        ) : null}

        {!results.length ? (
          <div className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
            <Search className="mx-auto h-7 w-7 text-[#8A99A9]" />
            <h3 className="mt-4 font-black text-[#071E33]">No matching item yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617286]">
              Try a broader search or another location.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
