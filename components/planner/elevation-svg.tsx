import { forwardRef } from "react";

import { Chain, Defs, GREY, INK, ItemFront, Ladder, NAVY, RED, Slabs } from "./drawing-kit";
import type { Elevation } from "@/lib/planner/elevation";
import { DOOR_HEIGHT } from "@/lib/planner/catalog";

/** Wall elevation (Section A-A, B-B…): cut walls at the ends, hatched slabs, items drawn front-on, labels, level ladder and chain dimensions. */
const ElevationSvg = forwardRef<SVGSVGElement, { e: Elevation; className?: string }>(function ElevationSvg({ e, className }, ref) {
  const L = e.length, H = e.height, f = Math.max(L, H) / 45, tw = 150;
  const vb = { x: -tw - f * 2, y: -H - f * 5, w: L + tw * 2 + f * 10, h: H + f * 11.5 };
  const items = e.parts.filter((p) => p.kind === "item");
  const levels = [0, H, ...e.parts.flatMap((p) => [p.y, p.y + p.h])];
  // Chain along the floor run (items below 1 m) plus doors and windows, as on contractor drawings.
  const edges = [0, L, ...e.parts.filter((p) => p.kind !== "item" || p.y < 1000).flatMap((p) => [Math.max(0, p.x), Math.min(L, p.x + p.w)])];
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={className}>
      <Defs f={f} />
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#fff" />
      <Slabs x0={-tw - f * 0.6} x1={L + tw + f * 0.6} H={H} f={f} />
      <rect x={0} y={-H} width={L} height={H} fill="#fff" stroke={INK} strokeWidth={f * 0.1} />
      <rect x={-tw} y={-H} width={tw} height={H} fill={NAVY} />
      <rect x={L} y={-H} width={tw} height={H} fill={NAVY} />
      {e.parts.filter((p) => p.kind !== "item").map((p, i) => p.kind === "door" ? (
        <g key={`o${i}`}><rect x={p.x} y={-DOOR_HEIGHT} width={p.w} height={DOOR_HEIGHT} fill="#F4F0EA" stroke={RED} strokeWidth={f * 0.08} /><text x={p.x + p.w / 2} y={-DOOR_HEIGHT / 2} fontSize={f * 0.7} textAnchor="middle" fill={GREY} fontFamily="Arial, sans-serif">Door</text></g>
      ) : (
        <g key={`o${i}`}><rect x={p.x} y={-(p.y + p.h)} width={p.w} height={p.h} fill="#DCE9F5" stroke={NAVY} strokeWidth={f * 0.1} /><line x1={p.x + p.w / 2} y1={-p.y} x2={p.x + p.w / 2} y2={-(p.y + p.h)} stroke={NAVY} strokeWidth={f * 0.08} /></g>
      ))}
      {[...items].sort((p, q) => p.y - q.y).map((p, i) => <ItemFront key={`i${i}`} type={p.type} finish={p.finish} name={p.name} x={Math.max(0, p.x)} w={Math.min(L, p.x + p.w) - Math.max(0, p.x)} y0={p.y} h={p.h} f={f} ceiling={H} />)}
      {/* Labels: high items above the ceiling slab, others below the floor */}
      <g fontFamily="Arial, sans-serif" fontSize={f * 0.75} fill={INK} textAnchor="middle">
        {e.parts.map((p, i) => { const cx = Math.max(0, p.x) + (Math.min(L, p.x + p.w) - Math.max(0, p.x)) / 2; const hi = p.y >= 1200 || p.kind === "window"; return <text key={`l${i}`} x={cx} y={hi ? -H - f * 2.6 - (i % 2) * f : f * 2.6 + (i % 2) * f}>{p.name}</text>; })}
      </g>
      <Chain edges={edges} at={f * 5.4} f={f} />
      <Ladder x={L + tw + f * 1.4} levels={levels} f={f} />
      {e.curved ? <text x={L / 2} y={f * 6.8} fontSize={f * 0.7} textAnchor="middle" fill={GREY} fontFamily="Arial, sans-serif">Curved wall shown unrolled; length along the curve.</text> : null}
    </svg>
  );
});

export default ElevationSvg;
