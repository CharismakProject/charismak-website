import { calculateBlockworkElementMaterials } from "./blockwork-element-calculator";

import type {
  FenceFoundationBlockworkMaterialInput,
  FenceFoundationBlockworkMaterialResult,
} from "./types";

export function calculateFenceFoundationBlockworkMaterials(
  input: FenceFoundationBlockworkMaterialInput
): FenceFoundationBlockworkMaterialResult {
  const areaM2 =
    input.foundation.blockwork.areaM2;

  if (!Number.isFinite(areaM2) || areaM2 < 0) {
    throw new Error(
      "Foundation blockwork area cannot be negative."
    );
  }

  if (areaM2 === 0) {
    return {
      sectionId: input.foundation.sectionId,
      blockwork: null,
    };
  }

  if (!input.assignment) {
    throw new Error(
      "Foundation blockwork requires a material assignment."
    );
  }

  const assignment = input.assignment;

  const blockwork =
    calculateBlockworkElementMaterials({
      element: {
        id: `${input.foundation.id}-foundation-blockwork`,
        name: `${input.foundation.name} Foundation Blockwork`,

        calculationMode: "direct-area",
        directAreaM2: areaM2,

        blockSpecificationId:
          assignment.blockSpecificationId,

        blockSpecification:
          assignment.blockSpecification,

        blockWastagePercent:
          assignment.blockWastagePercent,

        mortarCalculationBasis:
          assignment.mortarCalculationBasis,

        mortarVolumePerUnitM3:
          assignment.mortarVolumePerUnitM3,

        mortarWastagePercent:
          assignment.mortarWastagePercent,

        mortarMixId:
          assignment.mortarMix.id,
      },

      mortarMix: assignment.mortarMix,
    });

  return {
    sectionId: input.foundation.sectionId,
    blockwork,
  };
}