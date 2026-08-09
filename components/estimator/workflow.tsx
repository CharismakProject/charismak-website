"use client";

import React, { useState } from "react";
import Card from "./ui/card";
import Field from "./ui/field";
import ShellButton from "./ui/button";
import { useEstimate } from "./estimate-provider";
import ReviewWorkspace from "../bill/review-workspace";
import { adaptFenceScopeToBill } from "@/lib/billing/fence-adapter";
import { getOrCreateDraftBill, replaceCalculationInBill } from "@/lib/billing/store";

const steps = ["Project", "Sections", "Structure", "Review"];

type WorkflowProps = {
  onOpenConcrete: () => void;
  onOpenBlockwork: () => void;
  onOpenBill: () => void;
  onOpenEstimates: () => void;
};

export default function Workflow({ onOpenConcrete, onOpenBlockwork, onOpenBill, onOpenEstimates }: WorkflowProps) {
  const estimate = useEstimate();
  const { projectInfo, setProjectField, sections, addSection, updateSection, removeSection, duplicateSection, addGateToSection, removeGateFromSection, totals, calculateSectionLayout, setActiveStage, startNewEstimate, clearDraft } = estimate as any;

  const [newGateWidth, setNewGateWidth] = useState(1.2);
  const [newGateType, setNewGateType] = useState("pedestrian");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(sections[0]?.id ?? null);
  const [fenceBillMessage, setFenceBillMessage] = useState<string | null>(null);

  const validProject = projectInfo.projectName.trim().length > 0 && projectInfo.clientName.trim().length > 0 && projectInfo.location.trim().length > 0;

  const currentStage = estimate.activeStage ?? 1;

  function goNext() {
    if (currentStage === 1) {
      if (!validProject) { alert("Please fill project name, client and location"); return; }
      setActiveStage(2);
      return;
    }
    if (currentStage < 4) setActiveStage(currentStage + 1);
  }

  function goBack() {
    if (currentStage > 1) setActiveStage(currentStage - 1);
  }

  function handleAddNamed(position: any, name: string) {
    const id = addSection(undefined, position, name);
    if (id) setSelectedSectionId(id);
  }

  function handleAddCustom() {
    const name = window.prompt("Name for custom section")?.trim();
    if (!name) return;
    const id = addSection(undefined, "custom", name);
    if (id) setSelectedSectionId(id);
  }

  function generateFenceBoq() {
    const measuredSections = sections
      .map((section: any) => ({
        section,
        layout: calculateSectionLayout(section.id),
      }))
      .filter(({ layout }: any) => layout && !layout.error);

    if (measuredSections.length === 0) {
      setFenceBillMessage("Add at least one valid fence section before generating the BOQ.");
      return;
    }

    try {
      const bill = getOrCreateDraftBill({
        title: `${projectInfo.projectName || "Fence Project"} Bill of Quantities`,
      });
      bill.title = `${projectInfo.projectName || "Fence Project"} Bill of Quantities`;
      bill.projectName = projectInfo.projectName || "Fence Project";
      bill.clientName = projectInfo.clientName || null;
      bill.location = projectInfo.location || null;
      bill.currency = projectInfo.currency || "NGN";

      replaceCalculationInBill({
        bill,
        sectionId: "fence-works",
        sectionTitle: "Fence Works",
        calculationId: "fence-project-scope",
        module: "fence",
        ...adaptFenceScopeToBill({ calculationId: "fence-project-scope", sections: measuredSections }),
      });
      setFenceBillMessage(`Fence BOQ updated from ${measuredSections.length} measured section${measuredSections.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setFenceBillMessage(caught instanceof Error ? caught.message : "Unable to update fence BOQ.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Fence Estimator</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#0B2942]">Project workflow</h2>
        </div>
        <div className="flex items-center gap-3">
          {steps.map((s, i) => {
            const stepNumber = i + 1;
            const disabled = stepNumber > currentStage;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { if (!disabled) setActiveStage(stepNumber); }}
                className={`rounded-full px-3 py-2 text-sm ${currentStage === stepNumber ? "bg-[#0D3B66] text-white" : disabled ? "bg-white/20 text-[#9AA6B6] cursor-not-allowed" : "bg-white/80 text-[#0B2942]"}`}
                disabled={disabled}
              >{stepNumber}. {s}</button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#556475]">Draft autosaved. <button className="underline" onClick={clearDraft}>Clear</button></div>
          <div className="flex gap-2">
            {currentStage < 4 ? (
              <>
                <button onClick={goBack} className="rounded-3xl border px-4 py-2">Back</button>
                <button onClick={goNext} className="rounded-3xl bg-[#0D3B66] px-4 py-2 text-white">Continue</button>
              </>
            ) : (
              <>
                <button onClick={goBack} className="rounded-3xl border px-4 py-2">Back</button>
                <button onClick={onOpenBill} className="rounded-3xl bg-[#0D3B66] px-4 py-2 text-white">Open Full BOQ</button>
              </>
            )}
          </div>
        </div>
      </div>

      {currentStage === 1 && (
        <section>
          <Card>
            <div className="grid gap-4">
              <label className="block text-sm font-medium text-[#0B2942]">
                Project name
                <input value={projectInfo.projectName} onChange={(e) => setProjectField("projectName", e.target.value)} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </label>
              <label className="block text-sm font-medium text-[#0B2942]">
                Client name
                <input value={projectInfo.clientName} onChange={(e) => setProjectField("clientName", e.target.value)} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </label>
              <label className="block text-sm font-medium text-[#0B2942]">
                Location
                <input value={projectInfo.location} onChange={(e) => setProjectField("location", e.target.value)} className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#0B2942]">
                  Currency
                  <select value={projectInfo.currency} onChange={(e) => setProjectField("currency", e.target.value)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                    <option>NGN</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-[#0B2942]">
                  Measurement
                  <select value={projectInfo.measurement} onChange={(e) => setProjectField("measurement", e.target.value)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                    <option>Metric</option>
                    <option>Imperial</option>
                  </select>
                </label>
              </div>
              <div className="mt-2">
                <label className="text-sm font-medium text-[#0B2942]">Design category</label>
                <div className="mt-2 flex gap-2">
                  {[
                    { id: "simple", label: "Simple" },
                    { id: "mid-range", label: "Mid-range" },
                    { id: "heavy-luxury", label: "Heavy" },
                    { id: "luxury", label: "Luxury" },
                  ].map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setProjectField("designCategory", opt.id)} className={`rounded-3xl px-4 py-2 ${projectInfo.designCategory === opt.id ? "bg-[#0D3B66] text-white" : "bg-white/80"}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {currentStage === 2 && (
        <section className="grid gap-4">
          <div className="flex gap-2">
            <button onClick={() => handleAddNamed("front", "Front")} className="rounded-full border px-4 py-2">Add Front</button>
            <button onClick={() => handleAddNamed("rear", "Rear")} className="rounded-full border px-4 py-2">Add Rear</button>
            <button onClick={() => handleAddNamed("left-side", "Left")} className="rounded-full border px-4 py-2">Add Left</button>
            <button onClick={() => handleAddNamed("right-side", "Right")} className="rounded-full border px-4 py-2">Add Right</button>
            <button onClick={handleAddCustom} className="rounded-full border px-4 py-2">Add Custom Section</button>
          </div>

          <div className="grid gap-3">
            {sections.map((s: any) => {
              const isCollapsed = !!collapsed[s.id];
              return (
                <Card key={s.id} title={s.name}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#556475]">{s.position}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))} className="rounded-full border px-3 py-1">{isCollapsed ? "Expand" : "Collapse"}</button>
                      <button onClick={() => duplicateSection(s.id)} className="rounded-full border px-3 py-1">Duplicate</button>
                      <button onClick={() => removeSection(s.id)} className="rounded-full border px-3 py-1">Remove</button>
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="grid gap-3">
                        <label className="block text-sm font-medium text-[#0B2942]">Section name
                          <input value={s.name} onChange={(e) => updateSection(s.id, { name: e.target.value } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Gross length (m)
                          <input type="number" step="0.1" value={s.grossLengthM} onChange={(e) => updateSection(s.id, { grossLengthM: Number(e.target.value) } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Block-wall height (m)
                          <input type="number" step="0.01" value={s.defaultPanelComposition.blockWallHeightM} onChange={(e) => updateSection(s.id, { defaultPanelComposition: { ...s.defaultPanelComposition, blockWallHeightM: Number(e.target.value) } } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Upper-infill type
                          <select value={s.defaultPanelComposition.upperInfillType} onChange={(e) => updateSection(s.id, { defaultPanelComposition: { ...s.defaultPanelComposition, upperInfillType: e.target.value } } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="none">none</option>
                            <option value="steel-grill">steel grill</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Upper-infill height (m)
                          <input type="number" step="0.01" value={s.defaultPanelComposition.upperInfillHeightM} onChange={(e) => updateSection(s.id, { defaultPanelComposition: { ...s.defaultPanelComposition, upperInfillHeightM: Number(e.target.value) } } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                      </div>
                      <div className="grid gap-3">
                        <label className="block text-sm font-medium text-[#0B2942]">Total column height (m)
                          <input type="number" step="0.01" value={s.columnBodyHeightM} onChange={(e) => updateSection(s.id, { columnBodyHeightM: Number(e.target.value) } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Maximum column spacing (m)
                          <input type="number" step="0.1" value={s.maximumColumnSpacingM} onChange={(e) => updateSection(s.id, { maximumColumnSpacingM: Number(e.target.value) } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3" />
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Construction system
                          <select value={s.constructionSystem ?? "reinforced-concrete"} onChange={(e) => updateSection(s.id, { constructionSystem: e.target.value } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="reinforced-concrete">reinforced-concrete</option>
                            <option value="block-pillar">block pillar</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Section design category
                          <select value={s.designCategory} onChange={(e) => updateSection(s.id, { designCategory: e.target.value } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="simple">Simple</option>
                            <option value="mid-range">Mid-range</option>
                            <option value="heavy-luxury">Heavy</option>
                          </select>
                        </label>

                        <div>
                          <div className="text-sm font-semibold">Gates ({s.gates.length}) — total {s.gates.reduce((t: number, g: any) => t + (g.widthM || 0), 0)} m</div>
                          <div className="mt-2 space-y-2">
                            {s.gates.map((g: any) => (
                              <div key={g.id} className="grid gap-2 rounded-2xl border bg-white p-3">
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <input value={g.name} onChange={(e) => updateSection(s.id, { gates: s.gates.map((gg: any) => gg.id === g.id ? { ...gg, name: e.target.value } : gg) } as any)} className="rounded-3xl border px-3 py-2" />
                                  <select value={g.type} onChange={(e) => updateSection(s.id, { gates: s.gates.map((gg: any) => gg.id === g.id ? { ...gg, type: e.target.value } : gg) } as any)} className="rounded-3xl border px-3 py-2">
                                    <option value="pedestrian">pedestrian</option>
                                    <option value="vehicle">vehicle</option>
                                  </select>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  <input type="number" step="0.01" value={g.widthM} onChange={(e) => updateSection(s.id, { gates: s.gates.map((gg: any) => gg.id === g.id ? { ...gg, widthM: Number(e.target.value) } : gg) } as any)} className="rounded-3xl border px-3 py-2" />
                                  <input type="number" step="0.01" value={g.positionFromSectionStartM} onChange={(e) => updateSection(s.id, { gates: s.gates.map((gg: any) => gg.id === g.id ? { ...gg, positionFromSectionStartM: Number(e.target.value) } : gg) } as any)} className="rounded-3xl border px-3 py-2" />
                                  <select value={g.operation} onChange={(e) => updateSection(s.id, { gates: s.gates.map((gg: any) => gg.id === g.id ? { ...gg, operation: e.target.value } : gg) } as any)} className="rounded-3xl border px-3 py-2">
                                    <option value="manual">manual</option>
                                    <option value="automated">automated</option>
                                  </select>
                                </div>
                                <div className="flex justify-end"><button onClick={() => removeGateFromSection(s.id, g.id)} className="text-xs text-[#C8320A]">Remove</button></div>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <input type="number" step="0.01" value={newGateWidth} onChange={(e) => setNewGateWidth(Number(e.target.value))} className="w-24 rounded-3xl border px-3 py-2" />
                              <select value={newGateType} onChange={(e) => setNewGateType(e.target.value)} className="rounded-3xl border px-3 py-2">
                                <option value="pedestrian">Pedestrian</option>
                                <option value="vehicle">Vehicle</option>
                              </select>
                              <button onClick={() => { const gateId = `gate-${Date.now()}`; const gate = { id: gateId, name: `${newGateType} gate`, type: newGateType, operation: "manual", widthM: newGateWidth, heightM: 2.0, positionFromSectionStartM: 0 }; addGateToSection(s.id, gate); }} className="rounded-3xl bg-[#0D3B66] px-4 py-2 text-white">Add gate</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <button onClick={() => setSelectedSectionId(s.id)} className="rounded-full border px-3 py-1">Preview</button>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedSectionId ? (
            <div className="mt-4">
              <h4 className="text-lg font-semibold">Section preview</h4>
              <div className="grid gap-2">
                {(() => {
                  const res = calculateSectionLayout(selectedSectionId);
                  if (!res) return <div>Not enough data</div>;
                  if (res.error) return <div className="text-red-600">{res.error}</div>;
                  return (
                    <div className="grid gap-2">
                      <div>Gross length: {res.grossSectionLengthM} m</div>
                      <div>Gate opening width: {res.totalGateOpeningWidthM} m</div>
                      <div>Columns: {res.columns.length}</div>
                      <div>Column-occupied length: {res.totalColumnOccupiedLengthM} m</div>
                      <div>Clear block-panel length: {res.totalClearBlockPanelLengthM} m</div>
                      <div>Blockwork area: {res.totalBlockworkAreaM2} m²</div>
                      <div>Upper-infill area: {res.totalUpperInfillAreaM2} m²</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {currentStage === 3 && (
        <section className="grid gap-4">
          <h3 className="text-xl font-semibold">Structure</h3>
          <div className="grid gap-3">
            {sections.map((s: any) => {
              const res = calculateSectionLayout(s.id);
              return (
                <Card key={s.id} title={s.name}>
                  {res?.error ? <div className="text-red-600">{res.error}</div> : (
                    <div className="grid gap-2">
                      <div>Gross length: {res?.grossSectionLengthM} m</div>
                      <div>Gate opening width: {res?.totalGateOpeningWidthM} m</div>
                      <div>Column count: {res?.columns?.length}</div>
                      <div>Column system: {res?.columns?.[0]?.constructionSystem ?? "-"}</div>
                      <div>Block-wall height: {s.defaultPanelComposition.blockWallHeightM} m</div>
                      <div>Column height: {s.columnBodyHeightM} m</div>
                      <div>Upper-infill height: {s.defaultPanelComposition.upperInfillHeightM} m</div>
                      <div>Clear block-panel length: {res?.totalClearBlockPanelLengthM} m</div>
                      <div>Blockwork area: {res?.totalBlockworkAreaM2} m²</div>
                      <div>Upper-infill area: {res?.totalUpperInfillAreaM2} m²</div>
                      <div>Reconciliation: {res && (res.totalGateOpeningWidthM + res.totalColumnOccupiedLengthM + res.totalClearBlockPanelLengthM)} m = {res?.grossSectionLengthM} m</div>
                    </div>
                  )}
                </Card>
              );
            })}

            <Card>
              <div className="grid gap-2">
                <div>Total gross length: {sections.reduce((t: number, s: any) => t + Number(s.grossLengthM || 0), 0)} m</div>
                <div>Total gate opening: {sections.reduce((t: number, s: any) => t + (s.gates?.reduce((g: number, x: any) => g + Number(x.widthM || 0), 0) || 0), 0)} m</div>
                <div>Total column occupied length: {sections.reduce((t: number, s: any) => t + (calculateSectionLayout(s.id)?.totalColumnOccupiedLengthM || 0), 0)} m</div>
                <div>Total clear panel length: {sections.reduce((t: number, s: any) => t + (calculateSectionLayout(s.id)?.totalClearBlockPanelLengthM || 0), 0)} m</div>
                <div>Total blockwork area: {sections.reduce((t: number, s: any) => t + (calculateSectionLayout(s.id)?.totalBlockworkAreaM2 || 0), 0)} m²</div>
                <div>Total upper-infill area: {sections.reduce((t: number, s: any) => t + (calculateSectionLayout(s.id)?.totalUpperInfillAreaM2 || 0), 0)} m²</div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {currentStage === 4 && (
        <section>
          <div className="mb-5 flex flex-col gap-4 rounded-[28px] bg-[#071E33] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E7B34B]">Fence scope to BOQ</p>
              <p className="mt-2 text-sm text-white/75">Generate or refresh measured fence work, gates, columns, grills, coping, security and finishes.</p>
              {fenceBillMessage ? <p className="mt-2 text-sm font-semibold text-[#FFE3A3]">{fenceBillMessage}</p> : null}
            </div>
            <button type="button" onClick={generateFenceBoq} className="shrink-0 rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white">Generate / Update Fence BOQ</button>
          </div>
          <ReviewWorkspace
            onOpenConcrete={onOpenConcrete}
            onOpenBlockwork={onOpenBlockwork}
            onOpenEstimates={onOpenEstimates}
            onStartFence={() => {
              startNewEstimate();
              setActiveStage(1);
            }}
          />
        </section>
      )}
    </div>
  );
}
