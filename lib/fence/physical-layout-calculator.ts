import { calculateFenceSectionColumnLayout } from "./column-calculator";
import { segmentFenceSection } from "./section-calculator";

import type {
  ColumnSpecification,
  FenceColumnPlacement,
  FencePanelComposition,
  FenceSection,
  FenceSectionPhysicalLayoutResult,
  Gate,
  PhysicalFencePanel,
  ResolvedFenceColumnPlacement,
} from "./types";

type ColumnSpecificationSection = Pick<
  FenceSection,
  | "gates"
  | "regularColumnSpecificationId"
  | "cornerColumnSpecificationId"
  | "pedestrianGatePostSpecificationId"
  | "vehicleGatePostSpecificationId"
>;

type PhysicalLayoutSection = Pick<
  FenceSection,
  | "id"
  | "grossLengthM"
  | "gates"
  | "maximumColumnSpacingM"
  | "columnBodyHeightM"
  | "defaultPanelComposition"
  | "panelCompositionOverrides"
  | "regularColumnSpecificationId"
  | "cornerColumnSpecificationId"
  | "pedestrianGatePostSpecificationId"
  | "vehicleGatePostSpecificationId"
>;

const PHYSICAL_LAYOUT_TOLERANCE = 0.000001;

const roundPhysicalQuantity = (value: number): number =>
  Number(value.toFixed(6));

const validatePanelComposition = (
  composition: FencePanelComposition,
  columnBodyHeightM: number,
): void => {
  if (
    !Number.isFinite(composition.blockWallHeightM) ||
    composition.blockWallHeightM < 0
  ) {
    throw new Error("Block-wall height cannot be negative.");
  }

  if (
    !Number.isFinite(composition.upperInfillHeightM) ||
    composition.upperInfillHeightM < 0
  ) {
    throw new Error("Upper-infill height cannot be negative.");
  }

  if (
    composition.upperInfillType !== "none" &&
    composition.upperInfillHeightM <= 0
  ) {
    throw new Error("An upper infill requires a positive height.");
  }

  const combinedPanelHeightM =
    composition.blockWallHeightM +
    (composition.upperInfillType === "none"
      ? 0
      : composition.upperInfillHeightM);

  if (
    combinedPanelHeightM >
    columnBodyHeightM + PHYSICAL_LAYOUT_TOLERANCE
  ) {
    throw new Error(
      "Block-wall and upper-infill heights exceed the column-body height.",
    );
  }
};

export function resolveFenceColumnSpecification(input: {
  column: FenceColumnPlacement;
  section: ColumnSpecificationSection;
  specifications: ColumnSpecification[];
}): ColumnSpecification {
  const { column, section, specifications } = input;

  let selectedSpecificationId: string;

  if (column.roles.includes("gate-post")) {
    const relatedGates = column.relatedGateIds.map((gateId) => {
      const gate = section.gates.find(
        (candidateGate) => candidateGate.id === gateId,
      );

      if (!gate) {
        throw new Error(
          `Column "${column.id}" references an unknown gate.`,
        );
      }

      return gate;
    });

    if (relatedGates.length === 0) {
      throw new Error(
        `Gate-post column "${column.id}" has no related gate.`,
      );
    }

    const overrideIds = Array.from(
      new Set(
        relatedGates
          .map((gate) => gate.gatePostSpecificationId)
          .filter(
            (id): id is string =>
              typeof id === "string" && id.length > 0,
          ),
      ),
    );

    if (overrideIds.length > 1) {
      throw new Error(
        `Column "${column.id}" has conflicting gate-post overrides.`,
      );
    }

    if (overrideIds.length === 1) {
      selectedSpecificationId = overrideIds[0];
    } else if (
      relatedGates.some((gate: Gate) => gate.type === "vehicle")
    ) {
      selectedSpecificationId = section.vehicleGatePostSpecificationId;
    } else {
      selectedSpecificationId = section.pedestrianGatePostSpecificationId;
    }
  } else if (
    column.roles.includes("section-start") ||
    column.roles.includes("section-end") ||
    column.roles.includes("shared-corner")
  ) {
    selectedSpecificationId = section.cornerColumnSpecificationId;
  } else {
    selectedSpecificationId = section.regularColumnSpecificationId;
  }

  const specification = specifications.find(
    (candidateSpecification) =>
      candidateSpecification.id === selectedSpecificationId,
  );

  if (!specification) {
    throw new Error(
      `Column specification "${selectedSpecificationId}" was not found.`,
    );
  }

  return specification;
}

/**
 * A gate opening may begin at 0 m or end exactly at the section length.
 * In that case the boundary column is shared by the section corner and the
 * gate post. The complete column is still counted for materials/quantities,
 * but it must not consume an additional strip of this section's measured
 * length because the user-entered gate width already begins/ends at the
 * section boundary.
 */
const resolveSharedBoundaryGatePost = (
  column: ResolvedFenceColumnPlacement,
  sectionLengthM: number,
): ResolvedFenceColumnPlacement | null => {
  if (!column.roles.includes("gate-post")) return null;

  const atStart =
    column.roles.includes("section-start") &&
    Math.abs(column.positionM) <= PHYSICAL_LAYOUT_TOLERANCE;
  const atEnd =
    column.roles.includes("section-end") &&
    Math.abs(column.positionM - sectionLengthM) <=
      PHYSICAL_LAYOUT_TOLERANCE;

  if (!atStart && !atEnd) return null;

  const boundaryM = atStart ? 0 : sectionLengthM;
  return {
    ...column,
    positionM: roundPhysicalQuantity(boundaryM),
    occupiedStartM: roundPhysicalQuantity(boundaryM),
    occupiedEndM: roundPhysicalQuantity(boundaryM),
  };
};

export function calculateFenceSectionPhysicalLayout(input: {
  section: PhysicalLayoutSection;
  specifications: ColumnSpecification[];
}): FenceSectionPhysicalLayoutResult {
  const { section, specifications } = input;

  if (
    !Number.isFinite(section.columnBodyHeightM) ||
    section.columnBodyHeightM <= 0
  ) {
    throw new Error("Column-body height must be greater than zero.");
  }

  validatePanelComposition(
    section.defaultPanelComposition,
    section.columnBodyHeightM,
  );

  for (const override of section.panelCompositionOverrides) {
    validatePanelComposition(
      override.composition,
      section.columnBodyHeightM,
    );
  }

  const segmentation = segmentFenceSection(section);
  const columnLayout = calculateFenceSectionColumnLayout(section);

  const resolvedColumnMap = new Map<
    string,
    ResolvedFenceColumnPlacement
  >();

  for (const column of columnLayout.columns) {
    const specification = resolveFenceColumnSpecification({
      column,
      section,
      specifications,
    });

    if (
      !Number.isFinite(specification.widthAlongFenceM) ||
      specification.widthAlongFenceM <= 0
    ) {
      throw new Error(
        `Column specification "${specification.id}" has an invalid width.`,
      );
    }

    if (
      !Number.isFinite(specification.depthM) ||
      specification.depthM <= 0
    ) {
      throw new Error(
        `Column specification "${specification.id}" has an invalid depth.`,
      );
    }

    resolvedColumnMap.set(column.id, {
      ...column,
      specificationId: specification.id,
      constructionSystem: specification.constructionSystem,
      widthAlongFenceM: specification.widthAlongFenceM,
      depthM: specification.depthM,
      columnBodyHeightM: section.columnBodyHeightM,
      occupiedStartM: Number.NaN,
      occupiedEndM: Number.NaN,
    });
  }

  const panels: PhysicalFencePanel[] = [];
  let calculatedClearPanelLengthM = 0;
  let calculatedBlockworkAreaM2 = 0;
  let calculatedUpperInfillAreaM2 = 0;

  for (const wallSegment of segmentation.wallSegments) {
    const segmentColumns = columnLayout.columns
      .filter(
        (column) =>
          column.positionM >=
            wallSegment.startM - PHYSICAL_LAYOUT_TOLERANCE &&
          column.positionM <=
            wallSegment.endM + PHYSICAL_LAYOUT_TOLERANCE,
      )
      .sort(
        (firstColumn, secondColumn) =>
          firstColumn.positionM - secondColumn.positionM,
      );

    if (segmentColumns.length < 2) {
      throw new Error(
        `Wall segment "${wallSegment.id}" does not have two boundary columns.`,
      );
    }

    const resolvedSegmentColumns = segmentColumns.map((column) => {
      const resolvedColumn = resolvedColumnMap.get(column.id);
      if (!resolvedColumn) {
        throw new Error(`Column "${column.id}" could not be resolved.`);
      }
      return resolvedColumn;
    });

    const totalSegmentColumnWidthM = resolvedSegmentColumns.reduce(
      (total, column) => total + column.widthAlongFenceM,
      0,
    );
    const totalClearPanelLengthM =
      wallSegment.grossLengthM - totalSegmentColumnWidthM;

    if (totalClearPanelLengthM < -PHYSICAL_LAYOUT_TOLERANCE) {
      throw new Error(
        `Columns are wider than wall segment "${wallSegment.id}".`,
      );
    }

    const panelGapCount = resolvedSegmentColumns.length - 1;
    const clearPanelLengthM =
      totalClearPanelLengthM > PHYSICAL_LAYOUT_TOLERANCE
        ? totalClearPanelLengthM / panelGapCount
        : 0;

    let cursorM = wallSegment.startM;

    for (
      let columnIndex = 0;
      columnIndex < resolvedSegmentColumns.length;
      columnIndex += 1
    ) {
      const column = resolvedSegmentColumns[columnIndex];

      if (Number.isFinite(column.occupiedStartM)) {
        throw new Error(
          `Column "${column.id}" occupies more than one wall segment.`,
        );
      }

      const occupiedStartM = cursorM;
      const occupiedEndM = occupiedStartM + column.widthAlongFenceM;
      const positionedColumn: ResolvedFenceColumnPlacement = {
        ...column,
        positionM: roundPhysicalQuantity(
          (occupiedStartM + occupiedEndM) / 2,
        ),
        occupiedStartM: roundPhysicalQuantity(occupiedStartM),
        occupiedEndM: roundPhysicalQuantity(occupiedEndM),
      };

      resolvedColumnMap.set(positionedColumn.id, positionedColumn);
      cursorM = occupiedEndM;

      const isLastColumn =
        columnIndex === resolvedSegmentColumns.length - 1;

      if (!isLastColumn) {
        const panelNumber = columnIndex + 1;
        const panelStartM = cursorM;
        const panelEndM = panelStartM + clearPanelLengthM;

        if (clearPanelLengthM > PHYSICAL_LAYOUT_TOLERANCE) {
          const compositionOverride =
            section.panelCompositionOverrides.find(
              (override) =>
                override.wallSegmentId === wallSegment.id &&
                override.panelNumber === panelNumber,
            );
          const composition = {
            ...(compositionOverride?.composition ??
              section.defaultPanelComposition),
          };

          validatePanelComposition(
            composition,
            section.columnBodyHeightM,
          );

          const blockworkAreaM2 =
            clearPanelLengthM * composition.blockWallHeightM;
          const upperInfillAreaM2 =
            composition.upperInfillType === "none"
              ? 0
              : clearPanelLengthM * composition.upperInfillHeightM;

          calculatedClearPanelLengthM += clearPanelLengthM;
          calculatedBlockworkAreaM2 += blockworkAreaM2;
          calculatedUpperInfillAreaM2 += upperInfillAreaM2;

          panels.push({
            id: `${wallSegment.id}-panel-${panelNumber}`,
            wallSegmentId: wallSegment.id,
            panelNumber,
            startM: roundPhysicalQuantity(panelStartM),
            endM: roundPhysicalQuantity(panelEndM),
            clearLengthM: roundPhysicalQuantity(clearPanelLengthM),
            leftColumnId: column.id,
            rightColumnId:
              resolvedSegmentColumns[columnIndex + 1].id,
            composition,
            blockworkAreaM2: roundPhysicalQuantity(blockworkAreaM2),
            upperInfillAreaM2:
              roundPhysicalQuantity(upperInfillAreaM2),
          });
        }

        cursorM = panelEndM;
      }
    }

    if (
      Math.abs(cursorM - wallSegment.endM) >
      PHYSICAL_LAYOUT_TOLERANCE * 10
    ) {
      throw new Error(
        `Wall segment "${wallSegment.id}" does not balance physically.`,
      );
    }
  }

  // A gate positioned exactly at either end has one post that is not inside a
  // wall segment. Resolve that shared boundary post deliberately rather than
  // treating a valid edge gate as a broken layout.
  for (const [columnId, column] of resolvedColumnMap.entries()) {
    if (
      Number.isFinite(column.occupiedStartM) &&
      Number.isFinite(column.occupiedEndM)
    ) {
      continue;
    }

    const boundaryColumn = resolveSharedBoundaryGatePost(
      column,
      section.grossLengthM,
    );
    if (boundaryColumn) {
      resolvedColumnMap.set(columnId, boundaryColumn);
    }
  }

  const unresolvedColumns = Array.from(
    resolvedColumnMap.values(),
  ).filter(
    (column) =>
      !Number.isFinite(column.occupiedStartM) ||
      !Number.isFinite(column.occupiedEndM),
  );

  if (unresolvedColumns.length > 0) {
    throw new Error(
      `Column "${unresolvedColumns[0].id}" has no physical space inside the section.`,
    );
  }

  const columns = Array.from(resolvedColumnMap.values()).sort(
    (firstColumn, secondColumn) =>
      firstColumn.occupiedStartM - secondColumn.occupiedStartM,
  );

  // Use the actual footprint inside this section. Shared gate/corner posts at
  // the extreme boundary have a zero footprint here, while their full
  // dimensions remain on the column object for concrete/block/rebar/formwork
  // quantity calculations.
  const totalColumnOccupiedLengthM = columns.reduce(
    (total, column) =>
      total +
      Math.max(0, column.occupiedEndM - column.occupiedStartM),
    0,
  );

  const totalClearBlockPanelLengthM = calculatedClearPanelLengthM;
  const totalBlockworkAreaM2 = calculatedBlockworkAreaM2;
  const totalUpperInfillAreaM2 = calculatedUpperInfillAreaM2;

  const physicalLengthCheckM =
    totalColumnOccupiedLengthM +
    totalClearBlockPanelLengthM +
    segmentation.totalGateOpeningWidthM;

  if (
    Math.abs(physicalLengthCheckM - section.grossLengthM) >
    PHYSICAL_LAYOUT_TOLERANCE * 10
  ) {
    throw new Error(
      "The physical section elements do not equal the gross section length.",
    );
  }

  return {
    sectionId: section.id,
    grossSectionLengthM: roundPhysicalQuantity(section.grossLengthM),
    totalGateOpeningWidthM: roundPhysicalQuantity(
      segmentation.totalGateOpeningWidthM,
    ),
    totalColumnOccupiedLengthM: roundPhysicalQuantity(
      totalColumnOccupiedLengthM,
    ),
    totalClearBlockPanelLengthM: roundPhysicalQuantity(
      totalClearBlockPanelLengthM,
    ),
    totalBlockworkAreaM2: roundPhysicalQuantity(totalBlockworkAreaM2),
    totalUpperInfillAreaM2: roundPhysicalQuantity(
      totalUpperInfillAreaM2,
    ),
    columns,
    panels,
  };
}
