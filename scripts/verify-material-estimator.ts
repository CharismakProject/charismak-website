import assert from "node:assert/strict";
import { calculateMaterialEstimate, createMaterialEstimateInput } from "../lib/projects/material-estimate-engine";
import { calculateSpecialistMaterialEstimate, createSpecialistMaterialInput } from "../lib/projects/specialist-material-estimate-engine";
import { calculateAdditionalMaterialEstimate, createAdditionalMaterialInput } from "../lib/projects/additional-material-estimate-engine";

const approx = (actual: number, expected: number, tolerance = 0.02) => {
  assert.ok(Math.abs(actual - expected) <= expected * tolerance, `Expected ${actual} to be within ${tolerance * 100}% of ${expected}`);
};

{
  const input = createMaterialEstimateInput();
  input.category = "concrete";
  input.concreteVolumeM3 = 1;
  input.concreteMix = "1:2:4";
  input.wastePercent = 5;
  const result = calculateMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "cement")!.quantityLow, 6.65, 0.03);
  approx(result.lines.find((line) => line.id === "sand")!.quantityLow, 0.462, 0.03);
  approx(result.lines.find((line) => line.id === "aggregate")!.quantityLow, 0.924, 0.03);
}

{
  const input = createMaterialEstimateInput();
  input.category = "reinforcement";
  input.rebarMode = "bars";
  input.rebarDiameterMm = 12;
  input.rebarBarCount = 10;
  input.rebarBarLengthM = 12;
  input.wastePercent = 5;
  const result = calculateMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "rebar")!.quantityLow, 112, 0.02);
}

{
  const input = createMaterialEstimateInput();
  input.category = "blockwork";
  input.wallAreaM2 = 10;
  input.blockThicknessMm = 225;
  input.wastePercent = 5;
  const result = calculateMaterialEstimate(input);
  const blocks = result.lines.find((line) => line.id === "blocks")!;
  assert.ok((blocks.procurementQuantity ?? 0) >= 103 && (blocks.procurementQuantity ?? 0) <= 105, "10 m² wall should need about 104 blocks including 5% waste");
}

{
  const input = createMaterialEstimateInput();
  input.category = "gypsum-partition";
  input.partitionAreaM2 = 20;
  input.partitionHeightM = 3;
  input.wastePercent = 8;
  const result = calculateMaterialEstimate(input);
  assert.ok((result.lines.find((line) => line.id === "boards")!.procurementQuantity ?? 0) >= 15, "20 m² partition with both faces should require at least 15 boards including waste");
}

{
  const input = createMaterialEstimateInput();
  input.category = "curtain-wall";
  input.facadeWidthM = 10;
  input.facadeHeightM = 6;
  const result = calculateMaterialEstimate(input);
  assert.ok(result.lines.find((line) => line.id === "glass")!.quantityLow > 60, "Curtain wall glass should exceed net facade area after waste");
}

{
  const input = createMaterialEstimateInput();
  input.category = "tiling";
  input.tileAreaM2 = 50;
  input.wastePercent = 10;
  const result = calculateMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "tile-area")!.quantityLow, 55, 0.001);
}

{
  const input = createMaterialEstimateInput();
  input.category = "painting";
  input.paintAreaM2 = 100;
  input.paintCoats = 2;
  input.paintCoverageM2PerLitre = 10;
  input.wastePercent = 10;
  const result = calculateMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "paint")!.quantityLow, 22, 0.001);
}

{
  const input = createMaterialEstimateInput();
  input.category = "roofing";
  input.roofAreaM2 = 100;
  input.roofSheetEffectiveWidthM = 1;
  input.roofSheetLengthM = 3;
  input.wastePercent = 8;
  const result = calculateMaterialEstimate(input);
  const sheets = result.lines.find((line) => line.id === "sheets")!;
  assert.ok((sheets.procurementQuantity ?? 0) >= 36 && (sheets.procurementQuantity ?? 0) <= 37, "100 m² roof should procure about 36-37 sheets at 3 m² effective coverage plus waste");
}

{
  const input = createSpecialistMaterialInput();
  input.category = "electrical";
  input.lightingPoints = 10;
  input.socketPoints = 10;
  const base = calculateSpecialistMaterialEstimate(input);
  input.socketPoints = 20;
  const larger = calculateSpecialistMaterialEstimate(input);
  assert.ok(larger.lines.find((line) => line.id === "socket-cable")!.quantityHigh > base.lines.find((line) => line.id === "socket-cable")!.quantityHigh, "More socket points must increase cable quantity");
}

{
  const input = createSpecialistMaterialInput();
  input.category = "plumbing";
  input.bathrooms = 3;
  input.kitchens = 1;
  const result = calculateSpecialistMaterialEstimate(input);
  assert.ok(result.lines.find((line) => line.id === "ppr20")!.quantityHigh > 0, "Plumbing fixtures must generate water pipe quantity");
  assert.ok(result.lines.find((line) => line.id === "soil110")!.quantityHigh > 0, "Bathrooms/WCs must generate soil-pipe quantity");
}

{
  const input = createSpecialistMaterialInput();
  input.category = "ceiling";
  input.ceilingAreaM2 = 100;
  input.ceilingSystem = "gypsum";
  const result = calculateSpecialistMaterialEstimate(input);
  assert.ok((result.lines.find((line) => line.id === "boards")!.procurementQuantity ?? 0) >= 35, "100 m² gypsum ceiling must require full board sheets");
}

{
  const input = createSpecialistMaterialInput();
  input.category = "paving";
  input.pavingAreaM2 = 100;
  const result = calculateSpecialistMaterialEstimate(input);
  assert.ok(result.lines.find((line) => line.id === "subbase")!.quantityHigh > 15, "100 m² paving should generate a realistic compacted subbase volume");
}

{
  const input = createSpecialistMaterialInput();
  input.category = "waterproofing";
  input.waterproofAreaM2 = 50;
  input.waterproofSystem = "bituminous-membrane";
  const result = calculateSpecialistMaterialEstimate(input);
  assert.ok((result.lines.find((line) => line.id === "rolls")!.procurementQuantity ?? 0) >= 6, "50 m² membrane work should round up roll procurement including laps/waste");
}

{
  const input = createAdditionalMaterialInput();
  input.category = "structural-steel";
  input.steelCoveredAreaM2 = 150;
  input.steelIntensityKgM2 = 40;
  input.wastePercent = 7;
  const result = calculateAdditionalMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "steel-tonnes")!.quantityLow, 6.42, 0.01);
  assert.ok(result.lines.find((line) => line.id === "bolts")!.quantityHigh > 100, "Structural steel tonnage should drive connection bolt allowance");
}

{
  const input = createAdditionalMaterialInput();
  input.category = "doors-windows";
  input.windowCount = 10;
  input.windowWidthM = 1.2;
  input.windowHeightM = 1.2;
  input.doorCount = 5;
  const result = calculateAdditionalMaterialEstimate(input);
  approx(result.lines.find((line) => line.id === "window-area")!.quantityLow, 15.408, 0.01);
  assert.equal(result.lines.find((line) => line.id === "door-hardware")!.procurementQuantity, 5);
}

{
  const input = createAdditionalMaterialInput();
  input.category = "glass-partition";
  input.glassPartitionAreaM2 = 30;
  input.glassPartitionHeightM = 3;
  const result = calculateAdditionalMaterialEstimate(input);
  assert.ok(result.lines.find((line) => line.id === "glass")!.quantityLow > 30, "Glass partition procurement must include waste");
  assert.ok((result.lines.find((line) => line.id === "panels")!.procurementQuantity ?? 0) >= 8, "Partition geometry should infer panel count");
}

console.log("Material estimator verification passed: concrete, reinforcement, blockwork, partitions, curtain wall, finishes, roofing, electrical, plumbing, ceiling, paving, waterproofing, structural steel, doors/windows and glass partitions.");
