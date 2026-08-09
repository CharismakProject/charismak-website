"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BILL_UPDATED_EVENT,
  createBillRevision,
  getBillItemRate,
  isBillItemPriced,
  isBillLocked,
  loadBill,
  markBillCompleted,
  recalcBill,
  removeBillItem,
  saveBill,
} from "@/lib/billing/store";
import {
  downloadBillWorkbook,
  isBillPriced,
  openBillPrintView,
} from "@/lib/billing/export";
import type { Bill, BillAdjustment, BillItem } from "@/lib/billing/models";
import type { BillItemRateSource } from "@/lib/billing/models";
import { consolidateProcurementItems } from "@/lib/billing/procurement";
import { applyPriceLibraryRates } from "@/lib/pricing/boq-rates";
import { loadPriceItems, loadRateTemplates } from "@/lib/pricing/store";
import ShellButton from "../estimator/ui/button";

type ReviewWorkspaceProps = {
  onOpenConcrete: () => void;
  onOpenBlockwork: () => void;
  onStartFence: () => void;
  onOpenEstimates: () => void;
};

const cloneBill = (bill: Bill): Bill => JSON.parse(JSON.stringify(bill)) as Bill;

const formatCurrency = (value: number, currencyCode = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatQuantity = (value: number, precision = 3) =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: precision,
  }).format(value || 0);

const numberOrNull = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ReviewWorkspace({
  onOpenConcrete,
  onOpenBlockwork,
  onStartFence,
  onOpenEstimates,
}: ReviewWorkspaceProps) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setBill(loadBill());
    const syncBill = () => setBill(loadBill());
    window.addEventListener(BILL_UPDATED_EVENT, syncBill);
    return () => window.removeEventListener(BILL_UPDATED_EVENT, syncBill);
  }, []);

  const itemCount = useMemo(
    () => bill?.sections.reduce((total, section) => total + section.items.length, 0) ?? 0,
    [bill],
  );
  const consolidatedMaterials = useMemo(
    () => consolidateProcurementItems(bill?.materials ?? []),
    [bill],
  );

  const commit = (update: (draft: Bill) => void) => {
    if (!bill) return;
    if (isBillLocked(bill)) {
      setMessage("This completed bill is read-only. Create a revision to make changes.");
      return;
    }
    const next = cloneBill(bill);
    update(next);
    recalcBill(next, false);
    saveBill(next);
    setBill(next);
  };

  const updateItem = (
    itemId: string,
    field: keyof Pick<
      BillItem,
      | "description"
      | "billQuantity"
      | "materialRate"
      | "labourRate"
      | "plantRate"
      | "otherRate"
      | "allInRate"
    >,
    value: string | number | null,
  ) => {
    commit((draft) => {
      const item = draft.sections
        .flatMap((section) => section.items)
        .find((candidate) => candidate.id === itemId);
      if (!item) return;
      Object.assign(item, { [field]: value });
      if (field === "allInRate" && value !== null) {
        item.rateSource = "manual";
        item.manualRate = Number(value);
        item.materialRate = null;
        item.labourRate = null;
        item.plantRate = null;
        item.otherRate = null;
      }
      if (
        ["materialRate", "labourRate", "plantRate", "otherRate"].includes(field) &&
        value !== null
      ) {
        item.rateSource = "manual";
        item.manualRate = null;
        item.allInRate = null;
      }
    });
  };

  const updateRateSource = (itemId: string, rateSource: BillItemRateSource) => {
    commit((draft) => {
      const item = draft.sections
        .flatMap((section) => section.items)
        .find((candidate) => candidate.id === itemId);
      if (!item) return;
      item.rateSource = rateSource;
      if (rateSource === "manual" && item.manualRate == null) {
        item.manualRate = item.allInRate ?? item.defaultRate ?? null;
      }
    });
  };

  const updateManualRate = (itemId: string, value: string) => {
    commit((draft) => {
      const item = draft.sections
        .flatMap((section) => section.items)
        .find((candidate) => candidate.id === itemId);
      if (!item) return;
      item.rateSource = "manual";
      item.manualRate = numberOrNull(value);
      item.allInRate = null;
    });
  };

  const updateAdjustment = (field: keyof BillAdjustment, value: string) => {
    const parsed = Math.max(0, numberOrNull(value) ?? 0);
    commit((draft) => {
      draft.adjustments[field] = parsed;
    });
  };

  const updateAssumption = (assumptionId: string, value: string) => {
    commit((draft) => {
      const assumption = draft.assumptions.find(
        (candidate) => candidate.id === assumptionId,
      );
      if (assumption) assumption.value = value;
    });
  };

  const addManualItem = () => {
    commit((draft) => {
      let section = draft.sections.find((candidate) => candidate.id === "manual-items");
      if (!section) {
        section = { id: "manual-items", title: "Additional Items", items: [] };
        draft.sections.push(section);
      }
      section.items.push({
        id: `manual-${Date.now()}`,
        sourceCalculationId: null,
        sourceModule: "manual",
        description: "Additional construction item",
        unit: "item",
        calculatedQuantity: 1,
        billQuantity: 1,
        materialRate: null,
        labourRate: null,
        plantRate: null,
        otherRate: null,
        allInRate: null,
        amount: null,
      });
    });
  };

  const exportExcel = () => {
    if (!bill || itemCount === 0) return;
    const filename = downloadBillWorkbook(bill);
    setMessage(`${filename} downloaded.`);
  };

  const printBill = () => {
    if (!bill || itemCount === 0) return;
    try {
      openBillPrintView(bill);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open print view.");
    }
  };

  const completeBill = () => {
    if (!bill) return;
    const confirmed = window.confirm(
      `Mark Version ${bill.version} as completed? It will become read-only. You can create a new revision later if changes are required.`,
    );
    if (!confirmed) return;
    try {
      const completed = markBillCompleted(bill.id);
      setBill(completed);
      setMessage(
        `Version ${completed.version} completed and locked. Export remains available.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete bill.");
    }
  };

  const createRevision = () => {
    if (!bill) return;
    try {
      const revision = createBillRevision(bill.id);
      setBill(revision);
      setMessage(
        `Version ${revision.version} created as an editable draft. The completed version remains unchanged.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create revision.");
    }
  };

  const applySharedPrices = () => {
    if (!bill) return;
    try {
      const result = applyPriceLibraryRates({
        bill: cloneBill(bill),
        prices: loadPriceItems(),
        templates: loadRateTemplates(),
      });
      setBill(result.bill);
      setMessage(
        `${result.pricedItemCount} BOQ item(s) refreshed from the Price Library. ${result.skippedItemCount} item(s) need a matching template or complete prices.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to apply prices.");
    }
  };

  if (!bill || itemCount === 0) {
    return (
      <section className="overflow-hidden rounded-[30px] border border-[#d6dfe9] bg-white shadow-[0_20px_60px_rgba(7,30,51,0.08)]">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-[#FFF0E9] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#C8320A]">
              Bill workspace
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#071E33]">
              Your first bill is one calculation away.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#526579]">
              Calculate an element, add the result to your bill, enter rates and export a professional BOQ with a linked materials schedule.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ShellButton onClick={onOpenConcrete}>Calculate Concrete</ShellButton>
              <ShellButton variant="secondary" onClick={onOpenBlockwork}>Calculate Blockwork</ShellButton>
              <ShellButton variant="ghost" onClick={onStartFence}>Start Fence Estimate</ShellButton>
              <ShellButton variant="ghost" onClick={onOpenEstimates}>Open Saved Estimates</ShellButton>
            </div>
          </div>
          <div className="rounded-[26px] bg-[#071E33] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">What you will get</p>
            <ul className="mt-5 space-y-4 text-sm text-white/85">
              <li>✓ Editable BOQ descriptions, quantities and rates</li>
              <li>✓ Separate materials procurement schedule</li>
              <li>✓ Cost summary with overhead, profit and VAT</li>
              <li>✓ Excel workbook and print-ready PDF view</li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  const totals = bill.totals ?? recalcBill(bill, false).totals!;
  const locked = isBillLocked(bill);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] bg-[#071E33] p-6 text-white shadow-[0_22px_70px_rgba(7,30,51,0.18)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E7B34B]">{isBillPriced(bill) ? "Priced" : "Unpriced"} bill of quantities</p>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${locked ? "bg-white/15 text-white" : "bg-[#C8320A] text-white"}`}>
                {locked ? "Completed · Locked" : "Editable draft"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/75">Version {bill.version}</span>
            </div>
            <input
              aria-label="Bill title"
              value={bill.title}
              disabled={locked}
              onChange={(event) => commit((draft) => { draft.title = event.target.value; })}
              className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-2 text-2xl font-bold text-white outline-none placeholder:text-white/40 md:text-3xl"
            />
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["Project", "projectName"],
                ["Client", "clientName"],
                ["Location", "location"],
              ].map(([label, field]) => (
                <label key={field} className="rounded-2xl bg-white/8 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">{label}</span>
                  <input
                    value={String(bill[field as "projectName" | "clientName" | "location"] ?? "")}
                    disabled={locked}
                    onChange={(event) => commit((draft) => { draft[field as "projectName" | "clientName" | "location"] = event.target.value; })}
                    placeholder={`Add ${label.toLowerCase()}`}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/35"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">BOQ items</span><strong className="mt-1 block text-2xl">{itemCount}</strong></div>
            <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">Materials</span><strong className="mt-1 block text-2xl">{consolidatedMaterials.length}</strong><span className="mt-1 block text-[10px] text-white/45">consolidated</span></div>
            <div className="col-span-2 rounded-2xl bg-[#C8320A] p-4 sm:col-span-1"><span className="text-xs text-white/75">Grand total</span><strong className="mt-1 block text-lg">{formatCurrency(totals.grandTotal, bill.currency)}</strong></div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-white/12 pt-5">
          <ShellButton onClick={exportExcel}>Export Excel</ShellButton>
          <button type="button" onClick={printBill} className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Print / Save PDF</button>
          {!locked ? <button type="button" onClick={addManualItem} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10">Add manual item</button> : null}
          {!locked ? <button type="button" onClick={applySharedPrices} className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10">Apply Price Library</button> : null}
          {!locked ? (
            <button type="button" onClick={completeBill} className="rounded-full bg-[#E7B34B] px-5 py-3 text-sm font-bold text-[#071E33]">Mark Complete</button>
          ) : (
            <button type="button" onClick={createRevision} className="rounded-full bg-[#E7B34B] px-5 py-3 text-sm font-bold text-[#071E33]">Create Revision</button>
          )}
          <button type="button" onClick={onOpenEstimates} className="rounded-full px-5 py-3 text-sm font-semibold text-white/70">All Estimates</button>
        </div>
        {locked ? <div className="mt-4 rounded-2xl border border-white/15 bg-white/8 p-4 text-sm text-white/80">This completed version is frozen. Export or print it at any time. To make changes, select <strong className="text-white">Create Revision</strong>; the original remains unchanged.</div> : null}
        <details className="mt-4 rounded-2xl border border-white/15 bg-white/8 p-4">
          <summary className="cursor-pointer text-sm font-bold text-white">Document export options</summary>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
            <label className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <input type="checkbox" checked={bill.exportOptions?.includeMaterialsSchedule ?? true} disabled={locked} onChange={(event) => commit((draft) => { draft.exportOptions = { includeMaterialsSchedule: event.target.checked, includeAssumptions: draft.exportOptions?.includeAssumptions ?? true }; })} className="h-4 w-4 accent-[#E7B34B]" />
              Include materials schedule
            </label>
            <label className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <input type="checkbox" checked={bill.exportOptions?.includeAssumptions ?? true} disabled={locked} onChange={(event) => commit((draft) => { draft.exportOptions = { includeMaterialsSchedule: draft.exportOptions?.includeMaterialsSchedule ?? true, includeAssumptions: event.target.checked }; })} className="h-4 w-4 accent-[#E7B34B]" />
              Include assumptions
            </label>
          </div>
        </details>
        {message ? <p className="mt-3 text-sm text-[#FFE3A3]">{message}</p> : null}
      </section>

      <section className="rounded-[30px] border border-[#d6dfe9] bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D3B66]/65">Bill items</p><h3 className="mt-1 text-xl font-bold text-[#071E33]">Measured work</h3></div>
          <div className="inline-flex rounded-full bg-[#EEF3F8] p-1 text-xs font-semibold">
            <button type="button" disabled={locked} onClick={() => commit((draft) => { draft.rateMode = "breakdown"; })} className={`rounded-full px-4 py-2 disabled:cursor-not-allowed ${bill.rateMode === "breakdown" ? "bg-white text-[#071E33] shadow-sm" : "text-[#526579]"}`}>Material + labour</button>
            <button type="button" disabled={locked} onClick={() => commit((draft) => { draft.rateMode = "all-in"; })} className={`rounded-full px-4 py-2 disabled:cursor-not-allowed ${bill.rateMode === "all-in" ? "bg-white text-[#071E33] shadow-sm" : "text-[#526579]"}`}>All-in rate</button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead><tr className="bg-[#0D3B66] text-left text-[11px] uppercase tracking-[0.08em] text-white"><th className="p-3">S/N</th><th className="p-3">Description</th><th className="p-3">Unit</th><th className="p-3 text-right">Calc. Qty</th><th className="p-3 text-right">Bill Qty</th>{bill.rateMode === "breakdown" ? <><th className="p-3 text-right">Material</th><th className="p-3 text-right">Labour</th><th className="p-3 text-right">Plant/Other</th></> : <th className="p-3 text-right">Rate</th>}<th className="p-3 text-right">Amount</th><th className="p-3"></th></tr></thead>
            <tbody>
              {bill.sections.flatMap((section) => section.items.map((item) => ({ section, item }))).map(({ section, item }, index) => (
                <tr key={item.id} className="border-b border-[#DFE6EE] align-top hover:bg-[#F8FAFC]">
                  <td className="p-3 font-semibold text-[#0D3B66]">{index + 1}</td>
                  <td className="min-w-[330px] p-3"><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#C8320A]">{section.title}</span><textarea value={item.description} disabled={locked} onChange={(event) => updateItem(item.id, "description", event.target.value)} rows={2} className="w-full resize-none rounded-xl border border-transparent bg-transparent p-2 leading-5 outline-none transition focus:border-[#0D3B66] focus:bg-white disabled:cursor-not-allowed" /></td>
                  <td className="p-3 font-medium">{item.unit}</td>
                  <td className="p-3 text-right text-[#526579]">{formatQuantity(item.calculatedQuantity)}</td>
                  <td className="p-3"><input aria-label={`Bill quantity for ${item.description}`} type="number" min="0" step="0.001" value={item.billQuantity} disabled={locked} onChange={(event) => updateItem(item.id, "billQuantity", Math.max(0, Number(event.target.value) || 0))} className="w-24 rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-right disabled:bg-[#F4F7FA]" /></td>
                  {bill.rateMode === "breakdown" ? <>
                    {(["materialRate", "labourRate"] as const).map((field) => <td key={field} className="p-3"><input aria-label={`${field} for ${item.description}`} type="number" min="0" step="0.01" value={item[field] ?? ""} disabled={locked} placeholder="—" onChange={(event) => updateItem(item.id, field, numberOrNull(event.target.value))} className="w-28 rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-right disabled:bg-[#F4F7FA]" /></td>)}
                    <td className="p-3"><input aria-label={`Other rate for ${item.description}`} type="number" min="0" step="0.01" value={(item.plantRate ?? 0) + (item.otherRate ?? 0) || ""} disabled={locked} placeholder="—" onChange={(event) => updateItem(item.id, "otherRate", numberOrNull(event.target.value))} className="w-28 rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-right disabled:bg-[#F4F7FA]" /></td>
                  </> : <td className="p-3"><div className="w-40 space-y-2"><select aria-label={`Rate source for ${item.description}`} value={item.rateSource ?? "default"} disabled={locked} onChange={(event) => updateRateSource(item.id, event.target.value as BillItemRateSource)} className="w-full rounded-xl border border-[#CCD7E3] bg-[#F4F7FA] px-2 py-2 text-xs font-bold uppercase text-[#0D3B66] disabled:cursor-not-allowed"><option value="default">Default</option><option value="analysed">Analysed</option><option value="manual">Manual</option></select><input aria-label={`All-in rate for ${item.description}`} type="number" min="0" step="0.01" value={item.rateSource === "manual" ? item.manualRate ?? item.allInRate ?? "" : item.rateSource === "analysed" ? item.analysedRate ?? "" : item.defaultRate ?? ""} disabled={locked || item.rateSource !== "manual"} placeholder={item.rateSource === "analysed" ? "Apply Price Library" : "—"} onChange={(event) => updateManualRate(item.id, event.target.value)} className="w-full rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-right disabled:bg-[#F4F7FA]" /></div></td>}
                  <td className="p-3 text-right font-bold text-[#071E33]">{isBillItemPriced(item) ? formatCurrency(item.billQuantity * getBillItemRate(item), bill.currency) : <span className="font-normal text-[#8A98A8]">Unpriced</span>}</td>
                  <td className="p-3">{!locked ? <button type="button" onClick={() => { const next = cloneBill(bill); removeBillItem(next, item.id); setBill(loadBill()); }} className="rounded-full px-3 py-2 text-xs font-semibold text-[#C8320A] hover:bg-[#FFF0E9]">Remove</button> : <span className="text-xs text-[#8A98A8]">Locked</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-[30px] border border-[#d6dfe9] bg-white p-5 shadow-sm md:p-7">
          <details>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span><span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0D3B66]/65">Procurement</span><span className="mt-1 block text-xl font-bold text-[#071E33]">Materials schedule</span></span>
              <span className="rounded-full bg-[#EEF3F8] px-4 py-2 text-xs font-bold text-[#0D3B66]">{consolidatedMaterials.length} consolidated items · View</span>
            </summary>
            <div className="mt-5 overflow-x-auto"><table className="min-w-[760px] w-full border-collapse text-sm"><thead><tr className="border-b-2 border-[#0D3B66] text-left text-[11px] uppercase tracking-[0.08em]"><th className="p-3">S/N</th><th className="p-3">Material</th><th className="p-3">Unit</th><th className="p-3 text-right">Calculated</th><th className="p-3 text-right">Purchase</th><th className="p-3">Sources / notes</th></tr></thead><tbody>{consolidatedMaterials.map((material, index) => <tr key={material.id} className="border-b border-[#DFE6EE]"><td className="p-3">{index + 1}</td><td className="p-3 font-medium">{material.description}</td><td className="p-3">{material.unit}</td><td className="p-3 text-right">{formatQuantity(material.calculatedQuantity)}</td><td className="p-3 text-right font-bold text-[#0D3B66]">{formatQuantity(material.purchaseQuantity)}</td><td className="max-w-[300px] p-3 text-xs leading-5 text-[#526579]">{material.notes}</td></tr>)}</tbody></table></div>
          </details>
        </div>

        <div className="rounded-[30px] border border-[#d6dfe9] bg-white p-5 shadow-sm md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D3B66]/65">Commercial summary</p><h3 className="mt-1 text-xl font-bold text-[#071E33]">Cost build-up</h3>
          <div className="mt-5 space-y-3">
            {([
              ["Contingency", "contingencyPercent"],
              ["Overhead", "overheadPercent"],
              ["Profit", "profitPercent"],
              ["Discount", "discountPercent"],
              ["VAT", "vatPercent"],
            ] as const).map(([label, field]) => <label key={field} className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><span className="flex items-center rounded-xl border border-[#CCD7E3] bg-white"><input type="number" min="0" step="0.1" value={bill.adjustments[field]} disabled={locked} onChange={(event) => updateAdjustment(field, event.target.value)} className="w-20 rounded-xl px-3 py-2 text-right outline-none disabled:bg-[#F4F7FA]" /><span className="pr-3 text-[#526579]">%</span></span></label>)}
          </div>
          <dl className="mt-6 space-y-3 border-t border-[#DFE6EE] pt-5 text-sm">
            <div className="flex justify-between"><dt>Direct cost</dt><dd>{formatCurrency(totals.directCost, bill.currency)}</dd></div>
            <div className="flex justify-between"><dt>Contingency</dt><dd>{formatCurrency(totals.contingency, bill.currency)}</dd></div>
            <div className="flex justify-between"><dt>Overhead</dt><dd>{formatCurrency(totals.overhead, bill.currency)}</dd></div>
            <div className="flex justify-between"><dt>Profit</dt><dd>{formatCurrency(totals.profit, bill.currency)}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>-{formatCurrency(totals.discount, bill.currency)}</dd></div>
            <div className="flex justify-between"><dt>VAT</dt><dd>{formatCurrency(totals.vat, bill.currency)}</dd></div>
            <div className="flex justify-between rounded-2xl bg-[#071E33] p-4 text-white"><dt className="font-bold">Grand total</dt><dd className="font-bold">{formatCurrency(totals.grandTotal, bill.currency)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d6dfe9] bg-white p-5 shadow-sm md:p-7">
        <details><summary className="cursor-pointer font-bold text-[#071E33]">Calculation assumptions ({bill.assumptions.length})</summary><p className="mt-3 text-xs leading-5 text-[#526579]">These notes are included in the BOQ export when assumptions are enabled. Edit them to reflect the issued specification.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{bill.assumptions.map((assumption) => <label key={assumption.id} className="rounded-2xl bg-[#F4F7FA] p-4"><span className="text-sm font-semibold">{assumption.label}</span><textarea value={assumption.value} disabled={locked} onChange={(event) => updateAssumption(assumption.id, event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-xl border border-[#CCD7E3] bg-white px-3 py-2 text-sm leading-5 text-[#526579] disabled:cursor-not-allowed disabled:bg-[#EEF2F6]" /></label>)}</div></details>
      </section>
    </div>
  );
}
