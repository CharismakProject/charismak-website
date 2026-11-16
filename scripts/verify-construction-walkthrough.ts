import assert from "node:assert/strict";
import { BUILD_STAGES, csvCell, priceStages } from "../lib/construction/walkthrough";
import { calculateRate } from "../lib/rates/defaults";

const base = priceStages("fct");
const all = base.flatMap((stage) => stage.items);
assert.equal(BUILD_STAGES.length, 14);
assert.equal(new Set(all.map((line) => line.id)).size, all.length, "IDs must not share editing state");
for (const line of all) {
  if (line.rateSlug) assert.ok(line.reference, `Missing bank reference: ${line.rateSlug}`);
  if (line.reference) assert.equal(line.reference.unit, line.unit, `Unit mismatch: ${line.id}`);
}
const windowSupply = all.find((line) => line.id === "window-supply")!;
const windowInstall = all.find((line) => line.id === "window-fix")!;
assert.equal(windowSupply.rate, null, "Installation rates must not silently price window supply");
assert.equal(windowSupply.amount, 0);
assert.ok(windowInstall.rate! > 0);
assert.equal(windowInstall.reference!.lines.filter((line) => line.category === "material").length, 0);
const resolved = priceStages("fct", { "fct:window-supply": { rate: 200000, quantity: 10 } });
assert.equal(resolved[11].unpriced, base[11].unpriced - 1);
assert.equal(resolved[11].total - base[11].total, 2000000);
const lagos = priceStages("lagos", { "fct:window-supply": { rate: 200000, quantity: 10 } });
assert.equal(lagos[11].items.find((item) => item.id === "window-supply")!.rate, null, "Manual rates stay with their location");
assert.notEqual(lagos[2].total, base[2].total, "Location reprices the bank build-ups");
const waived = priceStages("fct", { "fct:window-supply": { rate: 0 } });
assert.equal(waived[11].items.find((item) => item.id === "window-supply")!.rate, 0, "Explicit zero rates remain priced");
assert.equal(waived[11].unpriced, base[11].unpriced - 1);
const concrete = all.find((line) => line.id === "slab")!;
assert.equal(concrete.rate, Math.round(calculateRate(concrete.reference!.lines, concrete.reference!.allowances).total * 100) / 100, "Do not add bank allowances twice");
assert.equal(csvCell('=HYPERLINK("test")'), '"\'=HYPERLINK(""test"")"');
assert.equal(csvCell("Quantity, rate"), '"Quantity, rate"');
console.log(`Construction walkthrough verified: ${base.length} stages, ${all.length} cost items, ${base.reduce((sum, stage) => sum + stage.unpriced, 0)} explicitly unpriced items.`);
