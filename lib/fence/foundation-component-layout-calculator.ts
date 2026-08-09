import { calculateFenceFoundationLayout } from "./foundation-layout-calculator";

import type {
  FenceFoundationBaseIntervalInput,
  FenceFoundationComponentLayoutInput,
  FenceFoundationComponentLayoutResult,
  FenceFoundationResolvedBasePlacement,
  FenceFoundationBaseQuantitySpecification,
} from "./types";

type ComponentName =
  | "excavation"
  | "blinding"
  | "structural";

const createComponentInterval = (
  placement: FenceFoundationResolvedBasePlacement,
  specification:
    FenceFoundationBaseQuantitySpecification,
  componentName: ComponentName,
  componentLengthM: number,
  grossSectionLengthM: number
): FenceFoundationBaseIntervalInput | null => {
  if (
    !Number.isFinite(componentLengthM) ||
    componentLengthM < 0
  ) {
    throw new Error(
      `Foundation "${specification.name}" ${componentName} length cannot be negative.`
    );
  }

  if (componentLengthM === 0) {
    return null;
  }

  if (
    componentName !== "structural" &&
    componentLengthM <
      specification.lengthAlongFenceM
  ) {
    throw new Error(
      `Foundation "${specification.name}" ${componentName} length cannot be smaller than its concrete-base length.`
    );
  }

  const rawStartM =
    placement.centrePositionM -
    componentLengthM / 2;

  const rawEndM =
    placement.centrePositionM +
    componentLengthM / 2;

  return {
    id: `${placement.id}-${componentName}`,
    name: `${placement.name} ${componentName}`,

    supportedColumnId:
      placement.supportedColumnId,
    foundationSpecificationId:
      specification.id,

    startM: Math.max(0, rawStartM),
    endM: Math.min(
      grossSectionLengthM,
      rawEndM
    ),
  };
};

export function calculateFenceFoundationComponentLayouts(
  input: FenceFoundationComponentLayoutInput
): FenceFoundationComponentLayoutResult {
  const specificationsById = new Map(
    input.specifications.map((specification) => [
      specification.id,
      specification,
    ])
  );

  if (
    specificationsById.size !==
    input.specifications.length
  ) {
    throw new Error(
      "Foundation specification IDs must be unique."
    );
  }

  const excavationIntervals:
    FenceFoundationBaseIntervalInput[] = [];

  const blindingIntervals:
    FenceFoundationBaseIntervalInput[] = [];

  const structuralIntervals:
    FenceFoundationBaseIntervalInput[] = [];

  for (const placement of input.placements) {
    const specification =
      specificationsById.get(
        placement.foundationSpecificationId
      );

    if (!specification) {
      throw new Error(
        `Foundation specification "${placement.foundationSpecificationId}" was not found for base "${placement.name}".`
      );
    }

    const excavationInterval =
      createComponentInterval(
        placement,
        specification,
        "excavation",
        specification.excavationLengthM,
        input.grossSectionLengthM
      );

    if (excavationInterval) {
      excavationIntervals.push(
        excavationInterval
      );
    }

    const blindingInterval =
      createComponentInterval(
        placement,
        specification,
        "blinding",
        specification.blindingLengthM,
        input.grossSectionLengthM
      );

    if (blindingInterval) {
      blindingIntervals.push(blindingInterval);
    }

    const structuralInterval =
      createComponentInterval(
        placement,
        specification,
        "structural",
        specification.lengthAlongFenceM,
        input.grossSectionLengthM
      );

    if (structuralInterval) {
      structuralIntervals.push(
        structuralInterval
      );
    }
  }

  const excavationLayout =
    calculateFenceFoundationLayout({
      sectionId: input.sectionId,
      grossSectionLengthM:
        input.grossSectionLengthM,
      baseIntervals: excavationIntervals,
      gateIntervals: input.gateIntervals,
    });

  const blindingLayout =
    calculateFenceFoundationLayout({
      sectionId: input.sectionId,
      grossSectionLengthM:
        input.grossSectionLengthM,
      baseIntervals: blindingIntervals,
      gateIntervals: input.gateIntervals,
    });

  const structuralLayout =
    calculateFenceFoundationLayout({
      sectionId: input.sectionId,
      grossSectionLengthM:
        input.grossSectionLengthM,
      baseIntervals: structuralIntervals,
      gateIntervals: input.gateIntervals,
    });

  return {
    sectionId: input.sectionId,
    grossSectionLengthM:
      input.grossSectionLengthM,

    excavationLayout,
    blindingLayout,
    structuralLayout,
  };
}