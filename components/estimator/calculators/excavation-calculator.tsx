"use client";

import { useMemo, useState } from "react";
import { calculateExcavation } from "@/lib/fence/excavation-calculator";
import type { ExcavationCalculationInput } from "@/lib/fence/types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import Field from "../ui/field";
import { adaptExcavationResultToBill } from "@/lib/billing/excavation-adapter";
import { getOrCreateDraftBill, replaceCalculationInBill } from "@/lib/billing/store";

const applications = [
  { value: "strip-foundation", label: "Strip foundation" },
  { value: "column-base", label: "Column base" },
  { value: "block-pillar-base", label: "Block pillar base" },
  { value: "pedestrian-gate-post-base", label: "Pedestrian gate post base" },
  { value: "vehicle-gate-post-base", label: "Vehicle gate post base" },
  { value: "ground-beam", label: "Ground beam" },
  { value: "pit", label: "Pit" },
  { value: "custom", label: "Custom" },
];

const groundConditions = [
  { value: "firm-lateritic", label: "Firm lateritic" },
  { value: "normal", label: "Normal" },
  { value: "weak-waterlogged", label: "Weak / waterlogged" },
];

const initialInput: ExcavationCalculationInput = {
  id: "excavation-1",
  name: "Excavation run",
  calculationMode: "dimensions",
  application: "strip-foundation",
  groundCondition: "firm-lateritic",
  lengthM: 10,
  widthM: 0.6,
  depthM: 0.9,
  quantity: 1,
  overExcavationPercent: 10,
  permanentConstructionVolumeM3: 2.4,
  reusableSoilPercent: 80,
  bulkingPercent: 25,
};

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const makeCalculationId = () =>
  `excavation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ExcavationCalculator({ onBack, onOpenBill }: { onBack: () => void; onOpenBill: () => void }) {
  const [input, setInput] = useState<ExcavationCalculationInput>(() => ({ ...initialInput, id: makeCalculationId() }));
  const [notice, setNotice] = useState<string | null>(null);
  const mode = input.calculationMode;

  const setDimensionsMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "dimensions",
      application: current.application,
      groundCondition: current.groundCondition,
      lengthM: "lengthM" in current ? current.lengthM : 10,
      widthM: "widthM" in current ? current.widthM : 0.6,
      depthM: "depthM" in current ? current.depthM : 0.9,
      quantity: "quantity" in current ? current.quantity : 1,
      overExcavationPercent: current.overExcavationPercent,
      permanentConstructionVolumeM3: current.permanentConstructionVolumeM3,
      reusableSoilPercent: current.reusableSoilPercent,
      bulkingPercent: current.bulkingPercent,
    }));
  };

  const setDirectMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "direct-volume",
      application: current.application,
      groundCondition: current.groundCondition,
      directExcavationVolumeM3: "directExcavationVolumeM3" in current ? current.directExcavationVolumeM3 : 10,
      overExcavationPercent: current.overExcavationPercent,
      permanentConstructionVolumeM3: current.permanentConstructionVolumeM3,
      reusableSoilPercent: current.reusableSoilPercent,
      bulkingPercent: current.bulkingPercent,
    }));
  };

  const calculation = useMemo(() => {
    try {
      return { result: calculateExcavation(input), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input" };
    }
  }, [input]);
  const { result, error } = calculation;

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({ title: `${input.name || "Earthworks"} Bill of Quantities` });
      replaceCalculationInBill({ bill, sectionId: "earthworks", sectionTitle: "Excavation and Earthworks", calculationId: input.id, module: "excavation", ...adaptExcavationResultToBill({ calculationId: input.id, element: input, result }) });
      setNotice("Excavation, backfill, imported fill and disposal items were added where applicable.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Unable to update bill.");
    }
  };

  const startAnotherCalculation = () => {
    setInput({ ...initialInput, id: makeCalculationId() });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Card title="Excavation calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">Estimate excavation, over-excavation, backfill, imported fill and disposal volumes with ground condition context.</p>
            <div className="flex flex-wrap gap-3">
              <ShellButton
                type="button"
                variant={mode === "dimensions" ? "secondary" : "ghost"}
                onClick={setDimensionsMode}
              >
                Dimensions
              </ShellButton>
              <ShellButton
                type="button"
                variant={mode === "direct-volume" ? "secondary" : "ghost"}
                onClick={setDirectMode}
              >
                Direct volume
              </ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <p className="font-semibold text-[#0B2942]">Application</p>
            <p className="mt-3 leading-7">Choose the excavation application and condition to align volume outputs with site work expectations.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Application" htmlFor="excavation-application">
              <select
                id="excavation-application"
                value={input.application}
                onChange={(event) => setInput({ ...input, application: event.target.value as ExcavationCalculationInput["application"] })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              >
                {applications.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Ground condition" htmlFor="excavation-ground">
              <select
                id="excavation-ground"
                value={input.groundCondition}
                onChange={(event) => setInput({ ...input, groundCondition: event.target.value as ExcavationCalculationInput["groundCondition"] })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              >
                {groundConditions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Over-excavation (%)" htmlFor="excavation-over">
              <input
                id="excavation-over"
                type="number"
                step="0.1"
                value={input.overExcavationPercent}
                onChange={(event) => setInput({ ...input, overExcavationPercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Permanent volume (m³)" htmlFor="excavation-permanent">
              <input
                id="excavation-permanent"
                type="number"
                step="0.1"
                value={input.permanentConstructionVolumeM3}
                onChange={(event) => setInput({ ...input, permanentConstructionVolumeM3: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
          </div>
          <div className="space-y-4">
            {mode === "dimensions" ? (
              <>
                <Field label="Length (m)" htmlFor="excavation-length">
                  <input
                    id="excavation-length"
                    type="number"
                    step="0.1"
                    value={input.lengthM ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "dimensions"
                        ? { ...current, lengthM: safeNumber(event.target.value) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
                <Field label="Width (m)" htmlFor="excavation-width">
                  <input
                    id="excavation-width"
                    type="number"
                    step="0.1"
                    value={input.widthM ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "dimensions"
                        ? { ...current, widthM: safeNumber(event.target.value) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
                <Field label="Depth (m)" htmlFor="excavation-depth">
                  <input
                    id="excavation-depth"
                    type="number"
                    step="0.1"
                    value={input.depthM ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "dimensions"
                        ? { ...current, depthM: safeNumber(event.target.value) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
                <Field label="Quantity" htmlFor="excavation-quantity">
                  <input
                    id="excavation-quantity"
                    type="number"
                    step="1"
                    value={input.quantity ?? ""}
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
              <Field label="Direct volume (m³)" htmlFor="excavation-volume">
                <input
                  id="excavation-volume"
                  type="number"
                  step="0.1"
                  value={input.directExcavationVolumeM3 ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "direct-volume"
                      ? { ...current, directExcavationVolumeM3: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
            )}
            <Field label="Reusable soil (%)" htmlFor="excavation-soil">
              <input
                id="excavation-soil"
                type="number"
                step="0.1"
                value={input.reusableSoilPercent}
                onChange={(event) => setInput({ ...input, reusableSoilPercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Bulking (%)" htmlFor="excavation-bulking">
              <input
                id="excavation-bulking"
                type="number"
                step="0.1"
                value={input.bulkingPercent}
                onChange={(event) => setInput({ ...input, bulkingPercent: safeNumber(event.target.value) })}
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
              <p className="text-sm font-semibold text-[#0B2942]">Excavation volumes</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Basic excavation</span><span>{result.basicExcavationVolumeM3} m³</span></div>
                <div className="flex justify-between"><span>Over-excavation</span><span>{result.overExcavationVolumeM3} m³</span></div>
                <div className="flex justify-between"><span className="font-semibold text-[#0B2942]">Final excavation</span><span className="font-semibold text-[#0B2942]">{result.finalExcavationVolumeM3} m³</span></div>
              </div>
            </div>
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Backfill and disposal</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Backfill required</span><span>{result.backfillRequiredM3} m³</span></div>
                <div className="flex justify-between"><span>Imported fill</span><span>{result.importedFillRequiredM3} m³</span></div>
                <div className="flex justify-between"><span>Loose disposal</span><span>{result.looseDisposalVolumeM3} m³</span></div>
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
