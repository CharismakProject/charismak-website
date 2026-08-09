import type {
  FenceFoundationBasePlacementResolutionInput,
  FenceFoundationBasePlacementResolutionResult,
  FenceFoundationResolvedBasePlacement,
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

export function resolveFenceFoundationBasePlacements(
  input: FenceFoundationBasePlacementResolutionInput
): FenceFoundationBasePlacementResolutionResult {
  assertPositive(
    "Gross section length",
    input.grossSectionLengthM
  );

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
  }

  const placements: FenceFoundationResolvedBasePlacement[] =
    input.columns
      .map((column) => {
        if (
          !Number.isFinite(column.columnStartM) ||
          !Number.isFinite(column.columnEndM)
        ) {
          throw new Error(
            `Column "${column.columnName}" positions must be finite numbers.`
          );
        }

        if (column.columnStartM < 0) {
          throw new Error(
            `Column "${column.columnName}" cannot start before the section.`
          );
        }

        if (
          column.columnEndM >
          input.grossSectionLengthM
        ) {
          throw new Error(
            `Column "${column.columnName}" cannot end beyond the section.`
          );
        }

        if (
          column.columnEndM <=
          column.columnStartM
        ) {
          throw new Error(
            `Column "${column.columnName}" end position must be greater than its start position.`
          );
        }

        const specification =
          specificationsById.get(
            column.foundationSpecificationId
          );

        if (!specification) {
          throw new Error(
            `Foundation specification "${column.foundationSpecificationId}" was not found for column "${column.columnName}".`
          );
        }

        const columnWidthAlongFenceM =
          column.columnEndM -
          column.columnStartM;

        if (
          specification.lengthAlongFenceM <
          columnWidthAlongFenceM
        ) {
          throw new Error(
            `Foundation "${specification.name}" cannot be narrower along the fence than column "${column.columnName}".`
          );
        }

        const centrePositionM =
          (column.columnStartM +
            column.columnEndM) /
          2;

        const rawBaseStartM =
          centrePositionM -
          specification.lengthAlongFenceM / 2;

        const rawBaseEndM =
          centrePositionM +
          specification.lengthAlongFenceM / 2;

        const sectionBaseStartM = Math.max(
          rawBaseStartM,
          0
        );

        const sectionBaseEndM = Math.min(
          rawBaseEndM,
          input.grossSectionLengthM
        );

        const extensionBeforeSectionM =
          Math.max(0, -rawBaseStartM);

        const extensionAfterSectionM = Math.max(
          0,
          rawBaseEndM -
            input.grossSectionLengthM
        );

        return {
          id: `${column.columnId}-foundation-base`,
          name: `${column.columnName} Foundation Base`,

          supportedColumnId: column.columnId,
          foundationSpecificationId:
            specification.id,

          columnStartM: roundQuantity(
            column.columnStartM
          ),
          columnEndM: roundQuantity(
            column.columnEndM
          ),
          columnWidthAlongFenceM:
            roundQuantity(
              columnWidthAlongFenceM
            ),
          centrePositionM: roundQuantity(
            centrePositionM
          ),

          baseLengthAlongFenceM:
            roundQuantity(
              specification.lengthAlongFenceM
            ),
          baseWidthAcrossFenceM:
            roundQuantity(
              specification.widthAcrossFenceM
            ),
          baseThicknessM: roundQuantity(
            specification.thicknessM
          ),

          rawBaseStartM: roundQuantity(
            rawBaseStartM
          ),
          rawBaseEndM: roundQuantity(
            rawBaseEndM
          ),

          sectionBaseStartM: roundQuantity(
            sectionBaseStartM
          ),
          sectionBaseEndM: roundQuantity(
            sectionBaseEndM
          ),
          sectionOccupiedLengthM:
            roundQuantity(
              sectionBaseEndM -
                sectionBaseStartM
            ),

          extensionBeforeSectionM:
            roundQuantity(
              extensionBeforeSectionM
            ),
          extensionAfterSectionM:
            roundQuantity(
              extensionAfterSectionM
            ),
        };
      })
      .sort(
        (first, second) =>
          first.sectionBaseStartM -
            second.sectionBaseStartM ||
          first.sectionBaseEndM -
            second.sectionBaseEndM
      );

  const baseIntervals = placements.map(
    (placement) => ({
      id: placement.id,
      name: placement.name,

      supportedColumnId:
        placement.supportedColumnId,
      foundationSpecificationId:
        placement.foundationSpecificationId,

      startM: placement.sectionBaseStartM,
      endM: placement.sectionBaseEndM,
    })
  );

  return {
    sectionId: input.sectionId,
    grossSectionLengthM: roundQuantity(
      input.grossSectionLengthM
    ),

    placements,
    baseIntervals,
  };
}