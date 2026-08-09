"use client";

import { useMemo, useState } from "react";
import { calculateFormwork } from "@/lib/fence/formwork-calculator";
import type { FormworkCalculationInput, FormworkFaceInput } from "@/lib/fence/types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import Field from "../ui/field";
import { adaptFormworkResultToBill } from "@/lib/billing/formwork-adapter";
import { getOrCreateDraftBill, replaceCalculationInBill } from "@/lib/billing/store";

const initialFaces: FormworkFaceInput[] = [
  { id: "face-1", name: "Face 1", lengthM: 2.4, widthM: 1.2, quantity: 2 },
  { id: "face-2", name: "Face 2", lengthM: 2.4, widthM: 1.2, quantity: 2 },
];

const initialInput: FormworkCalculationInput = {
  id: "formwork-1",
  name: "Formwork run",
  calculationMode: "individual-faces",
  application: "reinforced-concrete-column",
  wastagePercent: 10,
  sheetLengthM: 2.4,
  sheetWidthM: 1.2,
  expectedReuseCount: 2,
  faces: initialFaces,
};

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const makeCalculationId = () =>
  `formwork-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function FormworkCalculator({ onBack, onOpenBill }: { onBack: () => void; onOpenBill: () => void }) {
  const [input, setInput] = useState<FormworkCalculationInput>(() => ({ ...initialInput, id: makeCalculationId() }));
  const [notice, setNotice] = useState<string | null>(null);
  const mode = input.calculationMode;

  const setFacesMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "individual-faces",
      application: current.application,
      wastagePercent: current.wastagePercent,
      sheetLengthM: current.sheetLengthM,
      sheetWidthM: current.sheetWidthM,
      expectedReuseCount: current.expectedReuseCount,
      faces: "faces" in current ? current.faces : initialFaces,
    }));
  };

  const setDirectAreaMode = () => {
    setInput((current) => ({
      id: current.id,
      name: current.name,
      calculationMode: "direct-area",
      application: current.application,
      wastagePercent: current.wastagePercent,
      sheetLengthM: current.sheetLengthM,
      sheetWidthM: current.sheetWidthM,
      expectedReuseCount: current.expectedReuseCount,
      directFormworkAreaM2: "directFormworkAreaM2" in current ? current.directFormworkAreaM2 : 12,
    }));
  };

  const calculation = useMemo(() => {
    try {
      return { result: calculateFormwork(input), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input" };
    }
  }, [input]);
  const { result, error } = calculation;

  const addResultToBill = () => {
    if (!result) return;
    try {
      const bill = getOrCreateDraftBill({ title: `${input.name || "Formwork"} Bill of Quantities` });
      replaceCalculationInBill({ bill, sectionId: "formwork", sectionTitle: "Formwork", calculationId: input.id, module: "formwork", ...adaptFormworkResultToBill({ calculationId: input.id, element: input, result }) });
      setNotice("Added to your bill with reusable sheet procurement requirements.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Unable to update bill.");
    }
  };

  const startAnotherCalculation = () => {
    setInput({ ...initialInput, id: makeCalculationId() });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFace = (id: string, field: keyof FormworkFaceInput, value: string) => {
    setInput((current) => {
      if (current.calculationMode !== "individual-faces") {
        return current;
      }

      return {
        ...current,
        faces: current.faces.map((face) =>
          face.id === id ? { ...face, [field]: field === "name" ? value : safeNumber(value) } : face,
        ),
      };
    });
  };

  return (
    <div className="space-y-6">
      <Card title="Formwork calculator">
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-[#556475]">Calculate formwork area and sheet procurement from individual faces or direct contact area.</p>
            <div className="flex flex-wrap gap-3">
              <ShellButton
                type="button"
                variant={mode === "individual-faces" ? "secondary" : "ghost"}
                onClick={setFacesMode}
              >
                Individual faces
              </ShellButton>
              <ShellButton
                type="button"
                variant={mode === "direct-area" ? "secondary" : "ghost"}
                onClick={setDirectAreaMode}
              >
                Direct area
              </ShellButton>
            </div>
          </div>
          <div className="rounded-[28px] bg-[#F4F7FA] p-5 text-sm text-[#4B5B72]">
            <p className="font-semibold text-[#0B2942]">Sheet planning</p>
            <p className="mt-3 leading-7">Enter sheet dimensions and reuse count to predict procurement quantities for shuttering systems.</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {mode === "individual-faces" ? (
            <div className="space-y-4">
              {input.faces.map((face) => (
                <div key={face.id} className="rounded-[24px] bg-[#F8FAFC] p-4">
                  <Field label="Face name" htmlFor={`${face.id}-name`}>
                    <input
                      id={`${face.id}-name`}
                      value={face.name}
                      onChange={(event) => updateFace(face.id, "name", event.target.value)}
                      className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-white px-4 py-3"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Length (m)" htmlFor={`${face.id}-length`}>
                      <input
                        id={`${face.id}-length`}
                        type="number"
                        step="0.01"
                        value={face.lengthM}
                        onChange={(event) => updateFace(face.id, "lengthM", event.target.value)}
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-white px-4 py-3"
                      />
                    </Field>
                    <Field label="Width (m)" htmlFor={`${face.id}-width`}>
                      <input
                        id={`${face.id}-width`}
                        type="number"
                        step="0.01"
                        value={face.widthM}
                        onChange={(event) => updateFace(face.id, "widthM", event.target.value)}
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-white px-4 py-3"
                      />
                    </Field>
                    <Field label="Quantity" htmlFor={`${face.id}-quantity`}>
                      <input
                        id={`${face.id}-quantity`}
                        type="number"
                        step="1"
                        value={face.quantity}
                        onChange={(event) => updateFace(face.id, "quantity", event.target.value)}
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-white px-4 py-3"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Field label="Direct formwork area (m²)" htmlFor="formwork-direct-area">
              <input
                id="formwork-direct-area"
                type="number"
                step="0.1"
                value={input.directFormworkAreaM2 ?? ""}
                onChange={(event) => setInput((current) =>
                  current.calculationMode === "direct-area"
                    ? { ...current, directFormworkAreaM2: safeNumber(event.target.value) }
                    : current,
                )}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
          )}

          <div className="space-y-4">
            <Field label="Element name" htmlFor="formwork-name">
              <input
                id="formwork-name"
                value={input.name}
                onChange={(event) => setInput({ ...input, name: event.target.value })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Wastage (%)" htmlFor="formwork-wastage">
              <input
                id="formwork-wastage"
                type="number"
                step="0.1"
                value={input.wastagePercent}
                onChange={(event) => setInput({ ...input, wastagePercent: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Sheet length (m)" htmlFor="formwork-sheet-length">
              <input
                id="formwork-sheet-length"
                type="number"
                step="0.1"
                value={input.sheetLengthM}
                onChange={(event) => setInput({ ...input, sheetLengthM: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Sheet width (m)" htmlFor="formwork-sheet-width">
              <input
                id="formwork-sheet-width"
                type="number"
                step="0.1"
                value={input.sheetWidthM}
                onChange={(event) => setInput({ ...input, sheetWidthM: safeNumber(event.target.value) })}
                className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3"
              />
            </Field>
            <Field label="Expected reuse count" htmlFor="formwork-reuse">
              <input
                id="formwork-reuse"
                type="number"
                step="1"
                value={input.expectedReuseCount}
                onChange={(event) => setInput({ ...input, expectedReuseCount: Math.max(1, Math.round(safeNumber(event.target.value))) })}
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
              <p className="text-sm font-semibold text-[#0B2942]">Formwork area</p>
              <dl className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Basic area</span><span>{result.basicFormworkAreaM2} m²</span></div>
                <div className="flex justify-between"><span>Wastage</span><span>{result.wastageFormworkAreaM2} m²</span></div>
                <div className="flex justify-between"><span className="font-semibold text-[#0B2942]">Final area</span><span className="font-semibold text-[#0B2942]">{result.finalFormworkAreaM2} m²</span></div>
              </dl>
            </div>
            <div className="rounded-[24px] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Sheet procurement</p>
              <dl className="mt-4 space-y-3 text-sm text-[#556475]">
                <div className="flex justify-between"><span>Sheet area</span><span>{result.sheetAreaM2} m²</span></div>
                <div className="flex justify-between"><span>Effective coverage</span><span>{result.effectiveSheetCoverageM2} m²</span></div>
                <div className="flex justify-between"><span>Exact sheet quantity</span><span>{result.exactSheetQuantity}</span></div>
                <div className="flex justify-between"><span>Procurement quantity</span><span>{result.procurementSheetQuantity}</span></div>
              </dl>
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
