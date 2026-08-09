import { convertConcreteVolumeToMaterials } from "./material-converter";

import type {
  ConcreteElementCalculationInput,
  ConcreteElementCalculationResult,
  ConcreteElementMaterialCalculationResult,
  ConcreteMixSpecification,
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

export function calculateConcreteElementVolume(
  input: ConcreteElementCalculationInput
): ConcreteElementCalculationResult {
  assertNonNegative(
    "Concrete wastage",
    input.wastagePercent
  );

  let basicConcreteVolumeM3: number;
  let quantity: number;
  let dimensionLengthM: number | null;
  let dimensionWidthM: number | null;
  let dimensionDepthOrHeightM: number | null;
  let directVolumeM3: number | null;

  if (input.calculationMode === "dimensions") {
    assertPositive(
      "Element length",
      input.dimensionLengthM
    );
    assertPositive(
      "Element width",
      input.dimensionWidthM
    );
    assertPositive(
      "Element depth or height",
      input.dimensionDepthOrHeightM
    );

    if (
      !Number.isInteger(input.quantity) ||
      input.quantity <= 0
    ) {
      throw new Error(
        "Element quantity must be a positive whole number."
      );
    }

    basicConcreteVolumeM3 =
      input.dimensionLengthM *
      input.dimensionWidthM *
      input.dimensionDepthOrHeightM *
      input.quantity;

    quantity = input.quantity;
    dimensionLengthM = input.dimensionLengthM;
    dimensionWidthM = input.dimensionWidthM;
    dimensionDepthOrHeightM =
      input.dimensionDepthOrHeightM;
    directVolumeM3 = null;
  } else {
    assertPositive(
      "Direct concrete volume",
      input.directVolumeM3
    );

    basicConcreteVolumeM3 = input.directVolumeM3;
    quantity = 1;
    dimensionLengthM = null;
    dimensionWidthM = null;
    dimensionDepthOrHeightM = null;
    directVolumeM3 = input.directVolumeM3;
  }

  const wastageConcreteVolumeM3 =
    basicConcreteVolumeM3 *
    (input.wastagePercent / 100);

  const finalConcreteVolumeM3 =
    basicConcreteVolumeM3 +
    wastageConcreteVolumeM3;

  return {
    id: input.id,
    name: input.name,
    elementType: input.elementType,
    calculationMode: input.calculationMode,
    quantity,
    dimensionLengthM:
      dimensionLengthM === null
        ? null
        : roundQuantity(dimensionLengthM),
    dimensionWidthM:
      dimensionWidthM === null
        ? null
        : roundQuantity(dimensionWidthM),
    dimensionDepthOrHeightM:
      dimensionDepthOrHeightM === null
        ? null
        : roundQuantity(dimensionDepthOrHeightM),
    directVolumeM3:
      directVolumeM3 === null
        ? null
        : roundQuantity(directVolumeM3),
    concreteMixId: input.concreteMixId,
    basicConcreteVolumeM3: roundQuantity(
      basicConcreteVolumeM3
    ),
    wastageConcreteVolumeM3: roundQuantity(
      wastageConcreteVolumeM3
    ),
    finalConcreteVolumeM3: roundQuantity(
      finalConcreteVolumeM3
    ),
  };
}

export function calculateConcreteElementMaterials(
  input: {
    element: ConcreteElementCalculationInput;
    mix: ConcreteMixSpecification;
  }
): ConcreteElementMaterialCalculationResult {
  const { element, mix } = input;

  if (element.concreteMixId !== mix.id) {
    throw new Error(
      `Concrete element mix "${element.concreteMixId}" does not match supplied mix "${mix.id}".`
    );
  }

  const elementResult =
    calculateConcreteElementVolume(element);

  const materialResult =
    convertConcreteVolumeToMaterials({
      wetVolumeM3:
        elementResult.finalConcreteVolumeM3,
      mix,
    });

  return {
    element: elementResult,
    materials: materialResult,
  };
}