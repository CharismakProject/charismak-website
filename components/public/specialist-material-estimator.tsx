"use client";

import { useMemo, useState } from "react";
import { Calculator, Download, PlugZap, PackageCheck } from "lucide-react";
import {
  calculateSpecialistMaterialEstimate,
  createSpecialistMaterialInput,
  type SpecialistMaterialCategory,
  type SpecialistMaterialInput,
} from "@/lib/projects/specialist-material-estimate-engine";
import {
  calculateAdditionalMaterialEstimate,
  createAdditionalMaterialInput,
  type AdditionalMaterialCategory,
  type AdditionalMaterialInput,
} from "@/lib/projects/additional-material-estimate-engine";
import { downloadMaterialSchedulePdf } from "@/lib/projects/estimate-pdf";

type Category = SpecialistMaterialCategory | AdditionalMaterialCategory;
type ResultLine = { id: string; material: string; unit: string; quantityLow: number; quantityHigh: number; procurementQuantity?: number; note?: string };
type Result = { category: string; title: string; basis: string; lines: ResultLine[]; assumptions: string[]; warnings: string[] };

const categories: Array<[Category, string, string]> = [
  ["electrical", "Electrical", "Cables, conduit, boxes, data and DB capacity"],
  ["plumbing", "Plumbing & sanitary", "PPR, soil/waste pipes, fittings, valves and fixtures"],
  ["ceiling", "Ceilings", "Gypsum, PVC or acoustic ceiling materials"],
  ["paving", "Paving", "Pavers, bedding, subbase and jointing sand"],
  ["waterproofing", "Waterproofing", "Cementitious, membrane or liquid PU systems"],
  ["structural-steel", "Structural steel", "Tonnes, bolts, welding, coating and cladding"],
  ["doors-windows", "Doors & windows", "Opening units, glazing, frames, sealant and hardware"],
  ["glass-partition", "Glass partition", "Glass, aluminium/channels, silicone and door hardware"],
];

const specialistCategories = new Set<SpecialistMaterialCategory>(["electrical", "plumbing", "ceiling", "paving", "waterproofing"]);
const fmt = (value: number) => value < 10 ? value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") : Math.round(value).toLocaleString("en-NG");

export default function SpecialistMaterialEstimator() {
  const [category, setCategory] = useState<Category>("electrical");
  const [specialist, setSpecialist] = useState<SpecialistMaterialInput>(() => createSpecialistMaterialInput());
  const [additional, setAdditional] = useState<AdditionalMaterialInput>(() => createAdditionalMaterialInput());
  const [showResult, setShowResult] = useState(false);

  const isSpecialist = specialistCategories.has(category as SpecialistMaterialCategory);
  const activeInput = isSpecialist ? specialist : additional;
  const result: Result = useMemo(() => isSpecialist
    ? calculateSpecialistMaterialEstimate({ ...specialist, category: category as SpecialistMaterialCategory })
    : calculateAdditionalMaterialEstimate({ ...additional, category: category as AdditionalMaterialCategory }),
  [additional, category, isSpecialist, specialist]);

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setShowResult(false);
    if (specialistCategories.has(next as SpecialistMaterialCategory)) {
      setSpecialist((current) => ({ ...createSpecialistMaterialInput(), category: next as SpecialistMaterialCategory, wastePercent: current.wastePercent }));
    } else {
      setAdditional((current) => ({ ...createAdditionalMaterialInput(), category: next as AdditionalMaterialCategory, wastePercent: current.wastePercent }));
    }
  };

  const updateSpecialist = <K extends keyof SpecialistMaterialInput>(key: K, value: SpecialistMaterialInput[K]) => {
    setSpecialist((current) => ({ ...current, [key]: value }));
    setShowResult(false);
  };
  const updateAdditional = <K extends keyof AdditionalMaterialInput>(key: K, value: AdditionalMaterialInput[K]) => {
    setAdditional((current) => ({ ...current, [key]: value }));
    setShowResult(false);
  };
  const specialistNumber = (key: keyof SpecialistMaterialInput, value: string) => updateSpecialist(key, Math.max(0, Number(value) || 0) as never);
  const additionalNumber = (key: keyof AdditionalMaterialInput, value: string) => updateAdditional(key, Math.max(0, Number(value) || 0) as never);

  return (
    <section className="border-t border-[#0D3B66]/10 bg-[#F7F8FA] px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Services & Specialist Materials</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#071E33] md:text-5xl">MEP, steel, openings and external-work quantities.</h2>
            <p className="mt-6 text-base leading-8 text-[#3A4653]">Continue beyond concrete and finishes into electrical, plumbing, ceilings, paving, waterproofing, structural steel, doors/windows and glass partition materials.</p>
            <div className="mt-7 flex items-start gap-3 border-l-2 border-[#C8A45D] bg-white p-5 text-sm leading-7 text-[#3A4653]"><PackageCheck className="mt-1 h-5 w-5 shrink-0 text-[#0D3B66]" /><p>Where exact engineering information is unavailable, the calculator shows the assumption used and identifies quantities that must be replaced by approved design or shop drawings.</p></div>
          </aside>

          <div className="border border-[#0D3B66]/10 bg-white p-4 shadow-[0_24px_70px_rgba(7,30,51,0.08)] md:p-7">
            <div className="flex items-center gap-3 border-b border-[#0D3B66]/10 pb-5"><span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]"><PlugZap className="h-5 w-5" /></span><div><h3 className="font-semibold text-[#071E33]">Choose the specialist work item</h3><p className="mt-1 text-xs text-[#3A4653]/65">Each option has its own quantity model.</p></div></div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map(([id, label, text]) => <button key={id} type="button" onClick={() => chooseCategory(id)} className={`p-3 text-left transition ${category === id ? "bg-[#071E33] text-white" : "border border-[#0D3B66]/10 bg-[#F7F8FA] text-[#071E33] hover:border-[#C8A45D]"}`}><strong className="block text-xs">{label}</strong><span className={`mt-1 block text-[10px] leading-4 ${category === id ? "text-white/55" : "text-[#3A4653]/55"}`}>{text}</span></button>)}
            </div>

            <div className="mt-6 grid gap-4 border-t border-[#0D3B66]/10 pt-6 md:grid-cols-2">
              <NumberField label="Waste / route / cutting allowance (%)" value={activeInput.wastePercent} onChange={(value) => isSpecialist ? specialistNumber("wastePercent", value) : additionalNumber("wastePercent", value)} />
              <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 text-xs leading-6 text-[#3A4653]/70">Procurement quantities are rounded conservatively. Design-dependent items remain clearly labelled as planning allowances.</div>
            </div>

            <div className="mt-7">
              {isSpecialist
                ? <SpecialistFields category={category as SpecialistMaterialCategory} input={specialist} update={updateSpecialist} number={specialistNumber} />
                : <AdditionalFields category={category as AdditionalMaterialCategory} input={additional} update={updateAdditional} number={additionalNumber} />}
            </div>

            <button type="button" onClick={() => setShowResult(true)} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"><Calculator className="h-5 w-5" />Calculate material quantities</button>

            {showResult ? <ResultPanel input={activeInput} result={result} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ input, result }: { input: { category: string; wastePercent: number }; result: Result }) {
  return <div className="mt-7 overflow-hidden border border-[#0D3B66]/10 bg-white">
    <div className="bg-[#071E33] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Material schedule</p><h3 className="mt-2 text-2xl font-semibold">{result.title}</h3><p className="mt-2 text-xs leading-6 text-white/60">{result.basis}</p></div>
    <div className="p-5 md:p-6">
      {result.warnings.length ? <div className="mb-5 border border-[#C8A45D]/35 bg-[#FFF9ED] p-4">{result.warnings.map((warning) => <p key={warning} className="text-xs leading-5 text-[#74520D]">• {warning}</p>)}</div> : null}
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead><tr className="bg-[#F7F8FA] text-[#071E33]"><th className="border border-[#0D3B66]/10 p-3">Material / specification</th><th className="border border-[#0D3B66]/10 p-3">Unit</th><th className="border border-[#0D3B66]/10 p-3">Calculated</th><th className="border border-[#0D3B66]/10 p-3">Waste</th><th className="border border-[#0D3B66]/10 p-3">Procurement qty</th><th className="border border-[#0D3B66]/10 p-3">Basis / note</th></tr></thead><tbody>{result.lines.map((line) => <tr key={line.id}><td className="border border-[#0D3B66]/10 p-3 font-semibold text-[#071E33]">{line.material}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]">{line.unit}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]">{Math.abs(line.quantityHigh - line.quantityLow) < 0.0001 ? fmt(line.quantityLow) : `${fmt(line.quantityLow)} - ${fmt(line.quantityHigh)}`}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]">{input.wastePercent}% incl.</td><td className="border border-[#0D3B66]/10 p-3 font-bold text-[#0D3B66]">{line.procurementQuantity === undefined ? "Review range" : fmt(line.procurementQuantity)}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]/70">{line.note || "Calculated from entered quantities and stated assumptions."}</td></tr>)}</tbody></table></div>
      <div className="mt-5 border-l-2 border-[#C8A45D] bg-[#F7F8FA] p-4">{result.assumptions.map((item) => <p key={item} className="text-xs leading-6 text-[#3A4653]">• {item}</p>)}</div>
      <button type="button" onClick={() => downloadMaterialSchedulePdf(input, result)} className="mt-5 inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]"><Download className="h-4 w-4" />Download branded material schedule</button>
    </div>
  </div>;
}

function SpecialistFields({ category, input, update, number }: { category: SpecialistMaterialCategory; input: SpecialistMaterialInput; update: <K extends keyof SpecialistMaterialInput>(key: K, value: SpecialistMaterialInput[K]) => void; number: (key: keyof SpecialistMaterialInput, value: string) => void }) {
  if (category === "electrical") return <Fields title="Electrical first-fix materials" text="Point counts and average cable route drive cable, conduit, boxes and preliminary DB capacity."><NumberField label="Socket / power points" value={input.socketPoints} onChange={(v) => number("socketPoints", v)} /><NumberField label="Lighting points" value={input.lightingPoints} onChange={(v) => number("lightingPoints", v)} /><NumberField label="AC power points" value={input.acPoints} onChange={(v) => number("acPoints", v)} /><NumberField label="Water-heater points" value={input.waterHeaterPoints} onChange={(v) => number("waterHeaterPoints", v)} /><NumberField label="Data points" value={input.dataPoints} onChange={(v) => number("dataPoints", v)} /><NumberField label="Average route per point (m)" value={input.averageElectricalRouteM} onChange={(v) => number("averageElectricalRouteM", v)} step={0.1} /><CheckField label="Include protective earth conductor" checked={input.includeEarthCable} onChange={(v) => update("includeEarthCable", v)} /></Fields>;
  if (category === "plumbing") return <Fields title="Plumbing & sanitary materials" text="Fixture groups and average runs estimate supply/waste pipework, fittings and sanitary procurement counts."><NumberField label="Bathrooms" value={input.bathrooms} onChange={(v) => number("bathrooms", v)} /><NumberField label="Kitchens" value={input.kitchens} onChange={(v) => number("kitchens", v)} /><NumberField label="WCs" value={input.wcCount} onChange={(v) => number("wcCount", v)} /><NumberField label="Wash basins" value={input.basinCount} onChange={(v) => number("basinCount", v)} /><NumberField label="Showers" value={input.showerCount} onChange={(v) => number("showerCount", v)} /><NumberField label="Kitchen sinks" value={input.sinkCount} onChange={(v) => number("sinkCount", v)} /><NumberField label="Hot-water fixtures" value={input.hotWaterFixtures} onChange={(v) => number("hotWaterFixtures", v)} /><NumberField label="Average pipe run per fixture (m)" value={input.plumbingAverageRunM} onChange={(v) => number("plumbingAverageRunM", v)} step={0.1} /></Fields>;
  if (category === "ceiling") return <Fields title="Suspended ceiling materials" text="Choose the ceiling system and measured ceiling area."><NumberField label="Ceiling area (m²)" value={input.ceilingAreaM2} onChange={(v) => number("ceilingAreaM2", v)} step={0.01} /><SelectField label="Ceiling system" value={input.ceilingSystem} onChange={(v) => update("ceilingSystem", v as SpecialistMaterialInput["ceilingSystem"])} options={[["gypsum", "Gypsum board / POP substrate"], ["pvc", "PVC ceiling"], ["acoustic", "600×600 acoustic suspended ceiling"]]} /><NumberField label="Approximate ceiling drop (m)" value={input.ceilingDropM} onChange={(v) => number("ceilingDropM", v)} step={0.05} /></Fields>;
  if (category === "paving") return <Fields title="Interlocking paving materials" text="Paving area and pavement build-up determine pavers, bedding and subbase quantities."><NumberField label="Paving area (m²)" value={input.pavingAreaM2} onChange={(v) => number("pavingAreaM2", v)} step={0.01} /><NumberField label="Paver length (mm)" value={input.paverLengthMm} onChange={(v) => number("paverLengthMm", v)} /><NumberField label="Paver width (mm)" value={input.paverWidthMm} onChange={(v) => number("paverWidthMm", v)} /><NumberField label="Bedding thickness (mm)" value={input.beddingThicknessMm} onChange={(v) => number("beddingThicknessMm", v)} /><NumberField label="Subbase thickness (mm)" value={input.subbaseThicknessMm} onChange={(v) => number("subbaseThicknessMm", v)} /></Fields>;
  return <Fields title="Waterproofing materials" text="Measured area, system and coat/layer information drive membrane or coating quantities."><NumberField label="Waterproofing area (m²)" value={input.waterproofAreaM2} onChange={(v) => number("waterproofAreaM2", v)} step={0.01} /><SelectField label="Waterproofing system" value={input.waterproofSystem} onChange={(v) => update("waterproofSystem", v as SpecialistMaterialInput["waterproofSystem"])} options={[["cementitious", "Cementitious coating"], ["bituminous-membrane", "Torch-on bituminous membrane"], ["liquid-pu", "Liquid polyurethane"]]} /><NumberField label="Coats / layers" value={input.waterproofCoats} onChange={(v) => number("waterproofCoats", v)} />{input.waterproofSystem === "bituminous-membrane" ? <NumberField label="Nominal area per roll (m²)" value={input.membraneRollAreaM2} onChange={(v) => number("membraneRollAreaM2", v)} step={0.1} /> : null}</Fields>;
}

function AdditionalFields({ category, input, update, number }: { category: AdditionalMaterialCategory; input: AdditionalMaterialInput; update: <K extends keyof AdditionalMaterialInput>(key: K, value: AdditionalMaterialInput[K]) => void; number: (key: keyof AdditionalMaterialInput, value: string) => void }) {
  if (category === "structural-steel") return <Fields title="Structural steel materials" text="Use known tonnage where available. Otherwise area × steel-intensity gives a transparent preliminary tonnage."><NumberField label="Covered / structural area (m²)" value={input.steelCoveredAreaM2} onChange={(v) => number("steelCoveredAreaM2", v)} step={0.01} /><NumberField label="Known steel tonnage (optional)" value={input.steelKnownTonnes} onChange={(v) => number("steelKnownTonnes", v)} step={0.01} /><NumberField label="Planning steel intensity (kg/m²)" value={input.steelIntensityKgM2} onChange={(v) => number("steelIntensityKgM2", v)} /><NumberField label="Bolt-set allowance per tonne" value={input.boltSetsPerTonne} onChange={(v) => number("boltSetsPerTonne", v)} /><NumberField label="Coating allowance (L/tonne)" value={input.coatingLitresPerTonne} onChange={(v) => number("coatingLitresPerTonne", v)} step={0.1} /><NumberField label="Roof/wall cladding area (m², optional)" value={input.steelCladdingAreaM2} onChange={(v) => number("steelCladdingAreaM2", v)} step={0.01} /></Fields>;
  if (category === "doors-windows") return <Fields title="Door & window opening schedule" text="Typical sizes give unit counts, glazing areas, frame lengths, sealant and hardware allowances."><NumberField label="Number of windows" value={input.windowCount} onChange={(v) => number("windowCount", v)} /><NumberField label="Typical window width (m)" value={input.windowWidthM} onChange={(v) => number("windowWidthM", v)} step={0.01} /><NumberField label="Typical window height (m)" value={input.windowHeightM} onChange={(v) => number("windowHeightM", v)} step={0.01} /><SelectField label="Window system" value={input.windowSystem} onChange={(v) => update("windowSystem", v as AdditionalMaterialInput["windowSystem"])} options={[["aluminium", "Aluminium framed"], ["upvc", "uPVC framed"], ["frameless-glass", "Frameless glass"]]} /><NumberField label="Number of doors" value={input.doorCount} onChange={(v) => number("doorCount", v)} /><NumberField label="Typical door width (m)" value={input.doorWidthM} onChange={(v) => number("doorWidthM", v)} step={0.01} /><NumberField label="Typical door height (m)" value={input.doorHeightM} onChange={(v) => number("doorHeightM", v)} step={0.01} /><SelectField label="Door system" value={input.doorSystem} onChange={(v) => update("doorSystem", v as AdditionalMaterialInput["doorSystem"])} options={[["flush", "Flush door"], ["security", "Security door"], ["aluminium-glass", "Aluminium / glass door"], ["timber", "Timber door"]]} /></Fields>;
  return <Fields title="Glass / aluminium partition" text="Partition area, height and module size estimate glass panels, tracks, frames and silicone."><NumberField label="Partition area (m²)" value={input.glassPartitionAreaM2} onChange={(v) => number("glassPartitionAreaM2", v)} step={0.01} /><NumberField label="Partition height (m)" value={input.glassPartitionHeightM} onChange={(v) => number("glassPartitionHeightM", v)} step={0.01} /><NumberField label="Typical panel/module width (m)" value={input.glassPartitionModuleWidthM} onChange={(v) => number("glassPartitionModuleWidthM", v)} step={0.01} /><SelectField label="Partition system" value={input.glassPartitionSystem} onChange={(v) => update("glassPartitionSystem", v as AdditionalMaterialInput["glassPartitionSystem"])} options={[["frameless", "Frameless glass"], ["aluminium-framed", "Aluminium framed"]]} /><NumberField label="Glass doors within partition" value={input.glassPartitionDoorCount} onChange={(v) => number("glassPartitionDoorCount", v)} /><NumberField label="Glass thickness (mm)" value={input.glassThicknessMm} onChange={(v) => number("glassThicknessMm", v)} /></Fields>;
}

function Fields({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Quantity inputs</p><h3 className="mt-2 text-xl font-semibold text-[#071E33]">{title}</h3><p className="mt-2 max-w-3xl text-xs leading-6 text-[#3A4653]/65">{text}</p><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div></div>; }
function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (value: string) => void; step?: number }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<input type="number" min={0} step={step} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="0" className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-xs font-semibold transition ${checked ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#0D3B66]/12 bg-white text-[#3A4653]"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#C8A45D]" />{label}</label>; }
