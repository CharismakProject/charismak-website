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
  PriceMarketMode,
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

type MarketPresentation = {
  primary: string;
  options: string[];
  note: string;
  mode: PriceMarketMode;
  canUseTechnicalRate: boolean;
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
  "Y12 iron rod",
  "Blocks",
  "Sharp sand",
  "Granite",
  "Tiles",
  "Paint",
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

const readableTechnicalUnit = (unit: string) => {
  if (unit === "nr") return "piece";
  if (unit === "m") return "linear metre";
  if (unit === "m²") return "m²";
  if (unit === "m³") return "m³";
  return unit;
};

const practicalUnitDefaults: Record<string, Omit<MarketPresentation, "mode">> = {
  "cement-50kg": {
    primary: "50 kg bag",
    options: ["1 bag", "20 bags ≈ 1 tonne"],
    note: "Cement is bought and counted by sealed 50 kg bag; large orders are still usually discussed by number of bags.",
    canUseTechnicalRate: true,
  },
  "sharp-sand": {
    primary: "tipper / truckload",
    options: ["10 tonne tipper", "20 tonne tipper", "30 tonne tipper"],
    note: "Quote the actual truck capacity in tonnes. Do not rely on labels such as small tipper or big tipper alone.",
    canUseTechnicalRate: false,
  },
  "granite-aggregate": {
    primary: "tonne / tipper load",
    options: ["1 tonne", "10 tonne tipper", "20 tonne tipper", "30 tonne tipper"],
    note: "Granite is commonly discussed by tonne or delivered tipper load. Grade/size and delivered capacity must be stated.",
    canUseTechnicalRate: false,
  },
  water: {
    primary: "tanker load",
    options: ["1,000 L", "5,000 L tanker", "10,000 L tanker"],
    note: "For site buying, water is usually easier to compare by tanker capacity rather than a single litre rate.",
    canUseTechnicalRate: false,
  },
  "block-225": {
    primary: "piece",
    options: ["1 block", "100 blocks", "truckload"],
    note: "Compare block strength, mould size, delivery and breakage allowance. Bulk quotations are often discussed per 100 blocks or truckload.",
    canUseTechnicalRate: true,
  },
  "reinforcement-steel": {
    primary: "12 m length / tonne",
    options: ["12 m length", "bundle", "1 tonne"],
    note: "Always state diameter and brand/standard. Nigerian sellers commonly quote both individual 12 m lengths and tonne prices.",
    canUseTechnicalRate: false,
  },
  "binding-wire": {
    primary: "coil / roll",
    options: ["coil", "roll", "kg"],
    note: "Confirm coil/roll weight before comparing suppliers because package sizes vary.",
    canUseTechnicalRate: false,
  },
  "formwork-sheet": {
    primary: "sheet",
    options: ["1.22 × 2.44 m sheet"],
    note: "Plywood is bought by full sheet. Thickness, face quality and expected re-use should be stated.",
    canUseTechnicalRate: true,
  },
  "formwork-timber": {
    primary: "length / piece",
    options: ["full length", "piece", "bundle"],
    note: "State timber section size and actual length; site buying is normally by piece/length rather than by an abstract metre rate.",
    canUseTechnicalRate: false,
  },
  nails: {
    primary: "kg",
    options: ["1 kg", "carton / bulk pack"],
    note: "State nail type and size when comparing prices.",
    canUseTechnicalRate: true,
  },
  "emulsion-paint": {
    primary: "20 L bucket",
    options: ["4 L bucket", "20 L bucket"],
    note: "Paint should be compared by brand, grade and bucket size. Coverage can differ significantly even for the same volume.",
    canUseTechnicalRate: false,
  },
  "wall-filler": {
    primary: "bag / bucket",
    options: ["bag", "bucket"],
    note: "Package weight and brand should be stated before prices are compared.",
    canUseTechnicalRate: false,
  },
  "floor-tile": {
    primary: "carton",
    options: ["carton", "m² coverage per carton"],
    note: "Tiles are commonly sold per carton. Show tile size and the exact square-metre coverage of one carton.",
    canUseTechnicalRate: false,
  },
  "tile-adhesive": {
    primary: "20 kg bag",
    options: ["20 kg bag"],
    note: "Compare brand, grade and bag weight; coverage depends on tile size, substrate and application thickness.",
    canUseTechnicalRate: true,
  },
  "cable-2-5": {
    primary: "coil / roll",
    options: ["coil", "roll", "full drum for bulk orders"],
    note: "Cable should show conductor size, brand, type and actual coil/roll length.",
    canUseTechnicalRate: false,
  },
  "conduit-20": {
    primary: "length / bundle",
    options: ["length", "bundle"],
    note: "State conduit diameter, wall grade and number of lengths per bundle.",
    canUseTechnicalRate: false,
  },
  "socket-13a": {
    primary: "piece",
    options: ["piece", "carton for bulk order"],
    note: "Brand, range/series and finish should be shown because they strongly affect price.",
    canUseTechnicalRate: true,
  },
  "back-box": {
    primary: "piece",
    options: ["piece", "pack"],
    note: "State box type, depth and material.",
    canUseTechnicalRate: true,
  },
  "ppr-pipe-25": {
    primary: "length",
    options: ["full pipe length", "bundle"],
    note: "State diameter, pressure rating, brand and actual length per pipe.",
    canUseTechnicalRate: false,
  },
  "ppr-fitting-allowance": {
    primary: "piece / pack",
    options: ["piece", "pack"],
    note: "Fittings should be listed by actual fitting type and size rather than one generic allowance in the public marketplace.",
    canUseTechnicalRate: false,
  },
  "soil-pipe-110": {
    primary: "length",
    options: ["full pipe length", "bundle"],
    note: "State pipe class, brand, diameter and actual length.",
    canUseTechnicalRate: false,
  },
  "soil-fitting-allowance": {
    primary: "piece / pack",
    options: ["piece", "pack"],
    note: "Public listings should identify the fitting itself—bend, tee, socket, reducer, etc.—with diameter and brand.",
    canUseTechnicalRate: false,
  },
  "longspan-roof-sheet": {
    primary: "linear metre / cut sheet",
    options: ["linear metre", "cut sheet to required length"],
    note: "Roofing prices should state profile, gauge/thickness, colour and cut length. Avoid showing only an m² rate to buyers.",
    canUseTechnicalRate: false,
  },
  "roofing-accessories": {
    primary: "piece / pack",
    options: ["piece", "pack", "full job set"],
    note: "List flashings, screws, ridges and other accessories separately wherever possible.",
    canUseTechnicalRate: false,
  },
  "concrete-mixer": {
    primary: "hire/day or purchase",
    options: ["hire/day", "hire/week", "purchase unit"],
    note: "Equipment listings should separate rental from purchase and show capacity, condition, brand/model and delivery/mobilisation.",
    canUseTechnicalRate: false,
  },
};

const getMarketPresentation = (item: PriceItem): MarketPresentation => {
  const configured = practicalUnitDefaults[item.id];

  const defaultMode: PriceMarketMode =
    item.category === "plant"
      ? "buy-or-rent"
      : item.category === "labour" || item.category === "subcontract"
        ? "service"
        : "buy";

  if (item.marketUnit) {
    return {
      primary: item.marketUnit,
      options: item.marketUnitOptions?.length
        ? item.marketUnitOptions
        : [item.marketUnit],
      note:
        item.marketNote ||
        `Compare this item using ${item.marketUnit}, including specification, quantity and delivery conditions.`,
      mode: item.marketMode || defaultMode,
      canUseTechnicalRate: configured?.canUseTechnicalRate ?? false,
    };
  }

  if (item.id.startsWith("brc-")) {
    return {
      primary: "2.4 × 4.8 m sheet",
      options: ["full sheet"],
      note: "BRC mesh is bought by complete sheet. State mesh type and allow separately for laps in the estimator.",
      mode: "buy",
      canUseTechnicalRate: true,
    };
  }

  if (configured) {
    return {
      ...configured,
      mode: item.marketMode || defaultMode,
    };
  }

  if (item.category === "plant") {
    return {
      primary: "hire/day or purchase",
      options: ["hire/day", "hire/week", "purchase unit"],
      note: "Show equipment capacity, condition, brand/model, location and mobilisation separately.",
      mode: item.marketMode || "buy-or-rent",
      canUseTechnicalRate: false,
    };
  }

  return {
    primary: readableTechnicalUnit(item.unit),
    options: [readableTechnicalUnit(item.unit)],
    note: `Confirm specification, quantity, location and delivery conditions before comparing prices.`,
    mode: item.marketMode || defaultMode,
    canUseTechnicalRate: true,
  };
};

const buyingModeLabel: Record<PriceMarketMode, string> = {
  buy: "Buy",
  rent: "Rent",
  "buy-or-rent": "Buy / Rent",
  service: "Service rate",
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

const itemSearchText = (item: PriceItem) => {
  const market = getMarketPresentation(item);

  return [
    item.code,
    item.description,
    item.unit,
    item.brand,
    item.specification,
    item.location,
    market.primary,
    ...market.options,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

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
              Real construction prices in the units people actually buy.
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
              Search materials and equipment by location using familiar Nigerian site units—tipper, tonne, bag, 12 m length, carton, bucket, sheet, piece and hire/day. Technical QS units stay available for estimator conversion, not as the main shopping language.
            </p>

            <div className="mt-7 grid overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl sm:grid-cols-[1fr_210px_auto]">
              <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#617286]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search: 30t granite, Y12 length, 60x60 tiles..."
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
              ["Tipper", "sand & aggregate"],
              ["Tonne", "steel & bulk material"],
              ["Carton", "tiles & finishes"],
              ["Hire/day", "site equipment"],
            ].map(([value, label]) => (
              <div
                key={label}
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
            <strong>Buying unit first, QS conversion second.</strong> We will not relabel a technical ₦/m³ or ₦/kg starter rate as a tipper, tonne or carton price. Market prices will be shown only after Nigerian source observations are normalised into the actual buying unit.
          </span>
        </p>
        <Link
          href="/estimator"
          className="mt-3 inline-flex shrink-0 items-center gap-2 font-black text-[#8B1E00] md:mt-0"
        >
          Open estimator <ArrowRight className="h-4 w-4" />
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
            const market = getMarketPresentation(item);
            const hasRange =
              typeof item.priceLow === "number" &&
              typeof item.priceHigh === "number";
            const canShowSingleMarketRate =
              !hasRange && market.canUseTechnicalRate && item.rate !== null;

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white shadow-[0_8px_26px_rgba(7,30,51,0.045)] transition hover:-translate-y-1 hover:border-[#C7D1DC] hover:shadow-[0_22px_50px_rgba(7,30,51,0.11)]"
              >
                <div className="relative h-48 overflow-hidden bg-[#EEF2F6]">
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
                    <span className="rounded-full bg-[#071E33]/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                      {buyingModeLabel[market.mode]}
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
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black ${confidence.className}`}
                    >
                      {confidence.label}
                    </span>
                  </div>

                  <h3 className="mt-3 min-h-12 text-lg font-black leading-6 text-[#071E33]">
                    {item.description}
                  </h3>

                  {(item.brand || item.specification) && (
                    <p className="mt-2 text-xs leading-5 text-[#617286]">
                      {[item.brand, item.specification].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  <div className="mt-4 rounded-2xl bg-[#F5F7FA] p-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
                      How people buy it
                    </span>
                    <strong className="mt-1 block text-base text-[#071E33]">
                      {market.primary}
                    </strong>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {market.options.map((option) => (
                        <span
                          key={option}
                          className="rounded-full border border-[#DCE4EC] bg-white px-2.5 py-1 text-[10px] font-bold text-[#526579]"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 border-y border-[#E7ECF1] py-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#617286]">
                      {hasRange
                        ? `Market range / ${market.primary}`
                        : canShowSingleMarketRate
                          ? `Reference / ${market.primary}`
                          : "Market price"}
                    </span>

                    {hasRange ? (
                      <strong className="mt-1 block text-xl text-[#071E33]">
                        {money(item.priceLow ?? null, item.currency)} – {money(item.priceHigh ?? null, item.currency)}
                      </strong>
                    ) : canShowSingleMarketRate ? (
                      <strong className="mt-1 block text-2xl text-[#071E33]">
                        {money(item.rate, item.currency)}
                      </strong>
                    ) : (
                      <strong className="mt-1 block text-lg text-[#A82B05]">
                        Being verified in {market.primary}
                      </strong>
                    )}

                    {!market.canUseTechnicalRate && item.rate !== null && (
                      <span className="mt-2 block text-[11px] leading-5 text-[#7A8B9E]">
                        Estimator conversion reference only: {money(item.rate, item.currency)} / {readableTechnicalUnit(item.unit)}
                      </span>
                    )}

                    {item.sourceCount ? (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#617286]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Based on {item.sourceCount} market sources
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-start gap-2.5">
                    <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#A82B05]" />
                    <p className="text-[11px] leading-5 text-[#526579]">
                      {market.note}
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
              Try a broader search. The catalogue will grow to cover the full range of Nigerian construction materials, tools and equipment in familiar buying units.
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
            Compare the same real buying unit across suppliers.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            A 30-tonne tipper should be compared with another 30-tonne tipper—not with an unspecified truck. A tile carton should include its coverage. A steel quote should state diameter, length and whether it is per piece or tonne.
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
