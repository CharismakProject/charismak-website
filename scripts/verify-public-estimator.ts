import { calculateEstimateV2 as estimate } from "../lib/projects/public-estimate-engine-v2";
import { createInitialEstimateInput as initial } from "../lib/projects/public-estimate-defaults";
import assert from "node:assert/strict";
import { calculateEstimateV2, type EstimateInput } from "../lib/projects/public-estimate-engine-v2";
import { createInitialEstimateInput } from "../lib/projects/public-estimate-defaults";
import { buildCashFlow, buildComparisons, checkBudget, completenessScore } from "../lib/projects/public-estimate-decisions";

const clone = (patch: Partial<EstimateInput>): EstimateInput => ({ ...createInitialEstimateInput(), ...patch });
const approxEqual = (left: number, right: number, tolerance = 0.000001) => Math.abs(left - right) <= tolerance;

// 1. Small bungalow must not be treated like a generic heavy RC-frame building.
const bungalow = clone({
  category: "new-building",
  location: "Abuja",
  buildingUse: "residential",
  totalFloorAreaM2: 66,
  landAreaM2: 75,
  floorsAboveGround: 0,
  bedrooms: 2,
  bathrooms: 3,
  livingRooms: 1,
  kitchens: 1,
  finishLevel: "economy",
  frameType: "recommend",
});
const bungalowResult = calculateEstimateV2(bungalow);
const bungalowFrame = bungalowResult.sections.find((item) => item.id === "frame" || item.label.toLowerCase().includes("structural"));
assert.ok(bungalowFrame, "Bungalow result must contain a structural/frame section.");
assert.ok(bungalowFrame!.high < 3_500_000, `Small bungalow structural allowance is too high: ${bungalowFrame!.high}`);

// 2. Steel area + geometry must infer tonnes rather than price square metres directly.
const steel = clone({
  category: "structural-steel",
  location: "Abuja",
  workAreaM2: 150,
  steelStructureType: "warehouse",
  steelSpanM: 12,
  steelHeightM: 6,
  steelBays: 5,
  steelTonnes: 0,
  steelErection: true,
});
const steelResult = calculateEstimateV2(steel);
assert.equal(steelResult.basisUnit, "t", "Steel result basis must be tonnes.");
assert.ok(steelResult.basisQuantity > 4 && steelResult.basisQuantity < 10, `150 m² warehouse inferred tonnage looks unreasonable: ${steelResult.basisQuantity}`);

// 3. Adding cooling equipment must increase a measured MEP estimate.
const mepBase = clone({ category: "mep-services", location: "Abuja", workAreaM2: 150, electricalPoints: 30, lightingPoints: 24, mepBathrooms: 2, mepKitchens: 1, acSpec: "split", acUnits: 2 });
const mepMoreCooling = { ...mepBase, acUnits: 6 };
assert.ok(calculateEstimateV2(mepMoreCooling).midpoint > calculateEstimateV2(mepBase).midpoint, "More AC units must increase MEP cost.");

// 4. More renovation replacement scope must increase cost.
const reno20 = clone({ category: "renovation", location: "Abuja", workAreaM2: 140, renovationIntensity: "moderate", floorReplacementPercent: 20, paintingPercent: 50 });
const reno80 = { ...reno20, floorReplacementPercent: 80 };
assert.ok(calculateEstimateV2(reno80).midpoint > calculateEstimateV2(reno20).midpoint, "Higher floor-replacement percentage must increase renovation cost.");

// 5. Premium finish material choice must increase finish cost.
const porcelain = clone({ category: "finishes", location: "Abuja", workAreaM2: 100, floorFinish: "porcelain", wallFinish: "paint", ceilingFinish: "gypsum-pop" });
const marble = { ...porcelain, floorFinish: "marble" as const };
assert.ok(calculateEstimateV2(marble).midpoint > calculateEstimateV2(porcelain).midpoint, "Marble finish must price above porcelain for equal area/spec level.");

// 6. Joinery must scale with measured linear metres.
const wardrobe5 = clone({ category: "furniture", location: "Abuja", wardrobeLengthM: 5, furnitureLevel: "standard" });
const wardrobe10 = { ...wardrobe5, wardrobeLengthM: 10 };
assert.ok(calculateEstimateV2(wardrobe10).midpoint > calculateEstimateV2(wardrobe5).midpoint, "More wardrobe length must increase furniture/joinery cost.");

// 7. External works must scale with measured fence length.
const fence40 = clone({ category: "external-works", location: "Abuja", fenceLengthM: 40, finishLevel: "standard" });
const fence80 = { ...fence40, fenceLengthM: 80 };
assert.ok(calculateEstimateV2(fence80).midpoint > calculateEstimateV2(fence40).midpoint, "Longer boundary fence must increase external-work cost.");

// 8. Premium specification comparison must not be cheaper than economy.
const compareInput = clone({ category: "new-building", location: "Abuja", totalFloorAreaM2: 150, bedrooms: 3, bathrooms: 4, livingRooms: 1, kitchens: 1 });
const comparisons = buildComparisons(compareInput);
const economy = comparisons.find((item) => item.id === "economy")!;
const premium = comparisons.find((item) => item.id === "premium")!;
assert.ok(premium.result.midpoint > economy.result.midpoint, "Premium comparison must price above economy.");

// 9. A larger budget must support a larger indicative building area.
const seedResult = calculateEstimateV2(compareInput);
const budget30 = checkBudget(compareInput, seedResult, 30_000_000)!;
const budget60 = checkBudget(compareInput, seedResult, 60_000_000)!;
assert.ok((budget60.indicativeCapacityHigh ?? 0) > (budget30.indicativeCapacityHigh ?? 0), "Larger budget must support larger indicative floor area.");

// 10. Cash-flow allocations must sum exactly to the estimate.
const cashFlow = buildCashFlow(compareInput, seedResult);
const shareTotal = cashFlow.reduce((sum, phase) => sum + phase.share, 0);
assert.ok(approxEqual(shareTotal, 1), `Cash-flow shares must sum to 100%; got ${shareTotal}`);
assert.ok(approxEqual(cashFlow.reduce((sum, phase) => sum + phase.midpoint, 0), seedResult.midpoint, 1), "Cash-flow midpoint must reconcile to estimate midpoint.");

// 11. Completeness must respond to actual touched fields, not to merely opening More details.
const untouched = completenessScore(createInitialEstimateInput(), new Set());
const answered = completenessScore(compareInput, new Set(["location", "finishLevel", "buildingUse", "totalFloorAreaM2", "floorsAboveGround", "bedrooms", "bathrooms", "livingRooms", "kitchens", "siteCondition", "foundationType", "frameType", "roofType", "windowSpec", "floorFinish", "electricalSpec"]));
assert.ok(answered > untouched, "Answering real inputs must increase completeness score.");
assert.ok(untouched < 70, `An untouched default form must not look like a detailed estimate; score was ${untouched}.`);

console.log("Public estimator verification passed: building, steel, renovation, finishes, furniture, external works, MEP, comparisons, budget, cash-flow and completeness.");

// Benchmark: Molti Apartments, Asokoro (Charismak-reviewed BOQ, 2025): ground + 5 floors + basement, ≈ 4,556 m²,
// 2 passenger lifts. Prelims + main building + MEP (excluding external works, contingency, VAT) = ₦2,539.7m.
{
  const molti = estimate({ ...initial(), category: "new-building", location: "Abuja (FCT)", buildingUse: "apartments", finishLevel: "upper-mid", totalFloorAreaM2: 4556, floorsAboveGround: 5, lifts: 2, frameType: "reinforced-concrete", roofType: "flat-concrete", includeFireSystem: true, acSpec: "split" } as never);
  const core = molti.sections.filter((s) => !["external", "furniture"].includes(s.id));
  const mid = core.reduce((sum, s) => sum + (s.low + s.high) / 2, 0);
  const actual = 2_539_747_097;
  if (Math.abs(mid / actual - 1) > 0.1) throw new Error(`Molti benchmark: estimate midpoint ₦${Math.round(mid / 1e6)}m is not within 10% of the BOQ ₦${Math.round(actual / 1e6)}m`);
  if (!molti.sections.some((s) => s.id === "lifts" && s.low > 200e6)) throw new Error("Lifts must be priced as their own item (≈ ₦117m each for 6 stops)");
  console.log(`Molti benchmark passed: estimate midpoint ${(mid / actual * 100).toFixed(1)}% of the BOQ (₦${Math.round(mid / 1e6)}m vs ₦${Math.round(actual / 1e6)}m).`);
}
