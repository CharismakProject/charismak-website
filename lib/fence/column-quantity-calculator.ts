import type {
  BlockPillarColumnQuantityResult,
  BlockPillarColumnSpecification,
  ReinforcedConcreteColumnQuantityResult,
  ReinforcedConcreteColumnSpecification,
} from "./types";
const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

const calculateBarWeightKg = (
  lengthM: number,
  diameterMm: number
): number => lengthM * (diameterMm ** 2 / 162);

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

export function calculateReinforcedConcreteColumnQuantities(
  input: {
    columnCount: number;
    specification: ReinforcedConcreteColumnSpecification;
  }
): ReinforcedConcreteColumnQuantityResult {
  const { columnCount, specification } = input;

  if (!Number.isInteger(columnCount) || columnCount <= 0) {
    throw new Error(
      "Column count must be a positive whole number."
    );
  }

  assertPositive(
    "Column width",
    specification.widthAlongFenceM
  );
  assertPositive("Column depth", specification.depthM);
  assertPositive("Column height", specification.heightM);

  if (
    !Number.isInteger(specification.mainBarCount) ||
    specification.mainBarCount <= 0
  ) {
    throw new Error(
      "Main-bar count must be a positive whole number."
    );
  }

  assertPositive(
    "Main-bar diameter",
    specification.mainBarDiameterMm
  );
  assertNonNegative(
    "Main-bar extra length",
    specification.mainBarExtraLengthM
  );
  assertPositive(
    "Link-bar diameter",
    specification.linkBarDiameterMm
  );
  assertPositive(
    "Link spacing",
    specification.linkSpacingM
  );
  assertNonNegative(
    "Link hook allowance",
    specification.linkHookAllowanceM
  );
  assertNonNegative(
    "Concrete cover",
    specification.concreteCoverMm
  );

  assertNonNegative(
    "Concrete wastage",
    specification.concreteWastagePercent
  );
  assertNonNegative(
    "Reinforcement wastage",
    specification.reinforcementWastagePercent
  );
  assertNonNegative(
    "Formwork wastage",
    specification.formworkWastagePercent
  );
  assertNonNegative(
    "Binding-wire percentage",
    specification.bindingWirePercentOfReinforcementWeight
  );

  const widthFaceCount =
    specification.formedWidthFaceCount;
  const depthFaceCount =
    specification.formedDepthFaceCount;

  if (
    !Number.isInteger(widthFaceCount) ||
    widthFaceCount < 0 ||
    widthFaceCount > 2 ||
    !Number.isInteger(depthFaceCount) ||
    depthFaceCount < 0 ||
    depthFaceCount > 2
  ) {
    throw new Error(
      "Formwork face counts must be whole numbers from zero to two."
    );
  }

  const basicConcreteVolumeM3 =
    columnCount *
    specification.widthAlongFenceM *
    specification.depthM *
    specification.heightM;

  const wastageConcreteVolumeM3 =
    basicConcreteVolumeM3 *
    (specification.concreteWastagePercent / 100);

  const finalConcreteVolumeM3 =
    basicConcreteVolumeM3 + wastageConcreteVolumeM3;

  const basicMainBarLengthM =
    columnCount *
    specification.mainBarCount *
    (specification.heightM +
      specification.mainBarExtraLengthM);

  const wastageMainBarLengthM =
    basicMainBarLengthM *
    (specification.reinforcementWastagePercent / 100);

  const finalMainBarLengthM =
    basicMainBarLengthM + wastageMainBarLengthM;

  const finalMainBarWeightKg = calculateBarWeightKg(
    finalMainBarLengthM,
    specification.mainBarDiameterMm
  );

  const concreteCoverM =
    specification.concreteCoverMm / 1000;

  const halfLinkBarDiameterM =
    specification.linkBarDiameterMm / 2000;

  const linkWidthM =
    specification.widthAlongFenceM -
    2 * (concreteCoverM + halfLinkBarDiameterM);

  const linkDepthM =
    specification.depthM -
    2 * (concreteCoverM + halfLinkBarDiameterM);

  if (linkWidthM <= 0 || linkDepthM <= 0) {
    throw new Error(
      "Concrete cover and link diameter leave no valid link dimensions."
    );
  }

  const lengthPerLinkM =
    2 * (linkWidthM + linkDepthM) +
    specification.linkHookAllowanceM;

  const linksPerColumn =
    Math.ceil(
      specification.heightM /
        specification.linkSpacingM
    ) + 1;

  const totalLinkQuantity =
    columnCount * linksPerColumn;

  const basicLinkBarLengthM =
    totalLinkQuantity * lengthPerLinkM;

  const wastageLinkBarLengthM =
    basicLinkBarLengthM *
    (specification.reinforcementWastagePercent / 100);

  const finalLinkBarLengthM =
    basicLinkBarLengthM + wastageLinkBarLengthM;

  const finalLinkBarWeightKg = calculateBarWeightKg(
    finalLinkBarLengthM,
    specification.linkBarDiameterMm
  );

  const totalReinforcementWeightKg =
    finalMainBarWeightKg + finalLinkBarWeightKg;

  const bindingWireWeightKg =
    totalReinforcementWeightKg *
    (specification.bindingWirePercentOfReinforcementWeight /
      100);

  const basicFormworkAreaM2 =
    columnCount *
    specification.heightM *
    (specification.widthAlongFenceM * widthFaceCount +
      specification.depthM * depthFaceCount);

  const wastageFormworkAreaM2 =
    basicFormworkAreaM2 *
    (specification.formworkWastagePercent / 100);

  const finalFormworkAreaM2 =
    basicFormworkAreaM2 + wastageFormworkAreaM2;

  return {
    constructionSystem: "reinforced-concrete",
    specificationId: specification.id,
    columnCount,
    totalColumnWidthM: roundQuantity(
      columnCount * specification.widthAlongFenceM
    ),
    concreteMixId: specification.concreteMixId,

    basicConcreteVolumeM3: roundQuantity(
      basicConcreteVolumeM3
    ),
    wastageConcreteVolumeM3: roundQuantity(
      wastageConcreteVolumeM3
    ),
    finalConcreteVolumeM3: roundQuantity(
      finalConcreteVolumeM3
    ),

    mainBarDiameterMm: specification.mainBarDiameterMm,
    basicMainBarLengthM: roundQuantity(
      basicMainBarLengthM
    ),
    wastageMainBarLengthM: roundQuantity(
      wastageMainBarLengthM
    ),
    finalMainBarLengthM: roundQuantity(
      finalMainBarLengthM
    ),
    finalMainBarWeightKg: roundQuantity(
      finalMainBarWeightKg
    ),

    linkBarDiameterMm: specification.linkBarDiameterMm,
    linksPerColumn,
    totalLinkQuantity,
    lengthPerLinkM: roundQuantity(lengthPerLinkM),
    basicLinkBarLengthM: roundQuantity(
      basicLinkBarLengthM
    ),
    wastageLinkBarLengthM: roundQuantity(
      wastageLinkBarLengthM
    ),
    finalLinkBarLengthM: roundQuantity(
      finalLinkBarLengthM
    ),
    finalLinkBarWeightKg: roundQuantity(
      finalLinkBarWeightKg
    ),

    totalReinforcementWeightKg: roundQuantity(
      totalReinforcementWeightKg
    ),
    bindingWireWeightKg: roundQuantity(
      bindingWireWeightKg
    ),

    basicFormworkAreaM2: roundQuantity(
      basicFormworkAreaM2
    ),
    wastageFormworkAreaM2: roundQuantity(
      wastageFormworkAreaM2
    ),
    finalFormworkAreaM2: roundQuantity(
      finalFormworkAreaM2
    ),
  };
}

export function calculateBlockPillarColumnQuantities(
  input: {
    columnCount: number;
    specification: BlockPillarColumnSpecification;
  }
): BlockPillarColumnQuantityResult {
  const { columnCount, specification } = input;

  if (!Number.isInteger(columnCount) || columnCount <= 0) {
    throw new Error(
      "Column count must be a positive whole number."
    );
  }

  assertPositive(
    "Pillar width",
    specification.widthAlongFenceM
  );
  assertPositive("Pillar depth", specification.depthM);
  assertPositive("Pillar height", specification.heightM);
  assertPositive(
    "Blocks per course",
    specification.blocksPerCourse
  );
  assertPositive(
    "Course height",
    specification.courseHeightM
  );

  assertNonNegative(
    "Mortar volume per block",
    specification.mortarVolumePerBlockM3
  );
  assertNonNegative(
    "Concrete-infill volume per metre",
    specification.concreteInfillVolumePerMetreHeightM3
  );
  assertNonNegative(
    "Vertical-bar extra length",
    specification.verticalBarExtraLengthM
  );

  if (
    !Number.isInteger(specification.verticalBarCount) ||
    specification.verticalBarCount < 0
  ) {
    throw new Error(
      "Vertical-bar count must be a non-negative whole number."
    );
  }

  if (specification.verticalBarCount > 0) {
    assertPositive(
      "Vertical-bar diameter",
      specification.verticalBarDiameterMm
    );
  } else {
    assertNonNegative(
      "Vertical-bar diameter",
      specification.verticalBarDiameterMm
    );
  }

  assertNonNegative(
    "Block wastage",
    specification.blockWastagePercent
  );
  assertNonNegative(
    "Mortar wastage",
    specification.mortarWastagePercent
  );
  assertNonNegative(
    "Concrete-infill wastage",
    specification.concreteInfillWastagePercent
  );
  assertNonNegative(
    "Reinforcement wastage",
    specification.reinforcementWastagePercent
  );
  assertNonNegative(
    "Binding-wire percentage",
    specification.bindingWirePercentOfReinforcementWeight
  );

  const coursesPerColumn = Math.ceil(
    specification.heightM / specification.courseHeightM
  );

  const constructedHeightM =
    coursesPerColumn * specification.courseHeightM;

  const basicBlockQuantity =
    columnCount *
    coursesPerColumn *
    specification.blocksPerCourse;

  const finalBlockQuantity = Math.ceil(
    basicBlockQuantity *
      (1 + specification.blockWastagePercent / 100)
  );

  const wastageBlockQuantity =
    finalBlockQuantity - basicBlockQuantity;

  const basicMortarVolumeM3 =
    basicBlockQuantity *
    specification.mortarVolumePerBlockM3;

  const wastageMortarVolumeM3 =
    basicMortarVolumeM3 *
    (specification.mortarWastagePercent / 100);

  const finalMortarVolumeM3 =
    basicMortarVolumeM3 + wastageMortarVolumeM3;

  const basicConcreteInfillVolumeM3 =
    specification.concreteInfill === "none"
      ? 0
      : columnCount *
        constructedHeightM *
        specification.concreteInfillVolumePerMetreHeightM3;

  const wastageConcreteInfillVolumeM3 =
    basicConcreteInfillVolumeM3 *
    (specification.concreteInfillWastagePercent / 100);

  const finalConcreteInfillVolumeM3 =
    basicConcreteInfillVolumeM3 +
    wastageConcreteInfillVolumeM3;

  const basicVerticalBarLengthM =
    columnCount *
    specification.verticalBarCount *
    (constructedHeightM +
      specification.verticalBarExtraLengthM);

  const wastageVerticalBarLengthM =
    basicVerticalBarLengthM *
    (specification.reinforcementWastagePercent / 100);

  const finalVerticalBarLengthM =
    basicVerticalBarLengthM +
    wastageVerticalBarLengthM;

  const finalVerticalBarWeightKg =
    specification.verticalBarCount === 0
      ? 0
      : calculateBarWeightKg(
          finalVerticalBarLengthM,
          specification.verticalBarDiameterMm
        );

  const bindingWireWeightKg =
    finalVerticalBarWeightKg *
    (specification.bindingWirePercentOfReinforcementWeight /
      100);

  return {
    constructionSystem: "block-pillar",
    specificationId: specification.id,
    columnCount,
    totalColumnWidthM: roundQuantity(
      columnCount * specification.widthAlongFenceM
    ),
    blockSpecificationId:
      specification.blockSpecificationId,

    coursesPerColumn,
    constructedHeightM: roundQuantity(constructedHeightM),
    basicBlockQuantity: roundQuantity(basicBlockQuantity),
    wastageBlockQuantity: roundQuantity(
      wastageBlockQuantity
    ),
    finalBlockQuantity,

    basicMortarVolumeM3: roundQuantity(
      basicMortarVolumeM3
    ),
    wastageMortarVolumeM3: roundQuantity(
      wastageMortarVolumeM3
    ),
    finalMortarVolumeM3: roundQuantity(
      finalMortarVolumeM3
    ),

    basicConcreteInfillVolumeM3: roundQuantity(
      basicConcreteInfillVolumeM3
    ),
    wastageConcreteInfillVolumeM3: roundQuantity(
      wastageConcreteInfillVolumeM3
    ),
    finalConcreteInfillVolumeM3: roundQuantity(
      finalConcreteInfillVolumeM3
    ),

    verticalBarDiameterMm:
      specification.verticalBarDiameterMm,
    basicVerticalBarLengthM: roundQuantity(
      basicVerticalBarLengthM
    ),
    wastageVerticalBarLengthM: roundQuantity(
      wastageVerticalBarLengthM
    ),
    finalVerticalBarLengthM: roundQuantity(
      finalVerticalBarLengthM
    ),
    finalVerticalBarWeightKg: roundQuantity(
      finalVerticalBarWeightKg
    ),
    bindingWireWeightKg: roundQuantity(
      bindingWireWeightKg
    ),
  };
}