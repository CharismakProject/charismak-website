"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Building2, Calculator } from "lucide-react";

import { calculateGuidedEstimate } from "@/lib/projects/guided-estimate";
import type { FinishLevel } from "@/lib/projects/models";

const buildingTypes = [
  { id: "bungalow", label: "Bungalow", floors: 1, factor: 1 },
  { id: "duplex", label: "Duplex / two-storey home", floors: 2, factor: 1.08 },
  { id: "flats", label: "Block of flats", floors: 2, factor: 1.05 },
  { id: "commercial", label: "Shop / office building", floors: 1, factor: 1.12 },
];

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function QuickCostEstimator() {
  const [buildingType, setBuildingType] = useState("bungalow");
  const [floorArea, setFloorArea] = useState("150");
  const [floors, setFloors] = useState("1");
  const [finish, setFinish] = useState<FinishLevel>("standard");
  const [location, setLocation] = useState("Abuja");
  const [includeExternal, setIncludeExternal] = useState(false);
  const [landArea, setLandArea] = useState("450");
  const [showResult, setShowResult] = useState(false);

  const choice = buildingTypes.find((item) => item.id === buildingType) ?? buildingTypes[0];
  const result = useMemo(() => {
    const estimate = calculateGuidedEstimate("new-building", { floorAreaM2: Math.max(1, Number(floorArea) || 0), floors: Math.max(1, Number(floors) || 1), finishLevel: finish, landAreaM2: Math.max(0, Number(landArea) || 0), includeExternalWorks: includeExternal, preliminariesMode: "recommended", preliminariesPercent: 5, source: "guided", confidence: "rough" });
    return { ...estimate, low: estimate.low * choice.factor, high: estimate.high * choice.factor, midpoint: estimate.midpoint * choice.factor };
  }, [choice.factor, finish, floorArea, floors, includeExternal, landArea]);

  const selectType = (id: string) => { const next = buildingTypes.find((item) => item.id === id); setBuildingType(id); if (next) setFloors(String(next.floors)); setShowResult(false); };

  return <section id="quick-building-cost" className="bg-white px-5 py-16 md:px-8 md:py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8320A]">No account needed</p><h2 className="mt-3 text-3xl font-black leading-tight text-[#081B36] md:text-5xl">Get a rough building figure now.</h2><p className="mt-4 text-sm leading-7 text-[#526579]">Choose a building type, approximate floor area and finish. You will get a transparent planning range, then you can open the full app for rooms, dimensions, drawings and a BOQ.</p><div className="mt-6 rounded-2xl border border-[#F0D39B] bg-[#FFF9ED] p-4"><p className="flex gap-2 text-xs leading-6 text-[#74520D]"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" />This is an early planning benchmark—not a quotation, tender or contract price. Location is recorded for the next step; verify current local rates.</p></div><div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-[#526579]"><Link href="/prices" className="inline-flex items-center gap-2 text-[#175FC4]">View materials and labour prices <ArrowRight className="h-4 w-4" /></Link><Link href="/blog/how-to-estimate-building-cost-before-construction" className="inline-flex items-center gap-2 text-[#175FC4]">Read the estimate guide <ArrowRight className="h-4 w-4" /></Link></div></div>
      <div className="rounded-3xl border border-[#DCE4EC] bg-[#F8FAFC] p-4 shadow-[0_20px_55px_rgba(7,30,51,0.08)] md:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF2FF] text-[#175FC4]"><Building2 className="h-5 w-5" /></span><div><h3 className="font-bold text-[#081B36]">Quick building cost check</h3><p className="text-[11px] text-[#617286]">All dimensions are in metres and square metres.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#526579]">Building type<select value={buildingType} onChange={(event) => selectType(event.target.value)} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm">{buildingTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-xs font-semibold text-[#526579]">Project location<input value={location} onChange={(event) => { setLocation(event.target.value); setShowResult(false); }} placeholder="City and state" className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">Approximate floor area per floor (m²)<input type="number" min="20" value={floorArea} onChange={(event) => { setFloorArea(event.target.value); setShowResult(false); }} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">Number of floors<input type="number" min="1" max="20" value={floors} onChange={(event) => { setFloors(event.target.value); setShowResult(false); }} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">Finish level<select value={finish} onChange={(event) => { setFinish(event.target.value as FinishLevel); setShowResult(false); }} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm"><option value="basic">Basic and durable</option><option value="standard">Standard / mid-range</option><option value="premium">Premium</option></select></label><label className="text-xs font-semibold text-[#526579]">Land area (m²), for external works<input type="number" min="0" value={landArea} onChange={(event) => { setLandArea(event.target.value); setShowResult(false); }} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-white px-3 py-3 text-sm" /></label></div><label className="mt-4 flex items-start gap-3 rounded-xl border border-[#DCE4EC] bg-white p-4 text-xs leading-5 text-[#526579]"><input type="checkbox" checked={includeExternal} onChange={(event) => { setIncludeExternal(event.target.checked); setShowResult(false); }} className="mt-0.5 accent-[#175FC4]" /><span><strong className="block text-[#081B36]">Include an external works allowance</strong>Early allowance for open land, drainage, paving and site development.</span></label><button type="button" onClick={() => setShowResult(true)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C8320A] px-5 py-3 text-sm font-bold text-white"><Calculator className="h-4 w-4" />Calculate rough figure</button>{showResult ? <div className="mt-4 rounded-2xl bg-[#081B36] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E7B34B]">Rough planning range for {location || "your location"}</p><strong className="mt-2 block text-2xl md:text-3xl">{money(result.low)} – {money(result.high)}</strong><p className="mt-2 text-xs leading-5 text-white/60">Approx. {Math.round(result.basisQuantity)} m² total floor area · {choice.label} · {finish} finish · includes 5% preliminaries.</p><Link href="/estimator/app#projects" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E7B34B] px-4 py-3 text-xs font-bold text-[#081B36]">Build a detailed project <ArrowRight className="h-4 w-4" /></Link></div> : null}</div></div></div></section>;
}
