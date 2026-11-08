import assert from "node:assert/strict";

import { SPEC_DEFAULTS } from "../lib/projects/guided-estimate";
import { createInitialEstimateInput } from "../lib/projects/public-estimate-defaults";
import { calculateEstimateV2, type EstimateInput } from "../lib/projects/public-estimate-engine-v2";

const base = { ...createInitialEstimateInput(), category: "new-building", buildingUse: "residential", location: "Abuja", totalFloorAreaM2: 150, floorsAboveGround: 0, bedrooms: 3, bathrooms: 3 } as EstimateInput;
const run = (patch: Partial<EstimateInput>) => {
  const result = calculateEstimateV2({ ...base, ...patch } as EstimateInput);
  return Object.fromEntries(result.sections.map((section) => [section.id, section]));
};

// The default detailed selections must match the defaults the engine compares against.
const defaults = createInitialEstimateInput() as unknown as Record<string, unknown>;
for (const [key, value] of Object.entries(SPEC_DEFAULTS)) assert.equal(defaults[key], value, `SPEC_DEFAULTS.${key} out of sync`);

const standard = run({ finishLevel: "standard" });
const premium = run({ finishLevel: "premium" });
const economy = run({ finishLevel: "economy" });

// Finish level must not change foundations or the structural frame.
for (const id of ["substructure", "frame"]) {
  assert.equal(premium[id].low, standard[id].low, `premium changed ${id}`);
  assert.equal(economy[id].high, standard[id].high, `economy changed ${id}`);
}
// It must still raise finish-driven elements in full when nothing is customised (quick mode).
for (const id of ["finishes", "openings", "joinery"]) {
  assert.ok(Math.abs(premium[id].low / standard[id].low - 1.36) < 1e-9, `${id} should follow premium factor 1.36`);
}
// Partial effect on walls, roof and services.
assert.ok(premium.walls.low > standard.walls.low && premium.walls.low < standard.walls.low * 1.36);
assert.ok(premium.mep.low > standard.mep.low && premium.mep.low < standard.mep.low * 1.36);

// No double count: once marble floors are chosen, the finishes section is priced by the
// selection and the premium level is not applied on top.
const marbleStandard = run({ finishLevel: "standard", floorFinish: "marble" });
const marblePremium = run({ finishLevel: "premium", floorFinish: "marble" });
assert.equal(marblePremium.finishes.low, marbleStandard.finishes.low, "premium applied on top of explicit marble selection");
assert.ok(marbleStandard.finishes.low > standard.finishes.low, "marble should still cost more than porcelain");

// Standard specification totals are unchanged by this rule (factor 1).
const total = (sections: Record<string, { low: number }>) => Object.values(sections).reduce((sum, s) => sum + s.low, 0);
assert.ok(total(premium) < total(standard) * 1.36, "premium total no longer scales the whole building");

console.log("Estimate finish-level verification passed.");
