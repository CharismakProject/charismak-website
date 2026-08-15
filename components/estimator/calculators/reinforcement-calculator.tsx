"use client";

import { useMemo, useState } from "react";

import { adaptReinforcementResultToBill } from "@/lib/billing/reinforcement-adapter";
import { getOrCreateDraftBill, replaceCalculationInBill } from "@/lib/billing/store";
import { calculateReinforcement } from "@/lib/fence/reinforcement-calculator";
import type {
  BarMarkReinforcementInput,
  ReinforcementCalculationInput,
  WeldedMeshReinforcementInput,
} from "@/lib/fence/types";
import Card from "../ui/card";
import Field from "../ui/field";
import ShellButton from "../ui/button";

const initialBarInput: BarMarkReinforcementInput = {
  id: "reinforcement-1",
  name: "Reinforcement run",
  calculationMode: "bar-mark",
  steelGrade: "high-yield",
  barDiameterMm: 12,
  cuttingLengthM: 6.5,
  quantity: 3,
  additionalLengthPerBarM: 0.5,
  wastagePercent: 5,
  stockBarLengthM: 12,
  bindingWirePercent: 1.5,
};

const initialMeshInput: WeldedMeshReinforcementInput = {
  id: "reinforcement-mesh-1",
  name: "Oversite concrete mesh",
  calculationMode: "welded-mesh",
  meshDesignation: "A142",
  coverageAreaM2: 100,
  lapPercent: 10,
  wastagePercent: 5,
  sheetLengthM: 4.8,
  sheetWidthM: 2.4,
  unitWeightKgPerM2: 2.22,
  bindingWirePercent: 1,
};

const meshPresets = [
  { designation: "A142", diameter: "6 mm @ 200 mm", unitWeightKgPerM2: 2.22 },
  { designation: "A193", diameter: "7 mm @ 200 mm", unitWeightKgPerM2: 3.02 },
  { designation: "A252", diameter: "8 mm @ 200 mm", unitWeightKgPerM2: 3.95 },
  { designation: "A393", diameter: "10 mm @ 200 mm", unitWeightKgPerM2: 6.16 },
] as const;

const safeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const makeCalculationId = () =>
  `reinforcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatQuantity = (value: number, precision = 3) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: precision }).format(value);

export default function ReinforcementCalculator({ onBack, onOpenBill }: { onBack: () => void; onOpenBill: () => void }) {
  const [input, setInput] = useState<ReinforcementCalculationInput>(() => ({ ...initialBarInput, id: makeCalculationId() }));
  const [notice, setNotice] = useState<string | null>(null);
  const mode = input.calculationMode;

  const setBarMarkMode = () => {
    setInput((current) => ({
      ...initialBarInput,
      id: current.id,
      name: current.name || initialBarInput.name,
      calculationMode: "bar-mark",
      steelGrade: current.calculationMode === "welded-mesh" ? "high-yield" : current.steelGrade,
      barDiameterMm: current.calculationMode === "welded-mesh" ? 12 : current.barDiameterMm,
      wastagePercent: current.wastagePercent,
      bindingWirePercent: current.bindingWirePercent,
    }));
    setNotice(null);
  };

  const setDirectLengthMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name || "Known reinforcement length",
      calculationMode: "direct-total-length",
      steelGrade: current.calculationMode === "welded-mesh" ? "high-yield" : current.steelGrade,
      barDiameterMm: current.calculationMode === "welded-mesh" ? 12 : current.barDiameterMm,
      directTotalLengthM: current.calculationMode === "direct-total-length" ? current.directTotalLengthM : 50,
      wastagePercent: current.wastagePercent,
      stockBarLengthM: current.calculationMode === "welded-mesh" ? 12 : current.stockBarLengthM,
      bindingWirePercent: current.bindingWirePercent,
    }));
    setNotice(null);
  };

  const setMeshMode = () => {
    setInput((current) => ({
      ...initialMeshInput,
      id: current.id,
      name: current.calculationMode === "welded-mesh" ? current.name : "Oversite concrete mesh",
      wastagePercent: current.wastagePercent,
      bindingWirePercent: current.bindingWirePercent,
    }));
    setNotice(null);
  };

  const calculation = useMemo(() => {
    try {
      return { result: calculateReinforcement(input), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "Invalid input" };
    }
  }, [input]);
  const { result, error } = calculation;

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({ title: `${input.name || "Reinforcement"} Bill of Quantities` });
      replaceCalculationInBill({
        bill,
        sectionId: "reinforcement",
        sectionTitle: "Reinforcement",
        calculationId: input.id,
        module: "reinforcement",
        ...adaptReinforcementResultToBill({ calculationId: input.id, element: input, result }),
      });
      setNotice(result.calculationMode === "welded-mesh"
        ? "Added to your bill with measured mesh area, full BRC sheets and binding wire."
        : "Added to your bill with stock bars and binding wire in procurement.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Unable to update bill.");
    }
  };

  const startAnotherCalculation = () => {
    setInput({ ...(mode === "welded-mesh" ? initialMeshInput : initialBarInput), id: makeCalculationId() });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Card title="Reinforcement calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">Calculate high-yield or mild-steel bars, or BRC/welded mesh for oversite concrete, slabs and other reinforced work.</p>
            <div className="flex flex-wrap gap-3">
              <ShellButton type="button" variant={mode === "bar-mark" ? "secondary" : "ghost"} onClick={setBarMarkMode}>Cut bars</ShellButton>
              <ShellButton type="button" variant={mode === "direct-total-length" ? "secondary" : "ghost"} onClick={setDirectLengthMode}>Known total length</ShellButton>
              <ShellButton type="button" variant={mode === "welded-mesh" ? "secondary" : "ghost"} onClick={setMeshMode}>BRC / welded mesh</ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <p className="font-semibold text-[#0B2942]">Technical and purchasing quantities</p>
            <p className="mt-3 leading-7">Bars are reported by length, weight and full stock lengths. Mesh is reported by measured area, laps, weight and full sheets.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Element / reinforcement name" htmlFor="reinforcement-name">
            <input id="reinforcement-name" value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
          </Field>

          {mode === "welded-mesh" ? (
            <>
              <Field label="BRC mesh type" htmlFor="reinforcement-mesh-type">
                <select id="reinforcement-mesh-type" value={meshPresets.some((preset) => preset.designation === input.meshDesignation) ? input.meshDesignation : "custom"} onChange={(event) => {
                  const preset = meshPresets.find((item) => item.designation === event.target.value);
                  if (preset) setInput({ ...input, meshDesignation: preset.designation, unitWeightKgPerM2: preset.unitWeightKgPerM2 });
                  else setInput({ ...input, meshDesignation: "Custom mesh" });
                }} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3">
                  {meshPresets.map((preset) => <option key={preset.designation} value={preset.designation}>{preset.designation} · {preset.diameter}</option>)}
                  <option value="custom">Custom mesh</option>
                </select>
              </Field>
              <Field label="Mesh designation" htmlFor="reinforcement-mesh-designation">
                <input id="reinforcement-mesh-designation" value={input.meshDesignation} onChange={(event) => setInput({ ...input, meshDesignation: event.target.value })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              <Field label="Area to cover (m²)" htmlFor="reinforcement-mesh-area">
                <input id="reinforcement-mesh-area" type="number" min="0" step="0.1" value={input.coverageAreaM2} onChange={(event) => setInput({ ...input, coverageAreaM2: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              <Field label="Lap allowance (%)" htmlFor="reinforcement-mesh-lap">
                <input id="reinforcement-mesh-lap" type="number" min="0" step="0.1" value={input.lapPercent} onChange={(event) => setInput({ ...input, lapPercent: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              <Field label="Standard sheet length (m)" htmlFor="reinforcement-mesh-sheet-length">
                <input id="reinforcement-mesh-sheet-length" type="number" min="0" step="0.1" value={input.sheetLengthM} onChange={(event) => setInput({ ...input, sheetLengthM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              <Field label="Standard sheet width (m)" htmlFor="reinforcement-mesh-sheet-width">
                <input id="reinforcement-mesh-sheet-width" type="number" min="0" step="0.1" value={input.sheetWidthM} onChange={(event) => setInput({ ...input, sheetWidthM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              <Field label="Mesh weight (kg/m²)" htmlFor="reinforcement-mesh-weight">
                <input id="reinforcement-mesh-weight" type="number" min="0" step="0.01" value={input.unitWeightKgPerM2} onChange={(event) => setInput({ ...input, unitWeightKgPerM2: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
            </>
          ) : (
            <>
              <Field label="Reinforcement type" htmlFor="reinforcement-grade">
                <select id="reinforcement-grade" value={input.steelGrade ?? "high-yield"} onChange={(event) => setInput({ ...input, steelGrade: event.target.value as "high-yield" | "mild-steel" })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3">
                  <option value="high-yield">High-yield deformed bar (Y)</option>
                  <option value="mild-steel">Mild-steel round bar (R)</option>
                </select>
              </Field>
              <Field label="Bar diameter (mm)" htmlFor="reinforcement-diameter">
                <input id="reinforcement-diameter" type="number" step="1" value={input.barDiameterMm} onChange={(event) => setInput({ ...input, barDiameterMm: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </Field>
              {mode === "bar-mark" ? <>
                <Field label="Cutting length (m)" htmlFor="reinforcement-cutting-length"><input id="reinforcement-cutting-length" type="number" step="0.01" value={input.cuttingLengthM} onChange={(event) => setInput({ ...input, cuttingLengthM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
                <Field label="Bar quantity" htmlFor="reinforcement-quantity"><input id="reinforcement-quantity" type="number" min="1" step="1" value={input.quantity} onChange={(event) => setInput({ ...input, quantity: Math.max(1, Math.round(safeNumber(event.target.value))) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
                <Field label="Lap / hook / anchorage per bar (m)" htmlFor="reinforcement-extra-length"><input id="reinforcement-extra-length" type="number" min="0" step="0.01" value={input.additionalLengthPerBarM} onChange={(event) => setInput({ ...input, additionalLengthPerBarM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
              </> : <Field label="Direct total length (m)" htmlFor="reinforcement-direct-length"><input id="reinforcement-direct-length" type="number" min="0" step="0.1" value={input.directTotalLengthM} onChange={(event) => setInput({ ...input, directTotalLengthM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>}
              <Field label="Stock bar length (m)" htmlFor="reinforcement-stock-length"><input id="reinforcement-stock-length" type="number" min="0" step="0.1" value={input.stockBarLengthM} onChange={(event) => setInput({ ...input, stockBarLengthM: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
            </>
          )}

          <Field label="Wastage (%)" htmlFor="reinforcement-wastage"><input id="reinforcement-wastage" type="number" min="0" step="0.1" value={input.wastagePercent} onChange={(event) => setInput({ ...input, wastagePercent: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
          <Field label="Binding wire (%)" htmlFor="reinforcement-wire"><input id="reinforcement-wire" type="number" min="0" step="0.1" value={input.bindingWirePercent} onChange={(event) => setInput({ ...input, bindingWirePercent: safeNumber(event.target.value) })} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" /></Field>
        </div>
        {mode === "welded-mesh" ? <p className="mt-5 rounded-2xl bg-[#FFF7E3] p-4 text-xs leading-6 text-[#70520F]">Mesh presets are editable planning references. Confirm the structural engineer&apos;s mesh designation, laps and supplier sheet size before issuing the BOQ.</p> : null}
      </Card>

      {error ? <div className="rounded-[28px] border border-[#FAC8C0] bg-[#FFE8E2] p-5 text-sm text-[#C8320A]">{error}</div> : null}

      {result ? <Card title="Result summary">
        {result.calculationMode === "welded-mesh" ? <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[#F4F7FA] p-5"><p className="text-sm font-semibold text-[#0B2942]">Measured and required area</p><div className="mt-4 space-y-3 text-sm text-[#556475]"><div className="flex justify-between"><span>Area to cover</span><span>{formatQuantity(result.coverageAreaM2)} m²</span></div><div className="flex justify-between"><span>Lap allowance</span><span>{formatQuantity(result.lapAreaM2)} m²</span></div><div className="flex justify-between"><span>Wastage</span><span>{formatQuantity(result.wastageAreaM2)} m²</span></div><div className="flex justify-between font-semibold text-[#0B2942]"><span>Final mesh required</span><span>{formatQuantity(result.finalRequiredAreaM2)} m²</span></div></div></div>
          <div className="rounded-[24px] bg-[#F4F7FA] p-5"><p className="text-sm font-semibold text-[#0B2942]">Practical purchasing</p><div className="mt-4 space-y-3 text-sm text-[#556475]"><div className="flex justify-between"><span>Sheet size</span><span>{result.sheetLengthM} × {result.sheetWidthM} m</span></div><div className="flex justify-between"><span>Exact sheets</span><span>{formatQuantity(result.exactSheetQuantity, 2)}</span></div><div className="flex justify-between font-semibold text-[#0B2942]"><span>Full sheets to buy</span><span>{result.procurementSheetQuantity}</span></div><div className="flex justify-between"><span>Approx. purchase weight</span><span>{formatQuantity(result.procurementWeightKg, 1)} kg</span></div><div className="flex justify-between"><span>Binding wire</span><span>{formatQuantity(result.bindingWireWeightKg, 2)} kg</span></div></div></div>
        </div> : <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[#F4F7FA] p-5"><p className="text-sm font-semibold text-[#0B2942]">Distance and stock</p><div className="mt-4 space-y-3 text-sm text-[#556475]"><div className="flex justify-between"><span>Basic length</span><span>{result.basicLengthM} m</span></div><div className="flex justify-between"><span>Wastage</span><span>{result.wastageLengthM} m</span></div><div className="flex justify-between font-semibold text-[#0B2942]"><span>Final required length</span><span>{result.finalRequiredLengthM} m</span></div><div className="flex justify-between"><span>Stock bars required</span><span>{result.stockBarQuantity}</span></div><div className="flex justify-between"><span>Offcut / excess</span><span>{result.offcutOrExcessLengthM} m</span></div></div></div>
          <div className="rounded-[24px] bg-[#F4F7FA] p-5"><p className="text-sm font-semibold text-[#0B2942]">Weight and wire</p><div className="mt-4 space-y-3 text-sm text-[#556475]"><div className="flex justify-between"><span>Steel type</span><span>{result.steelGrade === "mild-steel" ? "Mild steel (R)" : "High yield (Y)"}</span></div><div className="flex justify-between"><span>Weight/m</span><span>{result.unitWeightKgPerM} kg/m</span></div><div className="flex justify-between"><span>Total steel weight</span><span>{result.totalWeightKg} kg</span></div><div className="flex justify-between"><span>Binding wire</span><span>{result.bindingWireWeightKg} kg</span></div></div></div>
        </div>}
      </Card> : null}

      {result ? <div className="rounded-[28px] border border-[#d6dfe9] bg-white p-4 shadow-sm">{notice ? <p className="mb-3 text-sm font-medium text-[#16704A]">{notice}</p> : null}<div className="flex flex-wrap gap-3"><ShellButton onClick={addResultToBill}>{notice ? "Update Bill" : "Add to Bill"}</ShellButton><ShellButton variant="secondary" onClick={onOpenBill}>View BOQ</ShellButton><ShellButton variant="ghost" onClick={startAnotherCalculation}>Start Another Calculation</ShellButton></div></div> : null}

      <ShellButton variant="ghost" onClick={onBack}>Back to calculators</ShellButton>
    </div>
  );
}
