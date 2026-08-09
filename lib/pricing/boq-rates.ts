import type { Bill } from "../billing/models";
import { isBillLocked, saveBill } from "../billing/store";
import { calculateAnalysedRate } from "./analysis";
import type { PriceItem, RateTemplate } from "./models";

export function applyPriceLibraryRates(input: {
  bill: Bill;
  prices: PriceItem[];
  templates: RateTemplate[];
}): { bill: Bill; pricedItemCount: number; skippedItemCount: number } {
  const { bill, prices, templates } = input;
  if (isBillLocked(bill)) {
    throw new Error("Completed bills cannot receive updated prices. Create a revision first.");
  }

  let pricedItemCount = 0;
  let skippedItemCount = 0;
  for (const item of bill.sections.flatMap((section) => section.items)) {
    const template = templates.find(
      (candidate) => candidate.module === item.sourceModule,
    );
    if (!template) {
      skippedItemCount += 1;
      continue;
    }
    const result = calculateAnalysedRate({ template, prices });
    if (result.missingPriceItemIds.length > 0) {
      skippedItemCount += 1;
      continue;
    }
    item.analysedRate = result.unitRate;
    item.allInRate = result.unitRate;
    item.materialRate = result.materialCost;
    item.labourRate = result.labourCost;
    item.plantRate = result.plantCost;
    item.otherRate =
      result.subcontractCost + result.overheadAmount + result.profitAmount;
    item.rateSource = "analysed";
    item.notes = `${item.notes ? `${item.notes} ` : ""}Rate refreshed from Price Library.`;
    pricedItemCount += 1;
  }
  return { bill: saveBill(bill), pricedItemCount, skippedItemCount };
}
