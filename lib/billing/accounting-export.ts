import type { Bill } from "./models";

export type AccountingBillTransfer = {
  schemaVersion: 1;
  sourceSystem: "charismak_estimator";
  reviewRequired: true;
  id: string;
  projectId: string;
  status: "completed";
  version: number;
  projectName: string;
  title: string;
  currency: string;
  priceBasisAt: string | null;
  sections: Array<{
    id: string;
    code: string | null;
    title: string;
    items: Array<{
      id: string;
      itemCode: string | null;
      description: string;
      unit: string;
      billQuantity: number;
      amount: number;
    }>;
  }>;
  totals: {
    directCost: number;
    contingency: number;
    overhead: number;
    profit: number;
    discount: number;
    subTotalBeforeTax: number;
    vat: number;
    grandTotal: number;
  };
};

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Produce the stable hand-off payload consumed by Charismak Construction Accounting.
 *
 * This function deliberately exports commercial layers separately. It does not decide
 * which amount becomes `internal_cost_budget` or `contract_value`; Accounting's review
 * step owns that decision.
 */
export function buildAccountingBillTransfer(bill: Bill): AccountingBillTransfer {
  if (bill.status !== "completed") {
    throw new Error("Complete and lock this bill before creating an Accounting project.");
  }
  if (!bill.projectId) {
    throw new Error("Link this bill to an Estimator project before Accounting hand-off.");
  }
  if (!bill.totals) {
    throw new Error("Recalculate this bill before Accounting hand-off.");
  }

  const sections = bill.sections.map((section) => ({
    id: section.id,
    code: section.code ?? null,
    title: section.title,
    items: section.items.map((item) => {
      if (item.amount == null || !Number.isFinite(item.amount)) {
        throw new Error(`Price “${item.description}” before Accounting hand-off.`);
      }
      if (!Number.isFinite(item.billQuantity) || item.billQuantity < 0) {
        throw new Error(`Review the quantity for “${item.description}” before Accounting hand-off.`);
      }

      return {
        id: item.id,
        itemCode: item.itemCode ?? null,
        description: item.description,
        unit: item.unit,
        billQuantity: item.billQuantity,
        amount: roundMoney(item.amount),
      };
    }),
  }));

  return {
    schemaVersion: 1,
    sourceSystem: "charismak_estimator",
    reviewRequired: true,
    id: bill.id,
    projectId: bill.projectId,
    status: "completed",
    version: bill.version,
    projectName: bill.projectName?.trim() || bill.title,
    title: bill.title,
    currency: bill.currency.toUpperCase(),
    priceBasisAt: bill.priceBasisAt ?? null,
    sections,
    totals: {
      directCost: roundMoney(bill.totals.directCost),
      contingency: roundMoney(bill.totals.contingency),
      overhead: roundMoney(bill.totals.overhead),
      profit: roundMoney(bill.totals.profit),
      discount: roundMoney(bill.totals.discount),
      subTotalBeforeTax: roundMoney(bill.totals.subTotalBeforeTax),
      vat: roundMoney(bill.totals.vat),
      grandTotal: roundMoney(bill.totals.grandTotal),
    },
  };
}
