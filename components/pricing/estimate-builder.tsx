"use client";

import { useEffect, useMemo, useState } from "react";

import { createNewBill, loadBill } from "@/lib/billing/store";
import WorkDiagram from "@/components/estimator/visuals/work-diagram";
import { calculateAnalysedRate } from "@/lib/pricing/analysis";
import { getDefaultAssumptionValues } from "@/lib/pricing/assumptions";
import { WORK_CATEGORIES } from "@/lib/pricing/categories";
import { applyRateEstimateToBill } from "@/lib/pricing/estimate-adapter";
import type {
  EstimateLine,
  PriceItem,
  RateEstimate,
  RateTemplate,
} from "@/lib/pricing/models";
import {
  PRICE_LIBRARY_UPDATED_EVENT,
  RATE_ESTIMATE_UPDATED_EVENT,
  createRateEstimate,
  deleteRateEstimate,
  loadPriceItems,
  loadRateEstimate,
  loadRateEstimates,
  loadRateTemplates,
  saveRateEstimate,
  selectRateEstimate,
} from "@/lib/pricing/store";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);

const safeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const getModuleTitle = (module: string) => ({
  concrete: "Concrete",
  blockwork: "Blockwork",
  reinforcement: "Reinforcement",
  formwork: "Formwork",
  excavation: "Earthworks",
  finishes: "Finishes",
  electrical: "Electrical",
  mechanical: "Mechanical",
  roofing: "Roofing",
  civil: "Civil",
  external: "External works",
  fence: "Fence",
}[module] ?? module.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));

export default function EstimateBuilder({
  onOpenRates,
  onOpenBill,
}: {
  onOpenRates: () => void;
  onOpenBill: () => void;
}) {
  const [estimate, setEstimate] = useState<RateEstimate | null>(null);
  const [estimates, setEstimates] = useState<RateEstimate[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [templates] = useState<RateTemplate[]>(() => loadRateTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates[0]?.id ?? "custom",
  );
  const [resourceSelection, setResourceSelection] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId);

  useEffect(() => {
    let current = loadRateEstimate();
    if (!current) current = createRateEstimate();
    setEstimate(current);
    setEstimates(loadRateEstimates());
    setPrices(loadPriceItems());

    const refreshPrices = () => setPrices(loadPriceItems());
    const refreshEstimates = () => setEstimates(loadRateEstimates());
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refreshPrices);
    window.addEventListener(RATE_ESTIMATE_UPDATED_EVENT, refreshEstimates);
    return () => {
      window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refreshPrices);
      window.removeEventListener(RATE_ESTIMATE_UPDATED_EVENT, refreshEstimates);
    };
  }, []);

  const commit = (update: (draft: RateEstimate) => void) => {
    if (!estimate) return;
    const draft = clone(estimate);
    update(draft);
    const saved = saveRateEstimate(draft);
    setEstimate(saved);
  };

  const lineResults = useMemo(() => {
    if (!estimate) return [];
    return estimate.lines.map((line) => {
      const catalogTemplate = templates.find((item) => item.id === line.templateId);
      const template = catalogTemplate ?? (line.customComponents?.length
        ? {
            id: `custom-${line.id}`,
            code: "CUSTOM",
            name: line.description,
            description: line.description,
            unit: line.unit,
            module: "custom",
            category: line.category ?? "custom",
            components: line.customComponents,
          }
        : null);
      if (!template) {
        const unitRate = line.customUnitRate ?? 0;
        return {
          line,
          template: null,
          analysis: null,
          unitRate,
          amount: line.quantity * unitRate,
          missingCount: line.customUnitRate === null || line.customUnitRate === undefined ? 1 : 0,
        };
      }
      const analysis = calculateAnalysedRate({
        template,
        prices,
        componentQuantityOverrides: line.componentQuantityOverrides,
        assumptionValues: line.assumptionValues,
        overheadPercent: line.overheadPercent,
        profitPercent: line.profitPercent,
      });
      const rateSource = line.rateSource ?? (line.manualUnitRateOverride !== null && line.manualUnitRateOverride !== undefined ? "manual" : "default");
      const unitRate = rateSource === "manual"
        ? line.manualUnitRateOverride ?? 0
        : rateSource === "analysed"
          ? analysis.unitRate
          : template.defaultUnitRate ?? 0;
      return {
        line,
        template,
        analysis,
        unitRate,
        amount: line.quantity * unitRate,
        missingCount: rateSource === "analysed" ? analysis.missingPriceItemIds.length : 0,
      };
    });
  }, [estimate, prices, templates]);

  const total = lineResults.reduce((sum, result) => sum + result.amount, 0);
  const missingPriceCount = lineResults.reduce(
    (sum, result) => sum + result.missingCount,
    0,
  );

  const addLine = () => {
    const template = templates.find((item) => item.id === selectedTemplateId);
    commit((draft) => {
      const line: EstimateLine = template
        ? {
            id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            templateId: template.id,
            description: template.description,
            unit: template.unit,
            quantity: 1,
            overheadPercent: 0,
            profitPercent: 0,
            componentQuantityOverrides: {},
            assumptionValues: getDefaultAssumptionValues(template),
            category: template.category ?? "custom",
            manualUnitRateOverride: null,
            rateSource: "default",
          }
        : {
            id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            templateId: "custom",
            description: "Custom construction work item",
            unit: "item",
            quantity: 1,
            overheadPercent: 0,
            profitPercent: 0,
            componentQuantityOverrides: {},
            category: "custom",
            customUnitRate: null,
            customComponents: [],
            manualUnitRateOverride: null,
            rateSource: "manual",
          };
      draft.lines.push(line);
    });
    setMessage("Work item added. Quantities and component allowances remain editable.");
  };

  const updateLine = (lineId: string, patch: Partial<EstimateLine>) => {
    commit((draft) => {
      draft.lines = draft.lines.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      );
    });
  };

  const changeLineTemplate = (lineId: string, templateId: string) => {
    const template = templates.find((candidate) => candidate.id === templateId);
    if (!template) {
      updateLine(lineId, {
        templateId: "custom",
        category: "custom",
        customComponents: [],
        componentQuantityOverrides: {},
        assumptionValues: {},
        rateSource: "manual",
        manualUnitRateOverride: null,
      });
      return;
    }
    updateLine(lineId, {
      templateId: template.id,
      description: template.description,
      unit: template.unit,
      category: template.category ?? "custom",
      customComponents: undefined,
      customUnitRate: null,
      componentQuantityOverrides: {},
      assumptionValues: getDefaultAssumptionValues(template),
      rateSource: "default",
      manualUnitRateOverride: null,
    });
  };

  const removeLine = (lineId: string) => {
    commit((draft) => {
      draft.lines = draft.lines.filter((line) => line.id !== lineId);
    });
  };

  const updateComponentQuantity = (
    line: EstimateLine,
    componentId: string,
    quantity: number,
  ) => {
    updateLine(line.id, {
      componentQuantityOverrides: {
        ...line.componentQuantityOverrides,
        [componentId]: quantity,
      },
    });
  };

  const addCustomResource = (line: EstimateLine) => {
    const priceItemId = resourceSelection[line.id] || prices[0]?.id;
    const price = prices.find((item) => item.id === priceItemId);
    if (!price) return;
    updateLine(line.id, {
      customComponents: [
        ...(line.customComponents ?? []),
        {
          id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          priceItemId: price.id,
          description: price.description,
          category: price.category,
          quantityPerUnit: 1,
        },
      ],
    });
  };

  const removeCustomResource = (line: EstimateLine, componentId: string) => {
    updateLine(line.id, {
      customComponents: (line.customComponents ?? []).filter(
        (component) => component.id !== componentId,
      ),
    });
  };

  const startNew = () => {
    const next = createRateEstimate({
      title: "New Construction Estimate",
      location: estimate?.location || "Abuja",
      currency: estimate?.currency || "NGN",
    });
    setEstimate(next);
    setMessage("New estimate created. Earlier estimates remain saved.");
  };

  const openEstimate = (id: string) => {
    const selected = selectRateEstimate(id);
    setEstimate(selected);
    setMessage("Saved estimate opened for editing.");
  };

  const removeEstimate = () => {
    if (!estimate || !window.confirm(`Delete “${estimate.title}”?`)) return;
    const next = deleteRateEstimate(estimate.id) ?? createRateEstimate();
    setEstimate(next);
    setMessage("Estimate deleted.");
  };

  const sendToBoq = () => {
    if (!estimate || estimate.lines.length === 0) {
      setMessage("Add at least one work item before generating the BOQ.");
      return;
    }
    try {
      const bill = loadBill() ?? createNewBill({
        title: `${estimate.title} — Bill of Quantities`,
      });
      applyRateEstimateToBill({ bill, estimate, prices, templates });
      setMessage(
        missingPriceCount
          ? `BOQ updated. ${missingPriceCount} rate component(s) remain unpriced.`
          : "BOQ updated from the current analysed estimate.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update BOQ.");
    }
  };

  if (!estimate) return null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-[#071E33] p-6 text-white shadow-[0_24px_70px_rgba(7,30,51,0.18)] md:p-8">
        <div className="grid gap-7 xl:grid-cols-[1fr_0.45fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E7B34B]">Internal cost planning</p>
            <input value={estimate.title} onChange={(event) => commit((draft) => { draft.title = event.target.value; })} className="mt-3 w-full border-b border-white/20 bg-transparent py-2 text-3xl font-bold text-white outline-none" />
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Build project costs from editable unit-rate analyses. Updating the Price Library recalculates this draft automatically; generated completed bills remain frozen.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <input value={estimate.projectName} onChange={(event) => commit((draft) => { draft.projectName = event.target.value; })} placeholder="Project name" className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
              <input value={estimate.clientName} onChange={(event) => commit((draft) => { draft.clientName = event.target.value; })} placeholder="Client" className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
              <input value={estimate.location} onChange={(event) => commit((draft) => { draft.location = event.target.value; })} placeholder="Location" className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
            </div>
          </div>
          <div className="rounded-[26px] bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">Current estimate</p>
            <strong className="mt-3 block text-3xl">{money(total, estimate.currency)}</strong>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-white/55">Work items</span><strong className="block text-xl">{estimate.lines.length}</strong></div><div><span className="text-white/55">Missing prices</span><strong className={`block text-xl ${missingPriceCount ? "text-[#FFD5C7]" : "text-[#BFF5DB]"}`}>{missingPriceCount}</strong></div></div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-white/12 pt-5">
          <button type="button" onClick={sendToBoq} className="rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white">Generate / Update BOQ</button>
          <button type="button" onClick={onOpenBill} className="rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white">View BOQ</button>
          <button type="button" onClick={onOpenRates} className="rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white">Update Price List</button>
          <button type="button" onClick={startNew} className="rounded-full px-5 py-3 text-sm font-semibold text-white/75">New Estimate</button>
          <button type="button" onClick={removeEstimate} className="rounded-full px-5 py-3 text-sm font-semibold text-[#FFD5C7]">Delete</button>
        </div>
        {message ? <p className="mt-4 text-sm text-[#FFE3A3]">{message}</p> : null}
      </section>

      <section className="rounded-[28px] border border-[#d6dfe9] bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[0.72fr_1fr_0.78fr] xl:items-center">
          <WorkDiagram type={selectedTemplate?.diagramType ?? "custom"} title={selectedTemplate?.name ?? "Custom measured work"} unit={selectedTemplate?.unit ?? "item"} />
          <div className="grid gap-4">
          <label className="text-sm font-semibold text-[#071E33]">Open saved estimate<select value={estimate.id} onChange={(event) => openEstimate(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#CCD7E3] px-4 py-3 font-normal">{estimates.map((item) => <option key={item.id} value={item.id}>{item.title} · {new Date(item.updatedAt).toLocaleDateString("en-NG")}</option>)}</select></label>
          <label className="text-sm font-semibold text-[#071E33]">Add work item<select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#CCD7E3] px-4 py-3 font-normal"><optgroup label="Work types and specifications">{templates.map((template) => <option key={template.id} value={template.id}>{getModuleTitle(template.module)} — {template.name}</option>)}</optgroup><option value="custom">Custom / subcontract item</option></select></label>
          </div>
          <div className="rounded-[24px] bg-[#F4F7FA] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C8320A]">Visual work module</p><h3 className="mt-3 text-xl font-bold text-[#071E33]">{selectedTemplate?.name ?? "Custom work item"}</h3><p className="mt-2 text-sm leading-6 text-[#526579]">{selectedTemplate?.description ?? "Create a measured item and build its rate from any resources in the catalog."}</p><button type="button" onClick={addLine} className="mt-5 w-full rounded-full bg-[#0D3B66] px-5 py-3 text-sm font-bold text-white">Add to Estimate</button></div>
        </div>
      </section>

      {lineResults.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-[#B8C7D6] bg-white p-10 text-center"><h3 className="text-2xl font-bold text-[#071E33]">Start with a work item</h3><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#526579]">Choose a building, civil, electrical or mechanical template above. You can edit every resource allowance, or add a completely custom subcontract item.</p></section>
      ) : (
        <section className="space-y-4">
          {lineResults.map(({ line, template, analysis, unitRate, amount, missingCount }, index) => (
            <article key={line.id} className="overflow-hidden rounded-[30px] border border-[#d6dfe9] bg-white shadow-sm">
              <div className="grid gap-4 p-5 lg:grid-cols-[auto_1fr_120px_120px_190px] lg:items-end md:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF1F7] text-sm font-bold text-[#0D3B66]">{index + 1}</span>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <select aria-label={`Work type for ${line.description}`} value={line.templateId} onChange={(event) => changeLineTemplate(line.id, event.target.value)} className="max-w-full rounded-full border border-[#C7D4E1] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0D3B66] outline-none">
                      {templates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                      <option value="custom">Custom / subcontract item</option>
                    </select>
                    <select aria-label={`BOQ section for ${line.description}`} value={line.category ?? template?.category ?? "custom"} onChange={(event) => updateLine(line.id, { category: event.target.value })} className="rounded-full bg-[#FFF0E9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#C8320A] outline-none">{(template?.module === "concrete" ? WORK_CATEGORIES.filter((category) => category.id === "substructure" || category.id === "superstructure") : WORK_CATEGORIES).map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select>
                  </div>
                  <textarea value={line.description} onChange={(event) => updateLine(line.id, { description: event.target.value })} rows={2} className="mt-2 w-full resize-none rounded-xl border border-[#CCD7E3] px-3 py-2 text-sm" />
                </div>
                <label className="text-xs font-semibold text-[#526579]">Quantity<input type="number" min="0" step="0.001" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: safeNumber(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#CCD7E3] px-3 py-2 text-right" /></label>
                <label className="text-xs font-semibold text-[#526579]">Unit<input value={line.unit} onChange={(event) => updateLine(line.id, { unit: event.target.value })} className="mt-2 w-full rounded-xl border border-[#CCD7E3] px-3 py-2" /></label>
                <div className="space-y-2 rounded-2xl bg-[#071E33] p-4 text-white">
                  <span className="text-xs text-white/60">Estimated amount</span><strong className="block text-lg">{money(amount, estimate.currency)}</strong><span className="block text-[10px] text-white/55">{money(unitRate, estimate.currency)} / {line.unit}</span>
                  {template ? <select aria-label={`Rate source for ${line.description}`} value={line.rateSource ?? "default"} onChange={(event) => updateLine(line.id, { rateSource: event.target.value as EstimateLine["rateSource"] })} className="w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white outline-none"><option className="text-[#071E33]" value="default">Default rate</option><option className="text-[#071E33]" value="analysed">Analysed rate</option><option className="text-[#071E33]" value="manual">Manual rate</option></select> : null}
                  {template && line.rateSource === "manual" ? <input aria-label={`Manual rate for ${line.description}`} type="number" min="0" step="0.01" value={line.manualUnitRateOverride ?? ""} placeholder="Enter rate" onChange={(event) => updateLine(line.id, { manualUnitRateOverride: event.target.value === "" ? null : safeNumber(event.target.value) })} className="w-full rounded-lg border border-white/25 bg-white px-2 py-1.5 text-right text-xs text-[#071E33]" /> : null}
                </div>
              </div>

              {template && analysis ? (
                <details className="border-t border-[#DFE6EE] bg-[#F8FAFC] p-5 md:px-6">
                  <summary className="cursor-pointer text-sm font-bold text-[#0D3B66]">Assumptions & rate analysis · {analysis.components.length} components · {missingCount ? `${missingCount} price(s) missing` : "fully priced"}</summary>
                  {template.assumptions?.length ? <div className="mt-5 rounded-2xl border border-[#D6E0EA] bg-white p-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#071E33]">Element-specific assumptions</p><p className="text-xs leading-5 text-[#526579]">Change this item only. Other concrete, electrical or mechanical items keep their own settings.</p></div><button type="button" onClick={() => updateLine(line.id, { assumptionValues: getDefaultAssumptionValues(template), componentQuantityOverrides: {} })} className="mt-2 w-fit text-xs font-bold text-[#C8320A] sm:mt-0">Reset defaults</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{template.assumptions.map((assumption) => <label key={assumption.id} className="text-xs font-semibold text-[#526579]">{assumption.label}{assumption.unit ? ` (${assumption.unit})` : ""}<input type={assumption.inputType === "text" ? "text" : "number"} min={assumption.min} max={assumption.max} step={assumption.step ?? 0.01} value={line.assumptionValues?.[assumption.id] ?? assumption.defaultValue} onChange={(event) => updateLine(line.id, { assumptionValues: { ...getDefaultAssumptionValues(template), ...line.assumptionValues, [assumption.id]: assumption.inputType === "text" ? event.target.value : safeNumber(event.target.value) }, componentQuantityOverrides: {} })} className="mt-1 w-full rounded-xl border border-[#CCD7E3] px-3 py-2 text-[#071E33]" />{assumption.help ? <span className="mt-1 block font-normal leading-4 text-[#7A8998]">{assumption.help}</span> : null}</label>)}</div></div> : null}
                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-sm"><thead><tr className="border-b-2 border-[#0D3B66] text-left text-[10px] uppercase tracking-[0.08em]"><th className="p-2">Resource</th><th className="p-2">Type</th><th className="p-2 text-right">Qty / {line.unit}</th><th className="p-2">Price unit</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Amount</th>{line.templateId === "custom" ? <th className="p-2"></th> : null}</tr></thead><tbody>{analysis.components.map((component) => <tr key={component.id} className="border-b border-[#DFE6EE]"><td className="p-2 font-medium">{component.priceDescription}</td><td className="p-2 capitalize text-[#526579]">{component.category}</td><td className="p-2"><input type="number" min="0" step="0.0001" value={component.quantityPerUnit} onChange={(event) => updateComponentQuantity(line, component.id, safeNumber(event.target.value))} className="w-28 rounded-lg border border-[#CCD7E3] px-2 py-1 text-right" /></td><td className="p-2">{component.priceUnit}</td><td className={`p-2 text-right ${component.missingPrice ? "font-bold text-[#C8320A]" : ""}`}>{component.missingPrice ? "Missing" : money(component.unitRate ?? 0, estimate.currency)}</td><td className="p-2 text-right font-semibold">{component.amount === null ? "—" : money(component.amount, estimate.currency)}</td>{line.templateId === "custom" ? <td className="p-2"><button type="button" onClick={() => removeCustomResource(line, component.id)} className="text-xs font-semibold text-[#C8320A]">Remove</button></td> : null}</tr>)}</tbody></table></div>{line.templateId === "custom" ? <div className="mt-4 flex flex-wrap items-center gap-2"><select value={resourceSelection[line.id] || prices[0]?.id || ""} onChange={(event) => setResourceSelection((current) => ({ ...current, [line.id]: event.target.value }))} className="min-w-[260px] rounded-xl border border-[#CCD7E3] px-3 py-2 text-sm">{prices.map((price) => <option key={price.id} value={price.id}>{price.category} — {price.description} ({price.unit})</option>)}</select><button type="button" onClick={() => addCustomResource(line)} className="rounded-full bg-[#0D3B66] px-4 py-2 text-xs font-bold text-white">Add Resource</button></div> : null}</div>
                    <div className="space-y-3 rounded-2xl bg-white p-4"><label className="flex items-center justify-between gap-3 text-sm"><span>Overhead</span><span className="flex items-center"><input type="number" min="0" step="0.1" value={line.overheadPercent} onChange={(event) => updateLine(line.id, { overheadPercent: safeNumber(event.target.value) })} className="w-20 rounded-lg border border-[#CCD7E3] px-2 py-1 text-right" /><span className="ml-1">%</span></span></label><label className="flex items-center justify-between gap-3 text-sm"><span>Profit</span><span className="flex items-center"><input type="number" min="0" step="0.1" value={line.profitPercent} onChange={(event) => updateLine(line.id, { profitPercent: safeNumber(event.target.value) })} className="w-20 rounded-lg border border-[#CCD7E3] px-2 py-1 text-right" /><span className="ml-1">%</span></span></label><dl className="space-y-2 border-t border-[#DFE6EE] pt-3 text-sm"><div className="flex justify-between"><dt>Default reference</dt><dd>{money(template.defaultUnitRate ?? 0, estimate.currency)}</dd></div><div className="flex justify-between"><dt>Material</dt><dd>{money(analysis.materialCost, estimate.currency)}</dd></div><div className="flex justify-between"><dt>Labour</dt><dd>{money(analysis.labourCost, estimate.currency)}</dd></div><div className="flex justify-between"><dt>Plant</dt><dd>{money(analysis.plantCost, estimate.currency)}</dd></div><div className="flex justify-between font-bold"><dt>Analysed unit rate</dt><dd>{money(analysis.unitRate, estimate.currency)}</dd></div></dl><label className="block border-t border-[#DFE6EE] pt-3 text-xs font-semibold text-[#526579]">Rate to use<select value={line.rateSource ?? "default"} onChange={(event) => updateLine(line.id, { rateSource: event.target.value as EstimateLine["rateSource"] })} className="mt-2 w-full rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-[#071E33]"><option value="default">Default reference</option><option value="analysed">Current analysed rate</option><option value="manual">Manual override</option></select></label>{line.rateSource === "manual" ? <label className="block text-xs font-semibold text-[#526579]">Manual unit rate<input type="number" min="0" step="0.01" value={line.manualUnitRateOverride ?? ""} placeholder="Enter agreed rate" onChange={(event) => updateLine(line.id, { manualUnitRateOverride: event.target.value === "" ? null : safeNumber(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#E3A58F] bg-[#FFF8F5] px-3 py-2 text-right text-[#071E33]" /></label> : null}</div>
                  </div>
                </details>
              ) : (
                <div className="border-t border-[#DFE6EE] bg-[#F8FAFC] p-5 md:px-6"><div className="grid gap-4 sm:grid-cols-[1fr_200px] sm:items-end"><p className="text-sm leading-6 text-[#526579]">Use a direct all-in rate, or add material, labour, plant and subcontract resources to build a detailed custom analysis.</p><label className="text-xs font-semibold text-[#526579]">All-in unit rate<input type="number" min="0" step="0.01" value={line.customUnitRate ?? ""} onChange={(event) => updateLine(line.id, { customUnitRate: event.target.value === "" ? null : safeNumber(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#CCD7E3] px-3 py-2 text-right" /></label></div><div className="mt-4 flex flex-wrap items-center gap-2"><select value={resourceSelection[line.id] || prices[0]?.id || ""} onChange={(event) => setResourceSelection((current) => ({ ...current, [line.id]: event.target.value }))} className="min-w-[280px] rounded-xl border border-[#CCD7E3] px-3 py-2 text-sm">{prices.map((price) => <option key={price.id} value={price.id}>{price.category} — {price.description} ({price.unit})</option>)}</select><button type="button" onClick={() => addCustomResource(line)} className="rounded-full bg-[#0D3B66] px-4 py-2 text-xs font-bold text-white">Build Rate with Resource</button></div></div>
              )}
              <div className="flex justify-end border-t border-[#DFE6EE] px-5 py-3"><button type="button" onClick={() => removeLine(line.id)} className="text-sm font-semibold text-[#C8320A]">Remove work item</button></div>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-[28px] border border-[#d6dfe9] bg-white p-5 text-sm leading-7 text-[#526579]"><strong className="text-[#071E33]">Important:</strong> starter resource quantities are editable rate-analysis assumptions, not universal specifications. Electrical cable routes, pipe lengths, fittings, labour output and plant productivity must be adjusted to the project drawings, specifications and site conditions.</section>
    </div>
  );
}
