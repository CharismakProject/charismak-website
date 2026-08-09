import type {
  BlockworkCalculationInput,
  BlockworkCalculationResult,
} from "./types";

/**
 * Confirms that a value is a valid number and is not negative.
 */
function validateNonNegativeNumber(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a valid non-negative number.`);
  }
}

/**
 * Confirms that a value is a valid number and is greater than zero.
 */
function validatePositiveNumber(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }
}

/**
 * Calculates the visible blockwork required for a perimeter fence.
 *
 * Foundation blockwork is not included here. It will be calculated
 * separately when the foundation system has been approved.
 */
export function calculateVisibleBlockwork(
  input: BlockworkCalculationInput,
): BlockworkCalculationResult {
  const {
    totalPerimeterLengthM,
    totalGateOpeningWidthM,
    totalColumnWidthM,
    fenceHeightM,
    wastagePercent,
    blockSpecification,
  } = input;

  validatePositiveNumber(
    "Total perimeter length",
    totalPerimeterLengthM,
  );

  validateNonNegativeNumber(
    "Total gate-opening width",
    totalGateOpeningWidthM,
  );

  validateNonNegativeNumber(
    "Total column width",
    totalColumnWidthM,
  );

  validatePositiveNumber("Fence height", fenceHeightM);

  validateNonNegativeNumber(
    "Wastage percentage",
    wastagePercent,
  );

  validatePositiveNumber(
    "Blocks per square metre",
    blockSpecification.blocksPerSquareMetre,
  );

  const totalDeductionsM =
    totalGateOpeningWidthM + totalColumnWidthM;

  if (totalDeductionsM > totalPerimeterLengthM) {
    throw new Error(
      "Gate openings and column widths cannot exceed the total perimeter length.",
    );
  }

  const netBlockPanelLengthM =
    totalPerimeterLengthM - totalDeductionsM;

  const netBlockworkAreaM2 =
    netBlockPanelLengthM * fenceHeightM;

  const basicBlockQuantity =
    netBlockworkAreaM2 *
    blockSpecification.blocksPerSquareMetre;

  const wastageBlockQuantity =
    basicBlockQuantity * (wastagePercent / 100);

  const finalBlockQuantity = Math.ceil(
    basicBlockQuantity + wastageBlockQuantity,
  );

  return {
    netBlockPanelLengthM,
    netBlockworkAreaM2,
    basicBlockQuantity,
    wastageBlockQuantity,
    finalBlockQuantity,
  };
}