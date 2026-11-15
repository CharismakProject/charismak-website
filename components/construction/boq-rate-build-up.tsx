"use client";
import { useState } from "react";
import { RATE_BANK_ITEMS, calculateRate } from "@/lib/rates/defaults";
import { normaliseWorkUnit, type BoqLine } from "@/lib/construction/project";
import { roundCost, type PricedCostWork } from "@/lib/construction/costs";
import { WorkEditor } from "./construction-cost-panel";
import styles from "./construction-studio.module.css";
import rateStyles from "./construction-cost-panel.module.css";

export default function BoqRateBuildUp({ line, update }: { line: BoqLine; update: (patch: Partial<BoqLine>) => void }) {
  const [reference, setReference] = useState("");
  const publish = (analysis: NonNullable<BoqLine["analysis"]>, quantity = line.quantity, manualRate?: number | null) => {
    const missing = analysis.resources.some(resource => resource.quantity > 0 && resource.unitRate === null);
    const calculated = roundCost(calculateRate(analysis.resources.map(resource => ({ ...resource, unitRate: resource.unitRate ?? 0 })), analysis.allowances).total);
    update({ quantity, analysis, rate: manualRate !== undefined ? manualRate : analysis.manual ? line.rate : missing ? null : calculated });
  };
  const apply = () => {
    const bank = RATE_BANK_ITEMS.find(item => item.slug === reference);
    if (bank) publish({ resources: bank.lines.map(resource => ({ ...resource })), allowances: { ...bank.allowances }, bankSlug: bank.slug, manual: false, baseRate: line.analysis ? line.analysis.baseRate : line.rate });
    else publish({ resources: [{ id: "quote", label: "Unanalysed BOQ / quotation allowance", category: "logistics", quantity: 1, unit: line.unit, unitRate: line.rate }], allowances: { materialFluctuation: 0, labourFluctuation: 0, plantFluctuation: 0, risk: 0, op: 0 }, manual: false, baseRate: line.analysis ? line.analysis.baseRate : line.rate });
  };
  const analysis = line.analysis;
  const calculation = analysis ? calculateRate(analysis.resources.map(resource => ({ ...resource, unitRate: resource.unitRate ?? 0 })), analysis.allowances) : null;
  const work: PricedCostWork | null = analysis && calculation ? { id: line.id, title: line.description, quantity: line.quantity, unit: line.unit, basis: `${line.section}. Resource consumption is for one ${line.unit} of this BOQ item; confirm it against the specification.`, reference: RATE_BANK_ITEMS.find(item => item.slug === analysis.bankSlug), lines: analysis.resources, allowances: analysis.allowances, calculation, knownRate: roundCost(calculation.total), rate: line.rate, amount: roundCost((line.rate ?? 0) * line.quantity), missing: analysis.resources.filter(resource => resource.quantity > 0 && resource.unitRate === null).length, custom: analysis.manual, adjustment: analysis.manual && line.rate !== null ? roundCost(line.rate - roundCost(calculation.total)) : 0, source: analysis.bankSlug ? "Rate Bank · under review" : "Your BOQ / resource analysis", sourceDate: RATE_BANK_ITEMS.find(item => item.slug === analysis.bankSlug)?.lastReviewed ?? null } : null;
  return <div className={styles.boqBuildUp}><h3>What makes up this unit rate?</h3><p>{analysis ? "Edit the resources below to recalculate the BOQ rate and project cost. A directly entered total is reconciled as a manual adjustment." : "The BOQ supplies a unit rate, not its underlying resources. Add your own analysis or deliberately apply a compatible reference. The resource mix is not inferred from the total."}</p><div className={styles.referenceChoice}><label>Starting point<select aria-label="BOQ rate build-up reference" value={reference} onChange={e => setReference(e.target.value)}><option value="">My BOQ / custom resource analysis</option>{RATE_BANK_ITEMS.filter(item => normaliseWorkUnit(item.unit) === normaliseWorkUnit(line.unit)).map(item => <option key={item.slug} value={item.slug}>{item.code} · {item.shortTitle} / {item.unit}</option>)}</select></label><button type="button" onClick={apply}>{analysis ? "Replace with selected build-up" : "Apply selected build-up"}</button></div>{work && analysis && <div className={rateStyles.panel}><WorkEditor work={work} costs={{
    editWork: (_id, field, raw) => { if (field === "quantity") publish(analysis, raw === "" ? line.quantity : Number(raw)); else publish({ ...analysis, manual: raw !== "" }, line.quantity, raw === "" ? undefined : Number(raw)); },
    editResource: (_id, id, field, raw) => publish({ ...analysis, manual: false, resources: analysis.resources.map(resource => resource.id !== id ? resource : field === "quantity" ? { ...resource, quantity: raw === "" ? 0 : Number(raw) } : { ...resource, unitRate: raw === "" ? null : Number(raw) }) }),
    editAllowance: (_id, field, raw) => publish({ ...analysis, manual: false, allowances: { ...analysis.allowances, [field]: Number(raw) / 100 } }),
    addResource: (_id, resource) => publish({ ...analysis, manual: false, resources: [...analysis.resources, { ...resource, id: `extra-${Date.now().toString(36)}` }] }),
    resetWork: () => update({ analysis: undefined, rate: analysis.baseRate }),
  }} /></div>}</div>;
}
