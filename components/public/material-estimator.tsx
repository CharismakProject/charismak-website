"use client";

import { useMemo, useState } from "react";
import { Calculator, Download, Layers3, PackageCheck } from "lucide-react";
import {
  calculateMaterialEstimate,
  createMaterialEstimateInput,
  type MaterialEstimateCategory,
  type MaterialEstimateInput,
} from "@/lib/projects/material-estimate-engine";
import { downloadMaterialSchedulePdf } from "@/lib/projects/estimate-pdf";

const categories: Array<[MaterialEstimateCategory, string, string]> = [
  ["concrete", "Concrete", "Cement, sand & granite from volume/mix"],
  ["reinforcement", "Reinforcement", "Bars, tonnes, binding wire or RC-volume allowance"],
  ["blockwork", "Blockwork", "Blocks and laying mortar"],
  ["mortar-plaster", "Plaster / mortar", "Cement and sand from area/thickness"],
  ["gypsum-partition", "Gypsum partition", "Boards, studs, tracks, screws & jointing"],
  ["curtain-wall", "Curtain wall", "Glass, mullions, transoms, silicone & anchors"],
  ["facade-cladding", "Facade / cladding", "Panels, subframe, fixings & sealant"],
  ["screed", "Floor screed", "Cement and sand from area/thickness"],
  ["tiling", "Tiles", "Tiles, boxes, adhesive & grout"],
  ["painting", "Painting", "Paint, primer and filler"],
  ["roofing", "Roof covering", "Sheets, fasteners and ridge caps"],
  ["formwork", "Formwork", "Plywood, timber, nails and release oil"],
];

const fmt = (value: number) => value < 10 ? value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") : Math.round(value).toLocaleString("en-NG");

export default function MaterialEstimator() {
  const [input, setInput] = useState<MaterialEstimateInput>(() => createMaterialEstimateInput());
  const [showResult, setShowResult] = useState(false);
  const result = useMemo(() => calculateMaterialEstimate(input), [input]);

  const update = <K extends keyof MaterialEstimateInput>(key: K, value: MaterialEstimateInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setShowResult(false);
  };
  const number = (key: keyof MaterialEstimateInput, value: string) => update(key, Math.max(0, Number(value) || 0) as never);
  const setCategory = (category: MaterialEstimateCategory) => {
    setInput((current) => ({ ...createMaterialEstimateInput(), category, wastePercent: current.wastePercent }));
    setShowResult(false);
  };

  return (
    <section className="bg-white px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Material Estimate</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#071E33] md:text-5xl">Know what to buy before you price it.</h1>
            <p className="mt-6 text-base leading-8 text-[#3A4653]">Calculate planning quantities for common construction materials from actual work dimensions, mix ratios, wall areas, module sizes and other measurable inputs.</p>
            <div className="mt-7 border-l-2 border-[#C8A45D] bg-[#FFF9ED] p-5 text-sm leading-7 text-[#74520D]">This section estimates quantities, not structural adequacy. Concrete strength, reinforcement schedules, facade systems and MEP materials must still follow approved professional design and manufacturer requirements.</div>
            <div className="mt-7 flex items-start gap-3 text-sm leading-7 text-[#3A4653]"><PackageCheck className="mt-1 h-5 w-5 shrink-0 text-[#0D3B66]" /><p>Every result includes a <strong className="text-[#071E33]">calculated quantity</strong> and a practical <strong className="text-[#071E33]">procurement quantity</strong> after waste/rounding.</p></div>
          </aside>

          <div className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4 shadow-[0_24px_70px_rgba(7,30,51,0.09)] md:p-7">
            <div className="flex items-center gap-3 border-b border-[#0D3B66]/10 pb-5"><span className="grid h-11 w-11 place-items-center bg-[#071E33] text-[#C8A45D]"><Layers3 className="h-5 w-5" /></span><div><h2 className="font-semibold text-[#071E33]">Select the material/work item</h2><p className="mt-1 text-xs text-[#3A4653]/65">The fields change to match the material calculation.</p></div></div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map(([id, label, text]) => <button key={id} type="button" onClick={() => setCategory(id)} className={`p-3 text-left transition ${input.category === id ? "bg-[#071E33] text-white" : "border border-[#0D3B66]/10 bg-white text-[#071E33] hover:border-[#C8A45D]"}`}><strong className="block text-xs">{label}</strong><span className={`mt-1 block text-[10px] leading-4 ${input.category === id ? "text-white/55" : "text-[#3A4653]/55"}`}>{text}</span></button>)}
            </div>

            <div className="mt-6 grid gap-4 border-t border-[#0D3B66]/10 pt-6 md:grid-cols-2">
              <NumberField label="Waste / cutting allowance (%)" value={input.wastePercent} onChange={(v) => number("wastePercent", v)} />
              <div className="border border-[#0D3B66]/10 bg-white p-4 text-xs leading-6 text-[#3A4653]/70">Use the waste percentage to reflect breakage, cutting, laps and normal site losses. Adjust it to suit the material and site condition.</div>
            </div>

            <div className="mt-7"><MaterialFields input={input} update={update} number={number} /></div>

            <button type="button" onClick={() => setShowResult(true)} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#0D3B66] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"><Calculator className="h-5 w-5" />Calculate material quantities</button>

            {showResult ? <div className="mt-7 overflow-hidden border border-[#0D3B66]/10 bg-white">
              <div className="bg-[#071E33] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Material schedule</p><h3 className="mt-2 text-2xl font-semibold">{result.title}</h3><p className="mt-2 text-xs leading-6 text-white/60">{result.basis}</p></div>
              <div className="p-5 md:p-6">
                {result.warnings.length ? <div className="mb-5 border border-[#C8A45D]/35 bg-[#FFF9ED] p-4">{result.warnings.map((warning) => <p key={warning} className="text-xs leading-5 text-[#74520D]">• {warning}</p>)}</div> : null}
                <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-xs"><thead><tr className="bg-[#F7F8FA] text-[#071E33]"><th className="border border-[#0D3B66]/10 p-3">Material</th><th className="border border-[#0D3B66]/10 p-3">Unit</th><th className="border border-[#0D3B66]/10 p-3">Calculated</th><th className="border border-[#0D3B66]/10 p-3">Procurement qty</th><th className="border border-[#0D3B66]/10 p-3">Basis / note</th></tr></thead><tbody>{result.lines.map((line) => <tr key={line.id}><td className="border border-[#0D3B66]/10 p-3 font-semibold text-[#071E33]">{line.material}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]">{line.unit}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]">{Math.abs(line.quantityHigh - line.quantityLow) < 0.0001 ? fmt(line.quantityLow) : `${fmt(line.quantityLow)} - ${fmt(line.quantityHigh)}`}</td><td className="border border-[#0D3B66]/10 p-3 font-bold text-[#0D3B66]">{line.procurementQuantity === undefined ? "Review range" : fmt(line.procurementQuantity)}</td><td className="border border-[#0D3B66]/10 p-3 text-[#3A4653]/70">{line.note || "-"}</td></tr>)}</tbody></table></div>
                <div className="mt-5 border-l-2 border-[#C8A45D] bg-[#F7F8FA] p-4">{result.assumptions.map((item) => <p key={item} className="text-xs leading-6 text-[#3A4653]">• {item}</p>)}</div>
                <button type="button" onClick={() => downloadMaterialSchedulePdf(input, result)} className="mt-5 inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]"><Download className="h-4 w-4" />Download branded material schedule</button>
              </div>
            </div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type Props = { input: MaterialEstimateInput; update: <K extends keyof MaterialEstimateInput>(key: K, value: MaterialEstimateInput[K]) => void; number: (key: keyof MaterialEstimateInput, value: string) => void };

function MaterialFields({ input, update, number }: Props) {
  if (input.category === "concrete") return <Fields title="Concrete mix quantities" text="Enter the wet concrete volume and nominal mix. Use the engineer's design mix where specified."><NumberField label="Wet concrete volume (m³)" value={input.concreteVolumeM3} onChange={(v) => number("concreteVolumeM3", v)} step={0.01} /><SelectField label="Nominal mix" value={input.concreteMix} onChange={(v) => update("concreteMix", v as MaterialEstimateInput["concreteMix"])} options={[["1:3:6", "1:3:6"], ["1:2:4", "1:2:4"], ["1:1.5:3", "1:1.5:3"], ["1:1:2", "1:1:2"], ["custom", "Custom ratio"]]} />{input.concreteMix === "custom" ? <><NumberField label="Cement part" value={input.cementRatio} onChange={(v) => number("cementRatio", v)} step={0.1} /><NumberField label="Sand part" value={input.sandRatio} onChange={(v) => number("sandRatio", v)} step={0.1} /><NumberField label="Aggregate part" value={input.aggregateRatio} onChange={(v) => number("aggregateRatio", v)} step={0.1} /></> : null}</Fields>;

  if (input.category === "reinforcement") return <Fields title="Reinforcement quantity" text="Use exact bar count where known, or estimate a planning steel range from RC volume and element type."><SelectField label="Calculation method" value={input.rebarMode} onChange={(v) => update("rebarMode", v as MaterialEstimateInput["rebarMode"])} options={[["bars", "Known bar count / length"], ["rc-volume", "Estimate from RC volume"]]} /><NumberField label="Bar diameter (mm)" value={input.rebarDiameterMm} onChange={(v) => number("rebarDiameterMm", v)} />{input.rebarMode === "bars" ? <><NumberField label="Number of bars" value={input.rebarBarCount} onChange={(v) => number("rebarBarCount", v)} /><NumberField label="Length per bar (m)" value={input.rebarBarLengthM} onChange={(v) => number("rebarBarLengthM", v)} step={0.1} /></> : <><SelectField label="RC element" value={input.rcElement} onChange={(v) => update("rcElement", v as MaterialEstimateInput["rcElement"])} options={[["slab", "Slab"], ["beam", "Beam"], ["column", "Column"], ["footing", "Footing"], ["retaining-wall", "Retaining wall"], ["general", "General RC"]]} /><NumberField label="RC volume (m³)" value={input.rcVolumeM3} onChange={(v) => number("rcVolumeM3", v)} step={0.01} /></>}</Fields>;

  if (input.category === "blockwork") return <Fields title="Block wall quantities" text="Gross wall area less openings determines blocks; laying mortar is included."><NumberField label="Gross wall area (m²)" value={input.wallAreaM2} onChange={(v) => number("wallAreaM2", v)} step={0.01} /><NumberField label="Doors/windows/openings area (m²)" value={input.openingsAreaM2} onChange={(v) => number("openingsAreaM2", v)} step={0.01} /><SelectField label="Block thickness" value={String(input.blockThicknessMm)} onChange={(v) => update("blockThicknessMm", Number(v) as 100 | 150 | 225)} options={[["100", "100 mm"], ["150", "150 mm"], ["225", "225 mm"]]} /></Fields>;

  if (input.category === "mortar-plaster") return <Fields title="Plaster / render / mortar" text="Area × average thickness gives wet mortar volume; the selected mix determines cement and sand."><NumberField label="Area (m²)" value={input.mortarAreaM2} onChange={(v) => number("mortarAreaM2", v)} step={0.01} /><NumberField label="Average thickness (mm)" value={input.mortarThicknessMm} onChange={(v) => number("mortarThicknessMm", v)} /><SelectField label="Mix ratio" value={input.mortarMix} onChange={(v) => update("mortarMix", v as MaterialEstimateInput["mortarMix"])} options={[["1:3", "1:3"], ["1:4", "1:4"], ["1:5", "1:5"], ["1:6", "1:6"]]} /></Fields>;

  if (input.category === "gypsum-partition") return <Fields title="Gypsum partition wall" text="Calculates boards on both faces plus metal framing and finishing consumables."><NumberField label="Partition area (m²)" value={input.partitionAreaM2} onChange={(v) => number("partitionAreaM2", v)} step={0.01} /><NumberField label="Wall height (m)" value={input.partitionHeightM} onChange={(v) => number("partitionHeightM", v)} step={0.1} /><SelectField label="Stud spacing" value={String(input.studSpacingMm)} onChange={(v) => update("studSpacingMm", Number(v) as 400 | 600)} options={[["400", "400 mm centres"], ["600", "600 mm centres"]]} /><NumberField label="Board layers on each side" value={input.boardLayersEachSide} onChange={(v) => number("boardLayersEachSide", v)} /><CheckField label="Include acoustic/thermal insulation" checked={input.includePartitionInsulation} onChange={(v) => update("includePartitionInsulation", v)} /></Fields>;

  if (input.category === "curtain-wall") return <Fields title="Curtain wall / glazed facade" text="Facade dimensions and module size estimate glazing, aluminium profile lengths, joints and anchors."><NumberField label="Facade width (m)" value={input.facadeWidthM} onChange={(v) => number("facadeWidthM", v)} step={0.1} /><NumberField label="Facade height (m)" value={input.facadeHeightM} onChange={(v) => number("facadeHeightM", v)} step={0.1} /><NumberField label="Typical module width (m)" value={input.moduleWidthM} onChange={(v) => number("moduleWidthM", v)} step={0.1} /><NumberField label="Typical module height (m)" value={input.moduleHeightM} onChange={(v) => number("moduleHeightM", v)} step={0.1} /></Fields>;

  if (input.category === "facade-cladding") return <Fields title="Facade / cladding system" text="Use the net cladding area and panel module to estimate panels, carrier frame and fixings."><NumberField label="Cladding area (m²)" value={input.claddingAreaM2} onChange={(v) => number("claddingAreaM2", v)} step={0.01} /><SelectField label="Cladding system" value={input.claddingSystem} onChange={(v) => update("claddingSystem", v as MaterialEstimateInput["claddingSystem"])} options={[["acp", "Aluminium composite panel (ACP)"], ["hpl", "HPL panel"], ["fibre-cement", "Fibre-cement panel"], ["stone-tile", "Stone / tile facade"]]} /><NumberField label="Panel width (m)" value={input.claddingPanelWidthM} onChange={(v) => number("claddingPanelWidthM", v)} step={0.01} /><NumberField label="Panel height (m)" value={input.claddingPanelHeightM} onChange={(v) => number("claddingPanelHeightM", v)} step={0.01} /></Fields>;

  if (input.category === "screed") return <Fields title="Floor screed" text="Calculates cement and sand from screed area, thickness and mix."><NumberField label="Screed area (m²)" value={input.screedAreaM2} onChange={(v) => number("screedAreaM2", v)} step={0.01} /><NumberField label="Average thickness (mm)" value={input.screedThicknessMm} onChange={(v) => number("screedThicknessMm", v)} /><SelectField label="Screed mix" value={input.screedMix} onChange={(v) => update("screedMix", v as MaterialEstimateInput["screedMix"])} options={[["1:3", "1:3"], ["1:4", "1:4"], ["1:5", "1:5"]]} /></Fields>;

  if (input.category === "tiling") return <Fields title="Tiles and fixing materials" text="Tile size and waste determine pieces/boxes; adhesive and grout use practical coverage ranges."><NumberField label="Tiling area (m²)" value={input.tileAreaM2} onChange={(v) => number("tileAreaM2", v)} step={0.01} /><NumberField label="Tile width (mm)" value={input.tileWidthMm} onChange={(v) => number("tileWidthMm", v)} /><NumberField label="Tile height (mm)" value={input.tileHeightMm} onChange={(v) => number("tileHeightMm", v)} /><NumberField label="Pieces per box (optional)" value={input.tilePiecesPerBox} onChange={(v) => number("tilePiecesPerBox", v)} /></Fields>;

  if (input.category === "painting") return <Fields title="Paint quantities" text="Paintable area × coats ÷ manufacturer coverage gives litres; primer and filler can be included."><NumberField label="Paintable area (m²)" value={input.paintAreaM2} onChange={(v) => number("paintAreaM2", v)} step={0.01} /><NumberField label="Finishing coats" value={input.paintCoats} onChange={(v) => number("paintCoats", v)} /><NumberField label="Coverage (m²/L/coat)" value={input.paintCoverageM2PerLitre} onChange={(v) => number("paintCoverageM2PerLitre", v)} step={0.1} /><CheckField label="Include primer / sealer" checked={input.includePrimer} onChange={(v) => update("includePrimer", v)} /></Fields>;

  if (input.category === "roofing") return <Fields title="Roof covering quantities" text="Enter the actual sloping roof surface area and effective sheet coverage."><NumberField label="Roof surface area (m²)" value={input.roofAreaM2} onChange={(v) => number("roofAreaM2", v)} step={0.01} /><NumberField label="Effective sheet width (m)" value={input.roofSheetEffectiveWidthM} onChange={(v) => number("roofSheetEffectiveWidthM", v)} step={0.01} /><NumberField label="Sheet length (m)" value={input.roofSheetLengthM} onChange={(v) => number("roofSheetLengthM", v)} step={0.1} /><NumberField label="Ridge / hip length (m)" value={input.ridgeLengthM} onChange={(v) => number("ridgeLengthM", v)} step={0.1} /></Fields>;

  return <Fields title="Formwork materials" text="Contact area and expected reuse cycles estimate plywood, timber and consumables."><NumberField label="Formwork contact area (m²)" value={input.formworkAreaM2} onChange={(v) => number("formworkAreaM2", v)} step={0.01} /><NumberField label="Planned plywood reuse cycles" value={input.plywoodReuseCycles} onChange={(v) => number("plywoodReuseCycles", v)} /></Fields>;
}

function Fields({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Quantity inputs</p><h3 className="mt-2 text-xl font-semibold text-[#071E33]">{title}</h3><p className="mt-2 max-w-3xl text-xs leading-6 text-[#3A4653]/65">{text}</p><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div></div>; }
function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (value: string) => void; step?: number }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<input type="number" min={0} step={step} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="0" className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) { return <label className="text-xs font-semibold text-[#3A4653]">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 bg-white px-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-xs font-semibold transition ${checked ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#0D3B66]/12 bg-white text-[#3A4653]"}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#C8A45D]" />{label}</label>; }
