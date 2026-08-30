import assert from "node:assert/strict";
import { calculateMaterialEstimate, createMaterialEstimateInput } from "../lib/projects/material-estimate-engine";

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
  const cement = result.lines.find((line) => line.id === "cement")!;
  const sand = result.lines.find((line) => line.id === "sand")!;
  const aggregate = result.lines.find((line) => line.id === "aggregate")!;
  approx(cement.quantityLow, 6.65, 0.03);
  approx(sand.quantityLow, 0.462, 0.03);
  approx(aggregate.quantityLow, 0.924, 0.03);
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
  const steel = result.lines.find((line) => line.id === "rebar")!;
  approx(steel.quantityLow, 112, 0.02);
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
  input.category = "tiling";
  input.tileAreaM2 = 50;
  input.wastePercent = 10;
  const result = calculateMaterialEstimate(input);
  const tiles = result.lines.find((line) => line.id === "tile-area")!;
  approx(tiles.quantityLow, 55, 0.001);
}

{
  const input = createMaterialEstimateInput();
  input.category = "painting";
  input.paintAreaM2 = 100;
  input.paintCoats = 2;
  input.paintCoverageM2PerLitre = 10;
  input.wastePercent = 10;
  const result = calculateMaterialEstimate(input);
  const paint = result.lines.find((line) => line.id === "paint")!;
  approx(paint.quantityLow, 22, 0.001);
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
  assert.equal(sheets.procurementQuantity, 36);
}

{
  const input = createMaterialEstimateInput();
  input.category = "gypsum-partition";
  input.partitionAreaM2 = 20;
  input.partitionHeightM = 3;
  input.wastePercent = 8;
  const result = calculateMaterialEstimate(input);
  const boards = result.lines.find((line) => line.id === "boards")!;
  assert.ok((boards.procurementQuantity ?? 0) >= 15, "20 m² partition with both faces should require at least 15 boards including waste");
}

{
  const input = createMaterialEstimateInput();
  input.category = "curtain-wall";
  input.facadeWidthM = 10;
  input.facadeHeightM = 6;
  const result = calculateMaterialEstimate(input);
  const glass = result.lines.find((line) => line.id === "glass")!;
  assert.ok(glass.quantityLow > 60, "Curtain wall glass should exceed net facade area after waste");
}

console.log("Material estimator verification passed: concrete, reinforcement, blockwork, partitions, curtain wall, tiling, painting and roofing.");
