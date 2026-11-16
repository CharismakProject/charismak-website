"use client";
import { useEffect, useRef, useState } from "react";
import { Calculator, Download, Plus, RotateCcw } from "lucide-react";
import { compactMoney, csvCell } from "@/lib/construction/walkthrough";
import { getLocation, RATE_LOCATIONS } from "@/lib/rates/locations";
import { roundCost, type PricedCostWork, type Resource } from "@/lib/construction/costs";
import type { ModelId } from "@/lib/construction/learning";
import type { ConstructionCosts } from "./use-construction-costs";
import styles from "./construction-cost-panel.module.css";

function NumberField({ value, label, commit, max = 1e9 }: { value: number | null; label: string; commit: (raw: string) => void; max?: number }) {
  const [draft, setDraft] = useState(value === null ? "" : String(value)), focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(value === null ? "" : String(value)); }, [value]);
  return <input type="number" min={0} max={max} step="any" inputMode="decimal" aria-label={label} value={draft} placeholder="Enter price" onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; setDraft(value === null ? "" : String(value)); }} onChange={event => { const raw = event.target.value; if (raw !== "" && (!Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > max)) return; setDraft(raw); commit(raw); }} />;
}
const categoryNames: Record<Resource["category"], string> = { material: "Materials", consumable: "Consumables", labour: "Labour", plant: "Plant & equipment", logistics: "Transport / logistics" };
const allowances = [
  ["materialFluctuation", "Material fluctuation", "Materials + consumables"], ["labourFluctuation", "Labour fluctuation", "Labour"], ["plantFluctuation", "Plant / logistics fluctuation", "Plant + logistics"], ["risk", "Risk allowance", "Direct cost"], ["op", "Overheads & profit", "Direct cost + fluctuations + risk"],
] as const;
const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const q = (n: number) => new Intl.NumberFormat("en-NG", { maximumFractionDigits: 6 }).format(n);

export function exportConstructionCosts(costs: ConstructionCosts, model: ModelId) {
  const rows: (string | number)[][] = [["Charismak construction rate build-up", model], ["Rate location", getLocation(costs.locationId).name], ["Basis", "Illustrative quantities; dated Rate Bank and Price Library starter references. No VAT. Missing prices excluded; not a complete project quotation."], ["Stage", "Work", "Work quantity", "Work unit", "Resource / allowance", "Category / basis", "Consumption per work unit", "Resource unit", "Resource price NGN", "Contribution per work unit NGN", "Scaled contribution NGN", "Status / note"]];
  for (const stage of costs.priced) for (const work of stage.items) {
    for (const line of work.lines) rows.push([stage.title, work.title, work.quantity, work.unit, line.label, line.category, line.quantity, line.unit, line.unitRate ?? "PRICE REQUIRED", line.unitRate === null ? "" : line.quantity * line.unitRate, line.unitRate === null ? "" : line.quantity * line.unitRate * work.quantity, line.note ?? work.source]);
    for (const [field, title, basis] of allowances) rows.push([stage.title, work.title, work.quantity, work.unit, title, `${q(work.allowances[field] * 100)}% × ${basis}`, "", "", "", work.calculation[field], work.calculation[field] * work.quantity, "Included once"]);
    if (work.custom) rows.push([stage.title, work.title, work.quantity, work.unit, "Manual rate adjustment", "Manual rate minus calculated resource rate", "", "", "", work.adjustment, work.adjustment * work.quantity, "Unanalysed difference"]);
    rows.push([stage.title, work.title, work.quantity, work.unit, "WORK TOTAL", "Quantity × unit rate", "", "", work.rate ?? "INCOMPLETE", "", work.amount, `${work.source}; ${work.missing} resources without a price; ${work.basis}`]);
  }
  for (const stage of costs.priced) rows.push([stage.title, "STAGE SUBTOTAL", "", "", "", "", "", "", "", "", stage.total, `${stage.unpriced} unpriced work items excluded`]);
  rows.push(["MODEL SUBTOTAL", "", "", "", "", "", "", "", "", "", costs.priced.reduce((sum, stage) => sum + stage.total, 0), "No additional O/P or VAT added outside the displayed build-ups"]);
  const blob = new Blob(["\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `Charismak_${model}_${costs.locationId}_Rate_Buildups.csv`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ConstructionCostSummary({ costs, step, onOpen }: { costs: ConstructionCosts; step: number; onOpen?: () => void }) {
  const current = costs.priced[step], through = costs.priced.slice(0, step + 1).reduce((sum, stage) => sum + stage.total, 0), full = costs.priced.reduce((sum, stage) => sum + stage.total, 0), pending = costs.priced.reduce((sum, stage) => sum + stage.unpriced, 0);
  return <div className={styles.live} aria-label="Live stage costs"><div><span>This stage</span><strong data-cost="stage">{compactMoney(current.total)}</strong></div><div><span>Through this stage</span><strong data-cost="cumulative">{compactMoney(through)}</strong></div><div><span>Model subtotal</span><strong data-cost="model">{compactMoney(full)}</strong></div><p>{pending ? `${pending} unpriced work items excluded. ` : "All sample work items have a rate. "}Illustrative quantities · no VAT.</p>{onOpen && <button type="button" onClick={onOpen}><Calculator size={13} /> View & edit rate build-up</button>}</div>;
}

export function WorkEditor({ work, costs }: { work: PricedCostWork; costs: Pick<ConstructionCosts, "editWork" | "editResource" | "editAllowance" | "addResource" | "resetWork"> }) {
  const [adding, setAdding] = useState(false), [label, setLabel] = useState(""), [unit, setUnit] = useState("item"), [category, setCategory] = useState<Resource["category"]>("material");
  return <>
    <div className={styles.workFields}><label>Work quantity <span>{work.unit}</span><NumberField value={work.quantity} label={`${work.title} work quantity`} commit={raw => costs.editWork(work.id, "quantity", raw)} /></label><label>Unit rate <span>₦ / {work.unit}</span><NumberField value={work.rate} label={`${work.title} unit rate`} commit={raw => costs.editWork(work.id, "rate", raw)} /></label></div>
    <div className={styles.workTotal}><span>{q(work.quantity)} {work.unit} × {work.rate === null ? "price required" : money(work.rate)}<small>{work.custom ? "Manual rate · adjustment disclosed below" : "Rate calculated from the resources below"}</small></span><strong>{work.rate === null ? "Unpriced" : money(work.amount)}</strong></div>
    <details className={styles.basis}><summary>Quantity, specification & price basis</summary><p>{work.basis}</p><p>{work.source}{work.sourceDate ? ` · reviewed ${work.sourceDate}` : ". Starter values need local quotations."}</p>{work.reference && <><p>{work.reference.specification}</p><p>{work.reference.methodologyNote}</p><a href={`/rates/${work.reference.slug}`} target="_blank" rel="noreferrer">Open {work.reference.code} reference ↗</a></>}</details>
    <div className={styles.resourceHeading}><strong>Build-up for 1 {work.unit}</strong><span>Consumption × resource price</span></div>
    {(["material", "consumable", "labour", "plant", "logistics"] as const).map(group => {
      const lines = work.lines.filter(line => line.category === group); if (!lines.length) return null;
      return <section className={styles.group} key={group} aria-label={categoryNames[group]}><h5>{categoryNames[group]}</h5>{lines.map(line => <div className={styles.resource} key={line.id}>
        <div className={styles.resourceTitle}><span>{line.label}</span><strong>{line.unitRate === null && line.quantity > 0 ? "Price required" : money(line.quantity * (line.unitRate ?? 0))}</strong></div>
        <div className={styles.resourceFields}><label>Use per {work.unit} <span>({line.unit})</span><NumberField value={line.quantity} label={`${line.label} consumption per ${work.unit}`} commit={raw => costs.editResource(work.id, line.id, "quantity", raw)} /></label><span>×</span><label>Price <span>(₦ / {line.unit})</span><NumberField value={line.unitRate} label={`${line.label} resource price`} commit={raw => costs.editResource(work.id, line.id, "unitRate", raw)} /></label></div>
        {line.note && <details><summary>Resource basis</summary><p>{line.note}</p></details>}
      </div>)}</section>;
    })}
    <button type="button" className={styles.add} onClick={() => setAdding(value => !value)}><Plus size={13} /> Add material, labour or equipment</button>
    {adding && <div className={styles.addForm}><label>Resource description<input maxLength={160} value={label} onChange={event => setLabel(event.target.value)} placeholder="e.g. Delivery to site" /></label><div><label>Category<select value={category} onChange={event => setCategory(event.target.value as Resource["category"])}>{Object.entries(categoryNames).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><label>Resource unit<input maxLength={20} value={unit} onChange={event => setUnit(event.target.value)} /></label></div><button type="button" disabled={!label.trim() || !unit.trim()} onClick={() => { costs.addResource(work.id, { label: label.trim(), unit: unit.trim(), category, quantity: 1, unitRate: null }); setLabel(""); setAdding(false); }}>Add resource</button></div>}
    <div className={styles.direct}><span>Direct resource cost</span><strong>{money(work.calculation.directCost)}</strong></div>
    <details className={styles.allowances} open><summary>Fluctuation, risk & overheads / profit</summary>{allowances.map(([field, title, basis]) => <div key={field}><label>{title}<small>{basis} × percentage</small></label><span><NumberField value={roundCost(work.allowances[field] * 100)} label={`${title} percentage`} max={100} commit={raw => costs.editAllowance(work.id, field, raw)} />%</span><strong>{money(work.calculation[field])}</strong></div>)}</details>
    {work.custom && <div className={styles.adjustment}><span>Manual rate adjustment<small>Entered rate minus known calculated rate. This difference has no resource analysis.</small></span><strong>{work.adjustment < 0 ? "−" : "+"}{money(Math.abs(work.adjustment))}</strong></div>}
    {work.missing > 0 && <p className={styles.missing}>{work.missing} resource price{work.missing === 1 ? " is" : "s are"} missing. {work.custom ? "The manual rate is used in the cost; its resource analysis is incomplete." : `Known components total ${money(work.knownRate)} per ${work.unit}; this work is excluded from totals until a full rate is entered.`}</p>}
    <div className={styles.rateResult}><span>{work.custom ? "Entered unit rate" : "Calculated unit rate"}<small>Direct resources + displayed allowances{work.custom ? " + adjustment" : ""}</small></span><strong>{work.rate === null ? "Incomplete" : `${money(work.rate)} / ${work.unit}`}</strong></div>
    <p className={styles.help}>Edit a resource to recalculate the unit rate. Entering a unit rate directly creates the adjustment shown above. Set an unused resource’s consumption to 0.</p>
    <button type="button" className={styles.reset} onClick={() => costs.resetWork(work.id)}><RotateCcw size={12} /> Restore this work item</button>
  </>;
}

export default function ConstructionCostPanel({ costs, model, step, onInteract, heading = true }: { costs: ConstructionCosts; model: ModelId; step: number; onInteract: () => void; heading?: boolean }) {
  const [workId, setWorkId] = useState("");
  const stage = costs.priced[step], active = stage.items.find(item => item.id === workId) ?? stage.items[0], location = getLocation(costs.locationId);
  return <div className={styles.panel} onFocusCapture={onInteract}>
    {heading && <><p className={styles.eyebrow}>LIVE RATE BUILD-UP · STEP {step + 1}</p><h3>{stage.title}</h3></>}
    <div className={styles.location}><label>Rate location<select aria-label="Build-up rate location" value={costs.locationId} onChange={event => costs.setLocationId(event.target.value)}>{RATE_LOCATIONS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><span>{costs.saved ? "Edits saved on this device" : "Edits stay in this session"}</span></div>
    {location.status === "provisional" && <p className={styles.locationNote}>Regional adjustments are provisional. Confirm local prices. {location.note}</p>}
    <p className={styles.editNote}>The build-up follows the tour. Editing pauses playback.</p>
    {active ? <><label className={styles.workSelect}>Work item<select aria-label="Stage work item" value={active.id} onChange={event => setWorkId(event.target.value)}>{stage.items.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><WorkEditor key={`${model}:${costs.locationId}:${step}:${active.id}`} work={active} costs={costs} /></> : <p className={styles.noWork}>This lesson reviews work already priced in earlier stages. No extra cost is added for viewing a load path.</p>}
    <div className={styles.footer}><button type="button" onClick={() => exportConstructionCosts(costs, model)}><Download size={13} /> Export all stage build-ups</button><button type="button" onClick={costs.resetModel}><RotateCcw size={12} /> Reset model costs</button></div>
    <p className={styles.help}>Sample quantities are editable and do not change the 3D geometry. Bank allowances are included once. No extra O/P or VAT is added outside this build-up.</p>
  </div>;
}
