import assert from "node:assert/strict";

import { measureScene, priceDesign } from "../lib/construction/design-takeoff";
import { getLocation } from "../lib/rates/locations";

// A 10 m × 8 m single room on the ground floor: four 0.2 m walls, 2.5 m high,
// one door (0.9 × 2.1) and one window (1.2 × 1.2) on the front wall, slab, ceiling and a gable roof.
const nodes: Record<string, { id: string; type: string; [k: string]: unknown }> = {
  level_0: { id: "level_0", type: "level", level: 0, parentId: null },
  wall_a: { id: "wall_a", type: "wall", parentId: "level_0", start: [0, 0], end: [10, 0], thickness: 0.2, height: 2.5 },
  wall_b: { id: "wall_b", type: "wall", parentId: "level_0", start: [10, 0], end: [10, 8], thickness: 0.2, height: 2.5 },
  wall_c: { id: "wall_c", type: "wall", parentId: "level_0", start: [10, 8], end: [0, 8], thickness: 0.2, height: 2.5 },
  wall_d: { id: "wall_d", type: "wall", parentId: "level_0", start: [0, 8], end: [0, 0], thickness: 0.2, height: 2.5 },
  wall_e: { id: "wall_e", type: "wall", parentId: "level_0", start: [5, 0], end: [5, 8], thickness: 0.15, height: 2.5 },
  door_1: { id: "door_1", type: "door", parentId: "wall_a", wallId: "wall_a", width: 0.9, height: 2.1 },
  window_1: { id: "window_1", type: "window", parentId: "wall_a", wallId: "wall_a", width: 1.2, height: 1.2 },
  slab_1: { id: "slab_1", type: "slab", parentId: "level_0", polygon: [[0, 0], [10, 0], [10, 8], [0, 8]], holes: [] },
  ceiling_1: { id: "ceiling_1", type: "ceiling", parentId: "level_0", polygon: [[0, 0], [10, 0], [10, 8], [0, 8]] },
  roof_seg: { id: "roof_seg", type: "roof-segment", parentId: "level_0", width: 10, depth: 8, overhang: 0.5, pitch: 30 },
};

const m = measureScene(nodes);
assert.equal(m.thickWall, 36 * 2.5 - (0.9 * 2.1 + 1.2 * 1.2)); // 90 − 3.33 = 86.67
assert.equal(m.thinWall, 8 * 2.5); // 20
assert.equal(m.groundWallLength, 44);
assert.equal(m.groundSlab, 80);
assert.equal(m.ceilings, 80);
assert.equal(m.roofSlope, Math.round(((11 * 9) / Math.cos(Math.PI / 6)) * 100) / 100); // 114.32
assert.equal(m.doors, 1);
assert.equal(m.windows, 1);

const priced = priceDesign(nodes, getLocation("fct"));
const sum = priced.lines.reduce((t, l) => t + l.amount, 0);
assert.ok(Math.abs(sum - priced.total) < 0.01, "total adds up");
for (const line of priced.lines) assert.ok(line.rate > 0 && line.quantity > 0, `${line.slug} priced`);
assert.ok(priced.lines.some((l) => l.slug === "055mm-aluminium-roof-covering"));
assert.equal(priceDesign({}, getLocation("fct")).lines.length, 0, "empty design prices nothing");
assert.ok(priceDesign({}, getLocation("fct")).warnings.length > 0, "empty design explains why");

console.log(`Design takeoff verification passed: ${priced.lines.length} priced lines, Abuja ₦${Math.round(priced.total).toLocaleString()} for the 80 m² test room.`);
