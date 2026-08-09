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
  const installedWeightKg = round(
    result.basicLengthM * result.unitWeightKgPerM,
    3,
  );

  return {
    workItem: {
      id: `${calculationId}:work`,
      sourceCalculationId: calculationId,
      sourceModule: "reinforcement",
      itemCode: `REBAR-Y${result.barDiameterMm}`,
      description: `Provide, cut, bend and fix Y${result.barDiameterMm} reinforcement to ${name}`,
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
        materialId: `reinforcement-y${result.barDiameterMm}`,
        sourceCalculationId: calculationId,
        sourceModule: "reinforcement",
        description: `Y${result.barDiameterMm} reinforcement stock bars for ${name}`,
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
        value: `Y${result.barDiameterMm}; ${round(result.unitWeightKgPerM, 3)} kg/m; installed length ${round(result.basicLengthM, 3)}m`,
      },
      {
        id: `${calculationId}:procurement`,
        label: `${name} procurement`,
        value: `${element.wastagePercent}% wastage; ${result.stockBarLengthM}m stock bars; ${element.bindingWirePercent}% binding wire`,
      },
    ],
  };
}
