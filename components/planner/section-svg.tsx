import { forwardRef } from "react";

import { Chain, Defs, GREY, INK, Ladder, NAVY, finishFill } from "./drawing-kit";
import type { CrossSection } from "@/lib/planner/section";

/** Cross-section (C-C…): walls cut in navy, items cut filled, things beyond dashed, slabs, ladder and dimensions across the room. */
const SectionSvg = forwardRef<SVGSVGElement, { s: CrossSection; className?: string }>(function SectionSvg({ s, className }, ref) {
  const x0 = s.from, x1 = s.to, W = x1 - x0, H = s.height, f = Math.max(W, H) / 40;
  const vb = { x: x0 - f * 2, y: -H - f * 5, w: W + f * 10, h: H + f * 14 };
  const order = (k: string) => ({ "door-beyond": 0, beyond: 1, item: 2, glass: 3, wall: 4 } as Record<string, number>)[k] ?? 5;
  const inner = s.edges.length ? [s.edges[0], s.edges[s.edges.length - 1]] : [x0, x1];
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={className}>
      <Defs f={f} />
      <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#fff" />
      <rect x={x0 - f * 0.6} y={0} width={W + f * 1.2} height={f * 1.6} fill="url(#slab-hatch)" stroke={INK} strokeWidth={f * 0.06} />
      <rect x={x0 - f * 0.6} y={-H - f * 1.6} width={W + f * 1.2} height={f * 1.6} fill="url(#slab-hatch)" stroke={INK} strokeWidth={f * 0.06} />
      <text x={(inner[0] + inner[1]) / 2} y={-H + f * 1.5} fontSize={f * 0.7} textAnchor="middle" fill={GREY} fontFamily="Arial, sans-serif">Ceiling {H}</text>
      {[...s.parts].sort((p, q) => order(p.kind) - order(q.kind)).map((p, i) => {
        const y = -(p.y0 + p.h), w = p.x1 - p.x0;
        if (p.kind === "wall") return <rect key={i} x={p.x0} y={y} width={w} height={p.h} fill={NAVY} />;
        if (p.kind === "glass") return <g key={i}><rect x={p.x0} y={y} width={w} height={p.h} fill="#DCE9F5" stroke={NAVY} strokeWidth={f * 0.06} /><line x1={p.x0 + w / 2} y1={y} x2={p.x0 + w / 2} y2={-p.y0} stroke={NAVY} strokeWidth={f * 0.05} /></g>;
        if (p.kind === "item") return <g key={i}><rect x={p.x0} y={y} width={w} height={p.h} fill={finishFill(p.type, p.finish, "#E6E9ED")} stroke={INK} strokeWidth={f * 0.1} />{p.type === "kitchen-sink" || p.type === "base-cabinet" ? <rect x={p.x0} y={y} width={w + f * 0.4} height={f * 0.6} fill="#D9DCDF" stroke={INK} strokeWidth={f * 0.06} /> : null}</g>;
        return <g key={i}><rect x={p.x0} y={y} width={w} height={p.h} fill={p.kind === "door-beyond" ? "#F4F0EA" : "none"} stroke={GREY} strokeWidth={f * 0.06} strokeDasharray={`${f * 0.4} ${f * 0.3}`} />{w > f * 4 && p.h > f * 1.5 ? <text x={p.x0 + w / 2} y={y + p.h / 2} fontSize={f * 0.65} textAnchor="middle" dominantBaseline="middle" fill={GREY} fontFamily="Arial, sans-serif">{p.kind === "door-beyond" ? "Door beyond" : `${p.name} beyond`}</text> : null}</g>;
      })}
      <g fontFamily="Arial, sans-serif" fontSize={f * 0.72} fill={INK} textAnchor="middle">
        {s.parts.filter((p) => p.kind === "item").map((p, i) => <text key={i} x={(p.x0 + p.x1) / 2} y={p.y0 >= 1200 ? -H - f * 2.6 : f * 2.6 + (i % 2) * f}>{p.name}</text>)}
      </g>
      {s.edges.length >= 2 ? <Chain edges={s.edges} at={f * 5.2} f={f} /> : null}
      {s.walkway ? (() => {
        // Walkway chain: the widest clear gap.
        const pairs = s.edges.slice(1).map((v, i) => [s.edges[i], v]).filter(([a, b]) => Math.round(b - a) === s.walkway);
        return pairs.length ? <Chain edges={pairs[0]} at={f * 7.4} f={f} labels={[`${s.walkway} walkway`]} /> : null;
      })() : null}
      {s.internal ? <Chain edges={inner} at={f * 9.6} f={f} labels={[`${s.internal} internal`]} /> : null}
      <Ladder x={x1 + f * 1.4} levels={[0, H, ...s.parts.filter((p) => p.kind !== "wall").flatMap((p) => [p.y0, p.y0 + p.h])]} f={f} />
    </svg>
  );
});

export default SectionSvg;
