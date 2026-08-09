"use client";

import React, { useState } from "react";
import Card from "./ui/card";
import Field from "./ui/field";
import ShellButton from "./ui/button";
import { useEstimate } from "./estimate-provider";
import ReviewWorkspace from "../bill/review-workspace";
import { adaptFenceScopeToBill } from "@/lib/billing/fence-adapter";
import { getOrCreateDraftBill, replaceCalculationSectionsInBill } from "@/lib/billing/store";

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

  function updateBoqProfile(section: any, field: string, value: number | string | boolean) {
    updateSection(section.id, {
      boqProfile: { ...section.boqProfile, [field]: value },
    } as any);
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

      const adapted = adaptFenceScopeToBill({
        calculationId: "fence-project-scope",
        sections: measuredSections,
      });
      replaceCalculationSectionsInBill({
        bill,
        calculationId: "fence-project-scope",
        module: "fence",
        sections: adapted.workSections,
        materials: adapted.materials,
        assumptions: adapted.assumptions,
      });
      setFenceBillMessage(`Fence BOQ updated from ${measuredSections.length} measured section${measuredSections.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setFenceBillMessage(caught instanceof Error ? caught.message : "Unable to update fence BOQ.");
    }
  }

  return (
    <div className="fence-workflow min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0D3B66]/70 sm:text-sm">Fence Estimator</p>
          <h2 className="mt-1 text-xl font-bold text-[#0B2942] sm:mt-2 sm:text-2xl">Project workflow</h2>
        </div>
        <div className="grid w-full grid-cols-4 gap-1 sm:flex sm:w-auto sm:items-center sm:gap-3">
          {steps.map((s, i) => {
            const stepNumber = i + 1;
            const disabled = stepNumber > currentStage;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { if (!disabled) setActiveStage(stepNumber); }}
                className={`min-w-0 rounded-xl px-1.5 py-2 text-[10px] font-bold sm:rounded-full sm:px-3 sm:text-sm ${currentStage === stepNumber ? "bg-[#0D3B66] text-white" : disabled ? "cursor-not-allowed bg-white/35 text-[#9AA6B6]" : "bg-white/80 text-[#0B2942]"}`}
                disabled={disabled}
              ><span className="block sm:inline">{stepNumber}</span><span className="mt-0.5 block truncate sm:ml-1 sm:mt-0 sm:inline">{s}</span></button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[20px] bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#556475] sm:text-sm">Draft autosaved. <button className="font-semibold underline" onClick={clearDraft}>Clear</button></div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {currentStage < 4 ? (
              <>
                <button onClick={goBack} className="rounded-xl border px-4 py-2 text-sm font-semibold sm:rounded-3xl">Back</button>
                <button onClick={goNext} className="rounded-xl bg-[#0D3B66] px-4 py-2 text-sm font-semibold text-white sm:rounded-3xl">Continue</button>
              </>
            ) : (
              <>
                <button onClick={goBack} className="rounded-xl border px-4 py-2 text-sm font-semibold sm:rounded-3xl">Back</button>
                <button onClick={onOpenBill} className="rounded-xl bg-[#0D3B66] px-4 py-2 text-sm font-semibold text-white sm:rounded-3xl">Open Full BOQ</button>
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
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button onClick={() => handleAddNamed("front", "Front")} className="rounded-xl border border-[#CAD6E2] bg-white px-3 py-2.5 text-sm font-semibold">+ Front</button>
            <button onClick={() => handleAddNamed("rear", "Rear")} className="rounded-xl border border-[#CAD6E2] bg-white px-3 py-2.5 text-sm font-semibold">+ Rear</button>
            <button onClick={() => handleAddNamed("left-side", "Left")} className="rounded-xl border border-[#CAD6E2] bg-white px-3 py-2.5 text-sm font-semibold">+ Left</button>
            <button onClick={() => handleAddNamed("right-side", "Right")} className="rounded-xl border border-[#CAD6E2] bg-white px-3 py-2.5 text-sm font-semibold">+ Right</button>
            <button onClick={handleAddCustom} className="col-span-2 rounded-xl border border-[#0D3B66] bg-[#0D3B66] px-3 py-2.5 text-sm font-semibold text-white sm:col-span-1">+ Custom section</button>
          </div>

          <div className="grid gap-3">
            {sections.map((s: any) => {
              const isCollapsed = !!collapsed[s.id];
              return (
                <Card key={s.id} title={s.name}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-[#556475]">{s.position}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))} className="rounded-lg border px-2 py-2 text-xs font-semibold sm:rounded-full sm:px-3 sm:py-1">{isCollapsed ? "Expand" : "Collapse"}</button>
                      <button onClick={() => duplicateSection(s.id)} className="rounded-lg border px-2 py-2 text-xs font-semibold sm:rounded-full sm:px-3 sm:py-1">Duplicate</button>
                      <button onClick={() => removeSection(s.id)} className="rounded-lg border border-[#F0C3B7] px-2 py-2 text-xs font-semibold text-[#C8320A] sm:rounded-full sm:px-3 sm:py-1">Remove</button>
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <div className="mt-4 grid grid-cols-1 gap-x-3 gap-y-4 min-[340px]:grid-cols-2">
                      <div className="contents">
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
                      <div className="contents">
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
                        <label className="block text-sm font-medium text-[#0B2942]">Wall coping
                          <select value={s.wallCopingType} onChange={(e) => updateSection(s.id, { wallCopingType: e.target.value } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="none">None</option>
                            <option value="in-situ-concrete">In-situ concrete</option>
                            <option value="precast-concrete">Precast concrete</option>
                            <option value="stone">Stone coping</option>
                            <option value="metal">Metal coping</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Column caps
                          <select value={s.regularColumnCapType} onChange={(e) => updateSection(s.id, { regularColumnCapType: e.target.value, cornerColumnCapType: e.target.value, gatePostCapType: e.target.value } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="none">None</option>
                            <option value="in-situ-concrete">In-situ concrete</option>
                            <option value="precast-concrete">Precast concrete</option>
                            <option value="stone">Stone caps</option>
                            <option value="metal">Metal caps</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">External finish
                          <select value={s.externalFinish.standardFinish} onChange={(e) => updateSection(s.id, { externalFinish: { ...s.externalFinish, standardFinish: e.target.value } } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="none">None</option>
                            <option value="fair-face">Fair face</option>
                            <option value="plaster-and-paint">Plaster and paint</option>
                            <option value="textured-paint">Plaster and textured paint</option>
                            <option value="stone-cladding">Stone cladding</option>
                            <option value="tile-cladding">Tile cladding</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-[#0B2942]">Internal finish
                          <select value={s.internalFinish.standardFinish} onChange={(e) => updateSection(s.id, { internalFinish: { ...s.internalFinish, standardFinish: e.target.value } } as any)} className="mt-2 w-full rounded-3xl border bg-[#F8FAFC] px-4 py-3">
                            <option value="none">None</option>
                            <option value="fair-face">Fair face</option>
                            <option value="plaster-and-paint">Plaster and paint</option>
                            <option value="textured-paint">Plaster and textured paint</option>
                            <option value="stone-cladding">Stone cladding</option>
                            <option value="tile-cladding">Tile cladding</option>
                          </select>
                        </label>

                        <div className="col-span-1 mt-1 border-t border-[#DFE6EE] pt-4 min-[340px]:col-span-2">
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
                            <div className="grid grid-cols-[68px_minmax(0,1fr)_auto] gap-2">
                              <input aria-label="New gate width" type="number" step="0.01" value={newGateWidth} onChange={(e) => setNewGateWidth(Number(e.target.value))} className="min-w-0 rounded-xl border px-2 py-2" />
                              <select aria-label="New gate type" value={newGateType} onChange={(e) => setNewGateType(e.target.value)} className="min-w-0 rounded-xl border px-2 py-2">
                                <option value="pedestrian">Pedestrian</option>
                                <option value="vehicle">Vehicle</option>
                              </select>
                              <button onClick={() => { const gateId = `gate-${Date.now()}`; const gate = { id: gateId, name: `${newGateType} gate`, type: newGateType, operation: "manual", widthM: newGateWidth, heightM: 2.0, positionFromSectionStartM: 0 }; addGateToSection(s.id, gate); }} className="rounded-xl bg-[#0D3B66] px-3 py-2 text-xs font-bold text-white">Add</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <button onClick={() => setSelectedSectionId(s.id)} className="w-full rounded-xl border border-[#0D3B66] px-3 py-2 text-sm font-semibold text-[#0D3B66] sm:w-auto sm:rounded-full sm:py-1">View section summary</button>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedSectionId ? (
            <div className="mt-2 rounded-[22px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:mt-4 sm:p-6">
              <h4 className="text-base font-bold sm:text-lg">Section summary</h4>
              <div className="mt-3 grid gap-2">
                {(() => {
                  const res = calculateSectionLayout(selectedSectionId);
                  if (!res) return <div>Not enough data</div>;
                  if (res.error) return <div className="text-red-600">{res.error}</div>;
                  return (
                    <dl className="grid grid-cols-2 gap-2">
                      {[
                        ["Gross length", `${res.grossSectionLengthM} m`],
                        ["Gate openings", `${res.totalGateOpeningWidthM} m`],
                        ["Columns", `${res.columns.length}`],
                        ["Column width", `${res.totalColumnOccupiedLengthM} m`],
                        ["Clear panels", `${res.totalClearBlockPanelLengthM} m`],
                        ["Blockwork", `${res.totalBlockworkAreaM2} m²`],
                        ["Upper infill", `${res.totalUpperInfillAreaM2} m²`],
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0 rounded-xl bg-[#F3F6F9] p-3">
                          <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B7D8F]">{label}</dt>
                          <dd className="mt-1 truncate text-sm font-bold text-[#071E33]">{value}</dd>
                        </div>
                      ))}
                    </dl>
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
              const p = s.boqProfile;
              return (
                <Card key={s.id} title={s.name}>
                  {res?.error ? <div className="text-red-600">{res.error}</div> : (
                    <div className="grid gap-2">
                      <div>Gross length: {res?.grossSectionLengthM} m</div>
                      <div>Gate opening width: {res?.totalGateOpeningWidthM} m</div>
                      <div className="rounded-xl bg-[#FFF4E4] p-3 font-semibold text-[#8A3A11]">Column count: {res?.columns?.length} — calculation driver only; the BOQ is broken into concrete, reinforcement, formwork or block-pillar constituents.</div>
                      <div>Column system: {res?.columns?.[0]?.constructionSystem ?? "-"}</div>
                      <div>Block-wall height: {s.defaultPanelComposition.blockWallHeightM} m</div>
                      <div>Column height: {s.columnBodyHeightM} m</div>
                      <div>Upper-infill height: {s.defaultPanelComposition.upperInfillHeightM} m</div>
                      <div>Clear block-panel length: {res?.totalClearBlockPanelLengthM} m</div>
                      <div>Blockwork area: {res?.totalBlockworkAreaM2} m²</div>
                      <div>Upper-infill area: {res?.totalUpperInfillAreaM2} m²</div>
                      <div>Reconciliation: {res && (res.totalGateOpeningWidthM + res.totalColumnOccupiedLengthM + res.totalClearBlockPanelLengthM)} m = {res?.grossSectionLengthM} m</div>
                      <details className="mt-3 rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-3">
                        <summary className="cursor-pointer text-sm font-bold text-[#0D3B66]">Edit substructure assumptions</summary>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {[
                            ["Trench width (m)", "trenchWidthM", 0.05],
                            ["Trench depth (m)", "trenchDepthM", 0.05],
                            ["Column pit length (m)", "columnPitLengthM", 0.05],
                            ["Column pit width (m)", "columnPitWidthM", 0.05],
                            ["Column pit depth (m)", "columnPitDepthM", 0.05],
                            ["Blinding thickness (m)", "blindingThicknessM", 0.01],
                            ["Strip footing width (m)", "stripFootingWidthM", 0.05],
                            ["Strip footing thickness (m)", "stripFootingThicknessM", 0.01],
                            ["Foundation block height (m)", "foundationBlockworkHeightM", 0.025],
                            ["Column base length (m)", "columnBaseLengthM", 0.05],
                            ["Column base width (m)", "columnBaseWidthM", 0.05],
                            ["Column base thickness (m)", "columnBaseThicknessM", 0.01],
                            ["Starter height (m)", "starterHeightM", 0.05],
                            ["Base basket bars", "baseMainBarCount", 1],
                            ["Base bar diameter (mm)", "baseMainBarDiameterMm", 1],
                            ["Starter bars", "starterBarCount", 1],
                            ["Starter bar diameter (mm)", "starterBarDiameterMm", 1],
                          ].map(([label, field, step]) => (
                            <label key={String(field)} className="text-xs font-semibold text-[#33485D]">{label}
                              <input type="number" step={Number(step)} value={p[field as keyof typeof p] as number} onChange={(e) => updateBoqProfile(s, String(field), Number(e.target.value))} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5" />
                            </label>
                          ))}
                          <label className="text-xs font-semibold text-[#33485D]">Foundation block infill
                            <select value={p.foundationBlockInfill} onChange={(e) => updateBoqProfile(s, "foundationBlockInfill", e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5">
                              <option value="none">Hollow / not filled</option>
                              <option value="partial">Partially filled</option>
                              <option value="full">Fully filled with weak concrete</option>
                            </select>
                          </label>
                          {[
                            ["Blinding mix", "blindingMix"],
                            ["Structural concrete mix", "structuralConcreteMix"],
                            ["Weak concrete mix", "weakConcreteMix"],
                            ["Block-laying mortar mix", "mortarMix"],
                          ].map(([label, field]) => (
                            <label key={field} className="text-xs font-semibold text-[#33485D]">{label}
                              <input value={p[field as keyof typeof p] as string} onChange={(e) => updateBoqProfile(s, field, e.target.value)} placeholder="e.g. 1:2:4" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5" />
                            </label>
                          ))}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-3">
                        <summary className="cursor-pointer text-sm font-bold text-[#0D3B66]">Edit column construction assumptions</summary>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {s.constructionSystem === "block-pillar" ? (
                            <>
                              {[
                                ["Pillar width (m)", "blockPillarWidthM", 0.025],
                                ["Pillar depth (m)", "blockPillarDepthM", 0.025],
                                ["Blocks per course", "blocksPerPillarCourse", 1],
                                ["Course height (m)", "blockCourseHeightM", 0.025],
                                ["Vertical bars", "blockPillarVerticalBarCount", 1],
                                ["Vertical bar diameter (mm)", "blockPillarVerticalBarDiameterMm", 1],
                              ].map(([label, field, step]) => (
                                <label key={String(field)} className="text-xs font-semibold text-[#33485D]">{label}
                                  <input type="number" step={Number(step)} value={p[field as keyof typeof p] as number} onChange={(e) => updateBoqProfile(s, String(field), Number(e.target.value))} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5" />
                                </label>
                              ))}
                              <label className="text-xs font-semibold text-[#33485D]">Block-pillar infill
                                <select value={p.blockPillarInfill} onChange={(e) => updateBoqProfile(s, "blockPillarInfill", e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5">
                                  <option value="none">Hollow / not filled</option>
                                  <option value="partial">Partially filled</option>
                                  <option value="full">Fully filled with weak concrete</option>
                                </select>
                              </label>
                            </>
                          ) : (
                            <>
                              {[
                                ["RC column width (m)", "rcColumnWidthM", 0.025],
                                ["RC column depth (m)", "rcColumnDepthM", 0.025],
                                ["Main bars", "rcMainBarCount", 1],
                                ["Main bar diameter (mm)", "rcMainBarDiameterMm", 1],
                                ["Link diameter (mm)", "rcLinkDiameterMm", 1],
                                ["Link spacing (m)", "rcLinkSpacingM", 0.025],
                              ].map(([label, field, step]) => (
                                <label key={String(field)} className="text-xs font-semibold text-[#33485D]">{label}
                                  <input type="number" step={Number(step)} value={p[field as keyof typeof p] as number} onChange={(e) => updateBoqProfile(s, String(field), Number(e.target.value))} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5" />
                                </label>
                              ))}
                            </>
                          )}
                          <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-xs font-semibold text-[#33485D]">
                            <input type="checkbox" checked={p.includePreliminaries} onChange={(e) => updateBoqProfile(s, "includePreliminaries", e.target.checked)} />
                            Include preliminaries
                          </label>
                          <label className="text-xs font-semibold text-[#33485D]">Material wastage (%)
                            <input type="number" step="0.5" value={p.materialWastagePercent} onChange={(e) => updateBoqProfile(s, "materialWastagePercent", Number(e.target.value))} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5" />
                          </label>
                        </div>
                      </details>
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
