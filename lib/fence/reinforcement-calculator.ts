import type {
  ReinforcementCalculationInput,
  ReinforcementCalculationResult,
} from "./types";

const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

const assertPositive = (
  name: string,
  value: number
): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }
};

const assertNonNegative = (
  name: string,
  value: number
): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
};

const assertPositiveWholeNumber = (
  name: string,
  value: number
): void => {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      `${name} must be a positive whole number.`
    );
  }
};

export function calculateReinforcement(
  input: ReinforcementCalculationInput
): ReinforcementCalculationResult {
  if (input.calculationMode === "welded-mesh") {
    assertPositive("Mesh coverage area", input.coverageAreaM2);
    assertNonNegative("Mesh lap allowance", input.lapPercent);
    assertNonNegative("Mesh wastage", input.wastagePercent);
    assertPositive("Mesh sheet length", input.sheetLengthM);
    assertPositive("Mesh sheet width", input.sheetWidthM);
    assertPositive("Mesh unit weight", input.unitWeightKgPerM2);
    assertNonNegative("Binding wire percentage", input.bindingWirePercent);

    const lapAreaM2 = input.coverageAreaM2 * (input.lapPercent / 100);
    const areaIncludingLapsM2 = input.coverageAreaM2 + lapAreaM2;
    const wastageAreaM2 = areaIncludingLapsM2 * (input.wastagePercent / 100);
    const finalRequiredAreaM2 = areaIncludingLapsM2 + wastageAreaM2;
    const sheetAreaM2 = input.sheetLengthM * input.sheetWidthM;
    const exactSheetQuantity = finalRequiredAreaM2 / sheetAreaM2;
    const procurementSheetQuantity = Math.ceil(exactSheetQuantity);
    const installedWeightKg = input.coverageAreaM2 * input.unitWeightKgPerM2;
    const totalWeightKg = finalRequiredAreaM2 * input.unitWeightKgPerM2;
    const procurementWeightKg =
      procurementSheetQuantity * sheetAreaM2 * input.unitWeightKgPerM2;
    const bindingWireWeightKg = totalWeightKg * (input.bindingWirePercent / 100);

    return {
      id: input.id,
      name: input.name,
      calculationMode: input.calculationMode,
      meshDesignation: input.meshDesignation.trim() || "Custom welded mesh",
      coverageAreaM2: roundQuantity(input.coverageAreaM2),
      lapPercent: roundQuantity(input.lapPercent),
      lapAreaM2: roundQuantity(lapAreaM2),
      wastagePercent: roundQuantity(input.wastagePercent),
      wastageAreaM2: roundQuantity(wastageAreaM2),
      finalRequiredAreaM2: roundQuantity(finalRequiredAreaM2),
      sheetLengthM: roundQuantity(input.sheetLengthM),
      sheetWidthM: roundQuantity(input.sheetWidthM),
      sheetAreaM2: roundQuantity(sheetAreaM2),
      exactSheetQuantity: roundQuantity(exactSheetQuantity),
      procurementSheetQuantity,
      unitWeightKgPerM2: roundQuantity(input.unitWeightKgPerM2),
      installedWeightKg: roundQuantity(installedWeightKg),
      totalWeightKg: roundQuantity(totalWeightKg),
      procurementWeightKg: roundQuantity(procurementWeightKg),
      bindingWireWeightKg: roundQuantity(bindingWireWeightKg),
    };
  }

  assertPositive(
    "Bar diameter",
    input.barDiameterMm
  );
  assertPositive(
    "Stock bar length",
    input.stockBarLengthM
  );
  assertNonNegative(
    "Reinforcement wastage",
    input.wastagePercent
  );
  assertNonNegative(
    "Binding wire percentage",
    input.bindingWirePercent
  );

  let quantity: number | null;
  let cuttingLengthM: number | null;
  let additionalLengthPerBarM: number | null;
  let directTotalLengthM: number | null;

  let basicLengthM: number;
  let stockBarsRequiredByCuttingPlan = 0;

  if (input.calculationMode === "bar-mark") {
    assertPositive(
      "Cutting length",
      input.cuttingLengthM
    );
    assertPositiveWholeNumber(
      "Bar quantity",
      input.quantity
    );
    assertNonNegative(
      "Additional length per bar",
      input.additionalLengthPerBarM
    );

    const effectiveCuttingLengthM =
      input.cuttingLengthM +
      input.additionalLengthPerBarM;

    if (
      effectiveCuttingLengthM >
      input.stockBarLengthM
    ) {
      throw new Error(
        "Cutting length including additional length cannot exceed the stock bar length."
      );
    }

    basicLengthM =
      effectiveCuttingLengthM * input.quantity;

    const cutsPerStockBar = Math.floor(
      input.stockBarLengthM /
        effectiveCuttingLengthM
    );

    stockBarsRequiredByCuttingPlan = Math.ceil(
      input.quantity / cutsPerStockBar
    );

    quantity = input.quantity;
    cuttingLengthM = input.cuttingLengthM;
    additionalLengthPerBarM =
      input.additionalLengthPerBarM;
    directTotalLengthM = null;
  } else {
    assertPositive(
      "Direct total reinforcement length",
      input.directTotalLengthM
    );

    basicLengthM = input.directTotalLengthM;

    quantity = null;
    cuttingLengthM = null;
    additionalLengthPerBarM = null;
    directTotalLengthM =
      input.directTotalLengthM;
  }

  const wastageLengthM =
    basicLengthM * (input.wastagePercent / 100);

  const finalRequiredLengthM =
    basicLengthM + wastageLengthM;

  const unitWeightKgPerM =
    input.barDiameterMm ** 2 / 162;

  const totalWeightKg =
    finalRequiredLengthM * unitWeightKgPerM;

  const stockBarsRequiredByLength = Math.ceil(
    finalRequiredLengthM /
      input.stockBarLengthM
  );

  const stockBarQuantity =
    input.calculationMode === "bar-mark"
      ? Math.max(
          stockBarsRequiredByLength,
          stockBarsRequiredByCuttingPlan
        )
      : stockBarsRequiredByLength;

  const totalProcuredLengthM =
    stockBarQuantity * input.stockBarLengthM;

  const offcutOrExcessLengthM =
    totalProcuredLengthM -
    finalRequiredLengthM;

  const bindingWireWeightKg =
    totalWeightKg *
    (input.bindingWirePercent / 100);

  return {
    id: input.id,
    name: input.name,
    calculationMode: input.calculationMode,

    barDiameterMm: roundQuantity(
      input.barDiameterMm
    ),
    steelGrade: input.steelGrade ?? "high-yield",

    quantity,
    cuttingLengthM:
      cuttingLengthM === null
        ? null
        : roundQuantity(cuttingLengthM),
    additionalLengthPerBarM:
      additionalLengthPerBarM === null
        ? null
        : roundQuantity(
            additionalLengthPerBarM
          ),
    directTotalLengthM:
      directTotalLengthM === null
        ? null
        : roundQuantity(directTotalLengthM),

    basicLengthM: roundQuantity(basicLengthM),
    wastageLengthM: roundQuantity(
      wastageLengthM
    ),
    finalRequiredLengthM: roundQuantity(
      finalRequiredLengthM
    ),

    unitWeightKgPerM: roundQuantity(
      unitWeightKgPerM
    ),
    totalWeightKg: roundQuantity(
      totalWeightKg
    ),

    stockBarLengthM: roundQuantity(
      input.stockBarLengthM
    ),
    stockBarQuantity,
    totalProcuredLengthM: roundQuantity(
      totalProcuredLengthM
    ),
    offcutOrExcessLengthM: roundQuantity(
      offcutOrExcessLengthM
    ),

    bindingWireWeightKg: roundQuantity(
      bindingWireWeightKg
    ),
  };
}
