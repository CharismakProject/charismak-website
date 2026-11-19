"use client";

import { forwardRef, useEffect, useState } from "react";

import { planGeometry, type QuickHouse } from "@/lib/construction/quick-house";

type P = [number, number];
// The logo is embedded as a data URL so it survives when the SVG is turned into a PNG/PDF.
let logoData: Promise<string | null> | null = null;
const loadLogo = () => (logoData ??= fetch("/branding/charismak-logo-wide.jpg")
  .then((r) => r.blob())
  .then((blob) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob); }))
  .catch(() => null));

const fmt = (m: number) => (Math.round(m * 1000)).toLocaleString("en-NG");

/**
 * A plain architectural floor plan (walls hatched solid, door swings, windows, room names and
 * areas, overall dimensions, Charismak title block) drawn from the same plan as the 3D model.
 */
const PlanDrawing = forwardRef<SVGSVGElement, { house: QuickHouse; floor: number; className?: string }>(function PlanDrawing({ house, floor, className }, ref) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => { void loadLogo().then(setLogo); }, []);
  const g = planGeometry(house);
  const f = g.floors[Math.min(floor, g.floors.length - 1)];
  const pad = 1.6;
  const titleH = 1.9;
  const minX = -pad, minY = -pad;
  const width = g.W + pad * 2;
  const tbY = g.L + (floor === 0 ? 1.7 : 0.9);
  const height = tbY - minY + titleH;
  const stroke = "#111827";

  // A wall drawn as its solid pieces between openings, plus the openings' symbols.
  const wallParts = f.walls.map((wall, wi) => {
    const [ax, ay] = wall.a;
    const [bx, by] = wall.b;
    const ux = (bx - ax) / wall.length, uy = (by - ay) / wall.length; // along
    // Across the wall; on external walls it points into the building so doors swing inwards.
    const inward = (g.W / 2 - (ax + bx) / 2) * -uy + (g.L / 2 - (ay + by) / 2) * ux >= 0;
    const flip = wall.thickness > 0.2 && !inward ? -1 : 1;
    const nx = -uy * flip, ny = ux * flip;
    const t = wall.thickness / 2;
    const pt = (s: number, o: number): P => [ax + ux * s + nx * o, ay + uy * s + ny * o];
    const quad = (s0: number, s1: number) => [pt(s0, -t), pt(s1, -t), pt(s1, t), pt(s0, t)].map((p) => p.join(",")).join(" ");
    const cuts = [...wall.open].sort((p, q) => p.at - q.at).map((o) => [o.at - o.w / 2, o.at + o.w / 2, o] as const);
    const solids: [number, number][] = [];
    let s = -t * (wall.railing ? 0 : 1);
    for (const [c0, c1] of cuts) { if (c0 > s) solids.push([s, c0]); s = c1; }
    if (wall.length + t > s) solids.push([s, wall.length + (wall.railing ? 0 : t)]);
    return (
      <g key={wi}>
        {wall.railing ? (
          <line x1={ax} y1={ay} x2={bx} y2={by} stroke={stroke} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
        ) : (
          solids.map(([s0, s1], k) => <polygon key={k} points={quad(s0, s1)} fill={wall.thickness > 0.2 ? "#1f2937" : "#4b5563"} />)
        )}
        {cuts.map(([c0, c1, o], k) => {
          if (o.kind === "window") {
            return (
              <g key={`o${k}`}>
                <polygon points={quad(c0, c1)} fill="#fff" stroke={stroke} strokeWidth={0.02} />
                <line x1={pt(c0, 0)[0]} y1={pt(c0, 0)[1]} x2={pt(c1, 0)[0]} y2={pt(c1, 0)[1]} stroke="#2563eb" strokeWidth={0.03} />
              </g>
            );
          }
          // Door leaf swung 90° into the side away from the wall's "outside" normal, with its arc.
          const hinge = pt(c0, t);
          const tip = [hinge[0] + nx * o.w, hinge[1] + ny * o.w];
          const end = pt(c1, t);
          return (
            <g key={`o${k}`} stroke={stroke} fill="none" strokeWidth={0.025}>
              <line x1={hinge[0]} y1={hinge[1]} x2={tip[0]} y2={tip[1]} />
              <path d={`M ${tip[0]} ${tip[1]} A ${o.w} ${o.w} 0 0 ${ux * ny - uy * nx > 0 ? 0 : 1} ${end[0]} ${end[1]}`} strokeDasharray="0.06 0.05" />
            </g>
          );
        })}
      </g>
    );
  });

  const dim = (x1: number, y1: number, x2: number, y2: number, label: string, vertical = false) => (
    <g stroke={stroke} strokeWidth={0.02} fill={stroke}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <line x1={x1 - (vertical ? 0.12 : 0.08)} y1={y1 - (vertical ? 0.08 : 0.12)} x2={x1 + (vertical ? 0.12 : 0.08)} y2={y1 + (vertical ? 0.08 : 0.12)} />
      <line x1={x2 - (vertical ? 0.12 : 0.08)} y1={y2 - (vertical ? 0.08 : 0.12)} x2={x2 + (vertical ? 0.12 : 0.08)} y2={y2 + (vertical ? 0.08 : 0.12)} />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 0.12} fontSize={0.28} textAnchor="middle" stroke="none" transform={vertical ? `rotate(-90 ${(x1 + x2) / 2} ${(y1 + y2) / 2})` : undefined}>{label}</text>
    </g>
  );

  const ext = 0.115;
  const floorName = g.floors.length > 1 ? (floor === 0 ? "GROUND FLOOR PLAN" : "FIRST FLOOR PLAN") : "FLOOR PLAN";

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`${minX} ${minY} ${width} ${height}`} className={className} role="img" aria-label={`${g.plan.label} ${floorName.toLowerCase()}`} style={{ background: "#fff", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <rect x={minX} y={minY} width={width} height={height} fill="#fff" />
      {/* Porch, steps, terrace: light grey */}
      {floor === 0 ? g.slabs.map((s) => <polygon key={s.name} points={s.poly.map((p) => p.join(",")).join(" ")} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={0.02} />) : null}
      {f.rooms.map((room) => (
        <polygon key={room.name} points={room.poly.map((p) => p.join(",")).join(" ")} fill={/wc|bath|en-suite|toilet/i.test(room.name) ? "#eef6ff" : "#fafafa"} />
      ))}
      {g.stair ? (
        <g stroke={stroke} strokeWidth={0.015} fill="none">
          <rect x={g.stair.x - g.stair.width / 2} y={g.stair.y - g.stair.length} width={g.stair.width} height={g.stair.length} />
          {Array.from({ length: Math.round(g.stair.length / 0.28) }, (_, i) => <line key={i} x1={g.stair!.x - g.stair!.width / 2} x2={g.stair!.x + g.stair!.width / 2} y1={g.stair!.y - i * 0.28} y2={g.stair!.y - i * 0.28} />)}
          <text x={g.stair.x} y={g.stair.y - g.stair.length / 2} fontSize={0.22} textAnchor="middle" fill={stroke} stroke="none" transform={`rotate(-90 ${g.stair.x} ${g.stair.y - g.stair.length / 2})`}>{floor === 0 ? "UP ▲" : "DN ▼"}</text>
        </g>
      ) : null}
      {wallParts}
      {f.rooms.map((room) => {
        const cx = (room.box.minX + room.box.maxX) / 2;
        const cy = (room.box.minY + room.box.maxY) / 2;
        const small = room.box.maxX - room.box.minX < 2.2 || room.box.maxY - room.box.minY < 1.3;
        return (
          <g key={`t${room.name}`} textAnchor="middle" fill={stroke}>
            {small ? (
              <>
                {room.name.replace(/\s*\(.*\)/, "").toUpperCase().split(" ").map((word, i, words) => (
                  <text key={i} x={cx} y={cy + (i - (words.length - 1) / 2) * 0.17} fontSize={0.14} fontWeight={700}>{word}</text>
                ))}
                <text x={cx} y={cy + (room.name.split(" ").length / 2) * 0.17 + 0.1} fontSize={0.12}>{room.area.toFixed(1)} m²</text>
              </>
            ) : (
              <>
                <text x={cx} y={cy - 0.05} fontSize={0.26} fontWeight={700}>{room.name.toUpperCase()}</text>
                <text x={cx} y={cy + 0.3} fontSize={0.2}>{room.rect ? `${(room.box.maxX - room.box.minX).toFixed(2)} × ${(room.box.maxY - room.box.minY).toFixed(2)} m · ` : ""}{room.area.toFixed(1)} m²</text>
              </>
            )}
          </g>
        );
      })}
      {floor === 0 && g.slabs.filter((s) => !f.rooms.some((room) => room.name === s.name)).map((s) => {
        const xs = s.poly.map((p) => p[0]), ys = s.poly.map((p) => p[1]);
        return <text key={`s${s.name}`} x={(Math.min(...xs) + Math.max(...xs)) / 2} y={(Math.min(...ys) + Math.max(...ys)) / 2 + 0.08} fontSize={0.18} textAnchor="middle" fill="#374151">{s.name.toUpperCase()}</text>;
      })}
      {dim(-ext, -0.8, g.W + ext, -0.8, fmt(g.W + 2 * ext))}
      {dim(g.W + 0.9, -ext, g.W + 0.9, g.L + ext, fmt(g.L + 2 * ext), true)}
      {floor === 0 ? <text x={g.frontDoorX} y={g.L + 1.25} fontSize={0.22} textAnchor="middle" fill="#b45309">▲ ENTRANCE</text> : null}
      {/* Title block: Charismak logo on white, navy frame, maroon accent */}
      <g transform={`translate(${minX + 0.2} ${tbY})`}>
        <rect width={width - 0.4} height={titleH - 0.2} fill="#fff" stroke="#0D3352" strokeWidth={0.04} />
        <rect width={0.09} height={titleH - 0.2} fill="#6A1400" />
        {logo ? <image href={logo} x={0.3} y={0.15} height={1.4} width={4.17} preserveAspectRatio="xMinYMid meet" /> : <text x={0.3} y={0.9} fontSize={0.36} fontWeight={700} fill="#0D3352">CHARISMAK PROJECT NIGERIA LIMITED</text>}
        <line x1={4.75} y1={0.2} x2={4.75} y2={titleH - 0.4} stroke="#d6dce5" strokeWidth={0.03} />
        <text x={5.0} y={0.6} fontSize={0.3} fontWeight={700} fill="#0D3352">{g.plan.label.toUpperCase()} · {floorName}</text>
        <text x={5.0} y={1.0} fontSize={0.17} fill="#3a4653">{fmt(g.W + 2 * ext)} × {fmt(g.L + 2 * ext)} mm overall · not to scale · dimensions in mm</text>
        <text x={5.0} y={1.36} fontSize={0.15} fill="#6A1400">Indicative design — verify on site · charismakproject.com</text>
      </g>
    </svg>
  );
});

export default PlanDrawing;
