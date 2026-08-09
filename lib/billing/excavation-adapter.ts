import type {
  ExcavationCalculationInput,
  ExcavationCalculationResult,
} from "../fence/types";
import type { BillAssumption, BillItem, ProcurementItem } from "./models";

const round = (value: number, precision = 3) =>
  Number(value.toFixed(precision));

const createWorkItem = (input: {
  id: string;
  calculationId: string;
  description: string;
  quantity: number;
}): BillItem => ({
  id: input.id,
  sourceCalculationId: input.calculationId,
  sourceModule: "excavation",
  description: input.description,
  unit: "m³",
  calculatedQuantity: round(input.quantity),
  billQuantity: round(input.quantity),
  materialRate: null,
  labourRate: null,
  plantRate: null,
  otherRate: null,
  allInRate: null,
  amount: null,
});

export function adaptExcavationResultToBill(input: {
  calculationId: string;
  element: ExcavationCalculationInput;
  result: ExcavationCalculationResult;
}): {
  workItems: BillItem[];
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, element, result } = input;
  const name = element.name.trim() || "Earthworks";
  const application = result.application.replaceAll("-", " ");
  const workItems: BillItem[] = [
    createWorkItem({
      id: `${calculationId}:excavation`,
      calculationId,
      description: `Excavate ${application} in ${result.groundCondition.replaceAll("-", " ")} ground for ${name}`,
      quantity: result.finalExcavationVolumeM3,
    }),
  ];

  if (result.excavatedSoilUsedForBackfillM3 > 0) {
    workItems.push(createWorkItem({
      id: `${calculationId}:backfill`,
      calculationId,
      description: `Return, fill and compact approved excavated material around ${name}`,
      quantity: result.excavatedSoilUsedForBackfillM3,
    }));
  }
  if (result.importedFillRequiredM3 > 0) {
    workItems.push(createWorkItem({
      id: `${calculationId}:imported-fill`,
      calculationId,
      description: `Provide, place and compact approved imported filling to ${name}`,
      quantity: result.importedFillRequiredM3,
    }));
  }
  if (result.looseDisposalVolumeM3 > 0) {
    workItems.push(createWorkItem({
      id: `${calculationId}:disposal`,
      calculationId,
      description: `Load, cart away and dispose surplus excavated material from ${name}`,
      quantity: result.looseDisposalVolumeM3,
    }));
  }

  const materials: ProcurementItem[] = result.importedFillRequiredM3 > 0
    ? [{
        id: `${calculationId}:imported-fill-material`,
        materialId: "imported-fill",
        sourceCalculationId: calculationId,
        sourceModule: "excavation",
        description: `Approved imported filling for ${name}`,
        unit: "m³",
        calculatedQuantity: round(result.importedFillRequiredM3),
        wastagePercent: 0,
        purchaseQuantity: round(result.importedFillRequiredM3),
        notes: "Compacted volume required after reusable excavated soil is applied.",
      }]
    : [];

  return {
    workItems,
    materials,
    assumptions: [
      {
        id: `${calculationId}:ground`,
        label: `${name} ground condition`,
        value: `${result.groundCondition.replaceAll("-", " ")}; ${element.overExcavationPercent}% over-excavation`,
      },
      {
        id: `${calculationId}:soil`,
        label: `${name} soil handling`,
        value: `${element.reusableSoilPercent}% reusable soil; ${element.bulkingPercent}% disposal bulking; ${result.permanentConstructionVolumeM3} m³ permanent construction`,
      },
    ],
  };
}
