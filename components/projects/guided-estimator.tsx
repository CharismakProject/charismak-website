"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileSpreadsheet,
  Home,
  Info,
  Landmark,
  Save,
  WalletCards,
} from "lucide-react";

import { createNewBill } from "@/lib/billing/store";
import { createProjectBudget } from "@/lib/projects/budget";
import { calculateGuidedEstimate } from "@/lib/projects/guided-estimate";
import type { FinishLevel, ProjectScope, ProjectSpace, UniversalProject } from "@/lib/projects/models";
import { saveProject } from "@/lib/projects/store";

type GuidedEstimatorProps = {
  project: UniversalProject;
  mode?: "guided" | "dimensions";
  onOpenBill: () => void;
  onOpenBudget: () => void;
  onBack: () => void;
};

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value || 0);

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const roomFields = [
  ["bedrooms", "Bedrooms", "bedroom"],
  ["bathrooms", "Toilets / bathrooms", "bathroom"],
  ["living", "Living rooms", "living"],
  ["kitchens", "Kitchens", "kitchen"],
  ["work", "Offices / shops / workspaces", "work"],
  ["stores", "Stores", "other"],
  ["corridors", "Corridors", "circulation"],
  ["staircases", "Staircases", "circulation"],
  ["balconies", "Balconies", "other"],
  ["verandas", "Verandas", "other"],
  ["garages", "Garages", "other"],
] as const;

const singularRoomNames: Record<(typeof roomFields)[number][0], string> = {
  bedrooms: "Bedroom",
  bathrooms: "Toilet / bathroom",
  living: "Living room",
  kitchens: "Kitchen",
  work: "Office / shop / workspace",
  stores: "Store",
  corridors: "Corridor",
  staircases: "Staircase",
  balconies: "Balcony",
  verandas: "Veranda",
  garages: "Garage",
};

const matchingSpaces = (spaces: ProjectScope["spaces"], id: (typeof roomFields)[number][0], category: ProjectSpace["category"]) => {
  const byCategory = spaces?.filter((space) => space.category === category) ?? [];
  if (category !== "other" && category !== "circulation") return byCategory;
  const firstWord = singularRoomNames[id].toLowerCase().split(/[ /]/)[0];
  return byCategory.filter((space) => space.name.toLowerCase().includes(firstWord));
};

export default function GuidedEstimator({
  project,
  mode = "guided",
  onOpenBill,
  onOpenBudget,
  onBack,
}: GuidedEstimatorProps) {
  const existing = project.scope;
  const initialCounts = Object.fromEntries(roomFields.map(([id, , category]) => {
    const stored = matchingSpaces(existing?.spaces, id, category).reduce((sum, space) => sum + space.count, 0);
    return [id, stored || (id === "bedrooms" ? 3 : id === "bathrooms" ? 2 : id === "living" || id === "kitchens" ? 1 : 0)];
  }));
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<ProjectScope>({
    landLengthM: existing?.landLengthM ?? 15,
    landWidthM: existing?.landWidthM ?? 30,
    buildingLengthM: existing?.buildingLengthM ?? 12,
    buildingWidthM: existing?.buildingWidthM ?? 15,
    floorAreaM2: existing?.floorAreaM2 ?? null,
    floors: existing?.floors ?? 1,
    finishLevel: existing?.finishLevel ?? "standard",
    includeExternalWorks: existing?.includeExternalWorks ?? true,
    preliminariesMode: existing?.preliminariesMode ?? "recommended",
    preliminariesPercent: existing?.preliminariesPercent ?? 5,
    spaces: existing?.spaces ?? [],
    source: mode,
    confidence: "detailed",
    assumptions: existing?.assumptions ?? [],
  });
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [roomMeasurements, setRoomMeasurements] = useState<Record<string, { lengthM: number | null; widthM: number | null }>>(() => {
    const values: Record<string, { lengthM: number | null; widthM: number | null }> = {};
    roomFields.forEach(([id, , category]) => matchingSpaces(existing?.spaces, id, category).forEach((space, index) => {
      values[`${id}-${index}`] = { lengthM: space.lengthM ?? null, widthM: space.widthM ?? null };
    }));
    return values;
  });
  const [customSpaces, setCustomSpaces] = useState<ProjectSpace[]>(() => existing?.spaces?.filter((space) => space.category === "other" && !["store", "balcony", "veranda", "garage"].some((word) => space.name.toLowerCase().includes(word))) ?? []);
  const [message, setMessage] = useState<string | null>(null);

  const isBuilding = project.projectType === "new-building" || project.projectType === "renovation";
  const result = useMemo(() => calculateGuidedEstimate(project.projectType, scope), [project.projectType, scope]);
  const landArea = (scope.landLengthM ?? 0) * (scope.landWidthM ?? 0);
  const footprint = scope.floorAreaM2 || (scope.buildingLengthM ?? 0) * (scope.buildingWidthM ?? 0);

  const update = <K extends keyof ProjectScope>(field: K, value: ProjectScope[K]) => {
    setScope((current) => ({ ...current, [field]: value }));
  };

  const buildScope = (): ProjectScope => ({
    ...scope,
    landAreaM2: landArea || scope.landAreaM2,
    floorAreaM2: footprint || scope.floorAreaM2,
    spaces: [...roomFields.flatMap(([id, , category]) => Array.from({ length: counts[id] ?? 0 }, (_, index) => ({
      id: `${project.id}-${id}-${index + 1}`,
      name: `${singularRoomNames[id]} ${index + 1}`,
      category,
      count: 1,
      lengthM: roomMeasurements[`${id}-${index}`]?.lengthM ?? null,
      widthM: roomMeasurements[`${id}-${index}`]?.widthM ?? null,
      heightM: null,
    }))), ...customSpaces],
    source: mode,
    confidence: footprint > 0 ? "detailed" : "rough",
  });

  const saveScope = () => {
    const savedScope = buildScope();
    saveProject({ ...project, scope: savedScope });
    setScope(savedScope);
    setMessage("Project information saved on this device.");
    return savedScope;
  };

  const createPreliminaryBill = () => {
    const savedScope = saveScope();
    const latest = calculateGuidedEstimate(project.projectType, savedScope);
    const bill = createNewBill({
      title: `${project.name} — Preliminary Cost Estimate`,
      projectName: project.name,
      clientName: project.clientName,
      location: project.location,
      currency: project.currency,
      sections: latest.sections.map((section) => ({
        id: `guided-${section.id}`,
        title: section.label,
        items: [{
          id: `guided-${section.id}-${Date.now()}`,
          sourceCalculationId: project.id,
          sourceModule: "guided-estimate",
          description: `${section.label} planning allowance`,
          unit: "item",
          calculatedQuantity: 1,
          billQuantity: 1,
          materialRate: null,
          labourRate: null,
          plantRate: null,
          otherRate: null,
          allInRate: (section.low + section.high) / 2,
          manualRate: (section.low + section.high) / 2,
          rateSource: "manual",
          amount: (section.low + section.high) / 2,
          notes: `${section.explanation} Preliminary planning range ${money(section.low, project.currency)}–${money(section.high, project.currency)}.`,
        }],
      })),
      assumptions: latest.assumptions.map((value, index) => ({ id: `guided-assumption-${index}`, label: `Assumption ${index + 1}`, value })),
    });
    saveProject({ ...project, scope: savedScope, linkedBillId: bill.id });
    onOpenBill();
  };

  const useAsBudget = () => {
    const savedScope = saveScope();
    const latest = calculateGuidedEstimate(project.projectType, savedScope);
    createProjectBudget(project.id, latest.midpoint, latest.sections.map((section) => ({
      id: section.id,
      label: section.label,
      budget: (section.low + section.high) / 2,
    })));
    onOpenBudget();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#617286]"><ArrowLeft className="h-4 w-4" /> Projects</button>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8320A]">{mode === "guided" ? "Guided estimate" : "Dimensions workspace"}</p><h1 className="mt-1 text-2xl font-bold text-[#081B36] md:text-3xl">{project.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">{mode === "guided" ? "Answer familiar questions. Technical assumptions and cost sections remain available for review." : "Enter the measurements you know and create a connected preliminary cost plan."}</p></div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F4F7FA] p-2">
            {["Project", "Choices", "Estimate"].map((label, index) => <button key={label} type="button" onClick={() => setStep(index + 1)} className={`rounded-lg px-3 py-2 text-[10px] font-bold ${step === index + 1 ? "bg-[#081B36] text-white" : "bg-white text-[#617286]"}`}><span className="block">0{index + 1}</span>{label}</button>)}
          </div>
        </div>
      </section>

      {step === 1 ? <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF2FF] text-[#175FC4]"><Landmark className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#081B36]">Land and project size</h2><p className="mt-1 text-xs leading-5 text-[#617286]">Use metres. If you only know the floor area, enter it directly.</p></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["Land length", "landLengthM"], ["Land width", "landWidthM"], [isBuilding ? "Building length" : "Primary quantity", "buildingLengthM"], [isBuilding ? "Building width" : "Secondary quantity", "buildingWidthM"]].map(([label, field]) => <label key={field} className="text-xs font-semibold text-[#526579]">{label}<input type="number" min="0" step="0.1" value={String(scope[field as keyof ProjectScope] ?? "")} onChange={(event) => update(field as "landLengthM", numberValue(event.target.value))} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm text-[#081B36]" /></label>)}
        </div>
        {isBuilding ? <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><label className="text-xs font-semibold text-[#526579]">Floor area instead (optional)<input type="number" min="0" step="0.1" value={scope.floorAreaM2 ?? ""} onChange={(event) => update("floorAreaM2", event.target.value ? numberValue(event.target.value) : null)} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">Number of floors<input type="number" min="1" max="100" value={scope.floors ?? 1} onChange={(event) => update("floors", Math.max(1, numberValue(event.target.value)))} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm" /></label></div> : null}
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white">Continue <ArrowRight className="h-4 w-4" /></button><span className="inline-flex items-center gap-2 rounded-xl bg-[#F4F7FA] px-4 py-3 text-xs text-[#617286]"><Info className="h-4 w-4" />Land {Math.round(landArea)} m² · Footprint {Math.round(footprint)} m²</span></div>
      </section> : null}

      {step === 2 ? <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E9F8F1] text-[#087A50]"><Home className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-[#081B36]">Spaces and quality</h2><p className="mt-1 text-xs leading-5 text-[#617286]">Select what applies. These details make the estimate easier to explain and improve future detailed calculations.</p></div></div>
        {isBuilding ? <><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">{roomFields.map(([id, label]) => <label key={id} className="rounded-xl border border-[#DCE4EC] bg-[#F8FAFC] p-3 text-xs font-semibold text-[#526579]">{label}<input type="number" min="0" max="100" value={counts[id] ?? 0} onChange={(event) => setCounts((current) => ({ ...current, [id]: numberValue(event.target.value) }))} className="mt-2 w-full rounded-lg border border-[#CAD5E0] bg-white px-3 py-2 text-sm text-[#081B36]" /></label>)}</div><details className="mt-4 rounded-xl border border-[#DCE4EC] bg-[#FBFCFE]"><summary className="cursor-pointer px-4 py-3 text-xs font-bold text-[#175FC4]">Add individual room dimensions or custom spaces (optional)</summary><div className="grid gap-3 border-t border-[#E5EBF1] p-4 sm:grid-cols-2 lg:grid-cols-3">{roomFields.flatMap(([id]) => Array.from({ length: counts[id] ?? 0 }, (_, index) => { const key = `${id}-${index}`; const value = roomMeasurements[key] ?? { lengthM: null, widthM: null }; return <div key={key} className="rounded-xl border border-[#DCE4EC] bg-white p-3"><p className="text-xs font-bold text-[#081B36]">{singularRoomNames[id]} {index + 1}</p><div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[10px] font-semibold text-[#617286]">Length (m)<input type="number" min="0" step="0.1" value={value.lengthM ?? ""} onChange={(event) => setRoomMeasurements((current) => ({ ...current, [key]: { ...value, lengthM: event.target.value ? numberValue(event.target.value) : null } }))} className="mt-1 w-full rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /></label><label className="text-[10px] font-semibold text-[#617286]">Width (m)<input type="number" min="0" step="0.1" value={value.widthM ?? ""} onChange={(event) => setRoomMeasurements((current) => ({ ...current, [key]: { ...value, widthM: event.target.value ? numberValue(event.target.value) : null } }))} className="mt-1 w-full rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /></label></div></div>; }))}</div><div className="border-t border-[#E5EBF1] p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-[#081B36]">Custom spaces</p><button type="button" onClick={() => setCustomSpaces((current) => [...current, { id: `${project.id}-custom-${Date.now()}`, name: "Custom space", category: "other", count: 1, lengthM: null, widthM: null, heightM: null }])} className="text-xs font-bold text-[#175FC4]">+ Add custom space</button></div>{customSpaces.length ? <div className="mt-3 space-y-2">{customSpaces.map((space, index) => <div key={space.id} className="grid grid-cols-[1fr_70px_70px_auto] gap-2"><input aria-label={`Custom space ${index + 1} name`} value={space.name} onChange={(event) => setCustomSpaces((current) => current.map((item) => item.id === space.id ? { ...item, name: event.target.value } : item))} className="min-w-0 rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><input aria-label={`${space.name} length`} type="number" min="0" step="0.1" value={space.lengthM ?? ""} onChange={(event) => setCustomSpaces((current) => current.map((item) => item.id === space.id ? { ...item, lengthM: event.target.value ? numberValue(event.target.value) : null } : item))} placeholder="L m" className="rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><input aria-label={`${space.name} width`} type="number" min="0" step="0.1" value={space.widthM ?? ""} onChange={(event) => setCustomSpaces((current) => current.map((item) => item.id === space.id ? { ...item, widthM: event.target.value ? numberValue(event.target.value) : null } : item))} placeholder="W m" className="rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><button type="button" onClick={() => setCustomSpaces((current) => current.filter((item) => item.id !== space.id))} className="px-2 text-xs font-bold text-[#C8320A]">Remove</button></div>)}</div> : <p className="mt-2 text-[11px] text-[#617286]">Add a workshop, dining area, clinic room or any space not listed above.</p>}</div></details></> : <div className="mt-5 rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#617286]">This route uses a broad quantity benchmark for the selected work type. Open the professional estimate builder afterward to replace the planning allowance with measured items and detailed rates.</div>}
        <div className="mt-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#617286]">Specification level</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{(["basic", "standard", "premium"] as FinishLevel[]).map((level) => <button key={level} type="button" onClick={() => update("finishLevel", level)} className={`rounded-xl border p-4 text-left ${scope.finishLevel === level ? "border-[#175FC4] bg-[#EAF2FF]" : "border-[#DCE4EC] bg-white"}`}><strong className="capitalize text-[#081B36]">{level}</strong><span className="mt-1 block text-[11px] leading-5 text-[#617286]">{level === "basic" ? "Essential, durable specification" : level === "standard" ? "Balanced mid-range specification" : "Higher-grade finishes and fittings"}</span></button>)}</div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="flex items-start gap-3 rounded-xl border border-[#DCE4EC] p-4 text-xs leading-5 text-[#526579]"><input type="checkbox" checked={scope.includeExternalWorks ?? false} onChange={(event) => update("includeExternalWorks", event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#175FC4]" /><span><strong className="block text-[#081B36]">Include external works allowance</strong>Uses remaining land area for an early paving, drainage and site-development range.</span></label><label className="rounded-xl border border-[#DCE4EC] p-4 text-xs font-semibold text-[#526579]">Preliminaries allowance (%)<input type="number" min="0" max="30" step="0.5" value={scope.preliminariesMode === "none" ? 0 : scope.preliminariesPercent ?? 5} onChange={(event) => { const value = numberValue(event.target.value); update("preliminariesPercent", value); update("preliminariesMode", value ? "percentage" : "none"); }} className="mt-2 w-full rounded-lg border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-2 text-sm" /><span className="mt-1 block font-normal">Enter 0 if you will supervise/manage the work yourself.</span></label></div>
        <div className="mt-5 flex gap-3"><button type="button" onClick={() => setStep(1)} className="rounded-xl border border-[#CAD5E0] px-4 py-3 text-sm font-bold text-[#617286]">Back</button><button type="button" onClick={() => { saveScope(); setStep(3); }} className="inline-flex items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white">Calculate estimate <ArrowRight className="h-4 w-4" /></button></div>
      </section> : null}

      {step === 3 ? <div className="grid gap-5 xl:grid-cols-[1fr_0.38fr]">
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#087A50]">{result.confidence === "detailed" ? "Detailed planning estimate" : "Rough planning estimate"}</p><h2 className="mt-1 text-xl font-bold text-[#081B36]">Estimated project range</h2></div><span className="inline-flex items-center gap-2 rounded-full bg-[#E9F8F1] px-3 py-2 text-[10px] font-bold uppercase text-[#087A50]"><CheckCircle2 className="h-4 w-4" />Review assumptions</span></div>
          <div className="mt-5 rounded-2xl bg-[#081B36] p-5 text-white"><p className="text-xs text-white/60">Planning range</p><strong className="mt-2 block text-2xl md:text-3xl">{money(result.low, project.currency)} – {money(result.high, project.currency)}</strong><p className="mt-2 text-xs text-white/60">Midpoint {money(result.midpoint, project.currency)} · {result.basisLabel}: {Math.round(result.basisQuantity)} {result.basisUnit}</p></div>
          <div className="mt-5 overflow-hidden rounded-xl border border-[#DCE4EC]">{result.sections.map((section) => <div key={section.id} className="grid gap-2 border-b border-[#E5EBF1] p-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><strong className="text-sm text-[#081B36]">{section.label}</strong><p className="mt-1 text-[11px] leading-5 text-[#617286]">{section.explanation}</p></div><span className="text-sm font-bold text-[#081B36]">{money(section.low, project.currency)} – {money(section.high, project.currency)}</span></div>)}</div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><CircleHelp className="h-5 w-5 text-[#175FC4]" /><h3 className="mt-3 font-bold text-[#081B36]">What this figure means</h3><p className="mt-2 text-xs leading-5 text-[#617286]">This is an early planning range, not a tender or contract price. Dimensions, drawings and measured quantities improve accuracy.</p><ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#617286]">{result.assumptions.map((assumption) => <li key={assumption} className="flex gap-2"><span>•</span>{assumption}</li>)}</ul></section>
          <div className="grid gap-2"><button type="button" onClick={createPreliminaryBill} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 py-3 text-sm font-bold text-white"><FileSpreadsheet className="h-4 w-4" />Create preliminary bill</button><button type="button" onClick={useAsBudget} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E9F8F1] px-4 py-3 text-sm font-bold text-[#087A50]"><WalletCards className="h-4 w-4" />Use as project budget</button><button type="button" onClick={saveScope} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CAD5E0] px-4 py-3 text-sm font-bold text-[#617286]"><Save className="h-4 w-4" />Save project information</button></div>
          {message ? <p className="rounded-xl bg-[#FFF4E4] p-3 text-xs leading-5 text-[#8A4A0A]">{message}</p> : null}
        </aside>
      </div> : null}
    </div>
  );
}
