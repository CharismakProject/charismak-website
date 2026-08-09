import type {
  FormworkCalculationInput,
  FormworkCalculationResult,
} from "../fence/types";
import type { BillAssumption, BillItem, ProcurementItem } from "./models";

const round = (value: number, precision = 3) =>
  Number(value.toFixed(precision));

export function adaptFormworkResultToBill(input: {
  calculationId: string;
  element: FormworkCalculationInput;
  result: FormworkCalculationResult;
}): {
  workItem: BillItem;
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, element, result } = input;
  const name = element.name.trim() || "Concrete element";
  const application = element.application.replaceAll("-", " ");

  return {
    workItem: {
      id: `${calculationId}:work`,
      sourceCalculationId: calculationId,
      sourceModule: "formwork",
      itemCode: "FORM",
      description: `Provide, erect and remove formwork to ${application} for ${name}`,
      unit: "m²",
      calculatedQuantity: result.basicFormworkAreaM2,
      billQuantity: result.basicFormworkAreaM2,
      materialRate: null,
      labourRate: null,
      plantRate: null,
      otherRate: null,
      allInRate: null,
      amount: null,
      notes: `Measured contact area; sheet procurement includes ${element.wastagePercent}% waste and ${element.expectedReuseCount} uses.`,
      assumptionReferences: [
        `${calculationId}:sheet`,
        `${calculationId}:wastage`,
      ],
    },
    materials: [{
      id: `${calculationId}:sheets`,
      materialId: "formwork-sheet",
      sourceCalculationId: calculationId,
      sourceModule: "formwork",
      description: `Formwork sheets for ${name}`,
      unit: "number",
      calculatedQuantity: round(result.exactSheetQuantity),
      wastagePercent: element.wastagePercent,
      purchaseQuantity: result.procurementSheetQuantity,
      notes: `${result.sheetLengthM} × ${result.sheetWidthM}m sheets with ${result.expectedReuseCount} expected uses.`,
    }],
    assumptions: [
      {
        id: `${calculationId}:sheet`,
        label: `${name} formwork sheet`,
        value: `${result.sheetLengthM} × ${result.sheetWidthM}m; ${result.expectedReuseCount} expected uses`,
      },
      {
        id: `${calculationId}:wastage`,
        label: `${name} formwork wastage`,
        value: `${element.wastagePercent}% applied to procurement area`,
      },
    ],
  };
}
