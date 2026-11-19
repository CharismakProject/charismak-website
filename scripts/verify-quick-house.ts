import assert from "node:assert/strict";

import { AnyNode } from "@pascal-app/core";

import { priceDesign } from "../lib/construction/design-takeoff";
import { generateHouseScene, normaliseHouse, QUICK_PRESETS } from "../lib/construction/quick-house";
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
  assert.ok(Math.abs(t.floorArea - (h.width - 0.23) * (h.length - 0.23) * h.floors) < 0.05, `${preset.id}: floor area`);
  assert.equal(t.counts.walls, (4 + h.rooms - 1) * h.floors, `${preset.id}: wall count`);
  assert.ok(t.counts.roofs === 1 && t.total > 0, `${preset.id}: priced with a roof`);
  console.log(`  ${preset.label}: ${Object.keys(scene.nodes).length} nodes, ${t.floorArea} m², ₦${Math.round(t.total).toLocaleString()} (₦${Math.round(t.total / t.floorArea).toLocaleString()}/m²)`);
}
assert.deepEqual(normaliseHouse({ width: 99, length: 1, floors: 9, rooms: 0, roofType: "gable", roofPitch: 90 }), { width: 20, length: 5, floors: 3, rooms: 1, roofType: "gable", roofPitch: 45 });
console.log("Quick house verification passed.");
