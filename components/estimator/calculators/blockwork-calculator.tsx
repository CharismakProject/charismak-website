"use client";

import { useMemo, useState } from "react";
import { calculateBlockworkElementMaterials } from "@/lib/fence/blockwork-element-calculator";
import type { BlockSpecification, MortarMixSpecification, RatioBasedMortarMixSpecification, BlockworkElementCalculationInput } from "@/lib/fence/types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import Field from "../ui/field";
import { adaptBlockworkResultToBill } from "@/lib/billing/blockwork-adapter";
import {
  getOrCreateDraftBill,
  replaceCalculationInBill,
} from "@/lib/billing/store";

const blockSpecification: BlockSpecification = {
  lengthMm: 450,
  heightMm: 225,
  thicknessMm: 225,
  blocksPerSquareMetre: 10,
};

const createMortarMix = (
  id: string,
  name: string,
  cementRatio: number,
  sandRatio: number,
): RatioBasedMortarMixSpecification => ({
  id,
  name,
  materialType: "mortar",
  calculationMethod: "ratio-based",
  cementRatio,
  sandRatio,
  dryVolumeFactor: 1.33,
  cementBagWeightKg: 50,
  cementBagVolumeM3: 0.0347,
  waterCementRatioByWeight: 0.65,
});

const mortarMixPresets = [
  createMortarMix("mortar-1-4", "1:4 Rich Mortar", 1, 4),
  createMortarMix("mortar-1-5", "1:5 General Mortar", 1, 5),
  createMortarMix("mortar-1-6", "1:6 Blockwork Mortar", 1, 6),
] as const;

const defaultMix = mortarMixPresets[2];

const initialInput: BlockworkElementCalculationInput = {
  id: "blockwork-1",
  name: "Blockwork panel",
  calculationMode: "dimensions",
  wallLengthM: 6,
  wallHeightM: 2.4,
  openingAreaM2: 0.6,
  blockSpecificationId: "block-225mm",
  blockSpecification,
  blockWastagePercent: 5,
  mortarCalculationBasis: "per-square-metre",
  mortarVolumePerUnitM3: 0.015,
  mortarWastagePercent: 10,
  mortarMixId: defaultMix.id,
};

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const makeCalculationId = () =>
  `blockwork-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatQuantity = (value: number, precision = 3) =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: precision,
  }).format(value);

export default function BlockworkCalculator({
  onBack,
  onOpenBill,
}: {
  onBack: () => void;
  onOpenBill: () => void;
}) {
  const [input, setInput] = useState<BlockworkElementCalculationInput>(() => ({
    ...initialInput,
    id: makeCalculationId(),
  }));
  const [notice, setNotice] = useState<string | null>(null);
  const [mortarMix, setMortarMix] = useState<MortarMixSpecification>({ ...defaultMix });

  const selectMortarMix = (id: string) => {
    const preset = mortarMixPresets.find((candidate) => candidate.id === id);
    if (!preset) return;
    setMortarMix({ ...preset });
    setInput((current) => ({ ...current, mortarMixId: preset.id }));
  };

  const updateMortarMix = (
    field: keyof Pick<RatioBasedMortarMixSpecification, "cementRatio" | "sandRatio" | "dryVolumeFactor" | "cementBagVolumeM3" | "waterCementRatioByWeight">,
    value: number,
  ) => {
    const customId = `custom-${mortarMix.id.replace(/^custom-/, "")}`;
    if (mortarMix.calculationMethod !== "ratio-based") return;
    setMortarMix((current) => current.calculationMethod === "ratio-based" ? { ...current, id: customId, [field]: value } : current);
    setInput((current) => ({ ...current, mortarMixId: customId }));
  };

  const setDimensionsMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "dimensions",
      wallLengthM: "wallLengthM" in current ? current.wallLengthM : 6,
      wallHeightM: "wallHeightM" in current ? current.wallHeightM : 2.4,
      openingAreaM2: "openingAreaM2" in current ? current.openingAreaM2 : 0,
      blockSpecificationId: current.blockSpecificationId,
      blockSpecification: current.blockSpecification,
      blockWastagePercent: current.blockWastagePercent,
      mortarCalculationBasis: current.mortarCalculationBasis,
      mortarVolumePerUnitM3: current.mortarVolumePerUnitM3,
      mortarWastagePercent: current.mortarWastagePercent,
      mortarMixId: current.mortarMixId,
    }));
  };

  const setDirectAreaMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "direct-area",
      directAreaM2: "directAreaM2" in current ? current.directAreaM2 : 14.4,
      blockSpecificationId: current.blockSpecificationId,
      blockSpecification: current.blockSpecification,
      blockWastagePercent: current.blockWastagePercent,
      mortarCalculationBasis: current.mortarCalculationBasis,
      mortarVolumePerUnitM3: current.mortarVolumePerUnitM3,
      mortarWastagePercent: current.mortarWastagePercent,
      mortarMixId: current.mortarMixId,
    }));
  };

  const calculation = useMemo(() => {
    try {
      return {
        result: calculateBlockworkElementMaterials({
          element: input,
          mortarMix,
        }),
        error: null,
      };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : "Invalid input",
      };
    }
  }, [input, mortarMix]);
  const { result, error } = calculation;

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({
        title: `${input.name.trim() || "Blockwork"} Bill of Quantities`,
      });
      const adapted = adaptBlockworkResultToBill({ calculationId: input.id, element: input, mortarMix, result });
      replaceCalculationInBill({ bill, sectionId: "blockwork", sectionTitle: "Blockwork", calculationId: input.id, module: "blockwork", ...adapted });
      setNotice("Added to your bill with blocks and mortar materials in the procurement schedule.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Unable to update bill.");
    }
  };

  const startAnotherCalculation = () => {
    setInput({ ...initialInput, id: makeCalculationId(), mortarMixId: mortarMix.id });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Card title="Blockwork calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">
              Calculate blocks, openings and mortar volumes for reinforced panels or block pillars.
            </p>
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
                variant={input.calculationMode === "direct-area" ? "secondary" : "ghost"}
                onClick={setDirectAreaMode}
              >
                Direct area
              </ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <label className="font-semibold text-[#0B2942]">Mortar mix<select value={mortarMixPresets.some((candidate) => candidate.id === mortarMix.id) ? mortarMix.id : "custom"} onChange={(event) => selectMortarMix(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#CCD7E3] bg-white px-4 py-3 font-normal"><option value="custom" disabled>Custom edited mix</option>{mortarMixPresets.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
            <p className="mt-3 leading-6">225 mm block at 10 blocks/m². Mortar settings apply only to this calculation.</p>
            {mortarMix.calculationMethod === "ratio-based" ? <details className="mt-4 rounded-2xl border border-[#D7E0E9] bg-white p-4"><summary className="cursor-pointer font-bold text-[#0D3B66]">Edit mortar assumptions</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{[
              ["cementRatio", "Cement ratio", 0.1],
              ["sandRatio", "Sand ratio", 0.1],
              ["dryVolumeFactor", "Dry-volume factor", 0.01],
              ["cementBagVolumeM3", "Bag volume (m³)", 0.0001],
              ["waterCementRatioByWeight", "Water/cement ratio", 0.01],
            ].map(([field, label, step]) => <label key={String(field)} className="text-xs font-semibold text-[#526579]">{label}<input type="number" min="0" step={Number(step)} value={Number(mortarMix[field as keyof RatioBasedMortarMixSpecification])} onChange={(event) => updateMortarMix(field as keyof Pick<RatioBasedMortarMixSpecification, "cementRatio" | "sandRatio" | "dryVolumeFactor" | "cementBagVolumeM3" | "waterCementRatioByWeight">, safeNumber(event.target.value))} className="mt-1 w-full rounded-xl border border-[#CCD7E3] px-3 py-2 text-[#071E33]" /></label>)}</div></details> : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {input.calculationMode === "dimensions" ? (
            <>
              <Field label="Wall length (m)" htmlFor="blockwork-length">
                <input
                  id="blockwork-length"
                  type="number"
                  step="0.1"
                  value={input.wallLengthM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, wallLengthM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
              <Field label="Wall height (m)" htmlFor="blockwork-height">
                <input
                  id="blockwork-height"
                  type="number"
                  step="0.1"
                  value={input.wallHeightM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, wallHeightM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
              <Field label="Opening area (m²)" htmlFor="blockwork-opening">
                <input
                  id="blockwork-opening"
                  type="number"
                  step="0.1"
                  value={input.openingAreaM2 ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "dimensions"
                      ? { ...current, openingAreaM2: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
            </>
          ) : (
            <Field label="Direct area (m²)" htmlFor="blockwork-direct-area">
              <input
                id="blockwork-direct-area"
                type="number"
                step="0.1"
                value={input.directAreaM2 ?? ""}
                onChange={(event) => setInput((current) =>
                  current.calculationMode === "direct-area"
                    ? { ...current, directAreaM2: safeNumber(event.target.value) }
                    : current,
                )}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
          )}
          <div className="space-y-4">
            <Field label="Element name" htmlFor="blockwork-name">
              <input
                id="blockwork-name"
                value={input.name}
                onChange={(event) => setInput({ ...input, name: event.target.value })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Block wastage (%)" htmlFor="blockwork-wastage">
              <input
                id="blockwork-wastage"
                type="number"
                step="0.1"
                value={input.blockWastagePercent}
                onChange={(event) => setInput({ ...input, blockWastagePercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Mortar basis" htmlFor="blockwork-mortar-basis">
              <select
                id="blockwork-mortar-basis"
                value={input.mortarCalculationBasis}
                onChange={(event) => setInput({ ...input, mortarCalculationBasis: event.target.value as BlockworkElementCalculationInput["mortarCalculationBasis"] })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              >
                <option value="per-block">Per block</option>
                <option value="per-square-metre">Per square metre</option>
              </select>
            </Field>
            <Field label="Mortar volume" htmlFor="blockwork-mortar-volume">
              <input
                id="blockwork-mortar-volume"
                type="number"
                step="0.001"
                value={input.mortarVolumePerUnitM3}
                onChange={(event) => setInput({ ...input, mortarVolumePerUnitM3: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Mortar wastage (%)" htmlFor="blockwork-mortar-wastage">
              <input
                id="blockwork-mortar-wastage"
                type="number"
                step="0.1"
                value={input.mortarWastagePercent}
                onChange={(event) => setInput({ ...input, mortarWastagePercent: safeNumber(event.target.value) })}
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
              <p className="text-sm font-semibold text-[#0B2942]">Blockwork quantities</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Gross wall area</span><span>{formatQuantity(result.blockwork.grossWallAreaM2)} m²</span></div>
                <div className="flex justify-between"><span>Opening deductions</span><span>{formatQuantity(result.blockwork.openingAreaM2)} m²</span></div>
                <div className="flex justify-between font-semibold text-[#0B2942]"><span>Net blockwork area</span><span>{formatQuantity(result.blockwork.netBlockworkAreaM2)} m²</span></div>
                <div className="flex justify-between"><span>Blocks before wastage</span><span>{formatQuantity(result.blockwork.basicBlockQuantity, 2)}</span></div>
                <div className="flex justify-between"><span>Blocks wastage</span><span>{formatQuantity(result.blockwork.wastageBlockQuantity, 2)}</span></div>
                <div className="flex justify-between font-semibold text-[#0B2942]"><span>Blocks to purchase</span><span>{formatQuantity(result.blockwork.finalBlockQuantity, 0)}</span></div>
              </div>
            </div>
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Mortar materials</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Basic mortar</span><span>{formatQuantity(result.blockwork.basicMortarVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Mortar wastage</span><span>{formatQuantity(result.blockwork.wastageMortarVolumeM3)} m³</span></div>
                <div className="flex justify-between font-semibold text-[#0B2942]"><span>Final mortar</span><span>{formatQuantity(result.blockwork.finalMortarVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Cement calculated</span><span>{formatQuantity(result.mortarMaterials.calculatedCementBagQuantity, 2)} bags</span></div>
                <div className="flex justify-between font-semibold text-[#0B2942]"><span>Cement to purchase</span><span>{Math.ceil(result.mortarMaterials.calculatedCementBagQuantity)} bags</span></div>
                <div className="flex justify-between"><span>Sand</span><span>{formatQuantity(result.mortarMaterials.sandVolumeM3)} m³</span></div>
                <div className="flex justify-between"><span>Water</span><span>{formatQuantity(result.mortarMaterials.waterLitres, 1)} L</span></div>
              </div>
            </div>
          </div>
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
