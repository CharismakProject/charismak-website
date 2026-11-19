import assert from "node:assert/strict";
import { detectWalls, type DxfLine } from "../lib/construction/dxf-walls";

// A 10 × 8 m room drawn in millimetres as double lines (230 mm walls) with a 150 mm partition.
const rect = (x0: number, y0: number, x1: number, y1: number): DxfLine => ({ layer: "A-WALL", closed: true, points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });
const lines: DxfLine[] = [
  rect(0, 0, 10000, 8000), // outer face
  rect(230, 230, 9770, 7770), // inner face
  { layer: "A-WALL", closed: false, points: [[5000, 230], [5000, 7770]] },
  { layer: "A-WALL", closed: false, points: [[5150, 230], [5150, 7770]] },
  { layer: "A-FURN", closed: false, points: [[1000, 1000], [3000, 1000]] },
];
const r = detectWalls(lines, 4, new Set(["A-WALL"]));
assert.ok(r.paired, "double-line walls are paired");
assert.equal(r.walls.length, 5, `walls found: ${r.walls.length}`);
assert.equal(r.walls.filter((w) => w.thickness === 0.23).length, 4, "four 230 mm walls");
assert.equal(r.walls.filter((w) => w.thickness === 0.15).length, 1, "one 150 mm partition");
assert.ok(Math.abs(r.width - 9.77) < 0.01 && Math.abs(r.length - 7.77) < 0.01, `plan size ${r.width} × ${r.length}`);
// Corners meet: every 230 mm wall end touches another wall.
const ends = r.walls.filter((w) => w.thickness === 0.23).flatMap((w) => [w.a, w.b]);
for (const e of ends) assert.ok(ends.filter((f) => Math.hypot(f[0] - e[0], f[1] - e[1]) < 0.01).length >= 2, `corner at ${e} joins`);
// Single-line walls (centrelines) and unknown units fall back sensibly.
const single = detectWalls([rect(0, 0, 12000, 9000)], 0);
assert.ok(!single.paired && single.walls.length === 4 && Math.abs(single.width - 12) < 0.01, "single-line fallback in mm");
console.log("DXF wall detection verification passed.");

// The detected walls build a valid Pascal scene; the trace scene holds a scaled guide image.
import("@pascal-app/core").then(async ({ AnyNode }) => {
  const { buildImportedScene, buildTraceScene } = await import("../lib/construction/quick-house");
  const { priceDesign } = await import("../lib/construction/design-takeoff");
  const { getLocation } = await import("../lib/rates/locations");
  const scene = buildImportedScene(r);
  for (const node of Object.values(scene.nodes)) assert.ok(AnyNode.safeParse(node).success, `imported: ${node.id} invalid ${JSON.stringify(AnyNode.safeParse(node).error?.issues ?? "").slice(0, 200)}`);
  const t = priceDesign(scene.nodes as never, getLocation("fct"));
  assert.equal(t.counts.walls, 5);
  assert.ok(t.total > 0 && t.counts.roofs === 1, "imported plan is priced");
  const trace = buildTraceScene({ guideUrl: "data:image/png;base64,iVBORw0KGgo=", widthMeters: 14, name: "Plan" });
  for (const node of Object.values(trace.nodes)) assert.ok(AnyNode.safeParse(node).success, `trace: ${node.id} invalid ${JSON.stringify(AnyNode.safeParse(node).error?.issues ?? "").slice(0, 200)}`);
  console.log(`Imported plan scene verification passed (₦${Math.round(t.total).toLocaleString()} for the 10 × 8 m test).`);
});
