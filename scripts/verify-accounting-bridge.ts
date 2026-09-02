import assert from "node:assert/strict";
import { buildAccountingBillTransfer } from "../lib/billing/accounting-export";
import type { Bill } from "../lib/billing/models";

const base: Bill = {
  id: "bill-1",
  projectId: "est-project-1",
  priceBasisAt: "2026-09-02T12:00:00.000Z",
  status: "completed",
  version: 3,
  rootBillId: "bill-1",
  title: "Jahi Residence BOQ",
  projectName: "Jahi Residence",
  currency: "NGN",
  createdAt: "2026-09-02T10:00:00.000Z",
  updatedAt: "2026-09-02T12:00:00.000Z",
  completedAt: "2026-09-02T12:00:00.000Z",
  rateMode: "all-in",
  sections: [
    {
      id: "blockwork",
      code: "04",
      title: "Blockwork",
      items: [
        {
          id: "wall-225",
          itemCode: "04",
          description: "225mm hollow block wall",
          unit: "m2",
          calculatedQuantity: 100,
          billQuantity: 100,
          allInRate: 12_000,
          rateSource: "manual",
          amount: 1_200_000,
        },
      ],
      subtotal: 1_200_000,
    },
  ],
  materials: [],
  assumptions: [],
  adjustments: {
    contingencyPercent: 5,
    overheadPercent: 10,
    profitPercent: 15,
    discountPercent: 0,
    vatPercent: 7.5,
  },
  totals: {
    directCost: 1_200_000,
    subTotal: 1_200_000,
    contingency: 60_000,
    overhead: 126_000,
    profit: 207_900,
    discount: 0,
    subTotalBeforeTax: 1_593_900,
    vat: 119_542.5,
    grandTotal: 1_713_442.5,
  },
};

const transfer = buildAccountingBillTransfer(base);
assert.equal(transfer.schemaVersion, 1);
assert.equal(transfer.sourceSystem, "charismak_estimator");
assert.equal(transfer.reviewRequired, true);
assert.equal(transfer.projectId, "est-project-1");
assert.equal(transfer.sections[0]?.items[0]?.amount, 1_200_000);
assert.equal(transfer.totals.directCost, 1_200_000);
assert.equal(transfer.totals.overhead, 126_000);
assert.equal(transfer.totals.profit, 207_900);
assert.equal(transfer.totals.vat, 119_542.5);
assert.equal(transfer.totals.grandTotal, 1_713_442.5);
assert.notEqual(transfer.totals.directCost, transfer.totals.grandTotal);

assert.throws(
  () => buildAccountingBillTransfer({ ...base, status: "draft" }),
  /Complete and lock this bill/,
);
assert.throws(
  () => buildAccountingBillTransfer({ ...base, projectId: null }),
  /Link this bill to an Estimator project/,
);
assert.throws(
  () =>
    buildAccountingBillTransfer({
      ...base,
      sections: [
        {
          ...base.sections[0],
          items: [{ ...base.sections[0]!.items[0]!, amount: null }],
        },
      ],
    }),
  /Price .* before Accounting hand-off/,
);

console.log("Estimator → Accounting bridge verification passed.");
