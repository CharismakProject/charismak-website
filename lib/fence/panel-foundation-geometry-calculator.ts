import type {
  FencePanelFoundationGeometryInput,
  FencePanelFoundationGeometryResult,
  FencePanelFoundationSegmentGeometryResult,
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

const assertDimensionPair = (
  name: string,
  firstValue: number,
  secondValue: number
): void => {
  assertNonNegative(`${name} first dimension`, firstValue);
  assertNonNegative(
    `${name} second dimension`,
    secondValue
  );

  const bothZero =
    firstValue === 0 && secondValue === 0;

  const bothPositive =
    firstValue > 0 && secondValue > 0;

  if (!bothZero && !bothPositive) {
    throw new Error(
      `${name} dimensions must either both be zero or both be greater than zero.`
    );
  }
};

export function calculateFencePanelFoundationGeometry(
  input: FencePanelFoundationGeometryInput
): FencePanelFoundationGeometryResult {
  const { specification } = input;

  assertDimensionPair(
    "Excavation",
    specification.excavationWidthM,
    specification.excavationDepthM
  );

  assertDimensionPair(
    "Blinding",
    specification.blindingWidthM,
    specification.blindingThicknessM
  );

  assertDimensionPair(
    "Footing",
    specification.footingWidthM,
    specification.footingThicknessM
  );

  assertDimensionPair(
    "Foundation blockwork",
    specification.foundationBlockworkHeightM,
    specification.foundationBlockworkThicknessM
  );

  assertDimensionPair(
    "Ground beam",
    specification.groundBeamWidthM,
    specification.groundBeamDepthM
  );

  const segmentIds = new Set<string>();

  const segments: FencePanelFoundationSegmentGeometryResult[] =
    input.segments.map((segment) => {
      if (segment.sectionId !== input.sectionId) {
        throw new Error(
          `Foundation segment "${segment.id}" does not belong to section "${input.sectionId}".`
        );
      }

      if (segmentIds.has(segment.id)) {
        throw new Error(
          `Foundation segment ID "${segment.id}" is duplicated.`
        );
      }

      segmentIds.add(segment.id);

      assertPositive(
        `Foundation segment "${segment.id}" length`,
        segment.lengthM
      );

      const excavationVolumeM3 =
        segment.lengthM *
        specification.excavationWidthM *
        specification.excavationDepthM;

      const blindingConcreteVolumeM3 =
        segment.lengthM *
        specification.blindingWidthM *
        specification.blindingThicknessM;

      const footingConcreteVolumeM3 =
        segment.lengthM *
        specification.footingWidthM *
        specification.footingThicknessM;

      const foundationBlockworkAreaM2 =
        segment.lengthM *
        specification.foundationBlockworkHeightM;

      const foundationBlockworkVolumeM3 =
        foundationBlockworkAreaM2 *
        specification.foundationBlockworkThicknessM;

      const groundBeamConcreteVolumeM3 =
        segment.lengthM *
        specification.groundBeamWidthM *
        specification.groundBeamDepthM;

      return {
        segmentId: segment.id,
        sectionId: segment.sectionId,
        segmentNumber: segment.segmentNumber,

        specificationId: specification.id,

        lengthM: roundQuantity(segment.lengthM),

        excavationVolumeM3: roundQuantity(
          excavationVolumeM3
        ),
        blindingConcreteVolumeM3:
          roundQuantity(
            blindingConcreteVolumeM3
          ),
        footingConcreteVolumeM3:
          roundQuantity(
            footingConcreteVolumeM3
          ),

        foundationBlockworkAreaM2:
          roundQuantity(
            foundationBlockworkAreaM2
          ),
        foundationBlockworkVolumeM3:
          roundQuantity(
            foundationBlockworkVolumeM3
          ),

        groundBeamConcreteVolumeM3:
          roundQuantity(
            groundBeamConcreteVolumeM3
          ),
      };
    });

  const totalLengthM = input.segments.reduce(
    (total, segment) =>
      total + segment.lengthM,
    0
  );

  return {
    sectionId: input.sectionId,
    specificationId: specification.id,

    segments,

    totalLengthM: roundQuantity(totalLengthM),

    totalExcavationVolumeM3: roundQuantity(
      totalLengthM *
        specification.excavationWidthM *
        specification.excavationDepthM
    ),

    totalBlindingConcreteVolumeM3:
      roundQuantity(
        totalLengthM *
          specification.blindingWidthM *
          specification.blindingThicknessM
      ),

    totalFootingConcreteVolumeM3:
      roundQuantity(
        totalLengthM *
          specification.footingWidthM *
          specification.footingThicknessM
      ),

    totalFoundationBlockworkAreaM2:
      roundQuantity(
        totalLengthM *
          specification.foundationBlockworkHeightM
      ),

    totalFoundationBlockworkVolumeM3:
      roundQuantity(
        totalLengthM *
          specification.foundationBlockworkHeightM *
          specification.foundationBlockworkThicknessM
      ),

    totalGroundBeamConcreteVolumeM3:
      roundQuantity(
        totalLengthM *
          specification.groundBeamWidthM *
          specification.groundBeamDepthM
      ),
  };
}