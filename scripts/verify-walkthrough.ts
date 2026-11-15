import assert from "node:assert/strict";

import { getRateBankItem } from "../lib/rates/defaults";
import { RATE_LOCATIONS, getLocation } from "../lib/rates/locations";
import { MODEL, WALKTHROUGH_STEPS, priceWalkthrough } from "../lib/rates/walkthrough";

for (const step of WALKTHROUGH_STEPS) {
  assert.ok(getRateBankItem(step.primary), `${step.id}: primary rate ${step.primary} missing`);
  for (const item of step.items) {
    assert.ok(getRateBankItem(item.slug), `${step.id}: rate ${item.slug} missing from the Rate Bank`);
    assert.ok(item.quantity > 0 && Number.isFinite(item.quantity), `${step.id}: bad quantity for ${item.slug}`);
  }
}

// Spot-check measured quantities against hand calculations.
const qty = (stepId: string, slug: string) => WALKTHROUGH_STEPS.find((s) => s.id === stepId)!.items.find((i) => i.slug === slug)!.quantity;
assert.equal(MODEL.wallRun, 44);
assert.equal(qty("excavation", "mechanical-excavation-wall-trenches"), 26.7); // 44 × 0.675 × 0.9 = 26.73
assert.equal(qty("footing", "c20-nominal-concrete-1-2-4"), 6.68); // 44 × 0.675 × 0.225 = 6.6825
assert.equal(qty("substructure-walls", "backfill-excavated-material"), 12.2); // 26.73 − 8.17 − 6.33

const base = priceWalkthrough(getLocation("fct"));
assert.equal(base.length, WALKTHROUGH_STEPS.length);
for (const step of base) {
  const sum = step.items.reduce((total, item) => total + item.rate * item.quantity, 0);
  assert.ok(Math.abs(sum - step.subtotal) < 0.01, `${step.step.id}: subtotal mismatch`);
  assert.ok(step.primaryBuildUp && step.primaryBuildUp.calc.total > 0, `${step.step.id}: no build-up`);
}
const total = base.at(-1)!.cumulative;
assert.ok(Math.abs(total - base.reduce((t, s) => t + s.subtotal, 0)) < 0.01, "cumulative total mismatch");
for (const loc of RATE_LOCATIONS) assert.ok(priceWalkthrough(loc).at(-1)!.cumulative > 0, `${loc.id}: no total`);

console.log(`Walkthrough verification passed: ${WALKTHROUGH_STEPS.length} stages, Abuja shell total ₦${Math.round(total).toLocaleString()} (₦${Math.round(total / MODEL.grossFloorArea).toLocaleString()}/m²), ${RATE_LOCATIONS.length} states priced.`);
