"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CalendarDays,
  ExternalLink,
  HardHat,
  MapPin,
  Search,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import type { PriceCategory, PriceItem } from "@/lib/pricing/models";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { loadPriceItems, PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";

type CategoryFilter = "all" | PriceCategory;

const categories: Array<{
  id: CategoryFilter;
  label: string;
  icon: typeof Boxes;
}> = [
  { id: "all", label: "All", icon: Boxes },
  { id: "material", label: "Materials", icon: Building2 },
  { id: "plant", label: "Equipment", icon: Wrench },
  { id: "labour", label: "Labour", icon: HardHat },
  { id: "subcontract", label: "Specialists", icon: Store },
];

const previewImages: Record<string, string> = {
  "cement-50kg": "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-10.jpg",
  "sharp-sand": "https://www.nairaland.com/attachments/2868570_sharp6_jpeg50ab46832ede475b4a2bf7c0ab5e7fdf",
  "granite-aggregate": "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-12.jpg",
  "block-225": "https://www.nairaland.com/attachments/5334494_screenshot201705172116321_jpeg0ec93fe55e4fd00777ff56622a797b8e",
  "reinforcement-steel": "https://s.alicdn.com/@sc04/kf/H07f75f4e5aee4ea18a89c35c67b2f532G/Steel-Rebar-Hpb300-Steel-Rebar-Co-Nigeria-Steel-Rebar-Top-Steel-Rebar-Reinforced-Steel-Rebar-Steel-Rebar-G40-18mm-Steel-Rebar.jpg",
  "formwork-sheet": "https://www.qdplywood.com/wp-pages/commercial-plywood/structural-plywood/images/commercial-construction-formwork-structural-plywood.webp",
  "ppr-pipe-25": "https://naijamart.com/storage/file_upload/downloads/66349cf2a888eIMG_20240329_085509-scaled.jpg",
  "longspan-roof-sheet": "https://www.nairaland.com/attachments/4045215_img20160207wa008copy_jpeg6f88ee38aab26d36e5d81c117c7470c3",
  "concrete-mixer": "https://www.camelwaygroup.com/dm-content/themes/camelwaygroup/page/images/small-concrete-mixer.webp",
};

const fallbackImage: Record<PriceCategory, string> = {
  material: "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-10.jpg",
  plant: "https://www.gz-supplies.com/product_images/uploaded_images/gz-industrial-supplies-powertools-shelf.jpg",
  labour: "/Images/Projects/coco/hero.jpg",
  subcontract: "/Images/Projects/Jahi/hero.jpg",
};

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

export default function MarketPriceBrowser() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");

  useEffect(() => {
    const refresh = () =>
      setItems(
        loadPriceItems().filter(
          (item) => item.countryCode === "NG" && item.active,
        ),
      );
    refresh();
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
  }, []);

  const locations = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      values.add(JIJI_MARKET_SNAPSHOT[item.id]?.location || item.location);
    });
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] px-5 py-9 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] md:px-9 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.22),transparent_28rem)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
            <BadgeCheck className="h-4 w-4" />
            Current Nigeria construction market
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Real market prices in units people actually buy.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Bags, pieces, 12 m lengths, tonnes, tippers, cartons, sheets, pipe lengths and equipment purchase prices — with the technical QS unit kept only as a secondary reference.
          </p>

          <div className="mt-7 grid overflow-hidden rounded-2xl bg-white sm:grid-cols-[1fr_220px]">
            <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cement, Y12, granite, mixer, PPR..."
                className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm text-[#071E33] outline-none"
              />
            </label>
            <label className="relative">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
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
            {["Cement", "Y12", "9-inch block", "Sharp sand", "Granite", "60x60 tiles", "PPR", "Concrete mixer"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuery(value)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#C8A45D] hover:text-[#F2B544]"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left font-bold transition ${
              category === id
                ? "border-[#0D3B66] bg-[#0D3B66] text-white"
                : "border-[#DCE4EC] bg-white text-[#071E33] hover:border-[#C8A45D]"
            }`}
          >
            <Icon className={`h-5 w-5 ${category === id ? "text-[#F2B544]" : "text-[#A82B05]"}`} />
            {label}
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#74520D]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
          <p>
            <strong>Current market observations, not guaranteed quotations.</strong> Jiji prices can be negotiable, duplicated or badly entered. Charismak excludes obvious outliers, keeps the source and date, and shows a practical range. Always reconfirm before purchase.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A82B05]">Market catalogue</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33] md:text-3xl">
              {results.length} current items
            </h2>
          </div>
          <p className="text-xs text-[#617286]">
            {liveCount} items already refreshed from current Jiji observations
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const market = JIJI_MARKET_SNAPSHOT[item.id];
            const image = item.imageUrl || previewImages[item.id] || fallbackImage[item.category];
            const displayName = market?.marketName || item.description;
            const displayLocation = market?.location || item.location;

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_26px_rgba(7,30,51,0.045)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(7,30,51,0.11)]"
              >
                <div className="relative h-48 overflow-hidden bg-[#EEF2F6]">
                  <img
                    src={image}
                    alt={item.imageAlt || displayName}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071E33]/55 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#0D3B66] shadow-sm">
                    {item.category === "plant" ? "equipment" : item.category}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#071E33]/80 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    <MapPin className="h-3.5 w-3.5 text-[#F2B544]" />
                    {displayLocation}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A8B9E]">{item.code}</span>
                    {market ? (
                      <span className="rounded-full bg-[#EAF7EF] px-2.5 py-1 text-[9px] font-black text-[#197447]">
                        Jiji checked
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#FFF1EA] px-2.5 py-1 text-[9px] font-black text-[#8B1E00]">
                        Charismak reference
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-black leading-6 text-[#071E33]">{displayName}</h3>
                  {(market?.specification || item.specification) && (
                    <p className="mt-2 text-xs leading-5 text-[#617286]">{market?.specification || item.specification}</p>
                  )}

                  <div className="mt-4 rounded-2xl bg-[#F6F8FA] p-4">
                    {market ? (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
                          Current market range / {market.unit}
                        </span>
                        <strong className="mt-1 block text-xl text-[#071E33]">
                          {money(market.priceLow)} – {money(market.priceHigh)}
                        </strong>
                        <span className="mt-2 block text-sm font-black text-[#A82B05]">
                          Typical reference: {money(market.reference)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
                          Existing reference / {item.marketUnit || item.unit}
                        </span>
                        <strong className="mt-1 block text-xl text-[#071E33]">{money(item.rate, item.currency)}</strong>
                      </>
                    )}
                  </div>

                  {market?.alternatives?.length ? (
                    <div className="mt-3 grid gap-2">
                      {market.alternatives.map((alt) => (
                        <div key={`${alt.label}-${alt.unit}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#E4EAF0] px-3 py-2.5 text-xs">
                          <div>
                            <strong className="block text-[#071E33]">{alt.label}</strong>
                            <span className="text-[#758396]">{alt.unit}</span>
                          </div>
                          <strong className="text-right text-[#0D3B66]">{money(alt.reference)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {market ? (
                    <p className="mt-4 text-[11px] leading-5 text-[#526579]">{market.note}</p>
                  ) : item.marketNote ? (
                    <p className="mt-4 text-[11px] leading-5 text-[#526579]">{item.marketNote}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-[#7A8B9E]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {market ? new Date(market.checkedAt).toLocaleDateString("en-NG") : new Date(item.updatedAt).toLocaleDateString("en-NG")}
                    </span>
                    {market && <span>{market.sourceCount} source observations</span>}
                  </div>

                  {market && (
                    <div className="mt-4 rounded-xl border border-[#DDE5EC] bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#8794A3]">QS conversion</span>
                          <span className="mt-1 block text-xs font-bold text-[#526579]">Estimator unit: {item.unit}</span>
                        </div>
                        <a
                          href={market.primarySourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[#A82B05]"
                        >
                          Jiji source <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <Link
                      href={`/marketplace?search=${encodeURIComponent(displayName)}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-4 text-xs font-black text-white transition hover:bg-[#071E33]"
                    >
                      Compare suppliers <Truck className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/estimator"
                      className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#DCE4EC] text-[#A82B05] transition hover:border-[#C8A45D]"
                      aria-label={`Use ${displayName} in estimator`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] bg-[#071E33] p-6 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F2B544]">Next data layer</p>
          <h2 className="mt-2 text-2xl font-black">More Nigerian sources, same unit discipline.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            Jiji is the first market feed. Build9ja, BuildersMap, supplier quotations and Charismak-verified observations can be added to the same item without replacing its price history.
          </p>
        </div>
        <Link href="/marketplace" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C8A45D] px-6 text-sm font-black text-[#071E33] md:mt-0">
          Open marketplace <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
