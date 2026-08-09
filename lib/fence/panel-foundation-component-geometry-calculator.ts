import { calculateFencePanelFoundationGeometry } from "./panel-foundation-geometry-calculator";

import type {
  FencePanelFoundationComponentGeometryInput,
  FencePanelFoundationComponentGeometryResult,
  FencePanelFoundationSpecification,
} from "./types";

const createExcavationOnlySpecification = (
  specification: FencePanelFoundationSpecification
): FencePanelFoundationSpecification => ({
  ...specification,

  blindingWidthM: 0,
  blindingThicknessM: 0,

  footingWidthM: 0,
  footingThicknessM: 0,

  foundationBlockworkHeightM: 0,
  foundationBlockworkThicknessM: 0,

  groundBeamWidthM: 0,
  groundBeamDepthM: 0,
});

const createBlindingOnlySpecification = (
  specification: FencePanelFoundationSpecification
): FencePanelFoundationSpecification => ({
  ...specification,

  excavationWidthM: 0,
  excavationDepthM: 0,

  footingWidthM: 0,
  footingThicknessM: 0,

  foundationBlockworkHeightM: 0,
  foundationBlockworkThicknessM: 0,

  groundBeamWidthM: 0,
  groundBeamDepthM: 0,
});

const createStructuralOnlySpecification = (
  specification: FencePanelFoundationSpecification
): FencePanelFoundationSpecification => ({
  ...specification,

  excavationWidthM: 0,
  excavationDepthM: 0,

  blindingWidthM: 0,
  blindingThicknessM: 0,
});

export function calculateFencePanelFoundationComponentGeometry(
  input: FencePanelFoundationComponentGeometryInput
): FencePanelFoundationComponentGeometryResult {
  const { componentLayouts, specification } =
    input;

  const sectionId = componentLayouts.sectionId;

  const layouts = [
    componentLayouts.excavationLayout,
    componentLayouts.blindingLayout,
    componentLayouts.structuralLayout,
  ];

  for (const layout of layouts) {
    if (layout.sectionId !== sectionId) {
      throw new Error(
        "All foundation component layouts must belong to the same section."
      );
    }
  }

  const excavation =
    calculateFencePanelFoundationGeometry({
      sectionId,
      segments:
        componentLayouts.excavationLayout
          .panelFoundationSegments,
      specification:
        createExcavationOnlySpecification(
          specification
        ),
    });

  const blinding =
    calculateFencePanelFoundationGeometry({
      sectionId,
      segments:
        componentLayouts.blindingLayout
          .panelFoundationSegments,
      specification:
        createBlindingOnlySpecification(
          specification
        ),
    });

  const structural =
    calculateFencePanelFoundationGeometry({
      sectionId,
      segments:
        componentLayouts.structuralLayout
          .panelFoundationSegments,
      specification:
        createStructuralOnlySpecification(
          specification
        ),
    });

  return {
    sectionId,
    specificationId: specification.id,

    excavation,
    blinding,
    structural,
  };
}