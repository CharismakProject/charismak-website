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
  Factory,
  Hammer,
  Layers3,
  ListChecks,
  PiggyBank,
  Sofa,
  Sparkles,
  Wrench,
} from "lucide-react";
import EstimatorResultExperience from "@/components/public/estimator-result-experience";
import { calculateEstimateV2, type EstimateCategory, type EstimateInput, type SpecLevel } from "@/lib/projects/public-estimate-engine-v2";
import { createInitialEstimateInput } from "@/lib/projects/public-estimate-defaults";
import { checkBudget, completenessScore, levelFromScore, validateEstimateInput } from "@/lib/projects/public-estimate-decisions";
import type { BuildingUse, PublicFinishLevel } from "@/lib/projects/guided-estimate";

const categories: Array<{ id: EstimateCategory; label: string; short: string; icon: typeof Building2 }> = [
  { id: "new-building", label: "New building", short: "House, flats, office, hotel & more", icon: Building2 },
  { id: "renovation", label: "Renovation", short: "Upgrade, remodelling or strip-out", icon: Hammer },
  { id: "structural-steel", label: "Steel fabrication", short: "Frames, trusses, canopies & structures", icon: Factory },
  { id: "finishes", label: "Finishes", short: "Floors, walls, ceilings & decorative work", icon: Sparkles },
  { id: "furniture", label: "Furniture / joinery", short: "Wardrobes, kitchens, furniture & FF&E", icon: Sofa },
  { id: "external-works", label: "External works", short: "Fence, paving, drainage & landscaping", icon: Layers3 },
  { id: "mep-services", label: "MEP services", short: "Electrical, plumbing, HVAC & systems", icon: Wrench },
];

const finishLevels: Array<{ id: SpecLevel; label: string; note: string }> = [
  { id: "economy", label: "Economy", note: "Functional and cost-conscious" },
  { id: "standard", label: "Standard", note: "Good mid-market specification" },
  { id: "upper-mid", label: "Upper-mid", note: "Better brands and finishes" },
  { id: "premium", label: "Premium", note: "High specification" },
  { id: "luxury", label: "Luxury", note: "Top-end materials and fittings" },
];

const buildingUses: Array<[BuildingUse, string]> = [
  ["residential", "Private house / residential"],
  ["apartments", "Block of flats / apartments"],
  ["commercial", "Office / shop / commercial"],
  ["hotel", "Hotel / serviced apartment"],
  ["school", "School / education"],
  ["healthcare", "Clinic / hospital"],
  ["warehouse", "Warehouse"],
  ["industrial", "Industrial / workshop"],
  ["religious", "Church / mosque / worship"],
  ["mixed-use", "Mixed-use development"],
];

const floorOptions = [["screed", "Screed / minimal"], ["ceramic", "Ceramic tiles"], ["porcelain", "Porcelain tiles"], ["granite", "Granite"], ["marble", "Marble"], ["vinyl", "Vinyl"], ["timber", "Timber"], ["epoxy", "Epoxy"]];
const ceilingOptions = [["none", "No ceiling"], ["pvc", "PVC"], ["gypsum-pop", "Gypsum / POP"], ["suspended", "Suspended acoustic"], ["decorative", "Decorative premium"]];
const acOptions = [["none", "None"], ["provision", "Provision only"], ["split", "Split units"], ["cassette", "Cassette units"], ["vrf", "VRF / VRV"], ["central", "Central HVAC"]];

export default function PublicFeasibilityEstimatorV3() {
  const [input, setInput] = useState<EstimateInput>(() => createInitialEstimateInput());
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());
  const [showMore, setShowMore] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const [showBudgetFirst, setShowBudgetFirst] = useState(false);
  const [budgetFirstText, setBudgetFirstText] = useState("");

  const result = useMemo(() => calculateEstimateV2(input), [input]);
  const score = useMemo(() => completenessScore(input, touchedFields), [input, touchedFields]);
  const estimateLevel = levelFromScore(score);

  const markTouched = (key: keyof EstimateInput) => {
    setTouchedFields((current) => {
      const next = new Set(current);
      next.add(String(key));
      return next;
    });
  };

  const update = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    markTouched(key);
    setShowResult(false);
    setValidation([]);
  };

  const updateNumber = (key: keyof EstimateInput, value: string) => update(key, Math.max(0, Number(value) || 0) as never);

  const selectCategory = (category: EstimateCategory) => {
    setInput((current) => {
      const fresh = createInitialEstimateInput();
      fresh.category = category;
      fresh.location = current.location;
      fresh.finishLevel = current.finishLevel;
      return fresh;
    });
    setTouchedFields((current) => {
      const next = new Set<string>();
      if (current.has("location")) next.add("location");
      if (current.has("finishLevel")) next.add("finishLevel");
      next.add("category");
      return next;
    });
    setShowMore(false);
    setShowResult(false);
    setValidation([]);
    setShowBudgetFirst(false);
  };

  const calculate = () => {
    const issues = validateEstimateInput(input);
    setValidation(issues);
    if (issues.length) {
      setShowResult(false);
      return;
    }
    setShowResult(true);
    requestAnimationFrame(() => document.getElementById("estimate-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const applyInput = (next: EstimateInput) => {
    setTouchedFields((current) => {
      const changed = new Set(current);
      (Object.keys(next) as Array<keyof EstimateInput>).forEach((key) => {
        if (next[key] !== input[key]) changed.add(String(key));
      });
      return changed;
    });
    setInput(next);
    setValidation([]);
    setShowResult(true);
  };

  const budgetFirst = Number(budgetFirstText.replace(/[^0-9.]/g, "")) || 0;
  const budgetSeed = useMemo(() => {
    if (!budgetFirst) return null;
    const seed = { ...input };
    if (seed.category === "new-building" && !seed.totalFloorAreaM2 && !seed.footprintM2) seed.totalFloorAreaM2 = 150;
    else if (seed.category !== "new-building" && !seed.workAreaM2 && !seed.steelTonnes) seed.workAreaM2 = 100;
    const seedResult = calculateEstimateV2(seed);
    return checkBudget(seed, seedResult, budgetFirst);
  }, [budgetFirst, input]);

  const useBudgetCapacity = () => {
    if (!budgetSeed?.indicativeCapacityLow || !budgetSeed?.indicativeCapacityHigh) return;
    const midpoint = (budgetSeed.indicativeCapacityLow + budgetSeed.indicativeCapacityHigh) / 2;
    if (input.category === "new-building" && budgetSeed.capacityUnit === "m²") update("totalFloorAreaM2", Math.round(midpoint));
    else if (budgetSeed.capacityUnit === "m²") update("workAreaM2", Math.round(midpoint));
  };

  return (
    <section id="quick-building-cost" className="bg-white px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 xl:grid-cols-[0.62fr_1.38fr] xl:items-start">
          <aside className="xl:sticky xl:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Public feasibility estimator</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-[#071E33] md:text-5xl">Describe the work. We’ll price the things that actually drive it.</h2>
            <p className="mt-6 text-base leading-8 text-[#3A4653]">The questionnaire changes with the selected construction scope. Enter only what you know, then use <strong>Add more details</strong> when you want a tighter planning range.</p>
            <div className="mt-7 border border-[#C8A45D]/35 bg-[#FFF9ED] p-5"><p className="flex gap-3 text-sm leading-7 text-[#74520D]"><AlertTriangle className="mt-1 h-5 w-5 shrink-0" />The percentage measures information actually supplied. Default technical selections are assumptions until you confirm or change them.</p></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[["70%+", "Quick estimate", "Enough for early feasibility"], ["85%+", "Detailed estimate", "More measured quantities and specifications"], ["Professional", "Next step", "Contact Charismak for drawings / BOQ review"]].map(([value, title, text]) => <div key={title} className="border-l border-[#C8A45D] pl-4"><strong className="text-lg text-[#071E33]">{value}</strong><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0D3B66]">{title}</p><p className="mt-1 text-xs leading-5 text-[#3A4653]/70">{text}</p></div>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold"><Link href="/prices" className="inline-flex items-center gap-2 text-[#0D3B66] hover:text-[#C8A45D]">View price references <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 text-[#0D3B66] hover:text-[#C8A45D]">Contact us <ArrowRight className="h-4 w-4" /></Link></div>
          </aside>

          <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(7,30,51,0.09)] md:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-[#0D3B66]/10 pb-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]"><Calculator className="h-5 w-5" /></span><div><h3 className="font-semibold text-[#071E33]">What are you estimating?</h3><p className="mt-1 text-xs text-[#3A4653]/70">No account needed for the preliminary result.</p></div></div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D3B66]"><ListChecks className="h-4 w-4 text-[#C8A45D]" />{estimateLevel} · Detail {score}%</div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = input.category === item.id;
                return <button key={item.id} type="button" onClick={() => selectCategory(item.id)} className={`p-4 text-left transition ${active ? "bg-[#071E33] text-white shadow-lg" : "border border-[#0D3B66]/10 bg-white text-[#071E33] hover:border-[#C8A45D]"}`}><Icon className={`h-5 w-5 ${active ? "text-[#C8A45D]" : "text-[#0D3B66]"}`} /><strong className="mt-4 block text-sm">{item.label}</strong><span className={`mt-1 block text-[11px] leading-5 ${active ? "text-white/60" : "text-[#3A4653]/65"}`}>{item.short}</span></button>;
              })}
            </div>

            <div className="mt-7 grid gap-4 border-t border-[#0D3B66]/10 pt-7 md:grid-cols-2">
              <TextField label="Project location" value={input.location} onChange={(value) => update("location", value)} placeholder="City / State, e.g. Abuja" />
              <SelectField label="Overall specification level" value={input.finishLevel} onChange={(value) => update("finishLevel", value as PublicFinishLevel)} options={finishLevels.map((item) => [item.id, `${item.label} — ${item.note}`])} />
            </div>

            <button type="button" onClick={() => setShowBudgetFirst((value) => !value)} className="mt-5 flex w-full items-center justify-between border border-[#C8A45D]/35 bg-[#FFF9ED] px-5 py-4 text-left">
              <span className="flex items-center gap-3"><PiggyBank className="h-5 w-5 text-[#9A6416]" /><span><strong className="block text-sm text-[#071E33]">I know my budget — what might it support?</strong><span className="mt-1 block text-xs text-[#74520D]/75">Optional budget-first planning mode.</span></span></span>{showBudgetFirst ? <ChevronUp className="h-5 w-5 text-[#9A6416]" /> : <ChevronDown className="h-5 w-5 text-[#9A6416]" />}
            </button>
            {showBudgetFirst ? <div className="mt-3 border border-[#C8A45D]/25 bg-white p-5"><NumberTextField label="Available construction budget (₦)" value={budgetFirstText} onChange={setBudgetFirstText} placeholder="e.g. 50000000" />{budgetSeed ? <div className="mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0D3B66]">{budgetSeed.status}</p>{budgetSeed.indicativeCapacityLow && budgetSeed.indicativeCapacityHigh ? <><strong className="mt-2 block text-xl text-[#071E33]">{formatQuantity(budgetSeed.indicativeCapacityLow)}–{formatQuantity(budgetSeed.indicativeCapacityHigh)} {budgetSeed.capacityUnit}</strong><p className="mt-1 text-xs leading-5 text-[#3A4653]/65">{budgetSeed.capacityLabel}</p>{budgetSeed.capacityUnit === "m²" ? <button type="button" onClick={useBudgetCapacity} className="mt-3 text-xs font-bold text-[#0D3B66]">Use the midpoint as my starting area →</button> : null}</> : null}</div> : <p className="mt-3 text-xs text-[#3A4653]/60">Enter a budget to see an indicative capacity at the currently selected specification.</p>}</div> : null}

            <div className="mt-7"><CoreQuestions input={input} update={update} updateNumber={updateNumber} /></div>

            <button type="button" onClick={() => { const next = !showMore; setShowMore(next); setInput((current) => ({ ...current, detailedMode: next })); }} className="mt-7 flex w-full items-center justify-between border-y border-[#0D3B66]/10 bg-white px-5 py-4 text-left"><span><strong className="block text-sm text-[#071E33]">{showMore ? "Hide detailed questions" : "Add more details for a tighter estimate"}</strong><span className="mt-1 block text-xs leading-5 text-[#3A4653]/70">Opening this section does not increase the detail score; answering it does.</span></span>{showMore ? <ChevronUp className="h-5 w-5 text-[#0D3B66]" /> : <ChevronDown className="h-5 w-5 text-[#0D3B66]" />}</button>
            {showMore ? <div className="mt-7"><DetailedQuestions input={input} update={update} updateNumber={updateNumber} /></div> : null}

            {validation.length ? <div className="mt-6 border border-red-200 bg-red-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">Please review before calculating</p><div className="mt-2 space-y-1">{validation.map((item) => <p key={item} className="text-xs leading-5 text-red-700">• {item}</p>)}</div></div> : null}

            <button type="button" onClick={calculate} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"><Calculator className="h-5 w-5" />Calculate preliminary project cost</button>
            {showResult ? <div id="estimate-result" className="scroll-mt-28"><EstimatorResultExperience input={input} result={result} score={score} onApplyInput={applyInput} /></div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreQuestions({ input, update, updateNumber }: FieldProps) {
  if (input.category === "new-building") return <div><SectionHeading eyebrow="Building basics" title="Tell us the size, use and accommodation." text="If you do not know the total floor area, the estimator can infer a planning area from the accommodation and/or footprint." /><div className="mt-5 grid gap-4 md:grid-cols-2"><SelectField label="Building use" value={input.buildingUse} onChange={(value) => update("buildingUse", value as BuildingUse)} options={buildingUses} /><NumberField label="Land area (m²)" value={input.landAreaM2} onChange={(value) => updateNumber("landAreaM2", value)} hint="0 if unknown" /><NumberField label="Ground-floor footprint (m²)" value={input.footprintM2} onChange={(value) => updateNumber("footprintM2", value)} hint="0 if unknown" /><NumberField label="Total floor area / GFA (m²)" value={input.totalFloorAreaM2} onChange={(value) => updateNumber("totalFloorAreaM2", value)} hint="0 if unknown" /><NumberField label="Floors above ground floor" value={input.floorsAboveGround} onChange={(value) => updateNumber("floorsAboveGround", value)} hint="0 = bungalow / ground only" /><NumberField label="Number of units / apartments" value={input.units} onChange={(value) => updateNumber("units", value)} min={1} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Accommodation / spaces</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><NumberField label="Bedrooms" value={input.bedrooms} onChange={(value) => updateNumber("bedrooms", value)} /><NumberField label="Bathrooms / WCs" value={input.bathrooms} onChange={(value) => updateNumber("bathrooms", value)} /><NumberField label="Living rooms" value={input.livingRooms} onChange={(value) => updateNumber("livingRooms", value)} /><NumberField label="Kitchens" value={input.kitchens} onChange={(value) => updateNumber("kitchens", value)} /><NumberField label="Family lounges" value={input.familyLounges} onChange={(value) => updateNumber("familyLounges", value)} /><SelectField label="Dining" value={input.dining} onChange={(value) => update("dining", value as EstimateInput["dining"])} options={[["none", "No dining"], ["combined", "Combined with living"], ["separate", "Separate dining room"]]} /></div></div>;

  if (input.category === "structural-steel") return <div><SectionHeading eyebrow="Steel core questions" title="First establish the structure and likely steel quantity." text="If tonnage is unknown, area + structure type + geometry are used to infer a weight range." /><div className="mt-5 grid gap-4 md:grid-cols-2"><SelectField label="What are you fabricating?" value={input.steelStructureType} onChange={(value) => update("steelStructureType", value as EstimateInput["steelStructureType"])} options={[["warehouse", "Warehouse / portal frame"], ["canopy", "Canopy / carport"], ["roof-truss", "Roof trusses"], ["mezzanine", "Mezzanine"], ["multi-storey-frame", "Multi-storey steel frame"], ["platform", "Platform / support frame"], ["staircase", "Steel staircase"], ["other", "Other steel structure"]]} /><NumberField label="Covered / structural area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} hint="0 if tonnage is known" /><NumberField label="Steel tonnage, if known" value={input.steelTonnes} onChange={(value) => updateNumber("steelTonnes", value)} hint="0 = infer weight" step={0.1} /><NumberField label="Typical clear span (m)" value={input.steelSpanM} onChange={(value) => updateNumber("steelSpanM", value)} hint="Strongly recommended" step={0.1} /></div></div>;

  if (input.category === "renovation") return <div><SectionHeading eyebrow="Renovation core questions" title="Tell us what existing space is being changed." /><div className="mt-5 grid gap-4 md:grid-cols-2"><SelectField label="Property use" value={input.renovationUse} onChange={(value) => update("renovationUse", value as EstimateInput["renovationUse"])} options={[["residential", "Residential"], ["office", "Office"], ["retail", "Retail / shop"], ["hotel", "Hotel / hospitality"], ["restaurant", "Restaurant"], ["other", "Other"]]} /><NumberField label="Renovation area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} /><SelectField label="Overall renovation intensity" value={input.renovationIntensity} onChange={(value) => update("renovationIntensity", value as EstimateInput["renovationIntensity"])} options={[["light", "Light refresh"], ["moderate", "Moderate renovation"], ["major", "Major renovation"], ["full-strip", "Full strip-out / rebuild internally"]]} /><NumberField label="Bathrooms being renovated" value={input.bathroomRenovations} onChange={(value) => updateNumber("bathroomRenovations", value)} /><NumberField label="Kitchens being renovated" value={input.kitchenRenovations} onChange={(value) => updateNumber("kitchenRenovations", value)} /></div></div>;

  if (input.category === "finishes") return <div><SectionHeading eyebrow="Finishes core questions" title="Measure each finish by the surface it actually covers." /><div className="mt-5 grid gap-4 md:grid-cols-2"><NumberField label="Floor finish area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} /><SelectField label="Floor finish" value={input.floorFinish} onChange={(value) => update("floorFinish", value as EstimateInput["floorFinish"])} options={floorOptions} /><SelectField label="Wall finish" value={input.wallFinish} onChange={(value) => update("wallFinish", value as EstimateInput["wallFinish"])} options={[["paint", "Paint"], ["wallpaper", "Wallpaper"], ["tile", "Wall tiles"], ["stone", "Stone / marble"], ["panel", "Wall panels"]]} /><NumberField label="Wall finish area (m²), if known" value={input.wallFinishAreaM2} onChange={(value) => updateNumber("wallFinishAreaM2", value)} hint="0 = infer from floor area" /></div></div>;

  if (input.category === "furniture") return <div><SectionHeading eyebrow="Furniture / joinery core" title="Use counts and linear metres wherever possible." /><div className="mt-5 grid gap-4 md:grid-cols-2"><SelectField label="Furniture level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as EstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} /><NumberField label="Approximate furnished area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} hint="Optional if item counts are known" /><NumberField label="Wardrobes (linear m)" value={input.wardrobeLengthM} onChange={(value) => updateNumber("wardrobeLengthM", value)} step={0.1} /><NumberField label="Kitchen cabinets (linear m)" value={input.kitchenCabinetLengthM} onChange={(value) => updateNumber("kitchenCabinetLengthM", value)} step={0.1} /></div></div>;

  if (input.category === "external-works") return <div><SectionHeading eyebrow="External works core" title="Enter actual lengths and areas around the site." /><div className="mt-5 grid gap-4 md:grid-cols-2"><NumberField label="Land / site area (m²)" value={input.landAreaM2} onChange={(value) => updateNumber("landAreaM2", value)} hint="Useful for sanity checks" /><NumberField label="Boundary fence length (m)" value={input.fenceLengthM} onChange={(value) => updateNumber("fenceLengthM", value)} /><NumberField label="Paving / parking area (m²)" value={input.pavingAreaM2} onChange={(value) => updateNumber("pavingAreaM2", value)} /><NumberField label="Drainage length (m)" value={input.drainageLengthM} onChange={(value) => updateNumber("drainageLengthM", value)} /><NumberField label="Landscaping area (m²)" value={input.landscapingAreaM2} onChange={(value) => updateNumber("landscapingAreaM2", value)} /><NumberField label="General external-work area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} hint="Fallback only if quantities are unknown" /></div></div>;

  return <div><SectionHeading eyebrow="MEP core questions" title="Count the points, fixtures and equipment that need services." /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><NumberField label="Serviced building area (m²)" value={input.workAreaM2} onChange={(value) => updateNumber("workAreaM2", value)} hint="Fallback basis if quantities are incomplete" /><NumberField label="Power / socket points" value={input.electricalPoints} onChange={(value) => updateNumber("electricalPoints", value)} /><NumberField label="Lighting points" value={input.lightingPoints} onChange={(value) => updateNumber("lightingPoints", value)} /><NumberField label="Bathrooms / WC groups" value={input.mepBathrooms} onChange={(value) => updateNumber("mepBathrooms", value)} /><NumberField label="Kitchen service groups" value={input.mepKitchens} onChange={(value) => updateNumber("mepKitchens", value)} /><NumberField label="AC units / zones" value={input.acUnits} onChange={(value) => updateNumber("acUnits", value)} /></div></div>;
}

function DetailedQuestions({ input, update, updateNumber }: FieldProps) {
  if (input.category === "new-building") return <div className="space-y-9">
    <div><SectionHeading eyebrow="Structure & site" title="Refine the structure and envelope." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><SelectField label="Site / soil condition" value={input.siteCondition} onChange={(value) => update("siteCondition", value as EstimateInput["siteCondition"])} options={[["unknown", "I don't know — use allowance"], ["good", "Good / firm"], ["normal", "Normal"], ["weak", "Weak"], ["waterlogged", "Waterlogged / difficult"]]} /><SelectField label="Foundation" value={input.foundationType} onChange={(value) => update("foundationType", value as EstimateInput["foundationType"])} options={[["recommend", "Recommend / unknown"], ["strip-pad", "Strip / pad"], ["raft", "Raft"], ["pile", "Pile"]]} /><SelectField label="Structural frame" value={input.frameType} onChange={(value) => update("frameType", value as EstimateInput["frameType"])} options={[["recommend", "Recommend / unknown"], ["masonry", "Load-bearing masonry"], ["reinforced-concrete", "Reinforced concrete"], ["steel", "Structural steel"], ["composite", "Composite"]]} /><SelectField label="Roof type" value={input.roofType} onChange={(value) => update("roofType", value as EstimateInput["roofType"])} options={[["pitched-aluminium", "Pitched aluminium"], ["stone-coated", "Stone coated"], ["flat-concrete", "Flat concrete"], ["steel-roof", "Steel roof"], ["combination", "Combination"]]} /><SelectField label="Roof complexity" value={input.roofComplexity} onChange={(value) => update("roofComplexity", value as EstimateInput["roofComplexity"])} options={[["simple", "Simple"], ["moderate", "Moderate"], ["complex", "Complex / hips & valleys"]]} /><SelectField label="Façade" value={input.facadeSpec} onChange={(value) => update("facadeSpec", value as EstimateInput["facadeSpec"])} options={[["paint-render", "Paint / rendered wall"], ["mixed-cladding", "Mixed cladding"], ["stone-tile", "Stone / tile cladding"], ["alucobond", "Alucobond / ACP"], ["curtain-wall", "Curtain wall"]]} /></div></div>
    <div><SectionHeading eyebrow="Openings & finishes" title="Choose the specification that best matches the project." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><SelectField label="Windows" value={input.windowSpec} onChange={(value) => update("windowSpec", value as EstimateInput["windowSpec"])} options={[["standard-aluminium", "Standard aluminium"], ["premium-aluminium", "Premium aluminium"], ["upvc", "uPVC"], ["double-glazed", "Double glazed"], ["curtain-wall", "Curtain wall / large glazing"]]} /><SelectField label="Doors" value={input.doorSpec} onChange={(value) => update("doorSpec", value as EstimateInput["doorSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["premium", "Premium"], ["security-premium", "Security + premium"]]} /><SelectField label="Floor finish" value={input.floorFinish} onChange={(value) => update("floorFinish", value as EstimateInput["floorFinish"])} options={floorOptions} /><SelectField label="Ceiling" value={input.ceilingFinish} onChange={(value) => update("ceilingFinish", value as EstimateInput["ceilingFinish"])} options={ceilingOptions} /><SelectField label="Kitchen specification" value={input.kitchenSpec} onChange={(value) => update("kitchenSpec", value as EstimateInput["kitchenSpec"])} options={[["basic", "Basic cabinetry"], ["standard", "Standard fitted kitchen"], ["premium", "Premium fitted kitchen"], ["luxury", "Luxury / imported"]]} /><SelectField label="Bathrooms / sanitary" value={input.bathroomSpec} onChange={(value) => update("bathroomSpec", value as EstimateInput["bathroomSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><NumberField label="Balconies / verandas" value={input.balconies} onChange={(value) => updateNumber("balconies", value)} /><NumberField label="Staircases" value={input.staircases} onChange={(value) => updateNumber("staircases", value)} /><NumberField label="Lifts" value={input.lifts} onChange={(value) => updateNumber("lifts", value)} /><NumberField label="Study / office rooms" value={input.studies} onChange={(value) => updateNumber("studies", value)} /><NumberField label="Laundry rooms" value={input.laundries} onChange={(value) => updateNumber("laundries", value)} /><NumberField label="BQ / staff rooms" value={input.bqRooms} onChange={(value) => updateNumber("bqRooms", value)} /><CheckField label="Fitted wardrobes" checked={input.includeWardrobes} onChange={(value) => update("includeWardrobes", value)} /><CheckField label="Kitchen joinery" checked={input.includeKitchenJoinery} onChange={(value) => update("includeKitchenJoinery", value)} /></div></div>
    <div><SectionHeading eyebrow="Building services" title="Power, water, cooling and specialist systems." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><SelectField label="Electrical specification" value={input.electricalSpec} onChange={(value) => update("electricalSpec", value as EstimateInput["electricalSpec"])} options={[["basic", "Basic"], ["standard", "Standard"], ["high", "High specification"]]} /><SelectField label="Air-conditioning" value={input.acSpec} onChange={(value) => update("acSpec", value as EstimateInput["acSpec"])} options={acOptions} /><SelectField label="Water system" value={input.waterSystem} onChange={(value) => update("waterSystem", value as EstimateInput["waterSystem"])} options={[["basic", "Basic / public supply"], ["borehole", "Borehole + tank"], ["borehole-treatment", "Borehole + treatment"], ["enhanced-storage", "Enhanced storage"]]} /><SelectField label="Waste system" value={input.wasteSystem} onChange={(value) => update("wasteSystem", value as EstimateInput["wasteSystem"])} options={[["public-sewer", "Public sewer"], ["septic", "Septic / soakaway"], ["treatment-plant", "Treatment plant"]]} /><SelectField label="Power backup" value={input.powerSystem} onChange={(value) => update("powerSystem", value as EstimateInput["powerSystem"])} options={[["grid", "Grid only"], ["generator", "Generator"], ["inverter", "Inverter"], ["solar", "Solar"], ["hybrid", "Hybrid"]]} /><div className="grid gap-3"><CheckField label="CCTV / access / security" checked={input.includeSecurity} onChange={(value) => update("includeSecurity", value)} /><CheckField label="Fire alarm / firefighting" checked={input.includeFireSystem} onChange={(value) => update("includeFireSystem", value)} /></div></div></div>
    <div><SectionHeading eyebrow="External works & furniture" title="Choose what should sit inside the same project budget." compact /><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><CheckField label="General external works" checked={input.includeExternalWorks} onChange={(value) => update("includeExternalWorks", value)} /><CheckField label="Boundary fence" checked={input.includeFence} onChange={(value) => update("includeFence", value)} /><CheckField label="Gatehouse" checked={input.includeGatehouse} onChange={(value) => update("includeGatehouse", value)} /><CheckField label="Paving / driveway / parking" checked={input.includePaving} onChange={(value) => update("includePaving", value)} /><CheckField label="Drainage" checked={input.includeDrainage} onChange={(value) => update("includeDrainage", value)} /><CheckField label="Landscaping" checked={input.includeLandscaping} onChange={(value) => update("includeLandscaping", value)} /><CheckField label="Swimming pool" checked={input.includePool} onChange={(value) => update("includePool", value)} /><CheckField label="Furniture / FF&E" checked={input.includeFurniture} onChange={(value) => update("includeFurniture", value)} />{input.includeFurniture ? <SelectField label="Furniture level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as EstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} /> : null}</div></div>
  </div>;

  if (input.category === "structural-steel") return <div><SectionHeading eyebrow="Steel details" title="Geometry, protection and erection information." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><NumberField label="Structure height (m)" value={input.steelHeightM} onChange={(value) => updateNumber("steelHeightM", value)} step={0.1} /><NumberField label="Number of bays" value={input.steelBays} onChange={(value) => updateNumber("steelBays", value)} /><SelectField label="Steel coating" value={input.steelCoating} onChange={(value) => update("steelCoating", value as EstimateInput["steelCoating"])} options={[["primer", "Primer / standard paint"], ["epoxy", "Epoxy coating"], ["galvanized", "Galvanized"], ["fireproof", "Fire-protective coating"]]} /><CheckField label="Include site erection" checked={input.steelErection} onChange={(value) => update("steelErection", value)} /><CheckField label="Crane / heavy lifting" checked={input.craneRequired} onChange={(value) => update("craneRequired", value)} /><CheckField label="Include foundations / anchors" checked={input.steelFoundations} onChange={(value) => update("steelFoundations", value)} /><CheckField label="Include roof / wall cladding" checked={input.steelCladding} onChange={(value) => update("steelCladding", value)} />{input.steelCladding ? <><NumberField label="Roof cladding area (m²)" value={input.roofCladdingAreaM2} onChange={(value) => updateNumber("roofCladdingAreaM2", value)} /><NumberField label="Wall cladding area (m²)" value={input.wallCladdingAreaM2} onChange={(value) => updateNumber("wallCladdingAreaM2", value)} /></> : null}</div></div>;

  if (input.category === "renovation") return <div><SectionHeading eyebrow="Renovation detail" title="Tell us how much of each existing element is actually changing." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><PercentField label="Demolition / strip-out" value={input.demolitionPercent} onChange={(value) => updateNumber("demolitionPercent", value)} /><PercentField label="Floor replacement" value={input.floorReplacementPercent} onChange={(value) => updateNumber("floorReplacementPercent", value)} /><PercentField label="Ceiling replacement" value={input.ceilingReplacementPercent} onChange={(value) => updateNumber("ceilingReplacementPercent", value)} /><PercentField label="Repainting" value={input.paintingPercent} onChange={(value) => updateNumber("paintingPercent", value)} /><PercentField label="Electrical rewiring" value={input.electricalRewirePercent} onChange={(value) => updateNumber("electricalRewirePercent", value)} /><PercentField label="Plumbing renewal" value={input.plumbingRenewalPercent} onChange={(value) => updateNumber("plumbingRenewalPercent", value)} /><NumberField label="Windows replaced" value={input.windowReplacementCount} onChange={(value) => updateNumber("windowReplacementCount", value)} /><NumberField label="Doors replaced" value={input.doorReplacementCount} onChange={(value) => updateNumber("doorReplacementCount", value)} /><NumberField label="AC units replaced" value={input.acReplacementCount} onChange={(value) => updateNumber("acReplacementCount", value)} /><CheckField label="Structural alterations / new openings" checked={input.structuralAlteration} onChange={(value) => update("structuralAlteration", value)} /></div></div>;

  if (input.category === "finishes") return <div><SectionHeading eyebrow="Finish details" title="Add the remaining measured finish surfaces." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><SelectField label="Ceiling type" value={input.ceilingFinish} onChange={(value) => update("ceilingFinish", value as EstimateInput["ceilingFinish"])} options={ceilingOptions} /><NumberField label="Ceiling area (m²)" value={input.ceilingAreaM2} onChange={(value) => updateNumber("ceilingAreaM2", value)} hint="0 = use floor area" /><NumberField label="Wet-area wall tiles (m²)" value={input.wetWallTileAreaM2} onChange={(value) => updateNumber("wetWallTileAreaM2", value)} /><NumberField label="Additional painting area (m²)" value={input.paintingAreaM2} onChange={(value) => updateNumber("paintingAreaM2", value)} /><NumberField label="Skirting length (m)" value={input.skirtingLengthM} onChange={(value) => updateNumber("skirtingLengthM", value)} /></div></div>;

  if (input.category === "furniture") return <div><SectionHeading eyebrow="Furniture / joinery detail" title="Count each package or fitted item." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><NumberField label="TV / media units" value={input.tvUnits} onChange={(value) => updateNumber("tvUnits", value)} /><NumberField label="Bedroom furniture sets" value={input.bedroomFurnitureSets} onChange={(value) => updateNumber("bedroomFurnitureSets", value)} /><NumberField label="Living-room sets" value={input.livingFurnitureSets} onChange={(value) => updateNumber("livingFurnitureSets", value)} /><NumberField label="Dining sets" value={input.diningFurnitureSets} onChange={(value) => updateNumber("diningFurnitureSets", value)} /><NumberField label="Office workstations" value={input.officeWorkstations} onChange={(value) => updateNumber("officeWorkstations", value)} /><NumberField label="Curtain / blind area (m²)" value={input.curtainAreaM2} onChange={(value) => updateNumber("curtainAreaM2", value)} /><NumberField label="Bathroom vanities" value={input.bathroomVanities} onChange={(value) => updateNumber("bathroomVanities", value)} /></div></div>;

  if (input.category === "external-works") return <div><SectionHeading eyebrow="External-work detail" title="Add the remaining site quantities." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><NumberField label="Gate sets" value={input.gateCount} onChange={(value) => updateNumber("gateCount", value)} /><NumberField label="Gatehouse area (m²)" value={input.gatehouseAreaM2} onChange={(value) => updateNumber("gatehouseAreaM2", value)} /><NumberField label="Pool water-surface area (m²)" value={input.poolAreaM2} onChange={(value) => updateNumber("poolAreaM2", value)} /><NumberField label="Retaining wall face area (m²)" value={input.retainingWallAreaM2} onChange={(value) => updateNumber("retainingWallAreaM2", value)} /><NumberField label="External lighting points" value={input.externalLightingPoints} onChange={(value) => updateNumber("externalLightingPoints", value)} /></div></div>;

  return <div><SectionHeading eyebrow="MEP detail" title="Add capacities and equipment that materially change the services budget." compact /><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"><NumberField label="Data / low-current points" value={input.dataPoints} onChange={(value) => updateNumber("dataPoints", value)} /><SelectField label="AC system" value={input.acSpec} onChange={(value) => update("acSpec", value as EstimateInput["acSpec"])} options={acOptions} /><NumberField label="Water heaters" value={input.waterHeaters} onChange={(value) => updateNumber("waterHeaters", value)} /><NumberField label="Pumps" value={input.pumps} onChange={(value) => updateNumber("pumps", value)} /><CheckField label="Borehole" checked={input.includeBorehole} onChange={(value) => update("includeBorehole", value)} /><CheckField label="Water treatment" checked={input.includeWaterTreatment} onChange={(value) => update("includeWaterTreatment", value)} /><CheckField label="Septic / soakaway" checked={input.includeSeptic} onChange={(value) => update("includeSeptic", value)} /><CheckField label="Sewage treatment plant" checked={input.includeTreatmentPlant} onChange={(value) => update("includeTreatmentPlant", value)} /><NumberField label="Generator capacity (kVA)" value={input.generatorKva} onChange={(value) => updateNumber("generatorKva", value)} /><NumberField label="Inverter capacity (kVA)" value={input.inverterKva} onChange={(value) => updateNumber("inverterKva", value)} /><NumberField label="Solar PV capacity (kW)" value={input.solarKw} onChange={(value) => updateNumber("solarKw", value)} /><NumberField label="Security / CCTV points" value={input.securityPoints} onChange={(value) => updateNumber("securityPoints", value)} /><NumberField label="Fire-system points" value={input.firePoints} onChange={(value) => updateNumber("firePoints", value)} /><NumberField label="Lifts" value={input.mepLifts} onChange={(value) => updateNumber("mepLifts", value)} /></div></div>;
}

type FieldProps = { input: EstimateInput; update: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void; updateNumber: (key: keyof EstimateInput, value: string) => void };

function SectionHeading({ eyebrow, title, text, compact = false }: { eyebrow: string; title: string; text?: string; compact?: boolean }) { return <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{eyebrow}</p><h4 className={`mt-2 font-semibold tracking-[-0.025em] text-[#071E33] ${compact ? "text-xl" : "text-2xl md:text-3xl"}`}>{title}</h4>{text ? <p className="mt-3 max-w-3xl text-xs leading-6 text-[#3A4653]/70">{text}</p> : null}</div>; }
function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function NumberTextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function NumberField({ label, value, onChange, hint, min = 0, step = 1 }: { label: string; value: number; onChange: (value: string) => void; hint?: string; min?: number; step?: number }) { return <label className="text-xs font-semibold text-[#3A4653]"><span className="flex items-center justify-between gap-2"><span>{label}</span>{hint ? <span className="font-normal text-[#3A4653]/45">{hint}</span> : null}</span><input type="number" min={min} step={step} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="0" className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function PercentField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) { return <NumberField label={`${label} (%)`} value={value} onChange={onChange} min={0} />; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-xs font-semibold transition ${checked ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#0D3B66]/12 bg-white text-[#3A4653]"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#C8A45D]" />{label}</label>; }
const formatQuantity = (value: number) => value < 10 ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value).toLocaleString();
