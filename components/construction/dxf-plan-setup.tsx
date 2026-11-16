"use client";
import { useMemo, useState } from "react";
import type { readDxf, TracePlan, PlanPoint } from "@/lib/construction/project-import";
import styles from "./construction-studio.module.css";
export default function DxfPlanSetup({ drawing, onUse }: { drawing: Awaited<ReturnType<typeof readDxf>>; onUse: (plan: TracePlan) => void }) {
  const [layer, setLayer] = useState(drawing.layers.find(name => /wall|block|masonry/i.test(name)) ?? drawing.layers[0]);
  const [unitScale, setUnitScale] = useState(drawing.units === 4 ? 0.001 : drawing.units === 5 ? 0.01 : drawing.units === 6 ? 1 : drawing.units === 1 ? 0.0254 : drawing.units === 2 ? 0.3048 : 0);
  const mapped = useMemo(() => {
    const points = drawing.lines.flatMap(line => line.points), xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = xs.reduce((a, b) => Math.min(a, b), Infinity), maxX = xs.reduce((a, b) => Math.max(a, b), -Infinity), minY = ys.reduce((a, b) => Math.min(a, b), Infinity), maxY = ys.reduce((a, b) => Math.max(a, b), -Infinity);
    const scale = 1100 / Math.max(1, maxX - minX, maxY - minY), toPixel = (p: PlanPoint): PlanPoint => [50 + (p[0] - minX) * scale, 50 + (maxY - p[1]) * scale];
    return { scale, lines: drawing.lines.map(line => ({ ...line, points: line.points.map(toPixel) })) };
  }, [drawing]);
  return <section className={styles.importer}><h2>Choose the DXF wall layer and units</h2><p>Straight lines and polylines are supported. Blocks, curves and annotation are not converted into walls. Review the layer and footprint before generating the model.</p><div className={styles.importSettings}><label>Wall layer<select value={layer} onChange={e => setLayer(e.target.value)}>{drawing.layers.map(name => <option key={name}>{name}</option>)}</select></label><label>Drawing units<select value={unitScale} onChange={e => setUnitScale(Number(e.target.value))}><option value={0}>Choose units</option><option value={0.001}>Millimetres</option><option value={0.01}>Centimetres</option><option value={1}>Metres</option><option value={0.3048}>Feet</option><option value={0.0254}>Inches</option></select></label></div><div className={styles.planBoard}><svg viewBox="0 0 1200 1200" role="img" aria-label="DXF layer preview"><rect width="1200" height="1200" fill="white" />{mapped.lines.slice(0, 10000).map((line, i) => <polyline key={i} points={[...line.points, ...(line.closed ? [line.points[0]] : [])].map(p => p.join(",")).join(" ")} fill="none" stroke={line.layer === layer ? "#bd431b" : "#bac6d3"} strokeWidth={line.layer === layer ? 3 : 1} />)}</svg></div><p>{drawing.skipped} unsupported / annotation entities omitted. The generated geometry remains a reviewable interpretation.</p><button type="button" className={styles.primary} disabled={!unitScale} onClick={() => {
    const selected = mapped.lines.filter(line => line.layer === layer);
    const area = (p: PlanPoint[]) => Math.abs(p.reduce((sum, point, i) => { const next = p[(i + 1) % p.length]; return sum + point[0] * next[1] - next[0] * point[1]; }, 0));
    const outline = selected.filter(line => line.closed && line.points.length >= 3).sort((a, b) => area(b.points) - area(a.points))[0];
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1200;
    const context = canvas.getContext("2d"); if (!context) return;
    context.fillStyle = "white"; context.fillRect(0, 0, 1200, 1200); context.lineWidth = 2;
    for (const line of mapped.lines.slice(0, 10000)) {
      if (!line.points.length) continue;
      context.strokeStyle = line.layer === layer ? "#333333" : "#bdc6d0"; context.beginPath(); context.moveTo(...line.points[0]);
      line.points.slice(1).forEach(point => context.lineTo(...point)); if (line.closed) context.closePath(); context.stroke();
    }
    const image = canvas.toDataURL("image/png");
    onUse({ image, width: 1200, height: 1200, calibration: [[50, 50], [150, 50]], distance: 100 / mapped.scale * unitScale, outline: outline?.points ?? [], segments: selected.filter(line => line !== outline).flatMap(line => line.points.slice(1).map((point, i) => ({ a: line.points[i], b: point, type: "wall" as const }))), floors: 1, storeyHeight: 3, wallThickness: 0.225 });
  }}>Review this layer as a traced plan</button></section>;
}
