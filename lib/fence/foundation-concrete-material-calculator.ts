import { calculateConcreteElementMaterials } from "./concrete-element-calculator";

import type {
  ConcreteElementMaterialCalculationResult,
  FenceFoundationConcreteMaterialInput,
  FenceFoundationConcreteMaterialResult,
  FenceFoundationConcreteMixAssignment,
} from "./types";

const calculateComponentMaterials = (input: {
  id: string;
  name: string;
  volumeM3: number;
  assignment:
    FenceFoundationConcreteMixAssignment | null;
}): ConcreteElementMaterialCalculationResult | null => {
  if (
    !Number.isFinite(input.volumeM3) ||
    input.volumeM3 < 0
  ) {
    throw new Error(
      `${input.name} volume cannot be negative.`
    );
  }

  if (input.volumeM3 === 0) {
    return null;
  }

  if (!input.assignment) {
    throw new Error(
      `${input.name} requires a concrete mix assignment.`
    );
  }

  return calculateConcreteElementMaterials({
    element: {
      id: input.id,
      name: input.name,

      elementType: "custom",
      calculationMode: "direct-volume",
      directVolumeM3: input.volumeM3,

      wastagePercent:
        input.assignment.wastagePercent,

      concreteMixId:
        input.assignment.mix.id,
    },

    mix: input.assignment.mix,
  });
};

export function calculateFenceFoundationConcreteMaterials(
  input: FenceFoundationConcreteMaterialInput
): FenceFoundationConcreteMaterialResult {
  const { foundation, assignments } = input;

  const panelBlinding =
    calculateComponentMaterials({
      id: `${foundation.id}-panel-blinding`,
      name: `${foundation.name} Panel Blinding`,
      volumeM3:
        foundation.concrete
          .panelBlindingVolumeM3,
      assignment: assignments.panelBlinding,
    });

  const panelFooting =
    calculateComponentMaterials({
      id: `${foundation.id}-panel-footing`,
      name: `${foundation.name} Panel Footing`,
      volumeM3:
        foundation.concrete
          .panelFootingVolumeM3,
      assignment: assignments.panelFooting,
    });

  const panelGroundBeam =
    calculateComponentMaterials({
      id: `${foundation.id}-panel-ground-beam`,
      name: `${foundation.name} Panel Ground Beam`,
      volumeM3:
        foundation.concrete
          .panelGroundBeamVolumeM3,
      assignment:
        assignments.panelGroundBeam,
    });

  const baseBlinding =
    calculateComponentMaterials({
      id: `${foundation.id}-base-blinding`,
      name: `${foundation.name} Base Blinding`,
      volumeM3:
        foundation.concrete
          .baseBlindingVolumeM3,
      assignment: assignments.baseBlinding,
    });

  const baseConcrete =
    calculateComponentMaterials({
      id: `${foundation.id}-base-concrete`,
      name: `${foundation.name} Base Concrete`,
      volumeM3:
        foundation.concrete
          .baseConcreteVolumeM3,
      assignment: assignments.baseConcrete,
    });

  return {
    sectionId: foundation.sectionId,

    panelBlinding,
    panelFooting,
    panelGroundBeam,
    baseBlinding,
    baseConcrete,
  };
}