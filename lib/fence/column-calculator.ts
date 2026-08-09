import { segmentFenceSection } from "./section-calculator";
import type {
  FenceColumnPlacement,
  FenceColumnRole,
  FenceSection,
  FenceSectionColumnLayoutResult,
  FenceWallSegmentColumnLayout,
} from "./types";

const roundMeasurement = (value: number): number =>
  Number(value.toFixed(6));

export function calculateFenceSectionColumnLayout(
  section: Pick<
    FenceSection,
    | "id"
    | "grossLengthM"
    | "gates"
    | "maximumColumnSpacingM"
  >
): FenceSectionColumnLayoutResult {
  if (
    !Number.isFinite(section.maximumColumnSpacingM) ||
    section.maximumColumnSpacingM <= 0
  ) {
    throw new Error(
      "Maximum column spacing must be greater than zero."
    );
  }

  const segmentation = segmentFenceSection(section);

  const columnMap = new Map<string, FenceColumnPlacement>();

  const addColumn = (
    positionM: number,
    role: FenceColumnRole,
    relatedGateId?: string
  ): void => {
    const roundedPositionM = roundMeasurement(positionM);
    const positionKey = roundedPositionM.toFixed(6);
    const existingColumn = columnMap.get(positionKey);

    if (existingColumn) {
      if (!existingColumn.roles.includes(role)) {
        existingColumn.roles.push(role);
      }

      if (
        relatedGateId &&
        !existingColumn.relatedGateIds.includes(relatedGateId)
      ) {
        existingColumn.relatedGateIds.push(relatedGateId);
      }

      return;
    }

    columnMap.set(positionKey, {
      id: "",
      positionM: roundedPositionM,
      roles: [role],
      relatedGateIds: relatedGateId ? [relatedGateId] : [],
    });
  };

  addColumn(0, "section-start");
  addColumn(section.grossLengthM, "section-end");

  for (const gate of section.gates) {
    addColumn(
      gate.positionFromSectionStartM,
      "gate-post",
      gate.id
    );

    addColumn(
      gate.positionFromSectionStartM + gate.widthM,
      "gate-post",
      gate.id
    );
  }

  const wallSegmentLayouts: FenceWallSegmentColumnLayout[] =
    [];

  for (const wallSegment of segmentation.wallSegments) {
    const numberOfBays = Math.max(
      1,
      Math.ceil(
        wallSegment.grossLengthM /
          section.maximumColumnSpacingM
      )
    );

    const actualBaySpacingM =
      wallSegment.grossLengthM / numberOfBays;

    const intermediateColumnCount = Math.max(
      0,
      numberOfBays - 1
    );

    wallSegmentLayouts.push({
      wallSegmentId: wallSegment.id,
      wallSegmentLengthM: wallSegment.grossLengthM,
      numberOfBays,
      actualBaySpacingM: roundMeasurement(actualBaySpacingM),
      intermediateColumnCount,
    });

    for (
      let bayNumber = 1;
      bayNumber < numberOfBays;
      bayNumber += 1
    ) {
      const intermediatePositionM =
        wallSegment.startM +
        actualBaySpacingM * bayNumber;

      addColumn(intermediatePositionM, "intermediate");
    }
  }

  const columns = Array.from(columnMap.values())
    .sort(
      (firstColumn, secondColumn) =>
        firstColumn.positionM - secondColumn.positionM
    )
    .map((column, index) => ({
      ...column,
      id: `${section.id}-column-${index + 1}`,
    }));

  const mandatoryColumnCount = columns.filter(
    (column) => !column.roles.includes("intermediate")
  ).length;

  const intermediateColumnCount = columns.filter((column) =>
    column.roles.includes("intermediate")
  ).length;

  return {
    sectionId: section.id,
    sectionLengthM: roundMeasurement(section.grossLengthM),
    maximumColumnSpacingM: roundMeasurement(
      section.maximumColumnSpacingM
    ),
    mandatoryColumnCount,
    intermediateColumnCount,
    totalColumnCount: columns.length,
    columns,
    wallSegmentLayouts,
  };
}