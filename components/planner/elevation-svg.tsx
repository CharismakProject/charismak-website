import { forwardRef } from "react";

import type { Elevation } from "@/lib/planner/elevation";

const NAVY = "#0D3352";
const RED = "#8A1A10";
const GREY = "#5A6675";

/** A wall elevation (section) drawn to scale: wall face, doors, windows and items, with dimensions in mm. */
const ElevationSvg = forwardRef<SVGSVGElement, { e: Elevation; className?: string; pixelWidth?: number }>(function ElevationSvg({ e, className, pixelWidth }, ref) {
  const L = e.length, H = e.height;
  const f = Math.max(L, H) / 45; // text size
  const pad = f * 5;
  const vb = { x: -pad * 1.2, y: -H - pad, w: L + pad * 2.4, h: H + pad * 3.4 };
  const y = (v: number) => -v; // up is positive in mm, down in the drawing
  const stroke = f * 0.06;

  // Chain of positions along the bottom: every edge of a door, window or item.
  const edges = [...new Set([0, L, ...e.parts.flatMap((p) => [p.x, p.x + p.w]).map((v) => Math.round(Math.max(0, Math.min(L, v))))])].sort((a, b) => a - b);
  const hDim = (x1: number, x2: number, at: number, label: string) => (
    <g key={`h-${x1}-${x2}-${at}`} stroke={GREY} strokeWidth={stroke} fill={GREY}>
      <line x1={x1} y1={at} x2={x2} y2={at} />
      <line x1={x1} y1={at - f * 0.4} x2={x1} y2={at + f * 0.4} />
      <line x1={x2} y1={at - f * 0.4} x2={x2} y2={at + f * 0.4} />
      {x2 - x1 > f * 2 ? <text x={(x1 + x2) / 2} y={at - f * 0.35} fontSize={f * 0.8} textAnchor="middle" stroke="none" fontFamily="Arial, sans-serif">{label}</text> : null}
    </g>
  );
  const vDim = (x: number, y1: number, y2: number, label: string, key: string) => (
    <g key={key} stroke={GREY} strokeWidth={stroke} fill={GREY}>
      <line x1={x} y1={y(y1)} x2={x} y2={y(y2)} />
      <line x1={x - f * 0.4} y1={y(y1)} x2={x + f * 0.4} y2={y(y1)} />
      <line x1={x - f * 0.4} y1={y(y2)} x2={x + f * 0.4} y2={y(y2)} />
      <text x={x - f * 0.35} y={y((y1 + y2) / 2)} fontSize={f * 0.75} textAnchor="middle" stroke="none" fontFamily="Arial, sans-serif" transform={`rotate(-90 ${x - f * 0.35} ${y((y1 + y2) / 2)})`}>{label}</text>
    </g>
  );

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={className} width={pixelWidth} height={pixelWidth ? Math.round((pixelWidth * vb.h) / vb.w) : undefined}>
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#fff" />
      {/* Wall face, floor and ceiling */}
      <rect x={0} y={y(H)} width={L} height={H} fill="#F3F5F8" stroke="#1B2433" strokeWidth={f * 0.12} />
      <line x1={-pad * 0.6} y1={0} x2={L + pad * 0.6} y2={0} stroke="#1B2433" strokeWidth={f * 0.25} />
      {/* Doors and windows are in the wall, so they are drawn first and items in front of them on top. */}
      {[...e.parts].sort((p, q) => (p.kind === "item" ? 1 : 0) - (q.kind === "item" ? 1 : 0)).map((p, i) => {
        const x = Math.max(0, p.x), w = Math.min(L, p.x + p.w) - x;
        if (p.kind === "door") return (
          <g key={i}>
            <rect x={x} y={y(p.y + p.h)} width={w} height={p.h} fill="#fff" stroke={RED} strokeWidth={f * 0.1} />
            <polyline points={`${x},${y(0)} ${x + w},${y(p.h / 2)} ${x},${y(p.h)}`} fill="none" stroke={RED} strokeWidth={f * 0.05} strokeDasharray={`${f * 0.4} ${f * 0.3}`} />
          </g>
        );
        if (p.kind === "window") return (
          <g key={i}>
            <rect x={x} y={y(p.y + p.h)} width={w} height={p.h} fill="#E5F1FF" stroke="#1D5FA8" strokeWidth={f * 0.1} />
            <line x1={x + w / 2} y1={y(p.y)} x2={x + w / 2} y2={y(p.y + p.h)} stroke="#1D5FA8" strokeWidth={f * 0.06} />
            {vDim(x + w + f * 0.9, 0, p.y, `${Math.round(p.y)}`, `sill-${i}`)}
          </g>
        );
        return (
          <g key={i}>
            <rect x={x} y={y(p.y + p.h)} width={w} height={p.h} fill="#fff" stroke={NAVY} strokeWidth={f * 0.08} />
            {w > f * 2.5 && p.h > f * 1.2 ? <text x={x + w / 2} y={y(p.y + p.h / 2)} fontSize={Math.min(f * 0.75, w / 8)} textAnchor="middle" dominantBaseline="middle" fill={NAVY} fontFamily="Arial, sans-serif">{p.name}</text> : null}
            {p.y > 0 ? vDim(x - f * 0.8, 0, p.y, `${Math.round(p.y)}`, `m-${i}`) : null}
          </g>
        );
      })}
      {/* Heights: ceiling on the left; door and item heights above them */}
      {vDim(-pad * 0.55, 0, H, `${Math.round(H)}`, "ceiling")}
      {e.parts.filter((p) => p.kind !== "window").map((p, i) => <text key={`ht-${i}`} x={Math.max(0, p.x) + Math.min(p.w, L) / 2} y={y(p.y + p.h) - f * 0.35} fontSize={f * 0.7} textAnchor="middle" fill={GREY} fontFamily="Arial, sans-serif">{`${Math.round(p.w)} × ${Math.round(p.h)}`}</text>)}
      {/* Positions along the wall, then the overall length */}
      {edges.slice(1).map((v, i) => hDim(edges[i], v, f * 1.6, `${v - edges[i]}`))}
      {hDim(0, L, f * 3.4, `${Math.round(L)}${e.curved ? " (curved wall, unrolled)" : ""}`)}
    </svg>
  );
});

export default ElevationSvg;
