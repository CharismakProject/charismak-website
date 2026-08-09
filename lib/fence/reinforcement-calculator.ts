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