import type {
  PriceItem,
  RateAnalysisResult,
  RateTemplate,
} from "./models";
import { resolveTemplateComponents } from "./assumptions";

const round = (value: number, precision = 2) =>
  Number(value.toFixed(precision));

export function calculateAnalysedRate(input: {
  template: RateTemplate;
  prices: PriceItem[];
  componentQuantityOverrides?: Record<string, number>;
  assumptionValues?: Record<string, number | string>;
  overheadPercent?: number;
  profitPercent?: number;
}): RateAnalysisResult {
  const {
    template,
    prices,
    componentQuantityOverrides = {},
    assumptionValues = {},
    overheadPercent = 0,
    profitPercent = 0,
  } = input;

  const components = resolveTemplateComponents(template, assumptionValues).map((component) => {
    const price = prices.find((item) => item.id === component.priceItemId);
    const quantityPerUnit = Math.max(
      0,
      componentQuantityOverrides[component.id] ?? component.quantityPerUnit,
    );
    const unitRate = price?.rate ?? null;
    const missingPrice = unitRate === null || !Number.isFinite(unitRate);
    return {
      ...component,
      quantityPerUnit,
      priceDescription: price?.description ?? component.description,
      priceUnit: price?.unit ?? "—",
      unitRate: missingPrice ? null : unitRate,
      amount: missingPrice ? null : round(quantityPerUnit * unitRate),
      missingPrice,
    };
  });

  const categoryTotal = (category: PriceItem["category"]) =>
    round(
      components
        .filter((component) => component.category === category)
        .reduce((sum, component) => sum + (component.amount ?? 0), 0),
    );
  const materialCost = categoryTotal("material");
  const labourCost = categoryTotal("labour");
  const plantCost = categoryTotal("plant");
  const subcontractCost = categoryTotal("subcontract");
  const directCost = round(
    materialCost + labourCost + plantCost + subcontractCost,
  );
  const overheadAmount = round(directCost * (Math.max(0, overheadPercent) / 100));
  const profitBase = directCost + overheadAmount;
  const profitAmount = round(profitBase * (Math.max(0, profitPercent) / 100));

  return {
    templateId: template.id,
    name: template.name,
    unit: template.unit,
    components,
    materialCost,
    labourCost,
    plantCost,
    subcontractCost,
    directCost,
    overheadPercent: Math.max(0, overheadPercent),
    overheadAmount,
    profitPercent: Math.max(0, profitPercent),
    profitAmount,
    unitRate: round(profitBase + profitAmount),
    missingPriceItemIds: components
      .filter((component) => component.missingPrice)
      .map((component) => component.priceItemId),
  };
}
