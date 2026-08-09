import type {
  EstimateCategoryCostResult,
  EstimateCostCalculationInput,
  EstimateCostCalculationResult,
  EstimateCostCategory,
  EstimateQuantityRoundingPolicy,
  EstimateResourceCostResult,
} from "./types";

type ResourceAccumulator = {
  resourceId: string;
  rateId: string;

  name: string;
  category: EstimateCostCategory;

  unit: string;
  currency: string;
  unitRate: number;

  sourceLineIds: string[];
  basicQuantity: number;

  roundingPolicy:
    EstimateQuantityRoundingPolicy;

  packageSize: number | null;
};

const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

const roundMoney = (value: number): number =>
  Number(value.toFixed(2));

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

const calculateProcurementQuantity = (
  basicQuantity: number,
  roundingPolicy:
    EstimateQuantityRoundingPolicy,
  packageSize: number | null
): number => {
  if (roundingPolicy === "none") {
    return basicQuantity;
  }

  if (roundingPolicy === "ceil-whole-unit") {
    return Math.ceil(basicQuantity);
  }

  if (
    packageSize === null ||
    !Number.isFinite(packageSize) ||
    packageSize <= 0
  ) {
    throw new Error(
      "Package size must be greater than zero when package rounding is selected."
    );
  }

  return (
    Math.ceil(basicQuantity / packageSize) *
    packageSize
  );
};

export function calculateEstimateCost(
  input: EstimateCostCalculationInput
): EstimateCostCalculationResult {
  assertPercentage(
    "Contingency percentage",
    input.contingencyPercent
  );
  assertPercentage(
    "Overhead percentage",
    input.overheadPercent
  );
  assertPercentage(
    "Profit percentage",
    input.profitPercent
  );
  assertPercentage(
    "Tax percentage",
    input.taxPercent
  );

  const ratesById = new Map(
    input.rates.map((rate) => [
      rate.id,
      rate,
    ])
  );

  if (ratesById.size !== input.rates.length) {
    throw new Error(
      "Estimate rate IDs must be unique."
    );
  }

  for (const rate of input.rates) {
    assertNonNegative(
      `Rate "${rate.name}"`,
      rate.unitRate
    );

    if (rate.currency !== input.currency) {
      throw new Error(
        `Rate "${rate.name}" uses currency "${rate.currency}" instead of estimate currency "${input.currency}".`
      );
    }
  }

  const lineIds = new Set<string>();
  const accumulators = new Map<
    string,
    ResourceAccumulator
  >();

  for (const line of input.quantityLines) {
    if (lineIds.has(line.id)) {
      throw new Error(
        `Estimate quantity line ID "${line.id}" is duplicated.`
      );
    }

    lineIds.add(line.id);

    assertNonNegative(
      `Quantity line "${line.description}"`,
      line.quantity
    );

    const rate = ratesById.get(line.rateId);

    if (!rate) {
      throw new Error(
        `Rate "${line.rateId}" was not found for quantity line "${line.description}".`
      );
    }

    if (rate.resourceId !== line.resourceId) {
      throw new Error(
        `Quantity line "${line.description}" does not match rate resource "${rate.resourceId}".`
      );
    }

    const groupKey =
      `${line.resourceId}::${line.rateId}`;

    const existing =
      accumulators.get(groupKey);

    if (existing) {
      if (
        existing.roundingPolicy !==
          line.roundingPolicy ||
        existing.packageSize !==
          line.packageSize
      ) {
        throw new Error(
          `Resource "${rate.name}" has conflicting procurement-rounding rules.`
        );
      }

      existing.basicQuantity +=
        line.quantity;

      existing.sourceLineIds.push(line.id);
    } else {
      accumulators.set(groupKey, {
        resourceId: line.resourceId,
        rateId: line.rateId,

        name: rate.name,
        category: rate.category,

        unit: rate.unit,
        currency: rate.currency,
        unitRate: rate.unitRate,

        sourceLineIds: [line.id],
        basicQuantity: line.quantity,

        roundingPolicy:
          line.roundingPolicy,

        packageSize: line.packageSize,
      });
    }
  }

  const resources: EstimateResourceCostResult[] =
    Array.from(accumulators.values()).map(
      (resource) => {
        const procurementQuantity =
          calculateProcurementQuantity(
            resource.basicQuantity,
            resource.roundingPolicy,
            resource.packageSize
          );

        return {
          resourceId: resource.resourceId,
          rateId: resource.rateId,

          name: resource.name,
          category: resource.category,

          unit: resource.unit,
          currency: resource.currency,

          sourceLineIds: [
            ...resource.sourceLineIds,
          ],

          basicQuantity: roundQuantity(
            resource.basicQuantity
          ),

          procurementQuantity:
            roundQuantity(
              procurementQuantity
            ),

          roundingAddition: roundQuantity(
            procurementQuantity -
              resource.basicQuantity
          ),

          roundingPolicy:
            resource.roundingPolicy,

          packageSize: resource.packageSize,

          unitRate: roundMoney(
            resource.unitRate
          ),

          amount: roundMoney(
            procurementQuantity *
              resource.unitRate
          ),
        };
      }
    );

  const categoryOrder: EstimateCostCategory[] =
    [
      "material",
      "labour",
      "plant",
      "transport",
      "subcontract",
      "other",
    ];

  const categories: EstimateCategoryCostResult[] =
    categoryOrder
      .map((category) => ({
        category,

        amount: roundMoney(
          resources
            .filter(
              (resource) =>
                resource.category === category
            )
            .reduce(
              (total, resource) =>
                total + resource.amount,
              0
            )
        ),
      }))
      .filter(
        (category) => category.amount !== 0
      );

  const directCost = roundMoney(
    resources.reduce(
      (total, resource) =>
        total + resource.amount,
      0
    )
  );

  const contingencyAmount = roundMoney(
    directCost *
      (input.contingencyPercent / 100)
  );

  const overheadBase =
    directCost + contingencyAmount;

  const overheadAmount = roundMoney(
    overheadBase *
      (input.overheadPercent / 100)
  );

  const profitBase =
    overheadBase + overheadAmount;

  const profitAmount = roundMoney(
    profitBase *
      (input.profitPercent / 100)
  );

  const subtotalBeforeTax = roundMoney(
    profitBase + profitAmount
  );

  const taxAmount = roundMoney(
    subtotalBeforeTax *
      (input.taxPercent / 100)
  );

  const grandTotal = roundMoney(
    subtotalBeforeTax + taxAmount
  );

  return {
    id: input.id,
    name: input.name,
    currency: input.currency,

    resources,
    categories,

    directCost,

    contingencyPercent:
      input.contingencyPercent,
    contingencyAmount,

    overheadPercent:
      input.overheadPercent,
    overheadAmount,

    profitPercent: input.profitPercent,
    profitAmount,

    subtotalBeforeTax,

    taxPercent: input.taxPercent,
    taxAmount,

    grandTotal,
  };
}