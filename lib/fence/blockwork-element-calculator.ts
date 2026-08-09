import { convertMortarVolumeToMaterials } from "./material-converter";

import type {
  BlockworkElementCalculationInput,
  BlockworkElementCalculationResult,
  BlockworkElementMaterialCalculationResult,
  MortarMixSpecification,
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

export function calculateBlockworkElement(
  input: BlockworkElementCalculationInput
): BlockworkElementCalculationResult {
  const { blockSpecification } = input;

  assertPositive(
    "Block length",
    blockSpecification.lengthMm
  );
  assertPositive(
    "Block height",
    blockSpecification.heightMm
  );
  assertPositive(
    "Blocks per square metre",
    blockSpecification.blocksPerSquareMetre
  );

  assertNonNegative(
    "Block wastage",
    input.blockWastagePercent
  );
  assertNonNegative(
    "Mortar volume per unit",
    input.mortarVolumePerUnitM3
  );
  assertNonNegative(
    "Mortar wastage",
    input.mortarWastagePercent
  );

  let wallLengthM: number | null;
  let wallHeightM: number | null;
  let grossWallAreaM2: number;
  let openingAreaM2: number;
  let directAreaM2: number | null;
  let netBlockworkAreaM2: number;

  if (input.calculationMode === "dimensions") {
    assertPositive("Wall length", input.wallLengthM);
    assertPositive("Wall height", input.wallHeightM);
    assertNonNegative(
      "Opening area",
      input.openingAreaM2
    );

    grossWallAreaM2 =
      input.wallLengthM * input.wallHeightM;

    if (input.openingAreaM2 > grossWallAreaM2) {
      throw new Error(
        "Opening area cannot exceed gross wall area."
      );
    }

    netBlockworkAreaM2 =
      grossWallAreaM2 - input.openingAreaM2;

    wallLengthM = input.wallLengthM;
    wallHeightM = input.wallHeightM;
    openingAreaM2 = input.openingAreaM2;
    directAreaM2 = null;
  } else {
    assertPositive(
      "Direct blockwork area",
      input.directAreaM2
    );

    grossWallAreaM2 = input.directAreaM2;
    openingAreaM2 = 0;
    netBlockworkAreaM2 = input.directAreaM2;

    wallLengthM = null;
    wallHeightM = null;
    directAreaM2 = input.directAreaM2;
  }

  const basicBlockQuantity =
    netBlockworkAreaM2 *
    blockSpecification.blocksPerSquareMetre;

  const finalBlockQuantity = Math.ceil(
    basicBlockQuantity *
      (1 + input.blockWastagePercent / 100)
  );

  const wastageBlockQuantity =
    finalBlockQuantity - basicBlockQuantity;

  const basicMortarVolumeM3 =
    input.mortarCalculationBasis === "per-block"
      ? basicBlockQuantity *
        input.mortarVolumePerUnitM3
      : netBlockworkAreaM2 *
        input.mortarVolumePerUnitM3;

  const wastageMortarVolumeM3 =
    basicMortarVolumeM3 *
    (input.mortarWastagePercent / 100);

  const finalMortarVolumeM3 =
    basicMortarVolumeM3 +
    wastageMortarVolumeM3;

  return {
    id: input.id,
    name: input.name,
    calculationMode: input.calculationMode,
    blockSpecificationId:
      input.blockSpecificationId,

    wallLengthM:
      wallLengthM === null
        ? null
        : roundQuantity(wallLengthM),
    wallHeightM:
      wallHeightM === null
        ? null
        : roundQuantity(wallHeightM),

    grossWallAreaM2: roundQuantity(
      grossWallAreaM2
    ),
    openingAreaM2: roundQuantity(openingAreaM2),
    directAreaM2:
      directAreaM2 === null
        ? null
        : roundQuantity(directAreaM2),
    netBlockworkAreaM2: roundQuantity(
      netBlockworkAreaM2
    ),

    basicBlockQuantity: roundQuantity(
      basicBlockQuantity
    ),
    wastageBlockQuantity: roundQuantity(
      wastageBlockQuantity
    ),
    finalBlockQuantity,

    mortarCalculationBasis:
      input.mortarCalculationBasis,
    basicMortarVolumeM3: roundQuantity(
      basicMortarVolumeM3
    ),
    wastageMortarVolumeM3: roundQuantity(
      wastageMortarVolumeM3
    ),
    finalMortarVolumeM3: roundQuantity(
      finalMortarVolumeM3
    ),
    mortarMixId: input.mortarMixId,
  };
}

export function calculateBlockworkElementMaterials(
  input: {
    element: BlockworkElementCalculationInput;
    mortarMix: MortarMixSpecification;
  }
): BlockworkElementMaterialCalculationResult {
  const { element, mortarMix } = input;

  if (element.mortarMixId !== mortarMix.id) {
    throw new Error(
      `Blockwork mortar mix "${element.mortarMixId}" does not match supplied mix "${mortarMix.id}".`
    );
  }

  const blockworkResult =
    calculateBlockworkElement(element);

  const mortarMaterialResult =
    convertMortarVolumeToMaterials({
      wetVolumeM3:
        blockworkResult.finalMortarVolumeM3,
      mix: mortarMix,
    });

  return {
    blockwork: blockworkResult,
    mortarMaterials: mortarMaterialResult,
  };
}