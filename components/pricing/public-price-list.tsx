"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CalendarDays,
  CircleDollarSign,
  HardHat,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import type {
  PriceCategory,
  PriceConfidence,
  PriceItem,
} from "@/lib/pricing/models";
import {
  loadPriceItems,
  PRICE_LIBRARY_UPDATED_EVENT,
} from "@/lib/pricing/store";

type CategoryFilter = "all" | PriceCategory;

type CategoryDefinition = {
  id: CategoryFilter;
  label: string;
  description: string;
  icon: LucideIcon;
};

const categories: CategoryDefinition[] = [
  {
    id: "all",
    label: "All prices",
    description: "Everything for construction",
    icon: Boxes,
  },
  {
    id: "material",
    label: "Materials",
    description: "Structure, finishes, MEP & more",
    icon: Building2,
  },
  {
    id: "plant",
    label: "Equipment",
    description: "Tools, plant & heavy machinery",
    icon: Wrench,
  },
  {
    id: "labour",
    label: "Labour",
    description: "Trade and installation rates",
    icon: HardHat,
  },
  {
    id: "subcontract",
    label: "Specialists",
    description: "Specialist work packages",
    icon: Store,
  },
];

const popularSearches = [
  "Cement",
  "Iron rods",
  "Blocks",
  "Sand",
  "Granite",
  "Tiles",
  "Plumbing",
  "Equipment",
];

const confidenceMeta: Record<
  PriceConfidence,
  { label: string; className: string }
> = {
  starter: {
    label: "Starter reference",
    className: "bg-[#FFF1EA] text-[#8B1E00]",
  },
  manual: {
    label: "Charismak checked",
    className: "bg-[#EEF3F8] text-[#0D3B66]",
  },
  "index-adjusted": {
    label: "Index adjusted",
    className: "bg-[#FFF8DD] text-[#7C5C08]",
  },
  verified: {
    label: "Verified",
    className: "bg-[#EAF7EF] text-[#197447]",
  },
};

const previewImages: Record<string, { src: string; alt: string }> = {
  "cement-50kg": {
    src: "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-10.jpg",
    alt: "Cement bags stacked at a Nigerian building-material supply yard",
  },
  "sharp-sand": {
    src: "https://www.nairaland.com/attachments/2868570_sharp6_jpeg50ab46832ede475b4a2bf7c0ab5e7fdf",
    alt: "Sharp sand stockpile",
  },
  "granite-aggregate": {
    src: "https://titaniumbuildingsolutions.com/wp-content/uploads/2024/11/Titanium-BS-12.jpg",
    alt: "Granite aggregate stockpile at a construction-material yard",
  },
  "block-225": {
    src: "https://www.nairaland.com/attachments/5334494_screenshot201705172116321_jpeg0ec93fe55e4fd00777ff56622a797b8e",
    alt: "Sandcrete blocks at a production yard",
  },
  "reinforcement-steel": {
    src: "https://s.alicdn.com/@sc04/kf/H07f75f4e5aee4ea18a89c35c67b2f532G/Steel-Rebar-Hpb300-Steel-Rebar-Co-Nigeria-Steel-Rebar-Top-Steel-Rebar-Reinforced-Steel-Rebar-Steel-Rebar-G40-18mm-Steel-Rebar.jpg",
    alt: "Bundles of reinforcement steel bars",
  },
  "formwork-sheet": {
    src: "https://www.qdplywood.com/wp-pages/commercial-plywood/structural-plywood/images/commercial-construction-formwork-structural-plywood.webp",
    alt: "Structural plywood used for concrete formwork",
  },
  "ppr-pipe-25": {
    src: "https://naijamart.com/storage/file_upload/downloads/66349cf2a888eIMG_20240329_085509-scaled.jpg",
    alt: "Green PPR plumbing pipes",
  },
  "longspan-roof-sheet": {
    src: "https://www.nairaland.com/attachments/4045215_img20160207wa008copy_jpeg6f88ee38aab26d36e5d81c117c7470c3",
    alt: "Longspan aluminium roofing sheet",
  },
  "concrete-mixer": {
    src: "https://www.camelwaygroup.com/dm-content/themes/camelwaygroup/page/images/small-concrete-mixer.webp",
    alt: "Mobile concrete mixer for construction work",
  },
};

const fallbackImages: Record<PriceCategory, { src: string; alt: string }> = {
  material: {
    src: "https://mindtrip.ai/cdn-cgi/image/format%3Dwebp%2Cw%3D1200/https%3A/iorigin.mindtrip.ai/locations/963e/a41f/5f20/087d/2430/0703/73bb/d717",
    alt: "Building materials displayed at a Nigerian supply store",
  },
  plant: {
    src: "https://www.gz-supplies.com/product_images/uploaded_images/gz-industrial-supplies-powertools-shelf.jpg",
    alt: "Construction tools and equipment in a Nigerian industrial supply store",
  },
  labour: {
    src: "/Images/Projects/coco/hero.jpg",
    alt: "Construction work on a Charismak project",
  },
  subcontract: {
    src: "/Images/Projects/Jahi/hero.jpg",
    alt: "Specialist construction work on a Charismak project",
  },
};

const money = (value: number | null, currency: string) =>
  value === null
    ? "Price required"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);

const buyingGuide = (item: PriceItem) => {
  if (item.id === "sharp-sand")
    return "1 m³ ≈ 1.6 tonnes. Compare truck quotes using the supplier's stated capacity, not only the truck name.";
  if (item.id === "granite-aggregate")
    return "1 m³ ≈ 1.5 tonnes. Compare 10, 20 or 30-tonne truck quotes using actual delivered capacity.";
  if (item.id === "cement-50kg")
    return "20 bags ≈ 1 tonne. Compare sealed 50 kg bag prices and confirm whether delivery is included.";
  if (item.id === "reinforcement-steel")
    return "Usually purchased by tonne or 12 m length. A Y12 bar is approximately 10.66 kg per 12 m length.";
  if (item.id.startsWith("brc-"))
    return "Purchased by full 2.4 × 4.8 m sheet. Allow for laps and round procurement quantities to complete sheets.";
  if (item.id === "block-225")
    return "Purchased by piece. Compare quotations per 100 blocks and confirm delivery and breakage allowance.";
  if (item.unit === "m²")
    return "Measured per square metre; supplier packaging or labour-gang output can be compared separately.";
  return `Priced per ${item.unit}. Confirm brand, specification, quantity, delivery and minimum order before buying.`;
};

const getImage = (item: PriceItem) => {
  if (item.imageUrl) {
    return {
      src: item.imageUrl,
      alt: item.imageAlt || item.description,
    };
  }

  return previewImages[item.id] || fallbackImages[item.category];
};

const itemSearchText = (item: PriceItem) =>
  [
    item.code,
    item.description,
    item.unit,
    item.brand,
    item.specification,
    item.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function PublicPriceList() {
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

  const locations = useMemo(
    () => ["all", ...new Set(items.map((item) => item.location).filter(Boolean))],
    [items],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: items.length,
      material: 0,
      plant: 0,
      labour: 0,
      subcontract: 0,
    };

    items.forEach((item) => {
      counts[item.category] += 1;
    });

    return counts;
  }, [items]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (location === "all" || item.location === location) &&
        (!normalizedQuery || itemSearchText(item).includes(normalizedQuery)),
    );
  }, [items, category, location, query]);

  const usePopularSearch = (value: string) => {
    setQuery(value);
    setCategory("all");
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] text-white shadow-[0_26px_80px_rgba(7,30,51,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.2),transparent_28rem)]" />
        <div className="relative grid gap-8 px-5 py-9 md:px-9 md:py-12 lg:grid-cols-[1fr_0.42fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F2B544] backdrop-blur">
              <CircleDollarSign className="h-4 w-4" />
              Nigeria construction market
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.06] tracking-tight md:text-6xl">
              Find construction prices before you buy.
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
              Search materials, tools, equipment and specialist construction work by location. See practical buying units, price references and supplier comparisons in one place.
            </p>

            <div className="mt-7 grid overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl sm:grid-cols-[1fr_210px_auto]">
              <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#617286]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What are you looking for? Cement, Y12, mixer..."
                  className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm text-[#071E33] outline-none placeholder:text-[#8391A1]"
                />
              </label>

              <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#617286]" />
                <select
                  aria-label="Price location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="min-h-14 w-full appearance-none border-0 bg-white pl-12 pr-8 text-sm font-semibold text-[#071E33] outline-none"
                >
                  <option value="all">All locations</option>
                  {locations.slice(1).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="min-h-14 bg-[#A82B05] px-7 text-sm font-black text-white transition hover:bg-[#8B1E00]"
              >
                Search prices
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="mr-1 text-white/55">Popular:</span>
              {popularSearches.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => usePopularSearch(value)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-white/85 transition hover:border-[#C8A45D] hover:text-[#F2B544]"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {[
              ["Nigeria", "market focus"],
              [items.length || "—", "current references"],
              ["₦", "local pricing"],
              ["24/7", "search access"],
            ].map(([value, label]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur"
              >
                <strong className="block text-xl text-white">{value}</strong>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.13em] text-white/48">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A82B05]">
              Browse categories
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33] md:text-3xl">
              Everything needed on site
            </h2>
          </div>

          <Link
            href="/marketplace"
            className="hidden items-center gap-2 text-sm font-bold text-[#0D3B66] sm:inline-flex"
          >
            Find suppliers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map(({ id, label, description, icon: Icon }) => {
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-[#0D3B66] bg-[#0D3B66] text-white shadow-[0_16px_36px_rgba(7,30,51,0.16)]"
                    : "border-[#DCE4EC] bg-white text-[#071E33] hover:-translate-y-0.5 hover:border-[#C8A45D] hover:shadow-[0_14px_30px_rgba(7,30,51,0.08)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      active
                        ? "bg-white/10 text-[#F2B544]"
                        : "bg-[#F5F7FA] text-[#A82B05]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      active
                        ? "bg-white/10 text-white/80"
                        : "bg-[#F5F7FA] text-[#617286]"
                    }`}
                  >
                    {categoryCounts[id]}
                  </span>
                </div>
                <strong className="mt-4 block text-sm">{label}</strong>
                <span
                  className={`mt-1 block text-[11px] leading-5 ${
                    active ? "text-white/60" : "text-[#6C7C8F]"
                  }`}
                >
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4 text-xs leading-6 text-[#74520D] md:flex md:items-center md:justify-between md:gap-6">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
          <span>
            <strong>Market guidance, not a supplier quotation.</strong> Prices vary by city, brand, condition, order size and delivery distance. The next data phase will combine multiple Nigerian market sources and verified supplier quotes before a price is marked verified.
          </span>
        </p>
        <Link
          href="/estimator"
          className="mt-3 inline-flex shrink-0 items-center gap-2 font-black text-[#8B1E00] md:mt-0"
        >
          Use in estimator <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A82B05]">
              Current market references
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33] md:text-3xl">
              {results.length} {results.length === 1 ? "result" : "results"}
            </h2>
          </div>

          {(query || category !== "all" || location !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setLocation("all");
              }}
              className="self-start rounded-xl border border-[#DCE4EC] bg-white px-4 py-2 text-xs font-bold text-[#526579] transition hover:border-[#0D3B66] hover:text-[#0D3B66] sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const image = getImage(item);
            const confidence = confidenceMeta[item.confidence || "starter"];
            const hasRange =
              typeof item.priceLow === "number" &&
              typeof item.priceHigh === "number";

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_26px_rgba(7,30,51,0.045)] transition hover:-translate-y-1 hover:border-[#C7D1DC] hover:shadow-[0_22px_50px_rgba(7,30,51,0.11)]"
              >
                <div className="relative h-48 overflow-hidden bg-[#EEF2F6]">
                  {/* External images are temporary catalogue references for the preview.
                      Production catalogue imagery will come from approved supplier/catalogue records. */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071E33]/45 to-transparent" />

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#0D3B66] shadow-sm">
                      {item.category === "plant" ? "equipment" : item.category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black ${confidence.className}`}
                    >
                      {confidence.label}
                    </span>
                  </div>

                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#071E33]/80 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    <MapPin className="h-3.5 w-3.5 text-[#F2B544]" />
                    {item.location}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A8B9E]">
                      {item.code}
                    </span>
                    {item.sourceCount ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#617286]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {item.sourceCount} sources
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 min-h-12 text-lg font-black leading-6 text-[#071E33]">
                    {item.description}
                  </h3>

                  {(item.brand || item.specification) && (
                    <p className="mt-2 text-xs leading-5 text-[#617286]">
                      {[item.brand, item.specification].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  <div className="mt-4 border-y border-[#E7ECF1] py-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#617286]">
                      {hasRange ? "Typical market range" : `Reference per ${item.unit}`}
                    </span>
                    {hasRange ? (
                      <strong className="mt-1 block text-xl text-[#071E33]">
                        {money(item.priceLow ?? null, item.currency)} – {money(item.priceHigh ?? null, item.currency)}
                      </strong>
                    ) : (
                      <strong
                        className={`mt-1 block text-2xl ${
                          item.rate === null ? "text-[#B45B09]" : "text-[#071E33]"
                        }`}
                      >
                        {money(item.rate, item.currency)}
                      </strong>
                    )}

                    {hasRange && item.rate !== null && (
                      <span className="mt-1 block text-xs font-semibold text-[#A82B05]">
                        Charismak reference: {money(item.rate, item.currency)} / {item.unit}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-start gap-2.5">
                    <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#A82B05]" />
                    <p className="text-[11px] leading-5 text-[#526579]">
                      {buyingGuide(item)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#7A8B9E]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Checked {new Date(item.updatedAt).toLocaleDateString("en-NG")}
                    {item.deliveryIncluded === true ? " · Delivery included" : ""}
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <Link
                      href={`/marketplace?search=${encodeURIComponent(item.description)}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-4 text-xs font-black text-white transition hover:bg-[#071E33]"
                    >
                      Compare suppliers <Truck className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/estimator"
                      aria-label={`Use ${item.description} in estimator`}
                      className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[#DCE4EC] text-[#A82B05] transition hover:border-[#C8A45D] hover:bg-[#FFF9ED]"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!results.length ? (
          <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
            <Search className="mx-auto h-7 w-7 text-[#8A99A9]" />
            <h3 className="mt-4 font-black text-[#071E33]">No matching price yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617286]">
              Try a broader search. As the catalogue expands, this page will cover the full range of Nigerian construction materials, tools and equipment.
            </p>
          </section>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-[2rem] bg-[#071E33] p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <div className="flex items-center gap-2 text-[#F2B544]">
            <BadgeCheck className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.16em]">
              Supplier connection
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            Found the item? Compare who can supply it.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            The marketplace will connect each catalogue item to approved suppliers, current offers, delivery coverage and direct quote requests.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C8A45D] px-6 text-sm font-black text-[#071E33] transition hover:bg-[#F2B544]"
        >
          Open marketplace <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
