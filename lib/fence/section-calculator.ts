import type {
  FenceSection,
  FenceSectionSegmentationResult,
  FenceWallSegment,
} from "./types";

const roundMeasurement = (value: number): number =>
  Number(value.toFixed(6));

export function segmentFenceSection(
  section: Pick<FenceSection, "id" | "grossLengthM" | "gates">
): FenceSectionSegmentationResult {
  if (
    !Number.isFinite(section.grossLengthM) ||
    section.grossLengthM <= 0
  ) {
    throw new Error("Section length must be greater than zero.");
  }

  const orderedGates = [...section.gates].sort(
    (firstGate, secondGate) =>
      firstGate.positionFromSectionStartM -
      secondGate.positionFromSectionStartM
  );

  let previousGateEndM = 0;

  for (const gate of orderedGates) {
    if (
      !Number.isFinite(gate.positionFromSectionStartM) ||
      gate.positionFromSectionStartM < 0
    ) {
      throw new Error(`Gate "${gate.name}" has an invalid position.`);
    }

    if (!Number.isFinite(gate.widthM) || gate.widthM <= 0) {
      throw new Error(`Gate "${gate.name}" must have a positive width.`);
    }

    const gateEndM =
      gate.positionFromSectionStartM + gate.widthM;

    if (gateEndM > section.grossLengthM) {
      throw new Error(
        `Gate "${gate.name}" extends beyond the section boundary.`
      );
    }

    if (gate.positionFromSectionStartM < previousGateEndM) {
      throw new Error(`Gate "${gate.name}" overlaps another gate.`);
    }

    previousGateEndM = gateEndM;
  }

  const wallSegments: FenceWallSegment[] = [];
  let currentPositionM = 0;

  for (const gate of orderedGates) {
    if (gate.positionFromSectionStartM > currentPositionM) {
      const segmentStartM = currentPositionM;
      const segmentEndM = gate.positionFromSectionStartM;

      wallSegments.push({
        id: `${section.id}-wall-${wallSegments.length + 1}`,
        startM: roundMeasurement(segmentStartM),
        endM: roundMeasurement(segmentEndM),
        grossLengthM: roundMeasurement(
          segmentEndM - segmentStartM
        ),
      });
    }

    currentPositionM =
      gate.positionFromSectionStartM + gate.widthM;
  }

  if (currentPositionM < section.grossLengthM) {
    wallSegments.push({
      id: `${section.id}-wall-${wallSegments.length + 1}`,
      startM: roundMeasurement(currentPositionM),
      endM: roundMeasurement(section.grossLengthM),
      grossLengthM: roundMeasurement(
        section.grossLengthM - currentPositionM
      ),
    });
  }

  const totalGateOpeningWidthM = orderedGates.reduce(
    (total, gate) => total + gate.widthM,
    0
  );

  const totalWallSegmentLengthM = wallSegments.reduce(
    (total, segment) => total + segment.grossLengthM,
    0
  );

  return {
    sectionId: section.id,
    sectionLengthM: roundMeasurement(section.grossLengthM),
    totalGateOpeningWidthM: roundMeasurement(
      totalGateOpeningWidthM
    ),
    totalWallSegmentLengthM: roundMeasurement(
      totalWallSegmentLengthM
    ),
    wallSegments,
  };
}