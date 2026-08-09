import { calculateExcavation } from "./excavation-calculator";

import type {
  FenceFoundationSectionEarthworksInput,
  FenceFoundationSectionEarthworksResult,
} from "./types";

const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

const assertNonNegative = (
  name: string,
  value: number
): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative.`);
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

export function calculateFenceFoundationEarthworks(
  input: FenceFoundationSectionEarthworksInput
): FenceFoundationSectionEarthworksResult {
  if (
    input.panelGeometry.sectionId !==
      input.sectionId ||
    input.baseGeometry.sectionId !==
      input.sectionId
  ) {
    throw new Error(
      "Panel and base foundation quantities must belong to the requested fence section."
    );
  }

  assertPercentage(
    "Panel blockwork below-ground percentage",
    input.panelBlockworkBelowGroundPercent
  );

  assertPercentage(
    "Panel ground-beam below-ground percentage",
    input.panelGroundBeamBelowGroundPercent
  );

  assertNonNegative(
    "Additional permanent below-ground volume",
    input.additionalPermanentBelowGroundVolumeM3
  );

  const panelExcavationVolumeM3 =
    input.panelGeometry.excavation
      .totalExcavationVolumeM3;

  const baseExcavationVolumeM3 =
    input.baseGeometry
      .totalExcavationVolumeM3;

  const totalBasicExcavationVolumeM3 =
    panelExcavationVolumeM3 +
    baseExcavationVolumeM3;

  if (totalBasicExcavationVolumeM3 <= 0) {
    throw new Error(
      "Total foundation excavation volume must be greater than zero."
    );
  }

  const panelBlindingVolumeM3 =
    input.panelGeometry.blinding
      .totalBlindingConcreteVolumeM3;

  const panelFootingVolumeM3 =
    input.panelGeometry.structural
      .totalFootingConcreteVolumeM3;

  const panelGroundBeamVolumeM3 =
    input.panelGeometry.structural
      .totalGroundBeamConcreteVolumeM3;

  const foundationBlockworkAreaM2 =
    input.panelGeometry.structural
      .totalFoundationBlockworkAreaM2;

  const foundationBlockworkVolumeM3 =
    input.panelGeometry.structural
      .totalFoundationBlockworkVolumeM3;

  const foundationBlockworkBelowGroundVolumeM3 =
    foundationBlockworkVolumeM3 *
    (input.panelBlockworkBelowGroundPercent /
      100);

  const panelGroundBeamBelowGroundVolumeM3 =
    panelGroundBeamVolumeM3 *
    (input.panelGroundBeamBelowGroundPercent /
      100);

  const panelPermanentBelowGroundVolumeM3 =
    panelBlindingVolumeM3 +
    panelFootingVolumeM3 +
    foundationBlockworkBelowGroundVolumeM3 +
    panelGroundBeamBelowGroundVolumeM3;

  const baseBlindingVolumeM3 =
    input.baseGeometry
      .totalBlindingConcreteVolumeM3;

  const baseConcreteVolumeM3 =
    input.baseGeometry
      .totalBaseConcreteVolumeM3;

  const basePermanentBelowGroundVolumeM3 =
    input.baseGeometry
      .totalPermanentBelowGroundVolumeM3;

  const totalPermanentBelowGroundVolumeM3 =
    panelPermanentBelowGroundVolumeM3 +
    basePermanentBelowGroundVolumeM3 +
    input.additionalPermanentBelowGroundVolumeM3;

  const totalConcreteVolumeM3 =
    panelBlindingVolumeM3 +
    panelFootingVolumeM3 +
    panelGroundBeamVolumeM3 +
    baseBlindingVolumeM3 +
    baseConcreteVolumeM3;

  const earthworks = calculateExcavation({
    id: `${input.id}-earthworks`,
    name: `${input.name} Earthworks`,

    calculationMode: "direct-volume",
    application: "strip-foundation",
    groundCondition: input.groundCondition,

    directExcavationVolumeM3:
      totalBasicExcavationVolumeM3,

    overExcavationPercent:
      input.overExcavationPercent,

    permanentConstructionVolumeM3:
      totalPermanentBelowGroundVolumeM3,

    reusableSoilPercent:
      input.reusableSoilPercent,

    bulkingPercent: input.bulkingPercent,
  });

  return {
    id: input.id,
    name: input.name,
    sectionId: input.sectionId,

    panelExcavationVolumeM3: roundQuantity(
      panelExcavationVolumeM3
    ),
    baseExcavationVolumeM3: roundQuantity(
      baseExcavationVolumeM3
    ),
    totalBasicExcavationVolumeM3:
      roundQuantity(
        totalBasicExcavationVolumeM3
      ),

    panelPermanentBelowGroundVolumeM3:
      roundQuantity(
        panelPermanentBelowGroundVolumeM3
      ),
    basePermanentBelowGroundVolumeM3:
      roundQuantity(
        basePermanentBelowGroundVolumeM3
      ),
    additionalPermanentBelowGroundVolumeM3:
      roundQuantity(
        input.additionalPermanentBelowGroundVolumeM3
      ),
    totalPermanentBelowGroundVolumeM3:
      roundQuantity(
        totalPermanentBelowGroundVolumeM3
      ),

    concrete: {
      panelBlindingVolumeM3: roundQuantity(
        panelBlindingVolumeM3
      ),
      panelFootingVolumeM3: roundQuantity(
        panelFootingVolumeM3
      ),
      panelGroundBeamVolumeM3:
        roundQuantity(
          panelGroundBeamVolumeM3
        ),

      baseBlindingVolumeM3: roundQuantity(
        baseBlindingVolumeM3
      ),
      baseConcreteVolumeM3: roundQuantity(
        baseConcreteVolumeM3
      ),

      totalConcreteVolumeM3: roundQuantity(
        totalConcreteVolumeM3
      ),
    },

    blockwork: {
      areaM2: roundQuantity(
        foundationBlockworkAreaM2
      ),
      volumeM3: roundQuantity(
        foundationBlockworkVolumeM3
      ),
      belowGroundVolumeM3: roundQuantity(
        foundationBlockworkBelowGroundVolumeM3
      ),
    },

    earthworks,
  };
}