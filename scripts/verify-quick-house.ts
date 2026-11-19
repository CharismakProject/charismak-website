import assert from "node:assert/strict";

import { AnyNode } from "@pascal-app/core";

import { priceDesign } from "../lib/construction/design-takeoff";
import { generateHouseScene, normaliseHouse, QUICK_PRESETS, randomHouse } from "../lib/construction/quick-house";
import { getLocation } from "../lib/rates/locations";

for (const preset of QUICK_PRESETS) {
  const scene = generateHouseScene(preset.house);
  for (const node of Object.values(scene.nodes)) {
    const result = AnyNode.safeParse(node);
    assert.ok(result.success, `${preset.id}: ${node.id} fails Pascal's schema: ${JSON.stringify(result.success ? "" : result.error.issues).slice(0, 300)}`);
    for (const child of node.children ?? []) assert.equal(scene.nodes[child]?.parentId, node.id, `${node.id} → ${child} link`);
  }
  const t = priceDesign(scene.nodes as never, getLocation("fct"));
  const h = scene.house;
  assert.ok(Math.abs(t.floorArea - (h.width - 0.23) * (h.length - 0.23) * h.floors) < 0.05, `${preset.id}: floor area ${t.floorArea}`);
  assert.equal(t.counts.walls, (4 + h.rooms - 1) * h.floors, `${preset.id}: wall count`);
  const kinds = Object.values(scene.nodes).reduce<Record<string, number>>((acc, n) => ({ ...acc, [n.type]: (acc[n.type] ?? 0) + 1 }), {});
  assert.ok((kinds.item ?? 0) >= 6, `${preset.id}: furnished and landscaped (items: ${kinds.item ?? 0})`);
  assert.ok((kinds.fence ?? 0) >= 1, `${preset.id}: boundary fence`);
  assert.ok(t.counts.roofs === 1 && t.total > 0, `${preset.id}: priced with a roof`);
  console.log(`  ${preset.label}: ${Object.keys(scene.nodes).length} nodes (${kinds.item} items, ${kinds.fence} fences), ${t.floorArea} m², ₦${Math.round(t.total).toLocaleString()} (₦${Math.round(t.total / t.floorArea).toLocaleString()}/m²)`);
}
const n = normaliseHouse({ width: 99, length: 1, floors: 9, rooms: 0, roofType: "gable", roofPitch: 90, walls: "nonsense" });
assert.deepEqual([n.width, n.length, n.floors, n.rooms, n.roofPitch, n.walls], [20, 5, 3, 1, 45, "preset-cream"]);
for (let i = 0; i < 5; i += 1) {
  const r = generateHouseScene(randomHouse());
  for (const node of Object.values(r.nodes)) assert.ok(AnyNode.safeParse(node).success, `random house: ${node.id} invalid`);
}
console.log("Quick house verification passed.");
