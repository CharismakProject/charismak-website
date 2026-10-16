import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { RATE_BANK_ITEMS } from "../lib/rates/defaults.ts";
import { buildAccurateRateScene } from "../components/rates/rate-3d/rate-specific-scenes.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rates = readFileSync(path.join(root, "lib/rates/defaults.ts"), "utf8");
const scenes = readFileSync(path.join(root, "components/rates/rate-3d/rate-specific-scenes.ts"), "utf8");

const rateSlugs = [...rates.matchAll(/"slug": "([^"]+)"/g)].map((match) => match[1]);
const presetBlock = scenes.split("function rng(")[0];
const presetSlugs = [...presetBlock.matchAll(/^\s*"([^"]+)": \{ kind: "([^"]+)", process: \["([^"]+)", "([^"]+)", "([^"]+)"\], result: "([^"]+)"/gm)];
const mapped = new Map(presetSlugs.map((match) => [match[1], { kind: match[2], steps: match.slice(3, 6), result: match[6] }]));
const switchBody = scenes.match(/switch \(kind\) \{([\s\S]*?)\n    \}\n\n    const labourTool/)?.[1] ?? "";
const handledKinds = new Set([...switchBody.matchAll(/case "([^"]+)":/g)].map((match) => match[1]));

assert.equal(rateSlugs.length, 67, "Expected 67 Rate Bank entries.");
assert.equal(new Set(rateSlugs).size, rateSlugs.length, "Rate Bank slugs must be unique.");
assert.equal(mapped.size, presetSlugs.length, "3D scene preset slugs must be unique.");
assert.equal(mapped.size, rateSlugs.length, "Every Rate Bank entry must have an explicit 3D preset.");

const missing = rateSlugs.filter((slug) => !mapped.has(slug));
const unexpected = [...mapped.keys()].filter((slug) => !rateSlugs.includes(slug));
assert.deepEqual(missing, [], "Rate items missing 3D scenes.");
assert.deepEqual(unexpected, [], "3D presets must not point at unknown rates.");

for (const [slug, preset] of mapped) {
  assert.ok(preset.kind, slug + ": missing scene operation.");
  assert.ok(preset.steps.every((step) => step.trim().length > 12), slug + ": every process step must be explanatory.");
  assert.ok(preset.result.trim().length > 25, slug + ": missing meaningful end-result description.");
  assert.ok(handledKinds.has(preset.kind), slug + ": scene kind has no geometry handler: " + preset.kind);
}

assert.ok(scenes.includes("this.addResiduals()"), "Unmatched rate lines must be surfaced, never hidden.");
assert.ok(scenes.includes("this.addLabourPeople(labourTool)"), "Rates with labour lines must show human labour.");

// Also instantiate the real Three.js scene for every rate under Node (procedural textures
// safely fall back without a browser canvas). This catches bad geometry/setup, not just names.
let totalParts = 0;
let totalMeshes = 0;
const builtScenes = new Map();
for (const item of RATE_BANK_ITEMS) {
  const scene = buildAccurateRateScene(item);
  builtScenes.set(item.slug, scene);
  assert.ok(scene.parts.length > 0, item.slug + ": scene has no interactive parts.");
  assert.ok(scene.context.length > 0, item.slug + ": no construction context/ground.");
  assert.equal(scene.process?.length, 3, item.slug + ": construction method must have three steps.");
  assert.ok(scene.endResult && scene.endResult.length > 25, item.slug + ": no end-result explanation.");
  const lineIdsInScene = new Set(scene.parts.flatMap((part) => Array.isArray(part.lineId) ? part.lineId : [part.lineId]));
  const missingLines = item.lines.map((line) => line.id).filter((lineId) => !lineIdsInScene.has(lineId));
  assert.deepEqual(missingLines, [], item.slug + ": cost lines not represented by an interactive model part.");
  const invalidLineIds = [...lineIdsInScene].filter((lineId) => lineId !== "__context" && !item.lines.some((line) => line.id === lineId));
  assert.deepEqual(invalidLineIds, [], item.slug + ": scene references cost lines that do not exist on the rate.");
  for (const labourLine of item.lines.filter((line) => line.category === "labour")) {
    const hasHumanWorker = scene.parts.some((part) => {
      const ids = Array.isArray(part.lineId) ? part.lineId : [part.lineId];
      return ids.includes(labourLine.id) && part.object.userData?.rateSceneRole === "worker";
    });
    assert.ok(hasHumanWorker, item.slug + ": labour line '" + labourLine.label + "' is missing a linked human worker.");
  }
  [...scene.parts.map((part) => part.object), ...scene.context].forEach((rootObject) => {
    rootObject.traverse((object) => {
      if (!("isMesh" in object) || !object.isMesh) return;
      const mesh = object;
      totalMeshes += 1;
      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox;
      assert.ok(bounds, item.slug + ": mesh has no bounding box.");
      for (const value of [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z]) {
        assert.ok(Number.isFinite(value), item.slug + ": mesh contains non-finite geometry bounds.");
      }
      const positions = mesh.geometry.attributes.position;
      for (let index = 0; index < positions.count; index += Math.max(1, Math.floor(positions.count / 40))) {
        assert.ok(Number.isFinite(positions.getX(index)) && Number.isFinite(positions.getY(index)) && Number.isFinite(positions.getZ(index)), item.slug + ": mesh position has non-finite values.");
      }
    });
  });
  totalParts += scene.parts.length;
}

const criticalGeometryRoles = {
  "mechanical-excavation-wall-trenches": "mechanical-excavation-trench",
  "manual-trench-excavation": "manual-excavation-trench",
  "backfill-excavated-material": "compacted-backfill-lift",
  "imported-laterite-fill": "laterite-fill-layer",
  "hardcore-fill-compacted": "hardcore-base-layer",
  "sharp-sand-blinding": "sand-blinding-bed",
  "c15-blinding-1-3-6": "thin-ground-blinding",
};
for (const [slug, role] of Object.entries(criticalGeometryRoles)) {
  const scene = builtScenes.get(slug);
  assert.ok(scene, "Critical 3D scene is missing: " + slug);
  assert.ok(scene.parts.some((part) => part.object.userData?.rateSceneRole === role), slug + ": wrong/missing key geometry role " + role + ". This likely indicates a construction-method misrepresentation.");
}
console.log("Rate-specific Three.js verification passed: " + mapped.size + " rate items, " + handledKinds.size + " handlers, " + totalParts + " interactive parts and " + totalMeshes + " instantiated meshes.");
