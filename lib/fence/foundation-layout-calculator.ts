import type {
  FenceFoundationIntervalResult,
  FenceFoundationLayoutCalculationInput,
  FenceFoundationLayoutCalculationResult,
  FencePanelFoundationSegmentResult,
} from "./types";

type InternalInterval = {
  startM: number;
  endM: number;
  sourceIds: string[];
};

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

const validateInterval = (
  name: string,
  interval: {
    startM: number;
    endM: number;
  },
  grossSectionLengthM: number
): void => {
  if (
    !Number.isFinite(interval.startM) ||
    !Number.isFinite(interval.endM)
  ) {
    throw new Error(
      `${name} positions must be finite numbers.`
    );
  }

  if (interval.startM < 0) {
    throw new Error(
      `${name} cannot start before the section.`
    );
  }

  if (interval.endM > grossSectionLengthM) {
    throw new Error(
      `${name} cannot end beyond the section.`
    );
  }

  if (interval.endM <= interval.startM) {
    throw new Error(
      `${name} end position must be greater than its start position.`
    );
  }
};

const mergeIntervals = (
  intervals: InternalInterval[]
): InternalInterval[] => {
  if (intervals.length === 0) {
    return [];
  }

  const sortedIntervals = [...intervals].sort(
    (first, second) =>
      first.startM - second.startM ||
      first.endM - second.endM
  );

  const mergedIntervals: InternalInterval[] = [];

  for (const interval of sortedIntervals) {
    const previous =
      mergedIntervals[mergedIntervals.length - 1];

    if (
      previous &&
      interval.startM <= previous.endM
    ) {
      previous.endM = Math.max(
        previous.endM,
        interval.endM
      );

      previous.sourceIds = Array.from(
        new Set([
          ...previous.sourceIds,
          ...interval.sourceIds,
        ])
      );
    } else {
      mergedIntervals.push({
        startM: interval.startM,
        endM: interval.endM,
        sourceIds: [...interval.sourceIds],
      });
    }
  }

  return mergedIntervals;
};

const convertIntervalsToResults = (
  intervals: InternalInterval[]
): FenceFoundationIntervalResult[] =>
  intervals.map((interval) => ({
    startM: roundQuantity(interval.startM),
    endM: roundQuantity(interval.endM),
    lengthM: roundQuantity(
      interval.endM - interval.startM
    ),
    sourceIds: [...interval.sourceIds],
  }));

const totalIntervalLength = (
  intervals: InternalInterval[]
): number =>
  intervals.reduce(
    (total, interval) =>
      total + interval.endM - interval.startM,
    0
  );

const createPanelFoundationSegments = (
  sectionId: string,
  grossSectionLengthM: number,
  excludedIntervals: InternalInterval[]
): FencePanelFoundationSegmentResult[] => {
  const segments: FencePanelFoundationSegmentResult[] =
    [];

  let cursorM = 0;

  for (const interval of excludedIntervals) {
    if (interval.startM > cursorM) {
      const segmentNumber = segments.length + 1;

      segments.push({
        id: `${sectionId}-foundation-segment-${segmentNumber}`,
        sectionId,
        segmentNumber,

        startM: roundQuantity(cursorM),
        endM: roundQuantity(interval.startM),
        lengthM: roundQuantity(
          interval.startM - cursorM
        ),
      });
    }

    cursorM = Math.max(cursorM, interval.endM);
  }

  if (cursorM < grossSectionLengthM) {
    const segmentNumber = segments.length + 1;

    segments.push({
      id: `${sectionId}-foundation-segment-${segmentNumber}`,
      sectionId,
      segmentNumber,

      startM: roundQuantity(cursorM),
      endM: roundQuantity(
        grossSectionLengthM
      ),
      lengthM: roundQuantity(
        grossSectionLengthM - cursorM
      ),
    });
  }

  return segments;
};

export function calculateFenceFoundationLayout(
  input: FenceFoundationLayoutCalculationInput
): FenceFoundationLayoutCalculationResult {
  assertPositive(
    "Gross section length",
    input.grossSectionLengthM
  );

  const baseIntervals: InternalInterval[] =
    input.baseIntervals.map((base) => {
      validateInterval(
        `Foundation base "${base.name}"`,
        base,
        input.grossSectionLengthM
      );

      return {
        startM: base.startM,
        endM: base.endM,
        sourceIds: [`base:${base.id}`],
      };
    });

  const excludedGateIntervals: InternalInterval[] =
    input.gateIntervals
      .filter(
        (gate) =>
          gate.treatment !==
          "continuous-under-gate"
      )
      .map((gate) => {
        validateInterval(
          `Gate foundation interval "${gate.name}"`,
          gate,
          input.grossSectionLengthM
        );

        return {
          startM: gate.startM,
          endM: gate.endM,
          sourceIds: [`gate:${gate.id}`],
        };
      });

  for (const gate of input.gateIntervals) {
    if (
      gate.treatment ===
      "continuous-under-gate"
    ) {
      validateInterval(
        `Gate foundation interval "${gate.name}"`,
        gate,
        input.grossSectionLengthM
      );
    }
  }

  const mergedBaseIntervals =
    mergeIntervals(baseIntervals);

  const mergedGateIntervals = mergeIntervals(
    excludedGateIntervals
  );

  const combinedExcludedIntervals =
    mergeIntervals([
      ...baseIntervals,
      ...excludedGateIntervals,
    ]);

  const panelFoundationSegments =
    createPanelFoundationSegments(
      input.sectionId,
      input.grossSectionLengthM,
      combinedExcludedIntervals
    );

  const totalPanelFoundationLengthM =
    panelFoundationSegments.reduce(
      (total, segment) =>
        total + segment.lengthM,
      0
    );

  return {
    sectionId: input.sectionId,
    grossSectionLengthM: roundQuantity(
      input.grossSectionLengthM
    ),

    baseOccupiedIntervals:
      convertIntervalsToResults(
        mergedBaseIntervals
      ),

    gateExcludedIntervals:
      convertIntervalsToResults(
        mergedGateIntervals
      ),

    combinedExcludedIntervals:
      convertIntervalsToResults(
        combinedExcludedIntervals
      ),

    panelFoundationSegments,

    totalBaseOccupiedLengthM: roundQuantity(
      totalIntervalLength(
        mergedBaseIntervals
      )
    ),
    totalGateExcludedLengthM: roundQuantity(
      totalIntervalLength(
        mergedGateIntervals
      )
    ),
    totalCombinedExcludedLengthM:
      roundQuantity(
        totalIntervalLength(
          combinedExcludedIntervals
        )
      ),
    totalPanelFoundationLengthM:
      roundQuantity(
        totalPanelFoundationLengthM
      ),
  };
}