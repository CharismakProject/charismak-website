"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Download,
  Factory,
  Gauge,
  Hammer,
  Layers3,
  Sofa,
  Sparkles,
  Wrench,
} from "lucide-react";
import { calculateEstimateV2, type EstimateCategory, type EstimateInput, type SpecLevel } from "@/lib/projects/public-estimate-engine-v2";
import { createInitialEstimateInput, saveQuickEstimateTransfer } from "@/lib/projects/public-estimate-defaults";
import { validateEstimateInput } from "@/lib/projects/public-estimate-decisions";
import { downloadEstimateBoqPdf } from "@/lib/projects/estimate-pdf";
import type { BuildingUse } from "@/lib/projects/guided-estimate";
import LocationPicker from "@/components/rates/location-picker";
import AnimatedNaira from "@/components/ui/animated-naira";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const money = (value: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(value);

const categories: Array<{ id: EstimateCategory; label: string; short: string; icon: typeof Building2 }> = [
  { id: "new-building", label: "New building", short: "Homes, flats, offices", icon: Building2 },
  { id: "renovation", label: "Renovation", short: "Upgrade or remodel", icon: Hammer },
  { id: "structural-steel", label: "Steel", short: "Frames & fabrication", icon: Factory },
  { id: "finishes", label: "Finishes", short: "Floors, walls, ceilings", icon: Sparkles },
  { id: "furniture", label: "Furniture", short: "Joinery & FF&E", icon: Sofa },
  { id: "external-works", label: "External works", short: "Fence, paving, drainage", icon: Layers3 },
  { id: "mep-services", label: "MEP", short: "Electrical, plumbing, HVAC", icon: Wrench },
];

const finishLevels: Array<[SpecLevel, string]> = [
  ["economy", "Economy — functional / cost-conscious"],
  ["standard", "Standard — good mid-market"],
  ["upper-mid", "Upper-mid — better finishes / brands"],
  ["premium", "Premium — high specification"],
  ["luxury", "Luxury — top-end specification"],
];

const buildingUses: Array<[BuildingUse, string]> = [
  ["residential", "Private house / residential"],
  ["apartments", "Block of flats / apartments"],
  ["commercial", "Office / commercial"],
  ["hotel", "Hotel / serviced apartment"],
  ["school", "School / education"],
  ["healthcare", "Clinic / hospital"],
  ["warehouse", "Warehouse"],
  ["industrial", "Industrial / workshop"],
  ["religious", "Church / mosque / worship"],
  ["mixed-use", "Mixed-use"],
];

const roofOptions: Array<[EstimateInput["roofType"], string]> = [
  ["pitched-aluminium", "Pitched long-span aluminium"],
  ["stone-coated", "Stone-coated / premium pitched roof"],
  ["flat-concrete", "Flat reinforced-concrete roof"],
  ["steel-roof", "Structural steel roof system"],
  ["combination", "Combination roof"],
];

export default function QuickEstimateHome() {
  const router = useRouter();
  const [location, setLocation] = useRateLocation();
  const [input, setInput] = useState<EstimateInput>(() => createInitialEstimateInput());
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Show the phone price bar only while the estimator section is on screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The estimator prices for the state chosen here or on the Rate Bank.
  const priced = useMemo(() => ({ ...input, location: location.name }), [input, location.name]);
  const result = useMemo(() => calculateEstimateV2(priced), [priced]);
  const issues = useMemo(() => validateEstimateInput(priced), [priced]);
  const ready = issues.length === 0;

  const update = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const updateNumber = (key: keyof EstimateInput, value: string) => {
    update(key, Math.max(0, Number(value) || 0) as never);
  };

  const selectCategory = (category: EstimateCategory) => {
    setInput((current) => {
      const fresh = createInitialEstimateInput();
      fresh.category = category;
      fresh.finishLevel = current.finishLevel;
      return fresh;
    });
  };

  const continueDetailed = () => {
    saveQuickEstimateTransfer(priced);
    router.push("/estimator/detailed");
  };

  const sections = [...result.sections].sort((x, y) => y.high - x.high);
  const maxSection = Math.max(1, ...sections.map((item) => item.high));
  const perUnit = result.basisQuantity > 0 ? result.midpoint / result.basisQuantity : 0;

  return (
    <section ref={sectionRef} id="quick-estimate" data-theme="dark" className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(242,181,68,0.14),transparent_34rem),radial-gradient(circle_at_0%_60%,rgba(56,189,168,0.10),transparent_30rem),linear-gradient(180deg,#071E33,#04121F)] px-5 py-16 md:px-8 md:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#F2B544]/30 bg-[#F2B544]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]"><Gauge className="h-3.5 w-3.5" /> Live cost meter</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-white md:text-5xl">Watch your budget build as you answer.</h2>
          <p className="mt-4 text-base leading-8 text-white/65">Every choice re-prices instantly — state, size, rooms, finish level, extras. No button to press. When you are happy, download the BOQ or carry everything into the detailed estimate.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur md:p-6">
            <div>
              <StepLabel n={1} text="What are you building?" />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = input.category === item.id;
                  return (
                    <button key={item.id} type="button" aria-pressed={active} onClick={() => selectCategory(item.id)} className={`rounded-2xl border p-3 text-left transition ${active ? "border-[#F2B544] bg-[#F2B544]/15 text-white shadow-[0_0_0_1px_rgba(242,181,68,0.4)]" : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/30"}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-[#F2B544]" : "text-white/55"}`} />
                      <strong className="mt-2 block text-xs">{item.label}</strong>
                      <span className="mt-0.5 block text-[10px] leading-4 text-white/45">{item.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <StepLabel n={2} text="Where?" />
                <div className="mt-3"><LocationPicker location={location} onChange={setLocation} showMap={false} /></div>
              </div>
              <div>
                <StepLabel n={3} text="Finish level" />
                <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Finish level">
                  {finishLevels.map(([id, text]) => {
                    const active = input.finishLevel === id;
                    return (
                      <button key={id} type="button" role="radio" aria-checked={active} onClick={() => update("finishLevel", id)} title={text} className={`min-h-12 rounded-xl border px-1 text-[11px] font-bold capitalize transition ${active ? "border-[#F2B544] bg-[#F2B544] text-[#071E33]" : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/35"}`}>
                        {id.replace("-", " ")}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-white/45">{finishLevels.find(([id]) => id === input.finishLevel)?.[1]}</p>
              </div>
            </div>

            <div>
              <StepLabel n={4} text="The details that drive cost" />
              <div className="mt-3"><QuickCategoryFields input={input} update={update} updateNumber={updateNumber} /></div>
            </div>
          </div>

          <aside id="live-meter" className="scroll-mt-24 lg:sticky lg:top-24" aria-live="polite">
            <div className="overflow-hidden rounded-[1.75rem] border border-[#F2B544]/25 bg-[linear-gradient(160deg,rgba(242,181,68,0.10),rgba(4,18,31,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="p-5 md:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F2B544]">Planning range · {location.name}</p>
                {ready ? (
                  <>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2 text-white">
                      <AnimatedNaira value={result.low} compact className="text-4xl font-black tracking-[-0.03em]" />
                      <span className="text-2xl text-white/40">–</span>
                      <AnimatedNaira value={result.high} compact className="text-4xl font-black tracking-[-0.03em]" />
                    </div>
                    <p className="mt-2 text-xs text-white/60">
                      Likely figure <strong className="text-white"><AnimatedNaira value={result.midpoint} /></strong>
                      {perUnit ? <> · about <strong className="text-white"><AnimatedNaira value={perUnit} /></strong> per {result.basisUnit}</> : null}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">{Math.round(result.basisQuantity).toLocaleString()} {result.basisUnit} · {result.basisLabel.toLowerCase()}{location.status === "provisional" ? " · provisional regional adjustment" : ""}</p>
                  </>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm font-bold text-white">Almost there — the meter starts when you add:</p>
                    <ul className="mt-2 space-y-1">{issues.slice(0, 4).map((item) => <li key={item} className="text-xs leading-5 text-white/65">• {item}</li>)}</ul>
                  </div>
                )}
              </div>

              {ready ? (
                <div className="border-t border-white/10 p-5 md:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">Where the money goes</p>
                  <ul className="mt-3 space-y-2.5">
                    {sections.slice(0, 9).map((item) => (
                      <li key={item.id} className="text-xs">
                        <div className="flex justify-between gap-3 text-white/75"><span className="truncate">{item.label}</span><span className="shrink-0 font-bold text-white">{money(item.low)}–{money(item.high)}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div initial={false} animate={{ width: `${(item.high / maxSection) * 100}%` }} transition={{ duration: reduce ? 0 : 0.5 }} className="h-full rounded-full bg-gradient-to-r from-[#38BDA8] to-[#F2B544]" />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {result.costDrivers.length ? (
                    <div className="mt-4 rounded-xl bg-white/[0.05] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">What is moving the price</p>
                      {result.costDrivers.slice(0, 3).map((item) => <p key={item} className="mt-1 text-[11px] leading-5 text-white/65">• {item}</p>)}
                    </div>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => router.push("/quote")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B544] px-5 text-sm font-black text-[#071E33] transition hover:brightness-105">Get a Charismak quote <ArrowRight className="h-4 w-4" /></button>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => downloadEstimateBoqPdf({ input: priced, result, level: "Quick" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold text-white hover:border-[#F2B544]"><Download className="h-4 w-4" />BOQ PDF</button>
                      <button type="button" onClick={continueDetailed} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold text-white hover:border-[#F2B544]">Go detailed <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-white/40">Planning estimate only — drawings, measured quantities and current quotations are needed before procurement or contract.</p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* Phones: the meter sits below the questions, so keep the live range pinned in view. */}
      <a href="#live-meter" aria-hidden={!inView} tabIndex={inView ? 0 : -1} className={`fixed inset-x-3 bottom-3 z-40 transition duration-300 ${inView ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"} flex items-center justify-between gap-3 rounded-2xl border border-[#F2B544]/40 bg-[#04121F]/95 px-4 py-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur lg:hidden`}>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">Live estimate · {location.name}</span>
          {ready ? (
            <span className="block text-lg font-black"><AnimatedNaira value={result.low} compact /> – <AnimatedNaira value={result.high} compact /></span>
          ) : (
            <span className="block truncate text-xs text-white/65">Add {issues[0]?.toLowerCase() ?? "details"} to start</span>
          )}
        </span>
        <span className="shrink-0 text-xs font-bold text-[#F2B544]">Breakdown ↓</span>
      </a>
    </section>
  );
}

function StepLabel({ n, text }: { n: number; text: string }) {
  return <p className="flex items-center gap-2 text-sm font-black text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#F2B544] text-[11px] text-[#071E33]">{n}</span>{text}</p>;
}

type QuickFieldsProps = {
  input: EstimateInput;
  update: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void;
  updateNumber: (key: keyof EstimateInput, value: string) => void;
};

function QuickCategoryFields({ input, update, updateNumber }: QuickFieldsProps) {
  if (input.category === "new-building") {
    return <div>
      <SectionTitle title="Building basics" text="Enter the major facts you know. Floor area is optional if the accommodation is sufficient to infer a planning size." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Building type / use" value={input.buildingUse} onChange={(value) => update("buildingUse", value as BuildingUse)} options={buildingUses} />
        <NumberField label="Land area (m²)" value={input.landAreaM2} onChange={(value) => updateNumber("landAreaM2", value)} placeholder="optional" />
        <NumberField label="Total floor area / GFA (m²)" value={input.totalFloorAreaM2} onChange={(value) => updateNumber("totalFloorAreaM2", value)} placeholder="leave blank if unknown" />
        <NumberField label="Floors above ground floor" value={input.floorsAboveGround} onChange={(value) => updateNumber("floorsAboveGround", value)} placeholder="0 = bungalow" />
        <NumberField label="Number of units / apartments" value={input.units} onChange={(value) => updateNumber("units", value)} placeholder="1" min={1} />
        <SelectField label="Roof type" value={input.roofType} onChange={(value) => update("roofType", value as EstimateInput["roofType"])} options={roofOptions} />
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B544]">Accommodation</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Bedrooms / rooms" value={input.bedrooms} onChange={(value) => updateNumber("bedrooms", value)} />
        <NumberField label="Bathrooms / WCs" value={input.bathrooms} onChange={(value) => updateNumber("bathrooms", value)} />
        <NumberField label="Living rooms" value={input.livingRooms} onChange={(value) => updateNumber("livingRooms", value)} />
        <NumberField label="Kitchens" value={input.kitchens} onChange={(value) => updateNumber("kitchens", value)} />
        <NumberField label="Family lounges" value={input.familyLounges} onChange={(value) => updateNumber("familyLounges", value)} />
        <NumberField label="Study / office" value={input.studies} onChange={(value) => updateNumber("studies", value)} />
        <NumberField label="BQ / staff rooms" value={input.bqRooms} onChange={(value) => updateNumber("bqRooms", value)} />
        <SelectField label="Dining" value={input.dining} onChange={(value) => update("dining", value as EstimateInput["dining"])} options={[["none", "No dining"], ["combined", "Combined with living"], ["separate", "Separate dining room"]]} />
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B544]">External works / extras</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <CheckField label="Boundary fence" checked={input.includeFence} onChange={(value) => { update("includeFence", value); update("includeExternalWorks", value || input.includeGatehouse || input.includePaving || input.includeDrainage || input.includeLandscaping || input.includePool); }} />
        <CheckField label="Gatehouse" checked={input.includeGatehouse} onChange={(value) => { update("includeGatehouse", value); update("includeExternalWorks", value || input.includeFence || input.includePaving || input.includeDrainage || input.includeLandscaping || input.includePool); }} />
        <CheckField label="Paving / parking" checked={input.includePaving} onChange={(value) => { update("includePaving", value); update("includeExternalWorks", value || input.includeFence || input.includeGatehouse || input.includeDrainage || input.includeLandscaping || input.includePool); }} />
        <CheckField label="Drainage" checked={input.includeDrainage} onChange={(value) => { update("includeDrainage", value); update("includeExternalWorks", value || input.includeFence || input.includeGatehouse || input.includePaving || input.includeLandscaping || input.includePool); }} />
        <CheckField label="Landscaping" checked={input.includeLandscaping} onChange={(value) => { update("includeLandscaping", value); update("includeExternalWorks", value || input.includeFence || input.includeGatehouse || input.includePaving || input.includeDrainage || input.includePool); }} />
        <CheckField label="Swimming pool" checked={input.includePool} onChange={(value) => { update("includePool", value); update("includeExternalWorks", value || input.includeFence || input.includeGatehouse || input.includePaving || input.includeDrainage || input.includeLandscaping); }} />
        <CheckField label="Furniture / FF&E" checked={input.includeFurniture} onChange={(value) => update("includeFurniture", value)} />
      </div>
    </div>;
  }

  if (input.category === "renovation") {
    return <div>
      <SectionTitle title="Renovation scope" text="A quick renovation figure improves considerably when we know what is actually being replaced." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Property use" value={input.renovationUse} onChange={(value) => update("renovationUse", value as EstimateInput["renovationUse"])} options={[["residential", "Residential"], ["office", "Office"], ["retail", "Retail / shop"], ["hotel", "Hotel / hospitality"], ["restaurant", "Restaurant"], ["other", "Other"]]} />
        <NumberField label="Renovation area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} />
        <SelectField label="Renovation intensity" value={input.renovationIntensity} onChange={(value) => update("renovationIntensity", value as EstimateInput["renovationIntensity"])} options={[["light", "Light refresh"], ["moderate", "Moderate renovation"], ["major", "Major renovation"], ["full-strip", "Full strip-out / rebuild internally"]]} />
        <NumberField label="Bathrooms to renovate" value={input.bathroomRenovations} onChange={(value) => updateNumber("bathroomRenovations", value)} />
        <NumberField label="Kitchens to renovate" value={input.kitchenRenovations} onChange={(value) => updateNumber("kitchenRenovations", value)} />
        <NumberField label="Floor replacement (%)" value={input.floorReplacementPercent} onChange={(value) => updateNumber("floorReplacementPercent", value)} />
        <NumberField label="Ceiling replacement (%)" value={input.ceilingReplacementPercent} onChange={(value) => updateNumber("ceilingReplacementPercent", value)} />
        <NumberField label="Painting / wall refresh (%)" value={input.paintingPercent} onChange={(value) => updateNumber("paintingPercent", value)} />
        <CheckField label="Structural alterations" checked={input.structuralAlteration} onChange={(value) => update("structuralAlteration", value)} />
      </div>
    </div>;
  }

  if (input.category === "structural-steel") {
    return <div>
      <SectionTitle title="Steel structure basics" text="Area alone is not enough; structure type and geometry help the engine infer a realistic steel weight." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SelectField label="Steel structure" value={input.steelStructureType} onChange={(value) => update("steelStructureType", value as EstimateInput["steelStructureType"])} options={[["warehouse", "Warehouse / portal frame"], ["canopy", "Canopy / carport"], ["roof-truss", "Roof trusses"], ["mezzanine", "Mezzanine"], ["multi-storey-frame", "Multi-storey frame"], ["platform", "Platform / support frame"], ["staircase", "Steel staircase"], ["other", "Other"]]} />
        <NumberField label="Covered / structural area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} />
        <NumberField label="Steel tonnage, if known" value={input.steelTonnes} onChange={(value) => updateNumber("steelTonnes", value)} step={0.1} placeholder="optional" />
        <NumberField label="Typical clear span (m)" value={input.steelSpanM} onChange={(value) => updateNumber("steelSpanM", value)} step={0.1} />
        <NumberField label="Typical height (m)" value={input.steelHeightM} onChange={(value) => updateNumber("steelHeightM", value)} step={0.1} />
        <NumberField label="Number of bays" value={input.steelBays} onChange={(value) => updateNumber("steelBays", value)} />
        <CheckField label="Include site erection" checked={input.steelErection} onChange={(value) => update("steelErection", value)} />
        <CheckField label="Include cladding" checked={input.steelCladding} onChange={(value) => update("steelCladding", value)} />
        <CheckField label="Crane required" checked={input.craneRequired} onChange={(value) => update("craneRequired", value)} />
        <CheckField label="Include steel foundations / bases" checked={input.steelFoundations} onChange={(value) => update("steelFoundations", value)} />
      </div>
    </div>;
  }

  if (input.category === "finishes") {
    return <div>
      <SectionTitle title="Finish scope" text="Choose the major finish types and measured areas you know." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Floor / finish area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} />
        <SelectField label="Main floor finish" value={input.floorFinish} onChange={(value) => update("floorFinish", value as EstimateInput["floorFinish"])} options={[["screed", "Screed / minimal"], ["ceramic", "Ceramic tiles"], ["porcelain", "Porcelain tiles"], ["granite", "Granite"], ["marble", "Marble"], ["vinyl", "Vinyl"], ["timber", "Timber"], ["epoxy", "Epoxy"]]} />
        <SelectField label="Wall finish" value={input.wallFinish} onChange={(value) => update("wallFinish", value as EstimateInput["wallFinish"])} options={[["paint", "Paint"], ["wallpaper", "Wallpaper"], ["tile", "Wall tiles"], ["stone", "Stone / marble"], ["panel", "Decorative panels"]]} />
        <SelectField label="Ceiling type" value={input.ceilingFinish} onChange={(value) => update("ceilingFinish", value as EstimateInput["ceilingFinish"])} options={[["none", "No ceiling"], ["pvc", "PVC"], ["gypsum-pop", "Gypsum / POP"], ["suspended", "Suspended acoustic"], ["decorative", "Decorative premium"]]} />
        <NumberField label="Ceiling area (m²)" value={input.ceilingAreaM2} onChange={(value) => updateNumber("ceilingAreaM2", value)} placeholder="optional" />
        <NumberField label="Painting area (m²)" value={input.paintingAreaM2} onChange={(value) => updateNumber("paintingAreaM2", value)} placeholder="optional" />
      </div>
    </div>;
  }

  if (input.category === "furniture") {
    return <div>
      <SectionTitle title="Furniture & joinery basics" text="Use approximate quantities where known; the detailed estimator can refine every fitted and loose item." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Approximate furnished area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} placeholder="optional if quantities entered" />
        <SelectField label="Furniture / joinery level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as EstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} />
        <NumberField label="Wardrobes (linear m)" value={input.wardrobeLengthM} onChange={(value) => updateNumber("wardrobeLengthM", value)} step={0.1} />
        <NumberField label="Kitchen cabinets (linear m)" value={input.kitchenCabinetLengthM} onChange={(value) => updateNumber("kitchenCabinetLengthM", value)} step={0.1} />
        <NumberField label="Bedroom furniture sets" value={input.bedroomFurnitureSets} onChange={(value) => updateNumber("bedroomFurnitureSets", value)} />
        <NumberField label="Living-room furniture sets" value={input.livingFurnitureSets} onChange={(value) => updateNumber("livingFurnitureSets", value)} />
        <NumberField label="Dining sets" value={input.diningFurnitureSets} onChange={(value) => updateNumber("diningFurnitureSets", value)} />
        <NumberField label="Office workstations" value={input.officeWorkstations} onChange={(value) => updateNumber("officeWorkstations", value)} />
      </div>
    </div>;
  }

  if (input.category === "external-works") {
    return <div>
      <SectionTitle title="External works basics" text="Lengths and areas are more useful than a single combined external-work area." />
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NumberField label="Site / external work area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} placeholder="optional if quantities entered" />
        <NumberField label="Fence length (m)" value={input.fenceLengthM} onChange={(value) => updateNumber("fenceLengthM", value)} />
        <NumberField label="Gate sets" value={input.gateCount} onChange={(value) => updateNumber("gateCount", value)} />
        <NumberField label="Paving / parking area (m²)" value={input.pavingAreaM2} onChange={(value) => updateNumber("pavingAreaM2", value)} />
        <NumberField label="Drainage length (m)" value={input.drainageLengthM} onChange={(value) => updateNumber("drainageLengthM", value)} />
        <NumberField label="Landscaping area (m²)" value={input.landscapingAreaM2} onChange={(value) => updateNumber("landscapingAreaM2", value)} />
        <NumberField label="Gatehouse area (m²)" value={input.gatehouseAreaM2} onChange={(value) => updateNumber("gatehouseAreaM2", value)} />
        <NumberField label="Pool area (m²)" value={input.poolAreaM2} onChange={(value) => updateNumber("poolAreaM2", value)} />
      </div>
    </div>;
  }

  return <div>
    <SectionTitle title="MEP services basics" text="Enter the main points and equipment. The detailed estimator adds capacities, low-current systems, treatment plants and more." />
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumberField label="Approximate serviced area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} placeholder="optional if quantities entered" />
      <SelectField label="Cooling system" value={input.acSpec} onChange={(value) => update("acSpec", value as EstimateInput["acSpec"])} options={[["none", "No cooling"], ["provision", "AC provision only"], ["split", "Split AC"], ["cassette", "Cassette AC"], ["vrf", "VRF / VRV"], ["central", "Central HVAC"]]} />
      <NumberField label="Power / socket points" value={input.electricalPoints} onChange={(value) => updateNumber("electricalPoints", value)} />
      <NumberField label="Lighting points" value={input.lightingPoints} onChange={(value) => updateNumber("lightingPoints", value)} />
      <NumberField label="Bathrooms / WC groups" value={input.mepBathrooms} onChange={(value) => updateNumber("mepBathrooms", value)} />
      <NumberField label="Kitchens" value={input.mepKitchens} onChange={(value) => updateNumber("mepKitchens", value)} />
      <NumberField label="AC units / zones" value={input.acUnits} onChange={(value) => updateNumber("acUnits", value)} />
      <NumberField label="Water heaters" value={input.waterHeaters} onChange={(value) => updateNumber("waterHeaters", value)} />
      <NumberField label="Generator capacity (kVA)" value={input.generatorKva} onChange={(value) => updateNumber("generatorKva", value)} placeholder="optional" />
      <NumberField label="Solar PV (kW)" value={input.solarKw} onChange={(value) => updateNumber("solarKw", value)} placeholder="optional" />
      <CheckField label="Borehole" checked={input.includeBorehole} onChange={(value) => update("includeBorehole", value)} />
      <CheckField label="Septic / soakaway" checked={input.includeSeptic} onChange={(value) => update("includeSeptic", value)} />
    </div>
  </div>;
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return <div><h4 className="text-base font-semibold text-white">{title}</h4><p className="mt-1 max-w-3xl text-xs leading-6 text-white/50">{text}</p></div>;
}

function NumberField({ label, value, onChange, placeholder = "0", min = 0, step = 1 }: { label: string; value: number; onChange: (value: string) => void; placeholder?: string; min?: number; step?: number }) {
  return <label className="text-xs font-semibold text-white/70">{label}<input type="number" inputMode="decimal" min={min} step={step} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-xl border px-4 text-sm outline-none bg-white/10! text-white! border-white/15! placeholder:text-white/35! focus:border-[#F2B544]!" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<readonly [string, string]> | Array<[string, string]> }) {
  return <label className="text-xs font-semibold text-white/70">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-4 text-sm outline-none bg-white/10! text-white! border-white/15! placeholder:text-white/35! focus:border-[#F2B544]! [&_option]:bg-[#071E33]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition ${checked ? "border-[#F2B544] bg-[#F2B544]/15 text-white" : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/30"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#C8A45D]" />{label}</label>;
}
