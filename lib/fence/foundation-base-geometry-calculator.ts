import type {
  FenceFoundationBaseGeometryInput,
  FenceFoundationBaseGeometryItemResult,
  FenceFoundationBaseGeometryResult,
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

const assertDimensionTriplet = (
  name: string,
  firstValue: number,
  secondValue: number,
  thirdValue: number
): void => {
  const values = [
    firstValue,
    secondValue,
    thirdValue,
  ];

  if (
    values.some(
      (value) =>
        !Number.isFinite(value) || value < 0
    )
  ) {
    throw new Error(
      `${name} dimensions cannot be negative.`
    );
  }

  const allZero = values.every(
    (value) => value === 0
  );

  const allPositive = values.every(
    (value) => value > 0
  );

  if (!allZero && !allPositive) {
    throw new Error(
      `${name} dimensions must either all be zero or all be greater than zero.`
    );
  }
};

const dimensionsMatch = (
  firstValue: number,
  secondValue: number
): boolean =>
  Math.abs(firstValue - secondValue) <=
  0.000001;

export function calculateFenceFoundationBaseGeometry(
  input: FenceFoundationBaseGeometryInput
): FenceFoundationBaseGeometryResult {
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

  for (const specification of input.specifications) {
    assertPositive(
      `Foundation "${specification.name}" length along fence`,
      specification.lengthAlongFenceM
    );
    assertPositive(
      `Foundation "${specification.name}" width across fence`,
      specification.widthAcrossFenceM
    );
    assertPositive(
      `Foundation "${specification.name}" thickness`,
      specification.thicknessM
    );

    assertDimensionTriplet(
      `Foundation "${specification.name}" excavation`,
      specification.excavationLengthM,
      specification.excavationWidthM,
      specification.excavationDepthM
    );

    assertDimensionTriplet(
      `Foundation "${specification.name}" blinding`,
      specification.blindingLengthM,
      specification.blindingWidthM,
      specification.blindingThicknessM
    );
  }

  const baseIds = new Set<string>();

  const bases: FenceFoundationBaseGeometryItemResult[] =
    input.placements.map((placement) => {
      if (baseIds.has(placement.id)) {
        throw new Error(
          `Foundation base ID "${placement.id}" is duplicated within section "${input.sectionId}".`
        );
      }

      baseIds.add(placement.id);

      const specification =
        specificationsById.get(
          placement.foundationSpecificationId
        );

      if (!specification) {
        throw new Error(
          `Foundation specification "${placement.foundationSpecificationId}" was not found for base "${placement.name}".`
        );
      }

      if (
        !dimensionsMatch(
          placement.baseLengthAlongFenceM,
          specification.lengthAlongFenceM
        ) ||
        !dimensionsMatch(
          placement.baseWidthAcrossFenceM,
          specification.widthAcrossFenceM
        ) ||
        !dimensionsMatch(
          placement.baseThicknessM,
          specification.thicknessM
        )
      ) {
        throw new Error(
          `Resolved dimensions for base "${placement.name}" do not match foundation specification "${specification.name}".`
        );
      }

      const excavationVolumeM3 =
        specification.excavationLengthM *
        specification.excavationWidthM *
        specification.excavationDepthM;

      const blindingConcreteVolumeM3 =
        specification.blindingLengthM *
        specification.blindingWidthM *
        specification.blindingThicknessM;

      const baseConcreteVolumeM3 =
        placement.baseLengthAlongFenceM *
        placement.baseWidthAcrossFenceM *
        placement.baseThicknessM;

      const permanentBelowGroundVolumeM3 =
        blindingConcreteVolumeM3 +
        baseConcreteVolumeM3;

      return {
        baseId: placement.id,
        sectionId: input.sectionId,

        supportedColumnId:
          placement.supportedColumnId,
        foundationSpecificationId:
          specification.id,

        excavationLengthM: roundQuantity(
          specification.excavationLengthM
        ),
        excavationWidthM: roundQuantity(
          specification.excavationWidthM
        ),
        excavationDepthM: roundQuantity(
          specification.excavationDepthM
        ),
        excavationVolumeM3: roundQuantity(
          excavationVolumeM3
        ),

        blindingLengthM: roundQuantity(
          specification.blindingLengthM
        ),
        blindingWidthM: roundQuantity(
          specification.blindingWidthM
        ),
        blindingThicknessM: roundQuantity(
          specification.blindingThicknessM
        ),
        blindingConcreteVolumeM3:
          roundQuantity(
            blindingConcreteVolumeM3
          ),

        baseLengthAlongFenceM:
          roundQuantity(
            placement.baseLengthAlongFenceM
          ),
        baseWidthAcrossFenceM:
          roundQuantity(
            placement.baseWidthAcrossFenceM
          ),
        baseThicknessM: roundQuantity(
          placement.baseThicknessM
        ),
        baseConcreteVolumeM3: roundQuantity(
          baseConcreteVolumeM3
        ),

        permanentBelowGroundVolumeM3:
          roundQuantity(
            permanentBelowGroundVolumeM3
          ),

        extensionBeforeSectionM:
          roundQuantity(
            placement.extensionBeforeSectionM
          ),
        extensionAfterSectionM:
          roundQuantity(
            placement.extensionAfterSectionM
          ),
      };
    });

  const totals = bases.reduce(
    (total, base) => ({
      excavation:
        total.excavation +
        base.excavationVolumeM3,
      blinding:
        total.blinding +
        base.blindingConcreteVolumeM3,
      concrete:
        total.concrete +
        base.baseConcreteVolumeM3,
      permanent:
        total.permanent +
        base.permanentBelowGroundVolumeM3,
    }),
    {
      excavation: 0,
      blinding: 0,
      concrete: 0,
      permanent: 0,
    }
  );

  return {
    sectionId: input.sectionId,
    bases,

    totalExcavationVolumeM3: roundQuantity(
      totals.excavation
    ),
    totalBlindingConcreteVolumeM3:
      roundQuantity(totals.blinding),
    totalBaseConcreteVolumeM3: roundQuantity(
      totals.concrete
    ),
    totalPermanentBelowGroundVolumeM3:
      roundQuantity(totals.permanent),
  };
}