import type {
  ExcavationCalculationInput,
  ExcavationCalculationResult,
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

const assertPercentage = (
  name: string,
  value: number
): void => {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `${name} must be between zero and one hundred.`
    );
  }
};

export function calculateExcavation(
  input: ExcavationCalculationInput
): ExcavationCalculationResult {
  assertNonNegative(
    "Over-excavation percentage",
    input.overExcavationPercent
  );
  assertNonNegative(
    "Permanent construction volume",
    input.permanentConstructionVolumeM3
  );
  assertPercentage(
    "Reusable soil percentage",
    input.reusableSoilPercent
  );
  assertNonNegative(
    "Bulking percentage",
    input.bulkingPercent
  );

  let lengthM: number | null;
  let widthM: number | null;
  let depthM: number | null;
  let quantity: number | null;
  let directExcavationVolumeM3: number | null;

  let basicExcavationVolumeM3: number;

  if (input.calculationMode === "dimensions") {
    assertPositive(
      "Excavation length",
      input.lengthM
    );
    assertPositive(
      "Excavation width",
      input.widthM
    );
    assertPositive(
      "Excavation depth",
      input.depthM
    );
    assertPositiveWholeNumber(
      "Excavation quantity",
      input.quantity
    );

    basicExcavationVolumeM3 =
      input.lengthM *
      input.widthM *
      input.depthM *
      input.quantity;

    lengthM = input.lengthM;
    widthM = input.widthM;
    depthM = input.depthM;
    quantity = input.quantity;
    directExcavationVolumeM3 = null;
  } else {
    assertPositive(
      "Direct excavation volume",
      input.directExcavationVolumeM3
    );

    basicExcavationVolumeM3 =
      input.directExcavationVolumeM3;

    lengthM = null;
    widthM = null;
    depthM = null;
    quantity = null;
    directExcavationVolumeM3 =
      input.directExcavationVolumeM3;
  }

  const overExcavationVolumeM3 =
    basicExcavationVolumeM3 *
    (input.overExcavationPercent / 100);

  const finalExcavationVolumeM3 =
    basicExcavationVolumeM3 +
    overExcavationVolumeM3;

  const backfillRequiredM3 = Math.max(
    finalExcavationVolumeM3 -
      input.permanentConstructionVolumeM3,
    0
  );

  const reusableExcavatedSoilAvailableM3 =
    finalExcavationVolumeM3 *
    (input.reusableSoilPercent / 100);

  const excavatedSoilUsedForBackfillM3 = Math.min(
    backfillRequiredM3,
    reusableExcavatedSoilAvailableM3
  );

  const importedFillRequiredM3 = Math.max(
    backfillRequiredM3 -
      excavatedSoilUsedForBackfillM3,
    0
  );

  const surplusExcavatedSoilM3 = Math.max(
    finalExcavationVolumeM3 -
      excavatedSoilUsedForBackfillM3,
    0
  );

  const looseDisposalVolumeM3 =
    surplusExcavatedSoilM3 *
    (1 + input.bulkingPercent / 100);

  return {
    id: input.id,
    name: input.name,

    calculationMode: input.calculationMode,
    application: input.application,
    groundCondition: input.groundCondition,

    lengthM:
      lengthM === null
        ? null
        : roundQuantity(lengthM),
    widthM:
      widthM === null
        ? null
        : roundQuantity(widthM),
    depthM:
      depthM === null
        ? null
        : roundQuantity(depthM),
    quantity,
    directExcavationVolumeM3:
      directExcavationVolumeM3 === null
        ? null
        : roundQuantity(
            directExcavationVolumeM3
          ),

    basicExcavationVolumeM3: roundQuantity(
      basicExcavationVolumeM3
    ),
    overExcavationVolumeM3: roundQuantity(
      overExcavationVolumeM3
    ),
    finalExcavationVolumeM3: roundQuantity(
      finalExcavationVolumeM3
    ),

    permanentConstructionVolumeM3:
      roundQuantity(
        input.permanentConstructionVolumeM3
      ),
    backfillRequiredM3: roundQuantity(
      backfillRequiredM3
    ),

    reusableExcavatedSoilAvailableM3:
      roundQuantity(
        reusableExcavatedSoilAvailableM3
      ),
    excavatedSoilUsedForBackfillM3:
      roundQuantity(
        excavatedSoilUsedForBackfillM3
      ),
    importedFillRequiredM3: roundQuantity(
      importedFillRequiredM3
    ),

    surplusExcavatedSoilM3: roundQuantity(
      surplusExcavatedSoilM3
    ),
    looseDisposalVolumeM3: roundQuantity(
      looseDisposalVolumeM3
    ),
  };
}