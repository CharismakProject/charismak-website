"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calculator,
  Factory,
  Hammer,
  Layers3,
  Sofa,
  Sparkles,
  Wrench,
} from "lucide-react";
import { calculateEstimateV2, type EstimateCategory, type EstimateInput, type SpecLevel } from "@/lib/projects/public-estimate-engine-v2";
import { createInitialEstimateInput, saveQuickEstimateTransfer } from "@/lib/projects/public-estimate-defaults";
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
  ["economy", "Economy"],
  ["standard", "Standard"],
  ["upper-mid", "Upper-mid"],
  ["premium", "Premium"],
  ["luxury", "Luxury"],
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

function quantityLabel(category: EstimateCategory) {
  if (category === "new-building") return "Approximate total floor area (m²)";
  if (category === "structural-steel") return "Approximate covered / structural area (m²)";
  if (category === "renovation") return "Approximate renovation area (m²)";
  if (category === "finishes") return "Approximate finish area (m²)";
  if (category === "furniture") return "Approximate furnished area (m²)";
  if (category === "external-works") return "Approximate external-work area (m²)";
  return "Approximate serviced area (m²)";
}

function secondaryField(input: EstimateInput, update: <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => void) {
  if (input.category === "new-building") {
    return <SelectField label="Building type" value={input.buildingUse} onChange={(value) => update("buildingUse", value as BuildingUse)} options={buildingUses} />;
  }
  if (input.category === "renovation") {
    return <SelectField label="Renovation level" value={input.renovationIntensity} onChange={(value) => update("renovationIntensity", value as EstimateInput["renovationIntensity"])} options={[["light", "Light refresh"], ["moderate", "Moderate renovation"], ["major", "Major renovation"], ["full-strip", "Full strip-out"]]} />;
  }
  if (input.category === "structural-steel") {
    return <SelectField label="Steel structure" value={input.steelStructureType} onChange={(value) => update("steelStructureType", value as EstimateInput["steelStructureType"])} options={[["warehouse", "Warehouse / portal frame"], ["canopy", "Canopy / carport"], ["roof-truss", "Roof trusses"], ["mezzanine", "Mezzanine"], ["multi-storey-frame", "Multi-storey frame"], ["platform", "Platform / support frame"], ["staircase", "Steel staircase"], ["other", "Other"]]} />;
  }
  if (input.category === "finishes") {
    return <SelectField label="Main floor finish" value={input.floorFinish} onChange={(value) => update("floorFinish", value as EstimateInput["floorFinish"])} options={[["screed", "Screed / minimal"], ["ceramic", "Ceramic tiles"], ["porcelain", "Porcelain tiles"], ["granite", "Granite"], ["marble", "Marble"], ["vinyl", "Vinyl"], ["timber", "Timber"], ["epoxy", "Epoxy"]]} />;
  }
  if (input.category === "furniture") {
    return <SelectField label="Furniture / joinery level" value={input.furnitureLevel} onChange={(value) => update("furnitureLevel", value as EstimateInput["furnitureLevel"])} options={[["essential", "Essential"], ["standard", "Standard"], ["premium", "Premium"], ["luxury", "Luxury"]]} />;
  }
  if (input.category === "mep-services") {
    return <SelectField label="Cooling basis" value={input.acSpec} onChange={(value) => update("acSpec", value as EstimateInput["acSpec"])} options={[["none", "No cooling included"], ["provision", "AC provision only"], ["split", "Split AC"], ["cassette", "Cassette AC"], ["vrf", "VRF / VRV"], ["central", "Central HVAC"]]} />;
  }
  return <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 text-xs leading-6 text-[#3A4653]/70">For a quick external-works estimate, use the approximate combined area. The detailed estimator lets you enter fence length, paving, drainage, landscaping, gatehouse, pool and retaining-wall quantities separately.</div>;
}

export default function QuickEstimateHome() {
  const router = useRouter();
  const [input, setInput] = useState<EstimateInput>(() => createInitialEstimateInput());
  const [showResult, setShowResult] = useState(false);
  const [message, setMessage] = useState("");

  const result = useMemo(() => calculateEstimateV2(input), [input]);

  const update = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setShowResult(false);
    setMessage("");
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
    setMessage("");
  };

  const area = input.category === "new-building" ? input.totalFloorAreaM2 : input.workAreaM2;

  const updateArea = (value: string) => {
    const numeric = Math.max(0, Number(value) || 0);
    if (input.category === "new-building") update("totalFloorAreaM2", numeric);
    else update("workAreaM2", numeric);
  };

  const calculate = () => {
    if (!input.location.trim()) {
      setMessage("Enter the project location.");
      return;
    }
    if (!area) {
      setMessage("Enter an approximate area so the quick estimate has a cost basis.");
      return;
    }
    setMessage("");
    setShowResult(true);
  };

  const continueDetailed = () => {
    const transfer: Partial<EstimateInput> = {
      category: input.category,
      location: input.location,
      finishLevel: input.finishLevel,
      buildingUse: input.buildingUse,
      totalFloorAreaM2: input.totalFloorAreaM2,
      workAreaM2: input.workAreaM2,
      renovationIntensity: input.renovationIntensity,
      steelStructureType: input.steelStructureType,
      floorFinish: input.floorFinish,
      furnitureLevel: input.furnitureLevel,
      acSpec: input.acSpec,
    };
    saveQuickEstimateTransfer(transfer);
    router.push("/estimator/detailed");
  };

  return (
    <section id="quick-estimate" className="bg-white px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Quick Estimate</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#071E33] md:text-5xl">A useful budget range in about a minute.</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#3A4653]">Give us the project type, location, approximate size and specification. We use the same calculation engine as the detailed estimator, but with fewer project facts and therefore wider assumptions.</p>
            <div className="mt-7 border-l-2 border-[#C8A45D] bg-[#FFF9ED] p-5 text-sm leading-7 text-[#74520D]">Quick Estimate is for early feasibility. If the number matters for procurement, financing, tendering or contract decisions, continue to the Detailed Estimate or contact Charismak with drawings and quantities.</div>
          </div>

          <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(7,30,51,0.09)] md:p-7">
            <div className="flex items-center gap-3 border-b border-[#0D3B66]/10 pb-5"><span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]"><Calculator className="h-5 w-5" /></span><div><h3 className="font-semibold text-[#071E33]">What do you want to estimate?</h3><p className="mt-1 text-xs text-[#3A4653]/65">Choose one scope and answer four quick questions.</p></div></div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = input.category === item.id;
                return <button key={item.id} type="button" onClick={() => selectCategory(item.id)} className={`p-3 text-left transition ${active ? "bg-[#071E33] text-white" : "border border-[#0D3B66]/10 bg-white text-[#071E33] hover:border-[#C8A45D]"}`}><Icon className={`h-4 w-4 ${active ? "text-[#C8A45D]" : "text-[#0D3B66]"}`} /><strong className="mt-3 block text-xs">{item.label}</strong><span className={`mt-1 block text-[10px] leading-4 ${active ? "text-white/55" : "text-[#3A4653]/55"}`}>{item.short}</span></button>;
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <TextField label="Project location" value={input.location} onChange={(value) => update("location", value)} placeholder="e.g. Abuja" />
              <SelectField label="Specification level" value={input.finishLevel} onChange={(value) => update("finishLevel", value as SpecLevel)} options={finishLevels} />
              <NumberField label={quantityLabel(input.category)} value={area} onChange={updateArea} />
              {secondaryField(input, update)}
            </div>

            {message ? <div className="mt-5 border border-[#B45151]/25 bg-[#FFF3F3] p-4 text-xs font-semibold text-[#8D2F2F]">{message}</div> : null}

            <button type="button" onClick={calculate} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"><Calculator className="h-5 w-5" />Get quick estimate</button>

            {showResult ? (
              <div className="mt-6 overflow-hidden border border-[#0D3B66]/10 bg-white">
                <div className="bg-[#071E33] p-6 text-white md:p-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">Quick planning range</p>
                  <strong className="mt-3 block text-3xl tracking-[-0.04em] md:text-4xl">{money(result.low)} – {money(result.high)}</strong>
                  <p className="mt-3 text-xs text-white/60">Likely planning figure: <strong className="text-white">{fullMoney(result.midpoint)}</strong></p>
                </div>
                <div className="p-5 md:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]/55">Cost basis</p><strong className="mt-2 block text-sm text-[#071E33]">{Math.round(result.basisQuantity).toLocaleString()} {result.basisUnit}</strong><p className="mt-1 text-[11px] leading-5 text-[#3A4653]/65">{result.basisLabel}</p></div>
                    <div className="bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3A4653]/55">Next level</p><strong className="mt-2 block text-sm text-[#071E33]">Detailed Estimate</strong><p className="mt-1 text-[11px] leading-5 text-[#3A4653]/65">Add measured quantities, construction details, systems and project choices for a tighter range.</p></div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={continueDetailed} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]">Continue to Detailed Estimate <ArrowRight className="h-4 w-4" /></button>
                    <button type="button" onClick={() => router.push("/contact")} className="inline-flex min-h-12 items-center justify-center border border-[#0D3B66]/15 px-5 py-3 text-xs font-bold text-[#0D3B66]">Contact Charismak</button>
                  </div>
                  <p className="mt-4 text-[10px] leading-5 text-[#3A4653]/55">Your quick project type, location, size and specification will carry into the Detailed Estimate.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<input type="number" min={0} step={1} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="e.g. 250" className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="text-xs font-semibold text-[#3A4653]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
