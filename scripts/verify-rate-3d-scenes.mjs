import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
console.log("Rate-specific 3D verification passed for " + mapped.size + " unique rate scenes across " + handledKinds.size + " construction scene handlers.");
