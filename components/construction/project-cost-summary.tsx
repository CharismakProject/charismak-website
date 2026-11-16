"use client";

import { projectCostSummary, projectMoney, type ConstructionProject, type ProjectCharge } from "@/lib/construction/project";
import styles from "./construction-studio.module.css";

export default function ProjectCostSummary({ project, update }: { project: ConstructionProject; update: (charges: ProjectCharge[]) => void }) {
  const summary = projectCostSummary(project);
  const edit = (id: string, patch: Partial<ProjectCharge>) => update((project.charges ?? []).map(charge => charge.id === id ? { ...charge, ...patch } : charge));
  return <details className={styles.costReconciliation} open={summary.charges.length > 0}>
    <summary>Project allowances and total <strong>{projectMoney(summary.total)}</strong></summary>
    <p>Work quantities and unit rates make up the priced works subtotal. Add percentages here once, in order. “Running subtotal” includes the preceding allowances. These percentages accrue in proportion to planned work during playback.</p>
    <div className={styles.chargeRow}><strong>Priced works subtotal</strong><span /><span /><strong>{projectMoney(summary.works)}</strong></div>
    {summary.charges.map(charge => <div className={styles.chargeRow} key={charge.id}>
      <input aria-label={`${charge.id} allowance name`} value={charge.label} maxLength={100} onChange={event => edit(charge.id, { label: event.target.value })} />
      <label>Percent<input aria-label={`${charge.id} percentage`} type="number" min={0} max={100} step="any" value={Number((charge.percentage * 100).toFixed(6))} onChange={event => edit(charge.id, { percentage: Math.max(0, Math.min(100, Number(event.target.value))) / 100 })} /></label>
      <label>Apply to<select aria-label={`${charge.id} basis`} value={charge.basis} onChange={event => edit(charge.id, { basis: event.target.value as ProjectCharge["basis"] })}><option value="works">Priced works</option><option value="running">Running subtotal</option></select><small>{projectMoney(charge.base)}</small></label>
      <div><strong>{projectMoney(charge.amount)}</strong><button type="button" aria-label={`Remove ${charge.label}`} onClick={() => update((project.charges ?? []).filter(item => item.id !== charge.id))}>Remove</button></div>
    </div>)}
    <div className={styles.chargeRow}><strong>Estimated project total</strong><span /><span /><strong>{projectMoney(summary.total)}</strong></div>
    <button type="button" disabled={summary.charges.length >= 20} onClick={() => update([...(project.charges ?? []), { id: `allowance-${Date.now()}`, label: "Project allowance", percentage: 0, basis: "works" }])}>Add percentage allowance</button>
  </details>;
}
