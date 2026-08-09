"use client";

import { useMemo, useState } from "react";
import { calculateReinforcement } from "@/lib/fence/reinforcement-calculator";
import type { ReinforcementCalculationInput } from "@/lib/fence/types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import Field from "../ui/field";
import { adaptReinforcementResultToBill } from "@/lib/billing/reinforcement-adapter";
import { getOrCreateDraftBill, replaceCalculationInBill } from "@/lib/billing/store";

const initialInput: ReinforcementCalculationInput = {
  id: "reinforcement-1",
  name: "Reinforcement run",
  calculationMode: "bar-mark",
  barDiameterMm: 12,
  cuttingLengthM: 6.5,
  quantity: 3,
  additionalLengthPerBarM: 0.5,
  wastagePercent: 5,
  stockBarLengthM: 12,
  bindingWirePercent: 1.5,
};

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const makeCalculationId = () =>
  `reinforcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ReinforcementCalculator({ onBack, onOpenBill }: { onBack: () => void; onOpenBill: () => void }) {
  const [input, setInput] = useState<ReinforcementCalculationInput>(() => ({ ...initialInput, id: makeCalculationId() }));
  const [notice, setNotice] = useState<string | null>(null);
  const mode = input.calculationMode;

  const setBarMarkMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "bar-mark",
      barDiameterMm: current.barDiameterMm,
      cuttingLengthM: "cuttingLengthM" in current ? current.cuttingLengthM : 6,
      quantity: "quantity" in current ? current.quantity : 1,
      additionalLengthPerBarM: "additionalLengthPerBarM" in current ? current.additionalLengthPerBarM : 0.5,
      wastagePercent: current.wastagePercent,
      stockBarLengthM: current.stockBarLengthM,
      bindingWirePercent: current.bindingWirePercent,
    }));
  };

  const setDirectLengthMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "direct-total-length",
      barDiameterMm: current.barDiameterMm,
      directTotalLengthM: "directTotalLengthM" in current ? current.directTotalLengthM : 50,
      wastagePercent: current.wastagePercent,
      stockBarLengthM: current.stockBarLengthM,
      bindingWirePercent: current.bindingWirePercent,
    }));
  };

  const calculation = useMemo(() => {
    try {
      return { result: calculateReinforcement(input), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input" };
    }
  }, [input]);
  const { result, error } = calculation;

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({ title: `${input.name || "Reinforcement"} Bill of Quantities` });
      replaceCalculationInBill({ bill, sectionId: "reinforcement", sectionTitle: "Reinforcement", calculationId: input.id, module: "reinforcement", ...adaptReinforcementResultToBill({ calculationId: input.id, element: input, result }) });
      setNotice("Added to your bill with stock bars and binding wire in procurement.");
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
      <Card title="Reinforcement calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">Plan reinforcement length, stock bars and bending allowances with bar-mark and direct-length modes.</p>
            <div className="flex flex-wrap gap-3">
              <ShellButton
                type="button"
                variant={mode === "bar-mark" ? "secondary" : "ghost"}
                onClick={setBarMarkMode}
              >
                Bar-mark
              </ShellButton>
              <ShellButton
                type="button"
                variant={mode === "direct-total-length" ? "secondary" : "ghost"}
                onClick={setDirectLengthMode}
              >
                Direct length
              </ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <p className="font-semibold text-[#0B2942]">Stock bar planning</p>
            <p className="mt-3 leading-7">Update stock bar length, wastage and binding wire percent to match site reinforcement procurement.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Bar diameter (mm)" htmlFor="reinforcement-diameter">
              <input
                id="reinforcement-diameter"
                type="number"
                step="1"
                value={input.barDiameterMm}
                onChange={(event) => setInput({ ...input, barDiameterMm: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            {mode === "bar-mark" ? (
              <>
                <Field label="Cutting length (m)" htmlFor="reinforcement-cutting-length">
                  <input
                    id="reinforcement-cutting-length"
                    type="number"
                    step="0.01"
                    value={input.cuttingLengthM ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "bar-mark"
                        ? { ...current, cuttingLengthM: safeNumber(event.target.value) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
                <Field label="Bar quantity" htmlFor="reinforcement-quantity">
                  <input
                    id="reinforcement-quantity"
                    type="number"
                    step="1"
                    value={input.quantity ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "bar-mark"
                        ? { ...current, quantity: Math.max(1, Math.round(safeNumber(event.target.value))) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
                <Field label="Additional length per bar (m)" htmlFor="reinforcement-extra-length">
                  <input
                    id="reinforcement-extra-length"
                    type="number"
                    step="0.01"
                    value={input.additionalLengthPerBarM ?? ""}
                    onChange={(event) => setInput((current) =>
                      current.calculationMode === "bar-mark"
                        ? { ...current, additionalLengthPerBarM: safeNumber(event.target.value) }
                        : current,
                    )}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                  />
                </Field>
              </>
            ) : (
              <Field label="Direct total length (m)" htmlFor="reinforcement-direct-length">
                <input
                  id="reinforcement-direct-length"
                  type="number"
                  step="0.1"
                  value={input.directTotalLengthM ?? ""}
                  onChange={(event) => setInput((current) =>
                    current.calculationMode === "direct-total-length"
                      ? { ...current, directTotalLengthM: safeNumber(event.target.value) }
                      : current,
                  )}
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
                />
              </Field>
            )}
          </div>
          <div className="space-y-4">
            <Field label="Stock bar length (m)" htmlFor="reinforcement-stock-length">
              <input
                id="reinforcement-stock-length"
                type="number"
                step="0.1"
                value={input.stockBarLengthM}
                onChange={(event) => setInput({ ...input, stockBarLengthM: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Wastage (%)" htmlFor="reinforcement-wastage">
              <input
                id="reinforcement-wastage"
                type="number"
                step="0.1"
                value={input.wastagePercent}
                onChange={(event) => setInput({ ...input, wastagePercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Binding wire (%)" htmlFor="reinforcement-wire">
              <input
                id="reinforcement-wire"
                type="number"
                step="0.1"
                value={input.bindingWirePercent}
                onChange={(event) => setInput({ ...input, bindingWirePercent: safeNumber(event.target.value) })}
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
              <p className="text-sm font-semibold text-[#0B2942]">Distance and stock</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Basic length</span><span>{result.basicLengthM} m</span></div>
                <div className="flex justify-between"><span>Wastage</span><span>{result.wastageLengthM} m</span></div>
                <div className="flex justify-between"><span className="font-semibold text-[#0B2942]">Final required length</span><span className="font-semibold text-[#0B2942]">{result.finalRequiredLengthM} m</span></div>
                <div className="flex justify-between"><span>Stock bars required</span><span>{result.stockBarQuantity}</span></div>
                <div className="flex justify-between"><span>Offcut / excess</span><span>{result.offcutOrExcessLengthM} m</span></div>
              </div>
            </div>
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Weight and wire</p>
              <div className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Weight/m</span><span>{result.unitWeightKgPerM} kg/m</span></div>
                <div className="flex justify-between"><span>Total steel weight</span><span>{result.totalWeightKg} kg</span></div>
                <div className="flex justify-between"><span>Binding wire</span><span>{result.bindingWireWeightKg} kg</span></div>
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
