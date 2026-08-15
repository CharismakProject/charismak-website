import type {
  ReinforcementCalculationInput,
  ReinforcementCalculationResult,
} from "../fence/types";
import type { BillAssumption, BillItem, ProcurementItem } from "./models";

const round = (value: number, precision: number) =>
  Number(value.toFixed(precision));

export function adaptReinforcementResultToBill(input: {
  calculationId: string;
  element: ReinforcementCalculationInput;
  result: ReinforcementCalculationResult;
}): {
  workItem: BillItem;
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, element, result } = input;
  const name = element.name.trim() || "Reinforcement";

  if (element.calculationMode === "welded-mesh" || result.calculationMode === "welded-mesh") {
    if (element.calculationMode !== "welded-mesh" || result.calculationMode !== "welded-mesh") {
      throw new Error("Welded-mesh input and result do not match.");
    }
    const meshId = element.meshDesignation.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      workItem: {
        id: `${calculationId}:work`,
        sourceCalculationId: calculationId,
        sourceModule: "reinforcement",
        itemCode: `BRC-${element.meshDesignation.toUpperCase()}`,
        description: `Provide and fix ${element.meshDesignation} welded reinforcement mesh to ${name}, including laps and tying`,
        unit: "m²",
        calculatedQuantity: round(result.coverageAreaM2, 3),
        billQuantity: round(result.coverageAreaM2, 3),
        materialRate: null,
        labourRate: null,
        plantRate: null,
        otherRate: null,
        allInRate: null,
        amount: null,
        notes: `${element.lapPercent}% lap allowance and ${element.wastagePercent}% wastage are included in procurement, not in the measured coverage area.`,
        assumptionReferences: [`${calculationId}:mesh`, `${calculationId}:procurement`],
      },
      materials: [
        {
          id: `${calculationId}:mesh-sheets`,
          materialId: `reinforcement-mesh-${meshId}`,
          sourceCalculationId: calculationId,
          sourceModule: "reinforcement",
          description: `${element.meshDesignation} welded reinforcement mesh for ${name}`,
          unit: "sheet",
          calculatedQuantity: round(result.exactSheetQuantity, 3),
          wastagePercent: element.wastagePercent,
          purchaseQuantity: result.procurementSheetQuantity,
          notes: `${result.sheetLengthM}m × ${result.sheetWidthM}m sheets; ${round(result.finalRequiredAreaM2, 3)}m² including laps and waste; approximate purchase weight ${round(result.procurementWeightKg, 1)}kg.`,
        },
        {
          id: `${calculationId}:binding-wire`,
          materialId: "binding-wire",
          sourceCalculationId: calculationId,
          sourceModule: "reinforcement",
          description: `Binding wire for ${name}`,
          unit: "kg",
          calculatedQuantity: round(result.bindingWireWeightKg, 3),
          wastagePercent: 0,
          purchaseQuantity: round(result.bindingWireWeightKg, 3),
          notes: `${element.bindingWirePercent}% of required mesh weight.`,
        },
      ],
      assumptions: [
        {
          id: `${calculationId}:mesh`,
          label: `${name} mesh specification`,
          value: `${element.meshDesignation}; ${result.unitWeightKgPerM2} kg/m²; sheet ${result.sheetLengthM}m × ${result.sheetWidthM}m`,
        },
        {
          id: `${calculationId}:procurement`,
          label: `${name} mesh procurement`,
          value: `${element.lapPercent}% laps; ${element.wastagePercent}% wastage; ${result.procurementSheetQuantity} full sheets`,
        },
      ],
    };
  }

  const steelGrade = element.steelGrade ?? "high-yield";
  const barPrefix = steelGrade === "mild-steel" ? "R" : "Y";
  const gradeDescription = steelGrade === "mild-steel" ? "mild-steel" : "high-yield";
  const installedWeightKg = round(
    result.basicLengthM * result.unitWeightKgPerM,
    3,
  );

  return {
    workItem: {
      id: `${calculationId}:work`,
      sourceCalculationId: calculationId,
      sourceModule: "reinforcement",
      itemCode: `REBAR-${barPrefix}${result.barDiameterMm}`,
      description: `Provide, cut, bend and fix ${barPrefix}${result.barDiameterMm} ${gradeDescription} reinforcement to ${name}`,
      unit: "kg",
      calculatedQuantity: installedWeightKg,
      billQuantity: installedWeightKg,
      materialRate: null,
      labourRate: null,
      plantRate: null,
      otherRate: null,
      allInRate: null,
      amount: null,
      notes: `Procurement plan includes ${element.wastagePercent}% length wastage and ${element.bindingWirePercent}% binding wire.`,
      assumptionReferences: [
        `${calculationId}:bar`,
        `${calculationId}:procurement`,
      ],
    },
    materials: [
      {
        id: `${calculationId}:stock-bars`,
        materialId: `reinforcement-${barPrefix.toLowerCase()}${result.barDiameterMm}`,
        sourceCalculationId: calculationId,
        sourceModule: "reinforcement",
        description: `${barPrefix}${result.barDiameterMm} ${gradeDescription} reinforcement stock bars for ${name}`,
        unit: "number",
        calculatedQuantity: round(
          result.finalRequiredLengthM / result.stockBarLengthM,
          3,
        ),
        wastagePercent: element.wastagePercent,
        purchaseQuantity: result.stockBarQuantity,
        notes: `${result.stockBarLengthM}m stock lengths; ${round(result.offcutOrExcessLengthM, 3)}m expected offcut/excess.`,
      },
      {
        id: `${calculationId}:binding-wire`,
        materialId: "binding-wire",
        sourceCalculationId: calculationId,
        sourceModule: "reinforcement",
        description: `Binding wire for ${name}`,
        unit: "kg",
        calculatedQuantity: round(result.bindingWireWeightKg, 3),
        wastagePercent: 0,
        purchaseQuantity: round(result.bindingWireWeightKg, 3),
        notes: `${element.bindingWirePercent}% of reinforcement weight.`,
      },
    ],
    assumptions: [
      {
        id: `${calculationId}:bar`,
        label: `${name} reinforcement`,
        value: `${barPrefix}${result.barDiameterMm} ${gradeDescription}; ${round(result.unitWeightKgPerM, 3)} kg/m; installed length ${round(result.basicLengthM, 3)}m`,
      },
      {
        id: `${calculationId}:procurement`,
        label: `${name} procurement`,
        value: `${element.wastagePercent}% wastage; ${result.stockBarLengthM}m stock bars; ${element.bindingWirePercent}% binding wire`,
      },
    ],
  };
}
