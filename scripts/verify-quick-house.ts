import assert from "node:assert/strict";

import { AnyNode } from "@pascal-app/core";

import { priceDesign } from "../lib/construction/design-takeoff";
import { generateHouseScene, normaliseHouse, QUICK_PRESETS, randomHouse, sizeLimits } from "../lib/construction/quick-house";
import { getLocation } from "../lib/rates/locations";

const area = (poly: [number, number][]) => Math.abs(poly.reduce((s, [x1, y1], i) => { const [x2, y2] = poly[(i + 1) % poly.length]; return s + x1 * y2 - x2 * y1; }, 0)) / 2;
const inside = ([x, z]: number[], poly: [number, number][]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]; const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
};

function check(label: string, scene: ReturnType<typeof generateHouseScene>, strict: boolean) {
  for (const node of Object.values(scene.nodes)) {
    const result = AnyNode.safeParse(node);
    assert.ok(result.success, `${label}: ${node.id} (${node.type}) fails Pascal's schema: ${JSON.stringify(result.success ? "" : result.error.issues).slice(0, 300)}`);
    for (const child of node.children ?? []) assert.equal(scene.nodes[child]?.parentId, node.id, `${label}: ${node.id} → ${child} link`);
  }
  const all = Object.values(scene.nodes);
  const zones = all.filter((n) => n.type === "zone");
  const items = all.filter((n) => n.type === "item");
  const assetOf = (n: (typeof items)[number]) => (n.asset as { id: string }).id;
  // Every room in the plan is in the scene, and every toilet room has its WC pan.
  for (const floor of scene.plan.floors) {
    for (const room of floor.rooms) {
      const zone = zones.find((z) => z.name === room.name);
      assert.ok(zone, `${label}: room "${room.name}" missing`);
      const roomItems = () => items.filter((n) => inside([(n.position as number[])[0], (n.position as number[])[2]], zone.polygon as [number, number][])).map(assetOf);
      if (strict && /bedroom/i.test(room.name)) assert.ok(roomItems().some((id) => id.includes("bed")), `${label}: "${room.name}" has no bed (${roomItems().join(", ")})`);
      if (strict && room.name === "Kitchen") assert.ok(roomItems().some((id) => id.startsWith("kitchen")), `${label}: kitchen has no units (${roomItems().join(", ")})`);
      if (room.wet) {
        const poly = zone.polygon as [number, number][];
        const fitted = items.filter((n) => inside([(n.position as number[])[0], (n.position as number[])[2]], poly)).map(assetOf);
        assert.ok(fitted.includes("toilet"), `${label}: "${room.name}" has no toilet (${fitted.join(", ")})`);
      }
    }
  }
  const t = priceDesign(scene.nodes as never, getLocation("fct"));
  const slabs = all.filter((n) => n.type === "slab" && !(n.metadata as { external?: boolean }).external);
  const expected = slabs.reduce((s, n) => s + area(n.polygon as [number, number][]), 0);
  assert.ok(Math.abs(t.floorArea - expected) < 0.05, `${label}: floor area ${t.floorArea} vs ${expected}`);
  assert.ok(t.counts.roofs === 1 && t.total > 0, `${label}: priced with a roof`);
  if (strict) {
    assert.ok(all.some((n) => n.type === "fence"), `${label}: boundary fence`);
    assert.ok(items.some((n) => assetOf(n) === "tesla"), `${label}: car on the driveway`);
    for (const name of ["Driveway", "Septic tank", "Soakaway"]) assert.ok(zones.some((z) => z.name === name), `${label}: ${name}`);
    for (const kind of ["bed", "sofa"]) assert.ok(items.some((n) => assetOf(n).includes(kind)), `${label}: has a ${kind}`);
  }
  return { t, items: items.length, zones: zones.length, nodes: all.length };
}

for (const preset of QUICK_PRESETS) {
  const scene = generateHouseScene(preset.house);
  const r = check(preset.id, scene, preset.id !== "shop");
  if (preset.id === "duplex") assert.ok(Object.values(scene.nodes).some((n) => n.type === "stair"), "duplex: staircase");
  console.log(`  ${preset.label}: ${r.nodes} nodes, ${r.zones} spaces, ${r.items} items, ${r.t.floorArea} m², ₦${Math.round(r.t.total).toLocaleString()} (₦${Math.round(r.t.total / r.t.floorArea).toLocaleString()}/m²)`);
}

// The 2-bed follows the drawing: 11.0 × 6.0 m overall, 10 named spaces inside.
const twoBed = generateHouseScene(QUICK_PRESETS.find((p) => p.id === "2bed")!.house);
assert.deepEqual([twoBed.house.width, twoBed.house.length], [11, 6]);
const n = normaliseHouse({ plan: "nonsense" as never, width: 99, length: 1, roofPitch: 90, walls: "nonsense" });
const lim = sizeLimits("2bed");
assert.deepEqual([n.plan, n.width, n.length, n.roofPitch, n.walls], ["2bed", lim.width[1], lim.length[0], 45, "preset-white"]);
for (let i = 0; i < 6; i += 1) {
  const house = randomHouse();
  check(`random ${house.plan} ${house.width}×${house.length}`, generateHouseScene(house), false);
}
console.log("Quick house verification passed.");
