import type {
  BlockworkElementCalculationInput,
  BlockworkElementMaterialCalculationResult,
  MortarMixSpecification,
} from "../fence/types";
import type {
  BillAssumption,
  BillItem,
  ProcurementItem,
} from "./models";

const round = (value: number, precision: number) =>
  Number(value.toFixed(precision));

export function adaptBlockworkResultToBill(input: {
  calculationId: string;
  element: BlockworkElementCalculationInput;
  mortarMix: MortarMixSpecification;
  result: BlockworkElementMaterialCalculationResult;
}): {
  workItem: BillItem;
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, element, mortarMix, result } = input;
  const elementName = element.name.trim() || "Blockwork element";
  const block = element.blockSpecification;
  const mortarBasis =
    element.mortarCalculationBasis === "per-block"
      ? `${element.mortarVolumePerUnitM3} m³ per block`
      : `${element.mortarVolumePerUnitM3} m³ per m² of blockwork`;
  const mixBasis =
    mortarMix.calculationMethod === "ratio-based"
      ? `${mortarMix.cementRatio}:${mortarMix.sandRatio} ratio; dry-volume factor ${mortarMix.dryVolumeFactor}`
      : `${mortarMix.cementBagsPerM3} cement bags, ${mortarMix.sandVolumeM3PerM3} m³ sand and ${mortarMix.waterLitresPerM3} litres water per m³`;

  const workItem: BillItem = {
    id: `${calculationId}:work`,
    sourceCalculationId: calculationId,
    sourceModule: "blockwork",
    itemCode: `BLK-${block.thicknessMm}`,
    description: `Provide and lay ${block.thicknessMm}mm thick sandcrete blockwork in ${mortarMix.name} mortar to ${elementName}`,
    unit: "m²",
    calculatedQuantity: result.blockwork.netBlockworkAreaM2,
    billQuantity: result.blockwork.netBlockworkAreaM2,
    materialRate: null,
    labourRate: null,
    plantRate: null,
    otherRate: null,
    allInRate: null,
    amount: null,
    notes: `Net measured area after deducting ${result.blockwork.openingAreaM2} m² of openings.`,
    assumptionReferences: [
      `${calculationId}:block-specification`,
      `${calculationId}:mortar`,
      `${calculationId}:wastage`,
    ],
  };

  const materials: ProcurementItem[] = [
    {
      id: `${calculationId}:blocks`,
      materialId: `block-${block.thicknessMm}`,
      sourceCalculationId: calculationId,
      sourceModule: "blockwork",
      description: `${block.thicknessMm}mm sandcrete blocks for ${elementName}`,
      unit: "number",
      calculatedQuantity: round(result.blockwork.basicBlockQuantity, 2),
      wastagePercent: element.blockWastagePercent,
      purchaseQuantity: result.blockwork.finalBlockQuantity,
      notes: `${block.blocksPerSquareMetre} blocks/m²; purchase quantity includes ${element.blockWastagePercent}% wastage and is rounded up.`,
    },
    {
      id: `${calculationId}:cement`,
      materialId: "cement-50kg",
      sourceCalculationId: calculationId,
      sourceModule: "blockwork",
      description: `Cement for ${elementName} mortar`,
      unit: "bag",
      calculatedQuantity: round(
        result.mortarMaterials.calculatedCementBagQuantity,
        2,
      ),
      wastagePercent: 0,
      purchaseQuantity: Math.ceil(
        result.mortarMaterials.calculatedCementBagQuantity,
      ),
      notes: `${mortarMix.cementBagWeightKg} kg bags; mortar wastage is already included before material conversion.`,
    },
    {
      id: `${calculationId}:sand`,
      materialId: "sharp-sand",
      sourceCalculationId: calculationId,
      sourceModule: "blockwork",
      description: `Sharp sand for ${elementName} mortar`,
      unit: "m³",
      calculatedQuantity: round(result.mortarMaterials.sandVolumeM3, 3),
      wastagePercent: 0,
      purchaseQuantity: round(result.mortarMaterials.sandVolumeM3, 3),
      notes: "Mortar wastage is already included in this quantity.",
    },
    {
      id: `${calculationId}:water`,
      materialId: "water",
      sourceCalculationId: calculationId,
      sourceModule: "blockwork",
      description: `Water for ${elementName} mortar`,
      unit: "litre",
      calculatedQuantity: round(result.mortarMaterials.waterLitres, 1),
      wastagePercent: 0,
      purchaseQuantity: round(result.mortarMaterials.waterLitres, 1),
      notes: "Planning quantity based on the selected mortar mix.",
    },
  ];

  const assumptions: BillAssumption[] = [
    {
      id: `${calculationId}:block-specification`,
      label: `${elementName} block specification`,
      value: `${block.lengthMm} × ${block.heightMm} × ${block.thicknessMm}mm; ${block.blocksPerSquareMetre} blocks/m²`,
    },
    {
      id: `${calculationId}:mortar`,
      label: `${elementName} mortar basis`,
      value: `${mortarMix.name}; ${mortarBasis}; ${mixBasis}`,
    },
    {
      id: `${calculationId}:wastage`,
      label: `${elementName} wastage`,
      value: `${element.blockWastagePercent}% blocks; ${element.mortarWastagePercent}% mortar`,
    },
  ];

  return { workItem, materials, assumptions };
}
