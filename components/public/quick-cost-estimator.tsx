"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Factory,
  Hammer,
  Layers3,
  ListChecks,
  Sofa,
  Sparkles,
  Wrench,
} from "lucide-react";

import {
  calculatePublicEstimate,
  type BuildingUse,
  type PublicEstimateCategory,
  type PublicEstimateInput,
  type PublicFinishLevel,
} from "@/lib/projects/guided-estimate";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const fullMoney = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const categories: Array<{
  id: PublicEstimateCategory;
  label: string;
  short: string;
  icon: typeof Building2;
}> = [
  { id: "new-building", label: "New building", short: "House, flats, office, hotel & more", icon: Building2 },
  { id: "renovation", label: "Renovation", short: "Remodelling, upgrade or full strip-out", icon: Hammer },
  { id: "structural-steel", label: "Steel fabrication", short: "Frames, warehouses, canopies & structures", icon: Factory },
  { id: "finishes", label: "Finishes", short: "Floor, wall, ceiling and decorative work", icon: Sparkles },
  { id: "furniture", label: "Furniture / joinery", short: "Wardrobes, kitchens, fittings and FF&E", icon: Sofa },
  { id: "external-works", label: "External works", short: "Paving, drainage, fence and landscaping", icon: Layers3 },
  { id: "mep-services", label: "MEP services", short: "Electrical, plumbing, cooling and systems", icon: Wrench },
];

const buildingUses: Array<{ id: BuildingUse; label: string }> = [
  { id: "residential", label: "Private house / residential" },
  { id: "apartments", label: "Block of flats / apartments" },
  { id: "commercial", label: "Office / shop / commercial" },
  { id: "hotel", label: "Hotel / serviced apartment" },
  { id: "school", label: "School / education" },
  { id: "healthcare", label: "Clinic / hospital" },
  { id: "warehouse", label: "Warehouse" },
  { id: "industrial", label: "Industrial / workshop" },
  { id: "religious", label: "Church / mosque / worship" },
  { id: "mixed-use", label: "Mixed-use development" },
];

const finishLevels: Array<{ id: PublicFinishLevel; label: string; note: string }> = [
  { id: "economy", label: "Economy", note: "Functional and cost-conscious" },
  { id: "standard", label: "Standard", note: "Good mid-market specification" },
  { id: "upper-mid", label: "Upper-mid", note: "Better brands and finishes" },
  { id: "premium", label: "Premium", note: "High-specification finish" },
  { id: "luxury", label: "Luxury", note: "Top-end materials and fittings" },
];

const initialInput: PublicEstimateInput = {
  category: "new-building",
  buildingUse: "residential",
  location: "Abuja",
  landAreaM2: 450,
  footprintM2: 0,
  totalFloorAreaM2: 0,
  floorsAboveGround: 0,
  units: 1,
  bedrooms: 4,
  bathrooms: 5,
  livingRooms: 1,
  dining: "separate",
  kitchens: 1,
  familyLounges: 1,
  studies: 0,
  laundries: 1,
  bqRooms: 0,
  balconies: 1,
  staircases: 0,
  lifts: 0,
  finishLevel: "standard",
  siteCondition: "unknown",
  foundationType: "recommend",
  frameType: "recommend",
  roofType: "pitched-aluminium",
  roofComplexity: "simple",
  windowSpec: "standard-aluminium",
  doorSpec: "standard",
  facadeSpec: "paint-render",
  floorFinish: "porcelain",
  ceilingFinish: "gypsum-pop",
  kitchenSpec: "standard",
  bathroomSpec: "standard",
  electricalSpec: "standard",
  acSpec: "provision",
  waterSystem: "borehole",
  wasteSystem: "septic",
  powerSystem: "grid",
  includeSecurity: false,
  includeFireSystem: false,
  includeExternalWorks: true,
  includeFence: false,
  includeGatehouse: false,
  includePaving: false,
  includeDrainage: false,
  includeLandscaping: false,
  includePool: false,
  includeFurniture: false,
  furnitureLevel: "standard",
  includeWardrobes: true,
  includeKitchenJoinery: true,
  workAreaM2: 150,
  steelTonnes: 0,
  steelSpanM: 0,
  steelHeightM: 0,
  steelBays: 0,
  steelCladding: false,
  steelErection: true,
  craneRequired: false,
  renovationIntensity: "moderate",
  detailedMode: false,
};

type NumericField = {
  key: keyof PublicEstimateInput;
  label: string;
  hint?: string;
  min?: number;
  step?: number;
};

const roomFields: NumericField[] = [
  { key: "bedrooms", label: "Bedrooms", min: 0 },
  { key: "bathrooms", label: "Bathrooms / WCs", min: 0 },
  { key: "livingRooms", label: "Living rooms", min: 0 },
  { key: "kitchens", label: "Kitchens", min: 0 },
  { key: "familyLounges", label: "Family lounges", min: 0 },
  { key: "studies", label: "Study / office rooms", min: 0 },
  { key: "laundries", label: "Laundry rooms", min: 0 },
  { key: "bqRooms", label: "BQ / staff rooms", min: 0 },
  { key: "balconies", label: "Balconies / verandas", min: 0 },
  { key: "staircases", label: "Staircases", min: 0 },
  { key: "lifts", label: "Lifts", min: 0 },
];

export default function QuickCostEstimator() {
  const [input, setInput] = useState<PublicEstimateInput>(initialInput);
  const [showMore, setShowMore] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => calculatePublicEstimate(input), [input]);

  const update = <K extends keyof PublicEstimateInput>(key: K, value: PublicEstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setShowResult(false);
  };

  const updateNumber = (key: keyof PublicEstimateInput, value: string) => {
    update(key, Math.max(0, Number(value) || 0) as never);
  };

  const selectCategory = (category: PublicEstimateCategory) => {
    setInput((current) => ({ ...current, category }));
    setShowMore(false);
    setShowResult(false);
  };

  return (
    <section id="quick-building-cost" className="bg-white px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 xl:grid-cols-[0.62fr_1.38fr] xl:items-start">
          <div className="xl:sticky xl:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Public feasibility estimator</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-[#071E33] md:text-5xl">
              Describe what you want to build. We’ll build the budget around it.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#3A4653]">
              Start with the questions you know. If you want a tighter planning range, open <strong>More details</strong> and tell us about structure, finishes, services, external works and furniture.
            </p>

            <div className="mt-7 border border-[#C8A45D]/35 bg-[#FFF9ED] p-5">
              <p className="flex gap-3 text-sm leading-7 text-[#74520D]">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                This is a feasibility/planning estimate, not a tender or contract price. The detail percentage measures how much project information you supplied—not guaranteed price accuracy.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                ["70%+", "Quick estimate", "Core project information"],
                ["85%+", "Detailed estimate", "Structure, finishes and MEP"],
                ["High detail", "Next step", "Measured drawings / BOQ in full app"],
              ].map(([value, title, text]) => (
                <div key={title} className="border-l border-[#C8A45D] pl-4">
                  <strong className="text-lg text-[#071E33]">{value}</strong>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0D3B66]">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#3A4653]/70">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
              <Link href="/prices" className="inline-flex items-center gap-2 text-[#0D3B66] hover:text-[#C8A45D]">
                View price references <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/estimator/app#projects" className="inline-flex items-center gap-2 text-[#0D3B66] hover:text-[#C8A45D]">
                Open professional estimator <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(7,30,51,0.09)] md:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-[#0D3B66]/10 pb-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]">
                  <Calculator className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#071E33]">What are you estimating?</h3>
                  <p className="mt-1 text-xs text-[#3A4653]/70">No account needed for the preliminary result.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D3B66]">
                <ListChecks className="h-4 w-4 text-[#C8A45D]" />
                Detail {result.detailScore}%
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = input.category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCategory(item.id)}
                    className={`text-left transition ${active ? "bg-[#071E33] text-white shadow-lg" : "border border-[#0D3B66]/10 bg-white text-[#071E33] hover:border-[#C8A45D]"} p-4`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-[#C8A45D]" : "text-[#0D3B66]"}`} />
                    <strong className="mt-4 block text-sm">{item.label}</strong>
                    <span className={`mt-1 block text-[11px] leading-5 ${active ? "text-white/60" : "text-[#3A4653]/65"}`}>{item.short}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-[#0D3B66]/10 pt-7">
              {input.category === "new-building" ? (
                <BuildingCore input={input} update={update} updateNumber={updateNumber} />
              ) : (
                <OtherWorkCore input={input} update={update} updateNumber={updateNumber} />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !showMore;
                setShowMore(next);
                update("detailedMode", next);
              }}
              className="mt-7 flex w-full items-center justify-between border-y border-[#0D3B66]/10 bg-white px-5 py-4 text-left"
            >
              <span>
                <strong className="block text-sm text-[#071E33]">{showMore ? "Hide detailed questions" : "Add more details for a tighter estimate"}</strong>
                <span className="mt-1 block text-xs leading-5 text-[#3A4653]/70">
                  {input.category === "new-building"
                    ? "Foundation, roof, windows, finishes, MEP, external works and furniture."
                    : "Add the specifications that materially change this type of work."}
                </span>
              </span>
              {showMore ? <ChevronUp className="h-5 w-5 text-[#0D3B66]" /> : <ChevronDown className="h-5 w-5 text-[#0D3B66]" />}
            </button>

            {showMore ? (
              <div className="mt-7">
                {input.category === "new-building" ? (
                  <BuildingDetails input={input} update={update} />
                ) : (
                  <OtherWorkDetails input={input} update={update} updateNumber={updateNumber} />
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowResult(true)}
              className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"
            >
              <Calculator className="h-5 w-5" />
              Calculate preliminary project cost
            </button>

            {showResult ? <EstimateResult input={input} result={result} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function BuildingCore({
  input,
  update,
  updateNumber,
}: {
  input: PublicEstimateInput;
  update: <K extends keyof PublicEstimateInput>(key: K, value: PublicEstimateInput[K]) => void;
  updateNumber: (key: keyof PublicEstimateInput, value: string) => void;
}) {
  return (
    <div>
      <SectionHeading eyebrow="Core questions" title="Tell us the size and accommodation." text="If you know the building area, enter it. If you don't, leave it blank and the estimator will infer a reasonable planning area from the rooms." />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SelectField label="Building use" value={input.buildingUse} onChange={(value) => update("buildingUse", value as BuildingUse)} options={buildingUses.map((item) => [item.id, item.label])} />
        <TextField label="Project location" value={input.location} onChange={(value) => update("location", value)} placeholder="City / State, e.g. Abuja" />
        <NumberField label="Land area (m²)" value={input.landAreaM2} onChange={(value) => updateNumber("landAreaM2", value)} hint="If known" />
        <NumberField label="Building footprint / ground-floor area (m²)" value={input.footprintM2} onChange={(value) => updateNumber("footprintM2", value)} hint="Leave 0 if unknown" />
        <NumberField label="Total floor area (m²)" value={input.totalFloorAreaM2} onChange={(value) => updateNumber("totalFloorAreaM2", value)} hint="Use this if already known" />
        <NumberField label="Floors above ground floor" value={input.floorsAboveGround} onChange={(value) => updateNumber("floorsAboveGround", value)} hint="0 = bungalow / ground floor only" />
        <NumberField label="Number of units / apartments" value={input.units} onChange={(value) => updateNumber("units", value)} min={1} />
        <SelectField label="Overall finish level" value={input.finishLevel} onChange={(value) => update("finishLevel", value as PublicFinishLevel)} options={finishLevels.map((item) => [item.id, `${item.label} — ${item.note}`])} />
      </div>

      <div className="mt-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Accommodation / spaces</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roomFields.slice(0, 8).map((field) => (
            <NumberField
              key={String(field.key)}
              label={field.label}
              value={Number(input[field.key]) || 0}
              onChange={(value) => updateNumber(field.key, value)}
              min={field.min}
            />
          ))}
          <SelectField label="Dining" value={input.dining} onChange={(value) => update("dining", value as PublicEstimateInput["dining"])} options={[["none", "No dining"], ["combined", "Combined with living"], ["separate", "Separate dining room"]]} />
        </div>
      </div>
    </div>
  );
}

function BuildingDetails({
  input,
  update,
}: {
  input: PublicEstimateInput;
  update: <K extends keyof PublicEstimateInput>(key: K, value: PublicEstimateInput[K]) => void;
}) {
  return (
    <div className="space-y-9">
      <div>
        <SectionHeading eyebrow="Structure & site" title="What is the building sitting on and how is it framed?" compact />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Site / soil condition" value={input.siteCondition} onChange={(value) => update("siteCondition", value as PublicEstimateInput["siteCondition"])} options={[["unknown", "I don't know — use allowance"], ["good", "Good / firm"], ["normal", "Normal"], ["weak", "Weak soil"], ["waterlogged", "Waterlogged / difficult"]]} />
          <SelectField label="Foundation" value={input.foundationType} onChange={(value) => update("foundationType", value as PublicEstimateInput["foundationType"])} options={[["recommend", "Recommend / unknown"], ["strip-pad", "Strip / pad foundation"], ["raft", "Raft foundation"], ["pile", "Pile foundation"]]} />
          <SelectField label="Structural frame" value={input.frameType} onChange={(value) => update("frameType", value as PublicEstimateInput["frameType"])} options={[["recommend", "Recommend / unknown"], ["masonry", "Load-bearing masonry"], ["reinforced-concrete", "Reinforced concrete"], ["steel", "Structural steel"], ["composite", "Composite"]]} />
          <SelectField label="Roof type" value={input.roofType} onChange={(value) => update("roofType", value as PublicEstimateInput["roofType"])} options={[["pitched-aluminium", "Pitched aluminium"], ["stone-coated", "Stone-coated roof"], ["flat-concrete", "Flat concrete roof"], ["steel-roof", "Steel roof structure"], ["combination", "Combination"]]} />
          <SelectField label="Roof complexity" value={input.roofComplexity} onChange={(value) => update("roofComplexity", value as PublicEstimateInput["roofComplexity"])} options={[["simple", "Simple"], ["moderate", "Moderate"], ["complex", "Complex / many hips & valleys"]]} />
          <SelectField label="Façade" value={input.facadeSpec} onChange={(value) => update("facadeSpec", value as PublicEstimateInput["facadeSpec"])} options={[["paint-render", "Paint / rendered wall"], ["mixed-cladding", "Mixed cladding"], ["stone-tile", "Stone / tile cladding"], ["alucobond", "Alucobond / ACP"], ["curtain-wall", "Curtain wall"]]} />
        </div>
      </div>

      <div>
        <SectionHeading eyebrow="Doors, windows & finishes" title="Choose the specification that best matches what you have in mind." compact />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Windows" value={input.windowSpec} onChange={(value) => update("windowSpec", value as PublicEstimateInput["windowSpec"])} options={[["standard-aluminium", "Standard aluminium"], ["premium-aluminium", "Premium aluminium"], ["upvc", "uPVC"], ["double-glazed", "Double glazed"], ["curtain-wall", "Curtain wall / large glazing"]]} />
          <SelectField label="Doors" value={input.doorSpec} onChange={(value) => update("doorSpec", value as PublicEstimateInput["doorSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["premium", "Premium"], ["security-premium", "Security + premium"]]} />
          <SelectField label="Floor finish" value={input.floorFinish} onChange={(value) => update("floorFinish", value as PublicEstimateInput["floorFinish"])} options={[["screed", "Screed / minimal"], ["ceramic", "Ceramic tiles"], ["porcelain", "Porcelain tiles"], ["granite", "Granite"], ["marble", "Marble"], ["vinyl", "Vinyl"], ["timber", "Timber"], ["epoxy", "Epoxy"]]} />
          <SelectField label="Ceiling" value={input.ceilingFinish} onChange={(value) => update("ceilingFinish", value as PublicEstimateInput["ceilingFinish"])} options={[["none", "Exposed / none"], ["pvc", "PVC"], ["gypsum-pop", "Gypsum / POP"], ["suspended", "Suspended acoustic"], ["decorative", "Decorative premium"]]} />
          <SelectField label="Kitchen specification" value={input.kitchenSpec} onChange={(value) => update("kitchenSpec", value as PublicEstimateInput["kitchenSpec"])} options={[["basic", "Basic cabinetry"], ["standard", "Standard fitted kitchen"], ["premium", "Premium fitted kitchen"], ["luxury", "Luxury / imported"]]} />
          <SelectField label="Bathrooms / sanitary" value={input.bathroomSpec} onChange={(value) => update("bathroomSpec", value as PublicEstimateInput["bathroomSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roomFields.slice(8).map((field) => (
            <MiniNumberToggle key={String(field.key)} label={field.label} value={Number(input[field.key]) || 0} onChange={(value) => update(field.key, value as never)} />
          ))}
          <CheckField label="Include fitted wardrobes" checked={input.includeWardrobes} onChange={(value) => update("includeWardrobes", value)} />
          <CheckField label="Include kitchen joinery" checked={input.includeKitchenJoinery} onChange={(value) => update("includeKitchenJoinery", value)} />
        </div>
      </div>

      <div>
        <SectionHeading eyebrow="Building services" title="Power, water, cooling and other systems can materially change the budget." compact />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Electrical specification" value={input.electricalSpec} onChange={(value) => update("electricalSpec", value as PublicEstimateInput["electricalSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["high", "High specification"]]} />
          <SelectField label="Air-conditioning" value={input.acSpec} onChange={(value) => update("acSpec", value as PublicEstimateInput["acSpec"])} options={[["none", "None"], ["provision", "Provision only"], ["split", "Split units"], ["cassette", "Cassette units"], ["vrf", "VRF / VRV"], ["central", "Central HVAC"]]} />
          <SelectField label="Water system" value={input.waterSystem} onChange={(value) => update("waterSystem", value as PublicEstimateInput["waterSystem"])} options={[["basic", "Basic / public supply"], ["borehole", "Borehole + tank"], ["borehole-treatment", "Borehole + treatment"], ["enhanced-storage", "Enhanced water storage"]]} />
          <SelectField label="Waste system" value={input.wasteSystem} onChange={(value) => update("wasteSystem", value as PublicEstimateInput["wasteSystem"])} options={[["public-sewer", "Public sewer"], ["septic", "Septic tank / soakaway"], ["treatment-plant", "Treatment plant"]]} />
          <SelectField label="Power backup" value={input.powerSystem} onChange={(value) => update("powerSystem", value as PublicEstimateInput["powerSystem"])} options={[["grid", "Grid only"], ["generator", "Generator"], ["inverter", "Inverter"], ["solar", "Solar"], ["hybrid", "Generator + solar/inverter hybrid"]]} />
          <div className="grid gap-3">
            <CheckField label="CCTV / access / security systems" checked={input.includeSecurity} onChange={(value) => update("includeSecurity", value)} />
            <CheckField label="Fire alarm / firefighting system" checked={input.includeFireSystem} onChange={(value) => update("includeFireSystem", value)} />
          </div>
        </div>
      </div>

      <div>
        <SectionHeading eyebrow="External works & furniture" title="Choose what should be inside the same project budget." compact />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CheckField label="General external works" checked={input.includeExternalWorks} onChange={(value) => update("includeExternalWorks", value)} />
          <CheckField label="Boundary fence" checked={input.includeFence} onChange={(value) => update("includeFence", value)} />
          <CheckField label="Gatehouse" checked={input.includeGatehouse} onChange={(value) => update("includeGatehouse", value)} />
          <CheckField label="Paving / driveway / parking" checked={input.includePaving} onChange={(value) => update("includePaving", value)} />
          <CheckField label="Drainage" checked={input.includeDrainage} onChange={(value) => update("includeDrainage", value)} />
          <CheckField label="Landscaping" checked={input.includeLandscaping} onChange={(value) => update("includeLandscaping", value)} />
          <CheckField label="Swimming pool" checked={input.includePool} onChange={(value) => update("includePool", value)} />
          <CheckField label="Furniture / FF&E" checked={input.includeFurniture} onChange={(value) => update("includeFurniture", value)} />
          {input.includeFurniture ? (
            <SelectField label="Furniture level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as PublicEstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OtherWorkCore({
  input,
  update,
  updateNumber,
}: {
  input: PublicEstimateInput;
  update: <K extends keyof PublicEstimateInput>(key: K, value: PublicEstimateInput[K]) => void;
  updateNumber: (key: keyof PublicEstimateInput, value: string) => void;
}) {
  const categoryName = categories.find((item) => item.id === input.category)?.label ?? "Selected work";
  return (
    <div>
      <SectionHeading eyebrow="Core questions" title={`Tell us about the ${categoryName.toLowerCase()} scope.`} text="Use the approximate work area if you do not yet have measured quantities." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextField label="Project location" value={input.location} onChange={(value) => update("location", value)} placeholder="City / State" />
        <NumberField label="Approximate work area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} min={1} />
        <SelectField label="Specification level" value={input.finishLevel} onChange={(value) => update("finishLevel", value as PublicFinishLevel)} options={finishLevels.map((item) => [item.id, `${item.label} — ${item.note}`])} />
        {input.category === "renovation" ? (
          <SelectField label="Renovation intensity" value={input.renovationIntensity} onChange={(value) => update("renovationIntensity", value as PublicEstimateInput["renovationIntensity"])} options={[["light", "Light refresh"], ["moderate", "Moderate renovation"], ["major", "Major renovation"], ["full-strip", "Full strip-out / rebuild internally"]]} />
        ) : null}
        {input.category === "structural-steel" ? (
          <NumberField label="Steel tonnage, if known" value={input.steelTonnes} onChange={(value) => updateNumber("steelTonnes", value)} hint="Leave 0 to estimate by area" step={0.1} />
        ) : null}
        {input.category === "furniture" ? (
          <SelectField label="Furniture level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as PublicEstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} />
        ) : null}
      </div>
    </div>
  );
}

function OtherWorkDetails({
  input,
  update,
  updateNumber,
}: {
  input: PublicEstimateInput;
  update: <K extends keyof PublicEstimateInput>(key: K, value: PublicEstimateInput[K]) => void;
  updateNumber: (key: keyof PublicEstimateInput, value: string) => void;
}) {
  if (input.category === "structural-steel") {
    return (
      <div>
        <SectionHeading eyebrow="Steel details" title="Add geometry, fabrication and erection information." compact />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Typical clear span (m)" value={input.steelSpanM} onChange={(value) => updateNumber("steelSpanM", value)} step={0.1} />
          <NumberField label="Structure height (m)" value={input.steelHeightM} onChange={(value) => updateNumber("steelHeightM", value)} step={0.1} />
          <NumberField label="Number of bays" value={input.steelBays} onChange={(value) => updateNumber("steelBays", value)} />
          <CheckField label="Include roofing / cladding" checked={input.steelCladding} onChange={(value) => update("steelCladding", value)} />
          <CheckField label="Include site erection" checked={input.steelErection} onChange={(value) => update("steelErection", value)} />
          <CheckField label="Crane / heavy lifting required" checked={input.craneRequired} onChange={(value) => update("craneRequired", value)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading eyebrow="Additional scope" title="Include the supporting items that should sit inside this budget." compact />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {input.category === "external-works" ? (
          <>
            <CheckField label="Boundary fence" checked={input.includeFence} onChange={(value) => update("includeFence", value)} />
            <CheckField label="Paving / driveway" checked={input.includePaving} onChange={(value) => update("includePaving", value)} />
            <CheckField label="Drainage" checked={input.includeDrainage} onChange={(value) => update("includeDrainage", value)} />
            <CheckField label="Landscaping" checked={input.includeLandscaping} onChange={(value) => update("includeLandscaping", value)} />
            <CheckField label="Gatehouse" checked={input.includeGatehouse} onChange={(value) => update("includeGatehouse", value)} />
          </>
        ) : (
          <>
            <CheckField label="Premium fitted elements" checked={input.includeKitchenJoinery} onChange={(value) => update("includeKitchenJoinery", value)} />
            <CheckField label="Wardrobes / fitted joinery" checked={input.includeWardrobes} onChange={(value) => update("includeWardrobes", value)} />
            <CheckField label="Security / specialist systems" checked={input.includeSecurity} onChange={(value) => update("includeSecurity", value)} />
          </>
        )}
      </div>
    </div>
  );
}

function EstimateResult({ input, result }: { input: PublicEstimateInput; result: ReturnType<typeof calculatePublicEstimate> }) {
  return (
    <div className="mt-7 overflow-hidden border border-[#0D3B66]/10 bg-white">
      <div className="bg-[#071E33] p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{result.estimateLevel} planning estimate · detail {result.detailScore}%</p>
            <strong className="mt-3 block text-3xl tracking-[-0.04em] md:text-5xl">{money(result.low)} – {money(result.high)}</strong>
            <p className="mt-3 text-sm text-white/60">Likely planning figure: <strong className="text-white">{fullMoney(result.midpoint)}</strong></p>
          </div>
          <div className="min-w-[170px] border border-white/15 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Cost basis</p>
            <strong className="mt-2 block text-lg">{Math.round(result.basisQuantity).toLocaleString()} m²</strong>
            <span className="text-xs text-white/55">{result.basisLabel}</span>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Where the money is going</p>
            <div className="mt-4 divide-y divide-[#0D3B66]/10 border-y border-[#0D3B66]/10">
              {result.sections.map((item) => (
                <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#071E33]">{item.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#3A4653]/65">{item.explanation}</p>
                  </div>
                  <strong className="text-sm text-[#0D3B66]">{money(item.low)} – {money(item.high)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-[#F7F8FA] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Main cost drivers</p>
              <div className="mt-4 space-y-3">
                {result.costDrivers.map((driver) => (
                  <p key={driver} className="flex gap-3 text-xs leading-6 text-[#3A4653]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D3B66]" />
                    {driver}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-4 border border-[#0D3B66]/10 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D3B66]"><CircleHelp className="h-4 w-4 text-[#C8A45D]" />Before you rely on this number</p>
              <div className="mt-4 space-y-2">
                {result.assumptions.map((assumption) => <p key={assumption} className="text-[11px] leading-5 text-[#3A4653]/70">• {assumption}</p>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#0D3B66]/10 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#071E33]">Need a more defensible figure?</p>
            <p className="mt-1 text-xs text-[#3A4653]/65">Move into the full estimator for drawings, measured quantities, BOQ and editable rates.</p>
          </div>
          <Link href="/estimator/app#projects" className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]">
            Build detailed estimate <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, compact = false }: { eyebrow: string; title: string; text?: string; compact?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{eyebrow}</p>
      <h4 className={`mt-2 font-semibold tracking-[-0.025em] text-[#071E33] ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>{title}</h4>
      {text ? <p className="mt-3 max-w-3xl text-xs leading-6 text-[#3A4653]/70">{text}</p> : null}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="text-xs font-semibold text-[#3A4653]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" />
    </label>
  );
}

function NumberField({ label, value, onChange, hint, min = 0, step = 1 }: { label: string; value: number; onChange: (value: string) => void; hint?: string; min?: number; step?: number }) {
  return (
    <label className="text-xs font-semibold text-[#3A4653]">
      <span className="flex items-center justify-between gap-3"><span>{label}</span>{hint ? <span className="font-normal text-[#3A4653]/45">{hint}</span> : null}</span>
      <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="text-xs font-semibold text-[#3A4653]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">
        {options.map(([id, labelText]) => <option key={id} value={id}>{labelText}</option>)}
      </select>
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-xs font-semibold transition ${checked ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#0D3B66]/12 bg-white text-[#3A4653]"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#C8A45D]" />
      {label}
    </label>
  );
}

function MiniNumberToggle({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border border-[#0D3B66]/12 bg-white px-3 text-xs font-semibold text-[#3A4653]">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="grid h-7 w-7 place-items-center border border-[#0D3B66]/15">−</button>
        <span className="w-5 text-center text-[#071E33]">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="grid h-7 w-7 place-items-center border border-[#0D3B66]/15">+</button>
      </div>
    </div>
  );
}
