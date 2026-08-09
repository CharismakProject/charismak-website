import type { Bill, BillAssumption, BillSection, ProcurementItem } from "../billing/models";
import { isBillLocked, saveBill } from "../billing/store";
import { calculateAnalysedRate } from "./analysis";
import { describeTemplateAssumption } from "./assumptions";
import { getWorkCategoryTitle } from "./categories";
import type { PriceItem, RateEstimate, RateTemplate } from "./models";

const round = (value: number, precision = 4) => Number(value.toFixed(precision));

export function applyRateEstimateToBill(input: {
  bill: Bill;
  estimate: RateEstimate;
  prices: PriceItem[];
  templates: RateTemplate[];
}): Bill {
  const { bill, estimate, prices, templates } = input;
  if (isBillLocked(bill)) {
    throw new Error(
      "The current bill is completed. Create a revision before applying this estimate.",
    );
  }

  for (const section of bill.sections) {
    section.items = section.items.filter(
      (item) => item.sourceCalculationId !== estimate.id,
    );
  }
  bill.sections = bill.sections.filter((section) => section.items.length > 0);
  bill.materials = bill.materials.filter(
    (item) => item.sourceCalculationId !== estimate.id,
  );
  bill.assumptions = bill.assumptions.filter(
    (item) => !item.id.startsWith(`${estimate.id}:`),
  );

  const sectionMap = new Map<string, BillSection>();
  const materials: ProcurementItem[] = [];
  const assumptions: BillAssumption[] = [];

  for (const line of estimate.lines) {
    const catalogTemplate = templates.find((candidate) => candidate.id === line.templateId);
    const template = catalogTemplate ?? (line.customComponents?.length
      ? {
          id: `custom-${line.id}`,
          code: "CUSTOM",
          name: line.description,
          description: line.description,
          unit: line.unit,
          module: "custom",
          category: line.category ?? "custom",
          components: line.customComponents,
        }
      : null);
    const category = line.category ?? template?.category ?? "custom";
    let section = sectionMap.get(category);
    if (!section) {
      section = {
        id: `estimate-${category}`,
        title: getWorkCategoryTitle(category),
        items: [],
      };
      sectionMap.set(category, section);
    }

    if (!template) {
      section.items.push({
        id: `${estimate.id}:${line.id}`,
        sourceCalculationId: estimate.id,
        sourceModule: "rate-estimate",
        itemCode: null,
        description: line.description,
        unit: line.unit,
        calculatedQuantity: line.quantity,
        billQuantity: line.quantity,
        allInRate: line.customUnitRate ?? null,
        manualRate: line.customUnitRate ?? null,
        rateSource: "manual",
        notes: "Custom estimate item.",
      });
      continue;
    }

    const analysis = calculateAnalysedRate({
      template,
      prices,
      componentQuantityOverrides: line.componentQuantityOverrides,
      assumptionValues: line.assumptionValues,
      overheadPercent: line.overheadPercent,
      profitPercent: line.profitPercent,
    });
    const fullyPriced = analysis.missingPriceItemIds.length === 0;
    const manualOverride = line.manualUnitRateOverride ?? null;
    const rateSource = line.rateSource ?? (manualOverride !== null ? "manual" : "default");
    const selectedRate = rateSource === "manual"
      ? manualOverride
      : rateSource === "analysed"
        ? fullyPriced ? analysis.unitRate : null
        : template.defaultUnitRate ?? null;
    section.items.push({
      id: `${estimate.id}:${line.id}`,
      sourceCalculationId: estimate.id,
      sourceModule: "rate-estimate",
      itemCode: template.code,
      description: line.description || template.description,
      unit: line.unit || template.unit,
      calculatedQuantity: line.quantity,
      billQuantity: line.quantity,
      allInRate: selectedRate,
      defaultRate: template.defaultUnitRate ?? null,
      analysedRate: fullyPriced ? analysis.unitRate : null,
      manualRate: manualOverride,
      rateSource,
      notes: rateSource === "manual" && manualOverride !== null
        ? `Manual unit-rate override applied. Analysed rate retained in the estimate for comparison.`
        : rateSource === "analysed" && fullyPriced
        ? `Rate analysed from current Price Library with ${line.overheadPercent}% overhead and ${line.profitPercent}% profit.`
        : rateSource === "default"
          ? `Charismak starter reference rate selected; verify before commercial issue.`
          : `Unpriced: ${analysis.missingPriceItemIds.length} Price Library item(s) require rates.`,
    });

    for (const component of analysis.components.filter(
      (candidate) => candidate.category === "material",
    )) {
      materials.push({
        id: `${estimate.id}:${line.id}:${component.id}`,
        materialId: component.priceItemId,
        sourceCalculationId: estimate.id,
        sourceModule: "rate-estimate",
        description: `${component.priceDescription} — ${line.description}`,
        unit: component.priceUnit,
        calculatedQuantity: round(component.quantityPerUnit * line.quantity),
        wastagePercent: 0,
        purchaseQuantity: round(component.quantityPerUnit * line.quantity),
        notes: "Quantity allowance comes from the editable rate analysis template.",
      });
    }

    assumptions.push({
      id: `${estimate.id}:${line.id}:rate-analysis`,
      label: `${line.description} rate analysis`,
      value: `${analysis.components.length} component(s); direct cost ${analysis.directCost.toFixed(2)}; overhead ${line.overheadPercent}%; profit ${line.profitPercent}%.`,
    });
    if (template.assumptions?.length) {
      assumptions.push({
        id: `${estimate.id}:${line.id}:configured-assumptions`,
        label: `${line.description} configured assumptions`,
        value: describeTemplateAssumption(template, line.assumptionValues),
      });
    }
  }

  bill.sections.push(...sectionMap.values());
  bill.materials.push(...materials);
  bill.assumptions.push(...assumptions);
  bill.title = `${estimate.title} — Bill of Quantities`;
  bill.projectName = estimate.projectName || bill.projectName;
  bill.clientName = estimate.clientName || bill.clientName;
  bill.location = estimate.location || bill.location;
  bill.currency = estimate.currency;
  bill.sourceModules = Array.from(
    new Set([...(bill.sourceModules ?? []), "rate-estimate"]),
  );
  return saveBill(bill);
}
