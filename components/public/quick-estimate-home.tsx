"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calculator,
  Download,
  Factory,
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

const money = (value: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(value);

const fullMoney = (value: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
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
  const [input, setInput] = useState<EstimateInput>(() => createInitialEstimateInput());
  const [showResult, setShowResult] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const result = useMemo(() => calculateEstimateV2(input), [input]);

  const update = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setShowResult(false);
    setMessages([]);
  };

  const updateNumber = (key: keyof EstimateInput, value: string) => {
    update(key, Math.max(0, Number(value) || 0) as never);
  };

  const selectCategory = (category: EstimateCategory) => {
    setInput((current) => {
      const fresh = createInitialEstimateInput();
      fresh.category = category;
      fresh.location = current.location;
      fresh.finishLevel = current.finishLevel;
      return fresh;
    });
    setShowResult(false);
    setMessages([]);
  };

  const calculate = () => {
    const issues = validateEstimateInput(input);
    setMessages(issues);
    if (issues.length) {
      setShowResult(false);
      return;
    }
    setShowResult(true);
    requestAnimationFrame(() => document.getElementById("quick-result")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const continueDetailed = () => {
    saveQuickEstimateTransfer(input);
    router.push("/estimator/detailed");
  };

  return (
    <section id="quick-estimate" className="bg-white px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Quick Estimate</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#071E33] md:text-5xl">Fast, but based on the major cost drivers.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#3A4653]">Tell us enough about the proposed work to avoid a meaningless square-metre-only answer. For a building, room counts, floors, building use, finish level and external works can all affect the range.</p>
            <div className="mt-7 border-l-2 border-[#C8A45D] bg-[#FFF9ED] p-5 text-sm leading-7 text-[#74520D]">You do not need to know everything. For a new building, if the total floor area is unknown, enter the accommodation you want and the estimator can infer a preliminary planning area.</div>
            <div className="mt-7 space-y-3 text-sm text-[#3A4653]">
              <p><strong className="text-[#071E33]">Quick:</strong> major project facts and broad specifications.</p>
              <p><strong className="text-[#071E33]">Detailed:</strong> measured quantities, structural/site details, MEP systems, comparisons, savings, programme and cash flow.</p>
            </div>
          </div>

          <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(7,30,51,0.09)] md:p-7">
            <div className="flex items-center gap-3 border-b border-[#0D3B66]/10 pb-5">
              <span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]"><Calculator className="h-5 w-5" /></span>
              <div><h3 className="font-semibold text-[#071E33]">What do you want to estimate?</h3><p className="mt-1 text-xs text-[#3A4653]/65">Choose the scope. The quick questions change to match the work.</p></div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = input.category === item.id;
                return <button key={item.id} type="button" onClick={() => selectCategory(item.id)} className={`p-3 text-left transition ${active ? "bg-[#071E33] text-white" : "border border-[#0D3B66]/10 bg-white text-[#071E33] hover:border-[#C8A45D]"}`}><Icon className={`h-4 w-4 ${active ? "text-[#C8A45D]" : "text-[#0D3B66]"}`} /><strong className="mt-3 block text-xs">{item.label}</strong><span className={`mt-1 block text-[10px] leading-4 ${active ? "text-white/55" : "text-[#3A4653]/55"}`}>{item.short}</span></button>;
              })}
            </div>

            <div className="mt-6 grid gap-4 border-t border-[#0D3B66]/10 pt-6 md:grid-cols-2">
              <TextField label="Project location" value={input.location} onChange={(value) => update("location", value)} placeholder="e.g. Abuja" />
              <SelectField label="Overall specification / finish level" value={input.finishLevel} onChange={(value) => update("finishLevel", value as SpecLevel)} options={finishLevels} />
            </div>

            <div className="mt-7">
              <QuickCategoryFields input={input} update={update} updateNumber={updateNumber} />
            </div>

            {messages.length ? <div className="mt-5 border border-[#B45151]/25 bg-[#FFF3F3] p-4"><p className="text-xs font-bold text-[#8D2F2F]">Please add the following:</p>{messages.map((item) => <p key={item} className="mt-1 text-xs leading-5 text-[#8D2F2F]">• {item}</p>)}</div> : null}

            <button type="button" onClick={calculate} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"><Calculator className="h-5 w-5" />Get quick estimate</button>

            {showResult ? (
              <div id="quick-result" className="mt-6 scroll-mt-28 overflow-hidden border border-[#0D3B66]/10 bg-white">
                <div className="bg-[#071E33] p-6 text-white md:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Quick planning range</p>
                  <strong className="mt-3 block text-3xl tracking-[-0.04em] md:text-4xl">{money(result.low)} – {money(result.high)}</strong>
                  <p className="mt-3 text-xs text-white/60">Likely planning figure: <strong className="text-white">{fullMoney(result.midpoint)}</strong></p>
                </div>
                <div className="p-5 md:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]/55">Cost basis</p><strong className="mt-2 block text-sm text-[#071E33]">{Math.round(result.basisQuantity).toLocaleString()} {result.basisUnit}</strong><p className="mt-1 text-[11px] leading-5 text-[#3A4653]/65">{result.basisLabel}</p></div>
                    <div className="bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]/55">Information level</p><strong className="mt-2 block text-sm text-[#071E33]">Quick planning estimate</strong><p className="mt-1 text-[11px] leading-5 text-[#3A4653]/65">Major cost drivers included; detailed technical quantities remain assumptions.</p></div>
                  </div>

                  {result.costDrivers.length ? <div className="mt-5 border border-[#0D3B66]/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0D3B66]">Main factors affecting this result</p><div className="mt-2 space-y-1">{result.costDrivers.slice(0, 4).map((item) => <p key={item} className="text-xs leading-5 text-[#3A4653]">• {item}</p>)}</div></div> : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button type="button" onClick={() => downloadEstimateBoqPdf({ input, result, level: "Quick" })} className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#0D3B66]/15 px-5 py-3 text-xs font-bold text-[#0D3B66]"><Download className="h-4 w-4" />Download BOQ PDF</button>
                    <button type="button" onClick={continueDetailed} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]">Continue to Detailed <ArrowRight className="h-4 w-4" /></button>
                    <button type="button" onClick={() => router.push("/contact")} className="inline-flex min-h-12 items-center justify-center border border-[#0D3B66]/15 px-5 py-3 text-xs font-bold text-[#0D3B66]">Contact Charismak</button>
                  </div>
                  <p className="mt-4 text-[10px] leading-5 text-[#3A4653]/55">The downloaded document is a branded preliminary elemental BOQ / cost plan. Everything entered here also carries into the Detailed Estimate.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
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

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Accommodation</p>
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

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">External works / extras</p>
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
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Major cost drivers</p><h4 className="mt-2 text-xl font-semibold text-[#071E33]">{title}</h4><p className="mt-2 max-w-3xl text-xs leading-6 text-[#3A4653]/65">{text}</p></div>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}

function NumberField({ label, value, onChange, placeholder = "0", min = 0, step = 1 }: { label: string; value: number; onChange: (value: string) => void; placeholder?: string; min?: number; step?: number }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<input type="number" min={min} step={step} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<readonly [string, string]> | Array<[string, string]> }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-xs font-semibold transition ${checked ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#0D3B66]/12 bg-white text-[#3A4653]"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#C8A45D]" />{label}</label>;
}
