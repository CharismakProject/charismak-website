import type { ReactNode } from "react";

import { FINISH_COLOUR, itemFinish } from "@/lib/planner/catalog";

export const NAVY = "#0D3352";
export const RED = "#8A1A10";
export const INK = "#1B2433";
export const GREY = "#5A6675";
const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
export const finishFill = (type?: string, finish?: string, fallback = "#ffffff") => { const f = type ? itemFinish(type, finish) : undefined; return f ? hex(FINISH_COLOUR[f].color) : fallback; };

/** Shared <defs>: slab hatching. */
export const Defs = ({ f }: { f: number }) => (
  <defs>
    <pattern id="slab-hatch" width={f * 0.8} height={f * 0.8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={f * 0.8} height={f * 0.8} fill="#fff" />
      <line x1={0} y1={0} x2={0} y2={f * 0.8} stroke="#B9C1CA" strokeWidth={f * 0.06} />
    </pattern>
  </defs>
);

/** Floor slab below 0 and ceiling slab above H, hatched, spanning x0..x1 (drawing y is down: y = −height). */
export const Slabs = ({ x0, x1, H, f }: { x0: number; x1: number; H: number; f: number }) => (
  <g stroke={INK} strokeWidth={f * 0.06}>
    <rect x={x0} y={0} width={x1 - x0} height={f * 1.6} fill="url(#slab-hatch)" />
    <rect x={x0} y={-H - f * 1.6} width={x1 - x0} height={f * 1.6} fill="url(#slab-hatch)" />
  </g>
);

/** Level ladder on the right: ticks and values for each height. */
export function Ladder({ x, levels, f }: { x: number; levels: number[]; f: number }) {
  const sorted = [...new Set(levels.map((v) => Math.round(v)))].sort((a, b) => a - b);
  const keep: number[] = [];
  for (const v of sorted) if (!keep.length || v - keep[keep.length - 1] >= f * 1.1 || v === sorted[sorted.length - 1]) keep.push(v);
  return (
    <g stroke={RED} strokeWidth={f * 0.06} fill={RED} fontFamily="Arial, sans-serif">
      <line x1={x} y1={0} x2={x} y2={-Math.max(...keep)} />
      {keep.map((v) => (
        <g key={v}>
          <line x1={x - f * 0.35} y1={-v} x2={x + f * 0.35} y2={-v} />
          <text x={x + f * 0.6} y={-v} fontSize={f * 0.75} dominantBaseline="middle" stroke="none">{v}</text>
        </g>
      ))}
    </g>
  );
}

/** A chain of dimensions along y = at, through the given edges (x positions); labels optional per segment. */
export function Chain({ edges, at, f, labels, offset = 0 }: { edges: number[]; at: number; f: number; labels?: (string | null)[]; offset?: number }) {
  const e = [...new Set(edges.map((v) => Math.round(v)))].sort((a, b) => a - b);
  return (
    <g stroke={RED} strokeWidth={f * 0.06} fill={RED} fontFamily="Arial, sans-serif">
      <line x1={e[0]} y1={at} x2={e[e.length - 1]} y2={at} />
      {e.map((v) => <line key={v} x1={v - f * 0.3} y1={at + f * 0.3} x2={v + f * 0.3} y2={at - f * 0.3} />)}
      {e.slice(1).map((v, i) => { const small = v - e[i] <= f * 1.3; return <text key={v} x={(v + e[i]) / 2} y={small ? at + f * 1.1 : at - f * 0.35} fontSize={small ? f * 0.55 : f * 0.75} textAnchor="middle" stroke="none">{labels?.[i] ?? `${v - e[i] + offset}`}</text>; })}
    </g>
  );
}

/**
 * An item drawn front-on (elevation) in the box x, y0 (underside) .. y0 + h, all in mm (drawing y = −height).
 * `ceiling` lets the hood draw its chimney to the ceiling.
 */
export function ItemFront({ type, finish, name, x, w, y0, h, f, ceiling }: { type?: string; finish?: string; name: string; x: number; w: number; y0: number; h: number; f: number; ceiling: number }): ReactNode {
  const top = -(y0 + h), bot = -y0, sw = f * 0.08;
  const body = finishFill(type, finish);
  const R = (rx: number, ry: number, rw: number, rh: number, fill: string, stroke = INK, k?: string) => <rect key={k} x={rx} y={ry} width={Math.max(0, rw)} height={Math.max(0, rh)} fill={fill} stroke={stroke} strokeWidth={sw} />;
  const handle = (hx: number, hy: number, hh: number, k: string) => <rect key={k} x={hx - f * 0.12} y={hy} width={f * 0.24} height={hh} fill={INK} />;
  const doorsRow = (n: number, yTop: number, yBot: number, handlesAt: "top" | "bottom") => {
    const dw = w / n, out: ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      out.push(R(x + i * dw, yTop, dw, yBot - yTop, body, INK, `d${i}`));
      const hx = n === 1 ? x + dw - f * 0.8 : i % 2 === 0 ? x + (i + 1) * dw - f * 0.8 : x + i * dw + f * 0.8;
      out.push(handle(hx, handlesAt === "top" ? yTop + f * 0.6 : yBot - f * 2.6, f * 2, `h${i}`));
    }
    return out;
  };
  switch (type) {
    case "cooker": return <g>{R(x, top, w, h, body)}{R(x, top, w, f * 0.6, "#1B1E22")}{R(x + w * 0.1, top + h * 0.3, w * 0.8, h * 0.45, "#2B3038")}{[0, 1, 2, 3].map((i) => <circle key={i} cx={x + w * (0.2 + i * 0.2)} cy={top + h * 0.15} r={f * 0.25} fill={INK} />)}</g>;
    case "washer": return <g>{R(x, top, w, h, body)}{R(x + w * 0.05, top + f * 0.3, w * 0.9, h * 0.1, "#E1E4E8")}<circle cx={x + w / 2} cy={top + h * 0.57} r={Math.min(w, h) * 0.3} fill="#9AA1A9" stroke={INK} strokeWidth={sw} /><circle cx={x + w / 2} cy={top + h * 0.57} r={Math.min(w, h) * 0.22} fill="#DCE9F5" stroke={INK} strokeWidth={sw} /></g>;
    case "fridge": return <g>{R(x, top, w, h, body)}<line x1={x} y1={bot - h * 0.62} x2={x + w} y2={bot - h * 0.62} stroke={INK} strokeWidth={sw} />{handle(x + w - f * 0.9, bot - h * 0.95, h * 0.2, "a")}{handle(x + w - f * 0.9, bot - h * 0.55, h * 0.3, "b")}</g>;
    case "microwave": return <g>{R(x, top, w, h, "#30353C")}{R(x + w * 0.08, top + h * 0.15, w * 0.6, h * 0.7, "#DCE9F5")}</g>;
    case "kitchen-sink": case "base-cabinet": return <g>{R(x, bot - f * 1, w, f * 1, "#3B4048")}{doorsRow(w >= 700 ? 2 : 1, top + f * 0.6, bot - f * 1, "top")}{R(x, top, w, f * 0.6, "#D9DCDF")}</g>;
    case "wall-cabinet": return <g>{doorsRow(Math.max(1, Math.round(w / 450)), top, bot, "bottom")}</g>;
    case "wardrobe": return <g>{doorsRow(Math.max(2, Math.round(w / 600)), top, bot, "top")}</g>;
    case "worktop": return R(x, top, w, h, body);
    case "fold-counter": return <g>{R(x, top, w, h, body)}{[x + w * 0.12, x + w * 0.88].map((lx, i) => <line key={i} x1={lx} y1={bot} x2={lx} y2={bot + f * 1.6} stroke={INK} strokeWidth={f * 0.25} />)}</g>;
    case "hood": return <g><polygon points={`${x},${bot} ${x + w},${bot} ${x + w * 0.66},${bot - h - 300} ${x + w * 0.34},${bot - h - 300}`} fill="#C9CED4" stroke={INK} strokeWidth={sw} />{R(x + w * 0.34, -ceiling, w * 0.32, ceiling - (y0 + h + 300), "#C9CED4")}</g>;
    default: return <g>{R(x, top, w, h, body)}{w > f * 3 && h > f * 1.4 ? <text x={x + w / 2} y={top + h / 2} fontSize={Math.min(f * 0.75, w / 8)} textAnchor="middle" dominantBaseline="middle" fill={NAVY} fontFamily="Arial, sans-serif">{name}</text> : null}</g>;
  }
}
