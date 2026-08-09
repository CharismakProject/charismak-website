import type {
  ConcreteMaterialConversionResult,
  ConcreteMixSpecification,
  MortarMaterialConversionResult,
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

export function convertConcreteVolumeToMaterials(
  input: {
    wetVolumeM3: number;
    mix: ConcreteMixSpecification;
  }
): ConcreteMaterialConversionResult {
  const { wetVolumeM3, mix } = input;

  assertNonNegative("Wet concrete volume", wetVolumeM3);

  if (mix.calculationMethod === "ratio-based") {
    assertPositive("Cement ratio", mix.cementRatio);
    assertPositive("Sand ratio", mix.sandRatio);
    assertNonNegative(
      "Coarse-aggregate ratio",
      mix.coarseAggregateRatio
    );
    assertPositive(
      "Dry-volume factor",
      mix.dryVolumeFactor
    );
    assertPositive(
      "Cement-bag weight",
      mix.cementBagWeightKg
    );
    assertPositive(
      "Cement-bag volume",
      mix.cementBagVolumeM3
    );
    assertNonNegative(
      "Water-cement ratio",
      mix.waterCementRatioByWeight
    );

    const totalMixRatio =
      mix.cementRatio +
      mix.sandRatio +
      mix.coarseAggregateRatio;
    assertPositive("Total concrete mix ratio", totalMixRatio);

    const dryVolumeM3 =
      wetVolumeM3 * mix.dryVolumeFactor;

    const cementVolumeM3 =
      dryVolumeM3 * (mix.cementRatio / totalMixRatio);

    const sandVolumeM3 =
      dryVolumeM3 * (mix.sandRatio / totalMixRatio);

    const coarseAggregateVolumeM3 =
      dryVolumeM3 *
      (mix.coarseAggregateRatio / totalMixRatio);

    const calculatedCementBagQuantity =
      cementVolumeM3 / mix.cementBagVolumeM3;

    const cementWeightKg =
      calculatedCementBagQuantity *
      mix.cementBagWeightKg;

    const waterLitres =
      cementWeightKg * mix.waterCementRatioByWeight;

    return {
      materialType: "concrete",
      mixId: mix.id,
      calculationMethod: mix.calculationMethod,
      wetVolumeM3: roundQuantity(wetVolumeM3),
      dryVolumeM3: roundQuantity(dryVolumeM3),
      cementVolumeM3: roundQuantity(cementVolumeM3),
      calculatedCementBagQuantity: roundQuantity(
        calculatedCementBagQuantity
      ),
      cementWeightKg: roundQuantity(cementWeightKg),
      sandVolumeM3: roundQuantity(sandVolumeM3),
      coarseAggregateVolumeM3: roundQuantity(
        coarseAggregateVolumeM3
      ),
      waterLitres: roundQuantity(waterLitres),
    };
  }

  assertPositive(
    "Cement bags per cubic metre",
    mix.cementBagsPerM3
  );
  assertPositive(
    "Cement-bag weight",
    mix.cementBagWeightKg
  );
  assertNonNegative(
    "Sand coefficient",
    mix.sandVolumeM3PerM3
  );
  assertNonNegative(
    "Coarse-aggregate coefficient",
    mix.coarseAggregateVolumeM3PerM3
  );
  assertNonNegative(
    "Water coefficient",
    mix.waterLitresPerM3
  );

  const calculatedCementBagQuantity =
    wetVolumeM3 * mix.cementBagsPerM3;

  const cementWeightKg =
    calculatedCementBagQuantity *
    mix.cementBagWeightKg;

  const sandVolumeM3 =
    wetVolumeM3 * mix.sandVolumeM3PerM3;

  const coarseAggregateVolumeM3 =
    wetVolumeM3 *
    mix.coarseAggregateVolumeM3PerM3;

  const waterLitres =
    wetVolumeM3 * mix.waterLitresPerM3;

  return {
    materialType: "concrete",
    mixId: mix.id,
    calculationMethod: mix.calculationMethod,
    wetVolumeM3: roundQuantity(wetVolumeM3),
    dryVolumeM3: null,
    cementVolumeM3: null,
    calculatedCementBagQuantity: roundQuantity(
      calculatedCementBagQuantity
    ),
    cementWeightKg: roundQuantity(cementWeightKg),
    sandVolumeM3: roundQuantity(sandVolumeM3),
    coarseAggregateVolumeM3: roundQuantity(
      coarseAggregateVolumeM3
    ),
    waterLitres: roundQuantity(waterLitres),
  };
}

export function convertMortarVolumeToMaterials(
  input: {
    wetVolumeM3: number;
    mix: MortarMixSpecification;
  }
): MortarMaterialConversionResult {
  const { wetVolumeM3, mix } = input;

  assertNonNegative("Wet mortar volume", wetVolumeM3);

  if (mix.calculationMethod === "ratio-based") {
    assertPositive("Cement ratio", mix.cementRatio);
    assertPositive("Sand ratio", mix.sandRatio);
    assertPositive(
      "Dry-volume factor",
      mix.dryVolumeFactor
    );
    assertPositive(
      "Cement-bag weight",
      mix.cementBagWeightKg
    );
    assertPositive(
      "Cement-bag volume",
      mix.cementBagVolumeM3
    );
    assertNonNegative(
      "Water-cement ratio",
      mix.waterCementRatioByWeight
    );

    const totalMixRatio =
      mix.cementRatio + mix.sandRatio;

    const dryVolumeM3 =
      wetVolumeM3 * mix.dryVolumeFactor;

    const cementVolumeM3 =
      dryVolumeM3 * (mix.cementRatio / totalMixRatio);

    const sandVolumeM3 =
      dryVolumeM3 * (mix.sandRatio / totalMixRatio);

    const calculatedCementBagQuantity =
      cementVolumeM3 / mix.cementBagVolumeM3;

    const cementWeightKg =
      calculatedCementBagQuantity *
      mix.cementBagWeightKg;

    const waterLitres =
      cementWeightKg * mix.waterCementRatioByWeight;

    return {
      materialType: "mortar",
      mixId: mix.id,
      calculationMethod: mix.calculationMethod,
      wetVolumeM3: roundQuantity(wetVolumeM3),
      dryVolumeM3: roundQuantity(dryVolumeM3),
      cementVolumeM3: roundQuantity(cementVolumeM3),
      calculatedCementBagQuantity: roundQuantity(
        calculatedCementBagQuantity
      ),
      cementWeightKg: roundQuantity(cementWeightKg),
      sandVolumeM3: roundQuantity(sandVolumeM3),
      waterLitres: roundQuantity(waterLitres),
    };
  }

  assertPositive(
    "Cement bags per cubic metre",
    mix.cementBagsPerM3
  );
  assertPositive(
    "Cement-bag weight",
    mix.cementBagWeightKg
  );
  assertNonNegative(
    "Sand coefficient",
    mix.sandVolumeM3PerM3
  );
  assertNonNegative(
    "Water coefficient",
    mix.waterLitresPerM3
  );

  const calculatedCementBagQuantity =
    wetVolumeM3 * mix.cementBagsPerM3;

  const cementWeightKg =
    calculatedCementBagQuantity *
    mix.cementBagWeightKg;

  const sandVolumeM3 =
    wetVolumeM3 * mix.sandVolumeM3PerM3;

  const waterLitres =
    wetVolumeM3 * mix.waterLitresPerM3;

  return {
    materialType: "mortar",
    mixId: mix.id,
    calculationMethod: mix.calculationMethod,
    wetVolumeM3: roundQuantity(wetVolumeM3),
    dryVolumeM3: null,
    cementVolumeM3: null,
    calculatedCementBagQuantity: roundQuantity(
      calculatedCementBagQuantity
    ),
    cementWeightKg: roundQuantity(cementWeightKg),
    sandVolumeM3: roundQuantity(sandVolumeM3),
    waterLitres: roundQuantity(waterLitres),
  };
}
