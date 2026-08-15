import type {
  ConcreteElementCalculationInput,
  ConcreteElementMaterialCalculationResult,
  ConcreteMixSpecification,
} from "../fence/types";
import type {
  BillAssumption,
  BillItem,
  ProcurementItem,
} from "./models";
import type { BulkPurchaseAssumption } from "../materials/bulk-converter";

const round = (value: number, precision: number) =>
  Number(value.toFixed(precision));

export function adaptConcreteResultToBill(input: {
  calculationId: string;
  element: ConcreteElementCalculationInput;
  mix: ConcreteMixSpecification;
  result: ConcreteElementMaterialCalculationResult;
  bulkPurchase?: {
    sand: BulkPurchaseAssumption;
    aggregate: BulkPurchaseAssumption;
  };
}): {
  workItem: BillItem;
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, element, mix, result } = input;
  const bulkPurchase = input.bulkPurchase ?? {
    sand: { densityTonnesPerM3: 1.6, truckCapacity: 15, truckCapacityBasis: "tonnes" as const },
    aggregate: { densityTonnesPerM3: 1.5, truckCapacity: 15, truckCapacityBasis: "tonnes" as const },
  };
  const elementName = element.name.trim() || "Concrete element";
  const mixBasis =
    mix.calculationMethod === "ratio-based"
      ? `${mix.cementRatio}:${mix.sandRatio}:${mix.coarseAggregateRatio} ratio; dry-volume factor ${mix.dryVolumeFactor}`
      : `approved per-m³ material coefficients (${mix.cementBagsPerM3} cement bags/m³)`;
  const waterBasis =
    mix.calculationMethod === "ratio-based"
      ? `Water-cement ratio: ${mix.waterCementRatioByWeight}.`
      : `Water coefficient: ${mix.waterLitresPerM3} litres/m³.`;

  const workItem: BillItem = {
    id: `${calculationId}:work`,
    sourceCalculationId: calculationId,
    sourceModule: "concrete",
    itemCode: "CONC",
    description: `Provide, mix, place and compact ${mix.name} concrete to ${elementName}`,
    unit: "m³",
    calculatedQuantity: result.element.finalConcreteVolumeM3,
    billQuantity: result.element.finalConcreteVolumeM3,
    materialRate: null,
    labourRate: null,
    plantRate: null,
    otherRate: null,
    allInRate: null,
    amount: null,
    notes: `Includes ${element.wastagePercent}% concrete wastage.`,
    assumptionReferences: [`${calculationId}:mix`, `${calculationId}:wastage`],
  };

  const materials: ProcurementItem[] = [
    {
      id: `${calculationId}:cement`,
      materialId: "cement-50kg",
      sourceCalculationId: calculationId,
      sourceModule: "concrete",
      description: `Cement for ${elementName}`,
      unit: "bag",
      calculatedQuantity: round(result.materials.calculatedCementBagQuantity, 2),
      wastagePercent: 0,
      purchaseQuantity: Math.ceil(result.materials.calculatedCementBagQuantity),
      notes: `${mix.cementBagWeightKg} kg bags; purchase quantity rounded up.`,
    },
    {
      id: `${calculationId}:sand`,
      materialId: "sharp-sand",
      sourceCalculationId: calculationId,
      sourceModule: "concrete",
      description: `Sharp sand for ${elementName}`,
      unit: "m³",
      calculatedQuantity: round(result.materials.sandVolumeM3, 3),
      wastagePercent: 0,
      purchaseQuantity: round(result.materials.sandVolumeM3, 3),
      bulkPurchase: bulkPurchase.sand,
      notes: "Technical quantity is in m³. Tonnage and truckloads are approximate purchasing conversions; confirm density and load capacity with the supplier.",
    },
    {
      id: `${calculationId}:aggregate`,
      materialId: "granite-aggregate",
      sourceCalculationId: calculationId,
      sourceModule: "concrete",
      description: `Coarse aggregate for ${elementName}`,
      unit: "m³",
      calculatedQuantity: round(result.materials.coarseAggregateVolumeM3, 3),
      wastagePercent: 0,
      purchaseQuantity: round(result.materials.coarseAggregateVolumeM3, 3),
      bulkPurchase: bulkPurchase.aggregate,
      notes: "Technical quantity is in m³. Tonnage and truckloads are approximate purchasing conversions; confirm density and load capacity with the supplier.",
    },
    {
      id: `${calculationId}:water`,
      materialId: "water",
      sourceCalculationId: calculationId,
      sourceModule: "concrete",
      description: `Water for ${elementName}`,
      unit: "litre",
      calculatedQuantity: round(result.materials.waterLitres, 1),
      wastagePercent: 0,
      purchaseQuantity: round(result.materials.waterLitres, 1),
      notes: waterBasis,
    },
  ];

  const assumptions: BillAssumption[] = [
    {
      id: `${calculationId}:mix`,
      label: `${elementName} concrete mix`,
      value: `${mix.name}; ${mixBasis}`,
    },
    {
      id: `${calculationId}:wastage`,
      label: `${elementName} wastage`,
      value: `${element.wastagePercent}%`,
    },
  ];

  return { workItem, materials, assumptions };
}
