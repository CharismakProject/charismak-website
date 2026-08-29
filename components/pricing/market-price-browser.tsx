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
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { loadPriceItems, PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";
import {
  loadSupplierOfferSummaries,
  type SupplierOfferSummary,
} from "@/lib/platform/supplier-offers";

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
  "floor-tile": "https://bulksuppliers.com.ng/products/1658247889.png",
  "ppr-pipe-25": "https://naijamart.com/storage/file_upload/downloads/66349cf2a888eIMG_20240329_085509-scaled.jpg",
  "longspan-roof-sheet": "https://www.nairaland.com/attachments/4045215_img20160207wa008copy_jpeg6f88ee38aab26d36e5d81c117c7470c3",
  "concrete-mixer": "https://www.camelwaygroup.com/dm-content/themes/camelwaygroup/page/images/small-concrete-mixer.webp",
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
  const [supplierSummaries, setSupplierSummaries] = useState<Record<string, SupplierOfferSummary>>({});
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
    void loadSupplierOfferSummaries().then(setSupplierSummaries);
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

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A82B05]">Market catalogue</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33] md:text-3xl">
              {results.length} current items
            </h2>
          </div>
          <p className="text-xs text-[#617286]">
            {liveCount} items refreshed from current Jiji observations
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const market = JIJI_MARKET_SNAPSHOT[item.id];
            const image = item.imageUrl || previewImages[item.id] || null;
            const displayName = market?.marketName || item.description;
            const displayLocation = market?.location || item.location;
            const supplierSummary = supplierSummaries[item.id];
            const detailHref = `/prices/${encodeURIComponent(item.id)}`;

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_26px_rgba(7,30,51,0.045)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(7,30,51,0.11)]"
              >
                <Link href={detailHref} className="relative block h-48 overflow-hidden bg-[#EEF2F6]" aria-label={`View suppliers and prices for ${displayName}`}>
                  {image ? (
                    <img
                      src={image}
                      alt={item.imageAlt || displayName}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#EEF3F8,#F8FAFC)] text-center">
                      <div>
                        <ImageIcon className="mx-auto h-8 w-8 text-[#9AA8B6]" />
                        <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">
                          Product photo pending
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071E33]/55 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#0D3B66] shadow-sm">
                    {item.category === "plant" ? "equipment" : item.category}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#071E33]/80 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    <MapPin className="h-3.5 w-3.5 text-[#F2B544]" />
                    {displayLocation}
                  </span>
                </Link>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A8B9E]">{item.code}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${market ? "bg-[#EAF7EF] text-[#197447]" : "bg-[#FFF1EA] text-[#8B1E00]"}`}>
                      {market ? "Market checked" : "Charismak reference"}
                    </span>
                  </div>

                  <Link href={detailHref} className="block">
                    <h3 className="mt-3 text-lg font-black leading-6 text-[#071E33] transition group-hover:text-[#0D3B66]">{displayName}</h3>
                    {(market?.specification || item.specification) && (
                      <p className="mt-2 text-xs leading-5 text-[#617286]">{market?.specification || item.specification}</p>
                    )}
                  </Link>

                  <div className="mt-4 rounded-2xl bg-[#F6F8FA] p-4">
                    {market ? (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
                          Market range / {market.unit}
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
                          Reference / {item.marketUnit || item.unit}
                        </span>
                        <strong className="mt-1 block text-xl text-[#071E33]">{money(item.rate, item.currency)}</strong>
                      </>
                    )}
                  </div>

                  {supplierSummary ? (
                    <Link href={detailHref} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#C9D8E7] bg-[#F7FBFF] px-3 py-3 transition hover:border-[#0D3B66]">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#0D3B66]"><Truck className="h-4 w-4" />{supplierSummary.count} supplier offer{supplierSummary.count === 1 ? "" : "s"}</span>
                      <strong className="text-right text-xs text-[#A82B05]">from {money(supplierSummary.lowestPrice)} / {supplierSummary.quotedUnit}</strong>
                    </Link>
                  ) : (
                    <Link href={detailHref} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#CBD6E1] px-3 py-3 text-xs font-semibold text-[#617286] transition hover:border-[#0D3B66] hover:text-[#0D3B66]">
                      <span>Supplier submissions</span><span>View item →</span>
                    </Link>
                  )}

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

                  {market?.note ? (
                    <p className="mt-4 text-[11px] leading-5 text-[#617286]">{market.note}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#7A8B9E]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Checked {new Date(market?.checkedAt || item.updatedAt).toLocaleDateString("en-NG")}
                    </span>
                    {market ? <span>{market.sourceCount} market sources</span> : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link
                      href={detailHref}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-3 text-xs font-black text-white transition hover:bg-[#071E33]"
                    >
                      Suppliers & prices <Truck className="h-4 w-4" />
                    </Link>
                    {market ? (
                      <a
                        href={market.primarySourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-3 text-xs font-black text-[#0D3B66] transition hover:border-[#C8A45D] hover:bg-[#FFF9ED]"
                      >
                        Market source <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href="/estimator"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-3 text-xs font-black text-[#A82B05] transition hover:border-[#C8A45D] hover:bg-[#FFF9ED]"
                      >
                        Estimator <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!results.length ? (
          <div className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
            <Search className="mx-auto h-7 w-7 text-[#8A99A9]" />
            <h3 className="mt-4 font-black text-[#071E33]">No matching item yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617286]">
              Try a broader search. The catalogue is being expanded into the full construction-material and equipment schedule.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
