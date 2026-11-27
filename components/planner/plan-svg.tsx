import { forwardRef, type ReactNode } from "react";

import { catalogItem, WINDOW_HEIGHT } from "@/lib/planner/catalog";
import { allWalls, roomArea, roomCentre, roomOf, roomPolygon, wallLength, type Item, type Opening, type Plan, type Pt, type Wall } from "@/lib/planner/model";

const NAVY = "#0D3352";
const RED = "#8A1A10";

/** Top-view symbol for an item, drawn in a box centred on 0,0 of size w × d. */
function symbol(it: Item): ReactNode {
  const c = catalogItem(it.type);
  const w = it.w, d = it.d, hw = w / 2, hd = d / 2;
  const line = { fill: "none", stroke: NAVY, strokeWidth: Math.max(8, Math.min(w, d) * 0.03) } as const;
  const box = <rect x={-hw} y={-hd} width={w} height={d} fill="#fff" stroke={NAVY} strokeWidth={line.strokeWidth} rx={Math.min(w, d) * 0.04} />;
  switch (c?.symbol) {
    case "chair": return <>{box}<rect x={-hw} y={-hd} width={w} height={d * 0.18} fill={NAVY} opacity={0.85} /></>;
    case "table": return <>{box}<rect x={-hw * 0.8} y={-hd * 0.75} width={w * 0.8} height={d * 0.75} {...line} /></>;
    case "bed": return <>{box}<rect x={-hw * 0.9} y={-hd * 0.95} width={w * 0.38} height={d * 0.16} rx={30} {...line} /><rect x={hw * 0.08} y={-hd * 0.95} width={w * 0.38} height={d * 0.16} rx={30} {...line} /><line x1={-hw} y1={-hd * 0.6} x2={hw} y2={-hd * 0.6} {...line} /></>;
    case "sofa": return <>{box}<rect x={-hw} y={-hd} width={w} height={d * 0.28} fill={NAVY} opacity={0.15} /><line x1={-hw / 3} y1={-hd * 0.44} x2={-hw / 3} y2={hd} {...line} /><line x1={hw / 3} y1={-hd * 0.44} x2={hw / 3} y2={hd} {...line} /></>;
    case "wardrobe": return <>{box}<line x1={0} y1={-hd} x2={0} y2={hd} {...line} /><line x1={-hw} y1={hd * 0.7} x2={hw} y2={hd * 0.7} {...line} /></>;
    case "tv": return <>{box}<rect x={-hw * 0.6} y={-hd * 0.2} width={w * 0.6} height={d * 0.15} fill={NAVY} /></>;
    case "cabinet": return <>{box}<line x1={-hw} y1={hd * 0.75} x2={hw} y2={hd * 0.75} {...line} /></>;
    case "cooker": return <>{box}{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <circle key={`${a}${b}`} cx={a * hw * 0.45} cy={b * hd * 0.42} r={Math.min(w, d) * 0.17} {...line} />)}</>;
    case "fridge": return <>{box}<line x1={-hw} y1={hd * 0.7} x2={hw} y2={hd * 0.7} {...line} /><text x={0} y={0} fontSize={Math.min(w, d) * 0.3} textAnchor="middle" dominantBaseline="middle" fill={NAVY}>F</text></>;
    case "sink": return <>{box}<rect x={-hw * 0.85} y={-hd * 0.7} width={w * 0.5} height={d * 0.75} rx={40} {...line} /><circle cx={hw * 0.45} cy={-hd * 0.2} r={Math.min(w, d) * 0.08} {...line} /></>;
    case "washer": return <>{box}<circle cx={0} cy={0} r={Math.min(w, d) * 0.32} {...line} /></>;
    case "wc": return <><rect x={-hw} y={-hd} width={w} height={d * 0.3} fill="#fff" stroke={NAVY} strokeWidth={line.strokeWidth} /><ellipse cx={0} cy={hd * 0.25} rx={hw * 0.9} ry={hd * 0.65} fill="#fff" stroke={NAVY} strokeWidth={line.strokeWidth} /></>;
    case "basin": return <>{box}<ellipse cx={0} cy={hd * 0.1} rx={hw * 0.7} ry={hd * 0.6} {...line} /></>;
    case "shower": return <>{box}<line x1={-hw} y1={-hd} x2={hw} y2={hd} {...line} /><line x1={hw} y1={-hd} x2={-hw} y2={hd} {...line} /><circle cx={0} cy={0} r={Math.min(w, d) * 0.06} fill={NAVY} /></>;
    case "bath": return <>{box}<rect x={-hw * 0.85} y={-hd * 0.75} width={w * 0.85} height={d * 0.75} rx={Math.min(w, d) * 0.3} {...line} /></>;
    case "bulb": return <><circle r={Math.min(w, d) / 2} fill="#FFF6D6" stroke={RED} strokeWidth={14} /><line x1={-hw * 0.7} y1={-hd * 0.7} x2={hw * 0.7} y2={hd * 0.7} stroke={RED} strokeWidth={14} /><line x1={hw * 0.7} y1={-hd * 0.7} x2={-hw * 0.7} y2={hd * 0.7} stroke={RED} strokeWidth={14} /></>;
    case "socket": return <><circle r={Math.min(w, d) / 2} fill="#fff" stroke={RED} strokeWidth={14} /><line x1={-hw * 0.5} y1={0} x2={hw * 0.5} y2={0} stroke={RED} strokeWidth={14} /></>;
    case "switch": return <><circle r={Math.min(w, d) / 2.4} fill={RED} /><line x1={0} y1={0} x2={hw} y2={-hd} stroke={RED} strokeWidth={14} /></>;
    case "ac": return <>{box}<text x={0} y={0} fontSize={Math.min(w, d) * 0.5} textAnchor="middle" dominantBaseline="middle" fill={NAVY} fontWeight={700}>AC</text></>;
    case "fan": return <><circle r={Math.min(w, d) / 2} fill="none" stroke={NAVY} strokeWidth={12} strokeDasharray="40 30" />{[0, 120, 240].map((a) => <rect key={a} x={-40} y={-hd * 0.9} width={80} height={hd * 0.85} rx={40} fill={NAVY} opacity={0.5} transform={`rotate(${a})`} />)}<circle r={60} fill={NAVY} /></>;
    case "tap": return <><circle r={Math.min(w, d) / 2} fill="#E5F1FF" stroke="#1D5FA8" strokeWidth={14} /><text x={0} y={0} fontSize={Math.min(w, d) * 0.5} textAnchor="middle" dominantBaseline="middle" fill="#1D5FA8" fontWeight={700}>W</text></>;
    case "drain": return <><rect x={-hw} y={-hd} width={w} height={d} fill="#fff" stroke="#1D5FA8" strokeWidth={14} /><line x1={-hw} y1={0} x2={hw} y2={0} stroke="#1D5FA8" strokeWidth={10} /><line x1={0} y1={-hd} x2={0} y2={hd} stroke="#1D5FA8" strokeWidth={10} /></>;
    default: return box;
  }
}

function opening(o: Opening, w: Wall) {
  const len = wallLength(w) || 1;
  const ux = (w.b.x - w.a.x) / len, uy = (w.b.y - w.a.y) / len;
  const cx = w.a.x + (w.b.x - w.a.x) * o.t, cy = w.a.y + (w.b.y - w.a.y) * o.t;
  const half = o.width / 2;
  const p1 = { x: cx - ux * half, y: cy - uy * half }, p2 = { x: cx + ux * half, y: cy + uy * half };
  const nx = -uy, ny = ux, th = w.thickness;
  const gap = <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth={th + 4} />;
  if (o.kind === "window") {
    return <g key={o.id}>{gap}{[-0.5, 0, 0.5].map((k) => <line key={k} x1={p1.x + nx * th * k * 0.8} y1={p1.y + ny * th * k * 0.8} x2={p2.x + nx * th * k * 0.8} y2={p2.y + ny * th * k * 0.8} stroke="#1D5FA8" strokeWidth={14} />)}</g>;
  }
  const leafEnd = { x: p1.x + nx * o.width, y: p1.y + ny * o.width };
  return <g key={o.id}>{gap}<line x1={p1.x} y1={p1.y} x2={leafEnd.x} y2={leafEnd.y} stroke={RED} strokeWidth={14} /><path d={`M ${leafEnd.x} ${leafEnd.y} A ${o.width} ${o.width} 0 0 1 ${p2.x} ${p2.y}`} fill="none" stroke={RED} strokeWidth={8} strokeDasharray="30 25" /></g>;
}

/** Dimension along a wall, offset to one side, text upright. */
function dimension(w: Wall, offset: number, size: number) {
  const len = wallLength(w);
  if (len < 50) return null;
  const ux = (w.b.x - w.a.x) / len, uy = (w.b.y - w.a.y) / len;
  const nx = uy, ny = -ux;
  const a = { x: w.a.x + nx * offset, y: w.a.y + ny * offset }, b = { x: w.b.x + nx * offset, y: w.b.y + ny * offset };
  let angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (angle > 90 || angle < -90) angle += 180;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const tick = size * 0.5;
  return (
    <g key={`d-${w.id}`} stroke="#5A6675" strokeWidth={size * 0.06} fill="#5A6675">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      <line x1={a.x - nx * tick} y1={a.y - ny * tick} x2={a.x + nx * tick} y2={a.y + ny * tick} />
      <line x1={b.x - nx * tick} y1={b.y - ny * tick} x2={b.x + nx * tick} y2={b.y + ny * tick} />
      <text x={mid.x + nx * size * 0.7} y={mid.y + ny * size * 0.7} fontSize={size} textAnchor="middle" dominantBaseline="middle" stroke="none" fontFamily="Arial, sans-serif" transform={`rotate(${angle} ${mid.x + nx * size * 0.7} ${mid.y + ny * size * 0.7})`}>{Math.round(len)}</text>
    </g>
  );
}

export type PlanSvgProps = {
  plan: Plan;
  box: { x: number; y: number; w: number; h: number };
  selected?: string | null;
  draft?: { a: Pt; b: Pt } | null;
  calibration?: Pt[];
  showBackdrop?: boolean;
  showDimensions?: boolean;
  className?: string;
  pixelWidth?: number;
};

/** The floor plan drawing, shared by the editor and the report/PDF. */
const PlanSvg = forwardRef<SVGSVGElement, PlanSvgProps & Omit<React.SVGProps<SVGSVGElement>, "viewBox" | "ref">>(function PlanSvg(
  { plan, box: viewBox, selected, draft, calibration, showBackdrop = true, showDimensions = true, className, pixelWidth, ...rest },
  ref,
) {
  const unit = viewBox.w / 60; // text size relative to the view
  const every = allWalls(plan);
  const walls = new Map(every.map((w) => [w.id, w]));
  const seen = new Set<string>(); // shared walls between rooms get one dimension
  const isSel = (id: string) => selected === id || (selected !== null && roomOf(id) === selected);
  const b = plan.backdrop;
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} className={className} width={pixelWidth} height={pixelWidth ? Math.round((pixelWidth * viewBox.h) / viewBox.w) : undefined} {...rest}>
      <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="#fff" />
      {b && showBackdrop ? <image href={b.image} x={b.x} y={b.y} width={b.pxW * b.mmPerPx} height={b.pxH * b.mmPerPx} opacity={b.opacity} preserveAspectRatio="none" /> : null}
      {plan.rooms.map((r) => (
        <polygon key={r.id} data-id={r.id} points={roomPolygon(r).map((p) => `${p.x},${p.y}`).join(" ")} fill={selected === r.id ? "#FBEDEA" : "#F3F5F8"} />
      ))}
      {every.map((w) => (
        <line key={w.id} data-id={w.id} x1={w.a.x} y1={w.a.y} x2={w.b.x} y2={w.b.y} stroke={isSel(w.id) ? RED : "#1B2433"} strokeWidth={w.thickness} strokeLinecap="square" />
      ))}
      {plan.openings.map((o) => { const w = walls.get(o.wallId); return w ? <g key={o.id} data-id={o.id} opacity={selected === o.id ? 0.6 : 1}>{opening(o, w)}</g> : null; })}
      {plan.items.map((it) => (
        <g key={it.id} data-id={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`}>
          {symbol(it)}
          {selected === it.id ? <rect x={-it.w / 2 - 40} y={-it.d / 2 - 40} width={it.w + 80} height={it.d + 80} fill="none" stroke={RED} strokeWidth={unit * 0.15} strokeDasharray={`${unit * 0.5} ${unit * 0.3}`} /> : null}
        </g>
      ))}
      {plan.rooms.map((r) => { const c = roomCentre(r); return (
        <g key={`label-${r.id}`} pointerEvents="none" fontFamily="Arial, sans-serif" textAnchor="middle">
          <text x={c.x} y={c.y - unit * 0.3} fontSize={unit * 1.05} fontWeight={700} fill={NAVY}>{r.name}</text>
          <text x={c.x} y={c.y + unit * 1} fontSize={unit * 0.85} fill="#5A6675">{roomArea(r).toFixed(1)} m²</text>
        </g>
      ); })}
      {showDimensions ? every.filter((w) => { const k = [w.a, w.b].map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).sort().join("|"); if (seen.has(k)) return false; seen.add(k); return true; }).map((w) => dimension(w, w.thickness / 2 + unit * 1.4, unit * 0.9)) : null}
      {draft ? <><line x1={draft.a.x} y1={draft.a.y} x2={draft.b.x} y2={draft.b.y} stroke={RED} strokeWidth={150} strokeOpacity={0.5} strokeLinecap="square" /><text x={(draft.a.x + draft.b.x) / 2} y={(draft.a.y + draft.b.y) / 2 - unit * 1.2} fontSize={unit * 1.2} textAnchor="middle" fill={RED} fontWeight={700} fontFamily="Arial, sans-serif">{Math.round(Math.hypot(draft.b.x - draft.a.x, draft.b.y - draft.a.y))} mm</text></> : null}
      {calibration?.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={unit * 0.4} fill={RED} />)}
      {calibration && calibration.length === 2 ? <line x1={calibration[0].x} y1={calibration[0].y} x2={calibration[1].x} y2={calibration[1].y} stroke={RED} strokeWidth={unit * 0.15} /> : null}
    </svg>
  );
});

export default PlanSvg;
export { WINDOW_HEIGHT };
