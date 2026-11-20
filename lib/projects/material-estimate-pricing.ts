import { getMaterial, isStale, toBuy, type Material } from "@/lib/rates/materials";
import type { MaterialEstimateInput, MaterialEstimateLine, MaterialEstimateResult } from "./material-estimate-engine";

/**
 * Prices a Material Estimator schedule from the shared material list (lib/rates/materials.ts),
 * so the estimator and the Rate Bank always use the same prices.
 *  • project: cost of the calculated quantity (what the work uses — leftovers go to the next item)
 *  • small:   cost of what you must buy (rounded up to how each material is sold)
 */
export type CostMode = "project" | "small";
export type PricedEstimateLine = MaterialEstimateLine & {
  item?: Material; // the priced material from the shared list
  factor: number; // estimator unit → material unit
  quantity: number; // in the material's unit, for the chosen mode
  cost: number | null; // null: not in the price list yet
  stale: boolean;
};

type Link = { id: string; factor: number };

function linkFor(input: MaterialEstimateInput, line: MaterialEstimateLine): Link | null {
  const key = `${input.category}:${line.id}`;
  const sheetArea = Math.max(0.1, input.roofSheetEffectiveWidthM * input.roofSheetLengthM);
  const map: Record<string, Link | null> = {
    "concrete:cement": { id: "cement-50kg", factor: 1 },
    "concrete:sand": { id: "sharp-sand", factor: 1 },
    "concrete:aggregate": { id: "granite", factor: 1 },
    "reinforcement:rebar": { id: "rebar-tmt", factor: 0.001 },
    "reinforcement:binding": { id: "binding-wire", factor: 1 },
    "blockwork:blocks": input.blockThicknessMm === 225 ? { id: "block-225", factor: 1 } : input.blockThicknessMm === 150 ? { id: "block-150", factor: 1 } : null,
    "blockwork:mortar-cement": { id: "cement-50kg", factor: 1 },
    "blockwork:mortar-sand": { id: "sharp-sand", factor: 1 },
    "mortar-plaster:cement": { id: "cement-50kg", factor: 1 },
    "mortar-plaster:sand": { id: "sharp-sand", factor: 1 },
    "screed:cement": { id: "cement-50kg", factor: 1 },
    "screed:sand": { id: "sharp-sand", factor: 1 },
    "gypsum-partition:boards": { id: "gypsum-board-12.5", factor: 1 },
    "tiling:tile-area": input.tileWidthMm === 600 && input.tileHeightMm === 600 ? { id: "tile-600x600", factor: 1 } : (input.tileWidthMm === 600 && input.tileHeightMm === 300) || (input.tileWidthMm === 300 && input.tileHeightMm === 600) ? { id: "tile-600x300", factor: 1 } : null,
    "tiling:adhesive": { id: "tile-adhesive-20kg", factor: 1 },
    "painting:paint": { id: "emulsion-20l", factor: 1 / 20 },
    "roofing:sheets": { id: "roofing-055", factor: sheetArea },
    "formwork:plywood": { id: "marine-18-economy", factor: 1 },
    "formwork:timber": { id: "timber-2x3", factor: 1 / 3.6 },
    "formwork:nails": { id: "nails", factor: 1 / 25 },
  };
  return map[key] ?? null;
}

export function priceEstimate(input: MaterialEstimateInput, result: MaterialEstimateResult, mode: CostMode, today = new Date()) {
  const lines: PricedEstimateLine[] = result.lines.map((line) => {
    const link = linkFor(input, line);
    const material = getMaterial(link?.id);
    const factor = link?.factor ?? 1;
    const used = line.quantityHigh * factor;
    const bought = (line.procurementQuantity ?? line.quantityHigh) * factor;
    const quantity = material ? (mode === "small" ? toBuy(bought, material) : used) : mode === "small" ? bought : used;
    return { ...line, item: material, factor, quantity, cost: material ? quantity * material.price : null, stale: material ? isStale(material, today) : false };
  });
  // Lines that restate another line (e.g. pieces vs m² of tiles, kg vs tonnes of steel) are not costed twice.
  const priced = lines.filter((line) => line.cost !== null);
  const total = priced.reduce((sum, line) => sum + (line.cost ?? 0), 0);
  const unpriced = lines.filter((line) => line.cost === null && !/^(tonnes|tile-pieces|boxes|paint-buckets|panels)$/.test(line.id));
  return { lines, total, unpriced, anyStale: priced.some((line) => line.stale) };
}
