"use client";

import { useMemo, useState } from "react";
import { calculateConcreteElementMaterials } from "@/lib/fence/concrete-element-calculator";
import type { ConcreteElementCalculationInput, RatioBasedConcreteMixSpecification } from "@/lib/fence/types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import Field from "../ui/field";
import {
  getOrCreateDraftBill,
  replaceCalculationInBill,
} from "@/lib/billing/store";
import { adaptConcreteResultToBill } from "@/lib/billing/concrete-adapter";
import {
  convertBulkMaterialToPurchaseUnits,
  formatBulkPurchaseSummary,
  type BulkPurchaseAssumption,
} from "@/lib/materials/bulk-converter";

const createMix = (
  id: string,
  name: string,
  cementRatio: number,
  sandRatio: number,
  coarseAggregateRatio: number,
  waterCementRatioByWeight: number,
): RatioBasedConcreteMixSpecification => ({
  id,
  name,
  materialType: "concrete",
  calculationMethod: "ratio-based",
  cementRatio,
  sandRatio,
  coarseAggregateRatio,
  dryVolumeFactor: 1.54,
  cementBagWeightKg: 50,
  cementBagVolumeM3: 0.0347,
  waterCementRatioByWeight,
});

const concreteMixPresets = [
  createMix("mix-1-2-4", "1:2:4 Structural Concrete", 1, 2, 4, 0.5),
  createMix("mix-1-1-5-3", "1:1.5:3 Structural Concrete", 1, 1.5, 3, 0.48),
  createMix("mix-1-3-6", "1:3:6 Concrete Blinding", 1, 3, 6, 0.6),
  createMix("mix-1-4-8", "1:4:8 Lean Concrete", 1, 4, 8, 0.65),
  createMix("mix-1-10", "1:10 Cement-Sand Blinding", 1, 10, 0, 0.7),
] as const;

const defaultMix = concreteMixPresets[0];

const initialInput: ConcreteElementCalculationInput = {
  id: "concrete-1",
  name: "Concrete element",
  elementType: "custom",
  calculationMode: "dimensions",
  dimensionLengthM: 1,
  dimensionWidthM: 0.25,
  dimensionDepthOrHeightM: 0.5,
  quantity: 4,
  wastagePercent: 5,
  concreteMixId: defaultMix.id,
};

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const makeCalculationId = () =>
  `concrete-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatQuantity = (value: number, precision = 3) =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: precision,
  }).format(value);

export default function ConcreteCalculator({
  onBack,
  onOpenBill,
}: {
  onBack: () => void;
  onOpenBill: () => void;
}) {
  const [input, setInput] = useState<ConcreteElementCalculationInput>(() => ({
    ...initialInput,
    id: makeCalculationId(),
  }));
  const [notice, setNotice] = useState<string | null>(null);
  const [mix, setMix] = useState<RatioBasedConcreteMixSpecification>({ ...defaultMix });
  const [workSection, setWorkSection] = useState<"substructure" | "superstructure">("substructure");
  const [sandBulkPurchase, setSandBulkPurchase] = useState<BulkPurchaseAssumption>({
    densityTonnesPerM3: 1.6,
    truckCapacity: 15,
    truckCapacityBasis: "tonnes",
  });
  const [aggregateBulkPurchase, setAggregateBulkPurchase] = useState<BulkPurchaseAssumption>({
    densityTonnesPerM3: 1.5,
    truckCapacity: 15,
    truckCapacityBasis: "tonnes",
  });

  const selectMix = (id: string) => {
    const preset = concreteMixPresets.find((item) => item.id === id);
    if (!preset) return;
    setMix({ ...preset });
    setInput((current) => ({ ...current, concreteMixId: preset.id }));
  };

  const updateMix = (
    field: keyof Pick<RatioBasedConcreteMixSpecification,
      | "name"
      | "cementRatio"
      | "sandRatio"
      | "coarseAggregateRatio"
      | "dryVolumeFactor"
      | "cementBagWeightKg"
      | "cementBagVolumeM3"
      | "waterCementRatioByWeight">,
    value: string | number,
  ) => {
    const customId = `custom-${mix.id.replace(/^custom-/, "")}`;
    setMix((current) => ({
      ...current,
      id: customId,
      [field]: value,
    }));
    setInput((current) => ({ ...current, concreteMixId: customId }));
  };

  const setDimensionsMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      elementType: current.elementType,
      calculationMode: "dimensions",
      dimensionLengthM: "dimensionLengthM" in current ? current.dimensionLengthM : 1,
      dimensionWidthM: "dimensionWidthM" in current ? current.dimensionWidthM : 0.25,
      dimensionDepthOrHeightM: "dimensionDepthOrHeightM" in current ? current.dimensionDepthOrHeightM : 0.5,
      quantity: "quantity" in current ? current.quantity : 1,
      wastagePercent: current.wastagePercent,
      concreteMixId: current.concreteMixId,
    }));
  };

  const setDirectVolumeMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      elementType: current.elementType,
      calculationMode: "direct-volume",
      directVolumeM3: "directVolumeM3" in current ? current.directVolumeM3 : 1,
      wastagePercent: current.wastagePercent,
      concreteMixId: current.concreteMixId,
    }));
  };

  const calculation = useMemo(() => {
    try {
      return {
        result: calculateConcreteElementMaterials({ element: input, mix }),
        error: null,
      };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : "Invalid input",
      };
    }
  }, [input, mix]);
  const { result, error } = calculation;
  const bulkPurchaseResults = useMemo(() => {
    if (!result) return null;
    try {
      return {
        sand: convertBulkMaterialToPurchaseUnits({
          volumeM3: result.materials.sandVolumeM3,
          assumption: sandBulkPurchase,
        }),
        aggregate: convertBulkMaterialToPurchaseUnits({
          volumeM3: result.materials.coarseAggregateVolumeM3,
          assumption: aggregateBulkPurchase,
        }),
      };
    } catch {
      return null;
    }
  }, [aggregateBulkPurchase, result, sandBulkPurchase]);

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({
        title: `${input.name.trim() || "Concrete"} Bill of Quantities`,
      });
      const adapted = adaptConcreteResultToBill({
        calculationId: input.id,
        element: input,
        mix,
        result,
        bulkPurchase: { sand: sandBulkPurchase, aggregate: aggregateBulkPurchase },
      });
      replaceCalculationInBill({
        bill,
        sectionId: `${workSection}-concrete`,
        sectionTitle: workSection === "substructure" ? "Substructure" : "Superstructure",
        calculationId: input.id,
        module: "concrete",
        ...adapted,
      });
      setNotice("Added to your bill. Rates can be entered in the BOQ workspace.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Unable to update bill.");
    }
  };

  const startAnotherCalculation = () => {
    setInput({ ...initialInput, id: makeCalculationId(), concreteMixId: mix.id });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Card title="Concrete calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">
              Calculate concrete volumes and material breakdowns for elements such as pads, columns and slabs.</p>
            <div className="flex flex-wrap gap-3">
              <ShellButton
                type="button"
                variant={input.calculationMode === "dimensions" ? "secondary" : "ghost"}
                onClick={setDimensionsMode}
              >
                Dimensions
              </ShellButton>
              <ShellButton
                type="button"
                variant={input.calculationMode === "direct-volume" ? "secondary" : "ghost"}
                onClick={setDirectVolumeMode}
              >
                Direct volume
              </ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <label className="font-semibold text-[#0B2942]">Mix specification<select value={concreteMixPresets.some((item) => item.id === mix.id) ? mix.id : "custom"} onChange={(event) => selectMix(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#CCD7E3] bg-white px-4 py-3 font-normal"><option value="custom" disabled>Custom edited mix</option>{concreteMixPresets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <p className="mt-3 leading-6">Current ratio <strong className="text-[#071E33]">{mix.cementRatio}:{mix.sandRatio}:{mix.coarseAggregateRatio}</strong>. Use a preset, then edit any assumption below for this exact element.</p>
            <details className="mt-4 rounded-2xl border border-[#D7E0E9] bg-white p-4"><summary className="cursor-pointer font-bold text-[#0D3B66]">Edit mix assumptions</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{[
              ["cementRatio", "Cement ratio", 0.1],
              ["sandRatio", "Sand ratio", 0.1],
              ["coarseAggregateRatio", "Aggregate ratio", 0.1],
              ["dryVolumeFactor", "Dry-volume factor", 0.01],
              ["cementBagVolumeM3", "Cement bag volume (m³)", 0.0001],
              ["waterCementRatioByWeight", "Water/cement ratio", 0.01],
            ].map(([field, label, step]) => <label key={String(field)} className="text-xs font-semibold text-[#526579]">{label}<input type="number" min="0" step={Number(step)} value={Number(mix[field as keyof RatioBasedConcreteMixSpecification])} onChange={(event) => updateMix(field as keyof Pick<RatioBasedConcreteMixSpecification, "cementRatio" | "sandRatio" | "coarseAggregateRatio" | "dryVolumeFactor" | "cementBagVolumeM3" | "waterCementRatioByWeight">, safeNumber(event.target.value))} className="mt-1 w-full rounded-xl border border-[#CCD7E3] px-3 py-2 text-[#071E33]" /></label>)}</div></details>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="BOQ work section" htmlFor="concrete-work-section">
            <select id="concrete-work-section" value={workSection} onChange={(event) => setWorkSection(event.target.value as "substructure" | "superstructure")} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3">
              <option value="substructure">Substructure</option>
              <option value="superstructure">Superstructure</option>
            </select>
          </Field>
          {input.calculationMode === "dimensions" ? (
            <>
              <Field label="Length (m)" htmlFor="concrete-length">
                <input
                  id="concrete-length"
                  type="number"
                  step="0.01"
                  value={input.dimensionLengthM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, dimensionLengthM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
              <Field label="Width (m)" htmlFor="concrete-width">
                <input
                  id="concrete-width"
                  type="number"
                  step="0.01"
                  value={input.dimensionWidthM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, dimensionWidthM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
              <Field label="Depth / height (m)" htmlFor="concrete-depth">
                <input
                  id="concrete-depth"
                  type="number"
                  step="0.01"
                  value={input.dimensionDepthOrHeightM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, dimensionDepthOrHeightM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
              <Field label="Quantity" htmlFor="concrete-quantity">
                <input
                  id="concrete-quantity"
                  type="number"
                  step="1"
                  min="1"
                  value={input.quantity}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, quantity: Math.max(1, Math.round(safeNumber(event.target.value))) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
            </>
          ) : (
            <Field label="Direct volume (m³)" htmlFor="concrete-volume">
              <input
                id="concrete-volume"
                type="number"
                step="0.01"
                value={input.directVolumeM3 ?? ""}
                onChange={(event) => setInput((current) =>
                  current.calculationMode === "direct-volume"
                    ? { ...current, directVolumeM3: safeNumber(event.target.value) }
                    : current,
                )}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
          )}
          <div className="space-y-4">
            <Field label="Element name" htmlFor="concrete-name">
              <input
                id="concrete-name"
                value={input.name}
                onChange={(event) => setInput({ ...input, name: event.target.value })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Wastage (%)" htmlFor="concrete-wastage">
              <input
                id="concrete-wastage"
                type="number"
                step="0.1"
                value={input.wastagePercent}
                onChange={(event) => setInput({ ...input, wastagePercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-[28px] border border-[#FAC8C0] bg-[#FFE8E2] p-5 text-sm text-[#C8320A]">{error}</div>
      ) : null}

      {result ? (
        <Card title="Result summary">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Concrete volumes</p>
              <dl className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Basic volume</span><span>{formatQuantity(result.element.basicConcreteVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Wastage volume</span><span>{formatQuantity(result.element.wastageConcreteVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span className="font-semibold text-[#0B2942]">Final volume</span><span className="font-semibold text-[#0B2942]">{formatQuantity(result.element.finalConcreteVolumeM3)} m³</span></div>
              </dl>
            </div>
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Materials</p>
              <dl className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Cement (calculated)</span><span>{formatQuantity(result.materials.calculatedCementBagQuantity, 2)} bags</span></div>
                <div className="flex justify-between font-semibold text-[#0B2942]"><span>Cement to purchase</span><span>{Math.ceil(result.materials.calculatedCementBagQuantity)} bags</span></div>
                <div className="flex justify-between"><span>Sand</span><span>{formatQuantity(result.materials.sandVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Aggregate</span><span>{formatQuantity(result.materials.coarseAggregateVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Water</span><span>{formatQuantity(result.materials.waterLitres, 1)} L</span></div>
              </dl>
            </div>
          </div>
        </Card>
      ) : null}
      {result && bulkPurchaseResults ? (
        <Card title="Practical bulk-material purchasing">
          <p className="text-sm leading-7 text-[#526579]">The BOQ keeps the technical quantity in cubic metres. This view also shows approximate tonnage and truckload equivalents, using editable density and truck capacity.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {([
              ["Sharp sand", bulkPurchaseResults.sand, sandBulkPurchase, setSandBulkPurchase],
              ["Granite aggregate", bulkPurchaseResults.aggregate, aggregateBulkPurchase, setAggregateBulkPurchase],
            ] as const).map(([label, conversion, settings, setSettings]) => (
              <div key={label} className="rounded-[24px] border border-[#D7E0E9] bg-[#F8FAFC] p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#071E33]">{label}</p><p className="mt-1 text-xs text-[#526579]">Technical: {formatQuantity(conversion.technicalVolumeM3)} m³</p></div><span className="rounded-full bg-[#E7F6EE] px-3 py-1 text-xs font-bold text-[#16704A]">≈ {formatQuantity(conversion.approximateWeightTonnes, 2)} t</span></div>
                <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-[#0D3B66]">{formatBulkPurchaseSummary(conversion)}</p>
                <details className="mt-4"><summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-[#C8320A]">Edit conversion assumptions</summary><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#526579]">Bulk density (t/m³)<input type="number" min="0.01" step="0.01" value={settings.densityTonnesPerM3} onChange={(event) => setSettings({ ...settings, densityTonnesPerM3: safeNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-[#CCD7E3] bg-white px-3 py-2" /></label><label className="text-xs font-semibold text-[#526579]">Truck/load capacity<input type="number" min="0.01" step="0.1" value={settings.truckCapacity} onChange={(event) => setSettings({ ...settings, truckCapacity: safeNumber(event.target.value) })} className="mt-1 w-full rounded-xl border border-[#CCD7E3] bg-white px-3 py-2" /></label><label className="text-xs font-semibold text-[#526579] sm:col-span-2">Supplier measures the truck by<select value={settings.truckCapacityBasis} onChange={(event) => setSettings({ ...settings, truckCapacityBasis: event.target.value as "tonnes" | "cubic-metres" })} className="mt-1 w-full rounded-xl border border-[#CCD7E3] bg-white px-3 py-2"><option value="tonnes">Tonnes</option><option value="cubic-metres">Cubic metres</option></select></label></div></details>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-6 text-[#6C7D8D]">Truckload figures are planning equivalents—not universal trip sizes. Confirm the supplier&apos;s actual vehicle capacity and combine quantities across the project before ordering.</p>
        </Card>
      ) : null}
      {result ? (
        <div className="rounded-[28px] border border-[#d6dfe9] bg-white p-4 shadow-sm">
          {notice ? <p className="mb-3 text-sm font-medium text-[#16704A]">{notice}</p> : null}
          <div className="flex flex-wrap gap-3">
            <ShellButton onClick={addResultToBill}>{notice ? "Update Bill" : "Add to Bill"}</ShellButton>
            <ShellButton variant="secondary" onClick={onOpenBill}>View BOQ</ShellButton>
            <ShellButton variant="ghost" onClick={startAnotherCalculation}>Start Another Calculation</ShellButton>
          </div>
        </div>
      ) : null}

      <ShellButton variant="ghost" onClick={onBack}>Back to calculators</ShellButton>
    </div>
  );
}
