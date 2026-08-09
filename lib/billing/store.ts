import type {
  Bill,
  BillAdjustment,
  BillItem,
  ProcurementItem,
} from "./models";
import { getStarterBillItemRate } from "./default-rates";

// Billing shares the estimator draft payload, but preserves all unrelated keys.
const DRAFT_KEY = "charismak-estimator-draft";
export const BILL_UPDATED_EVENT = "charismak:bill-updated";

const defaultAdjustments: BillAdjustment = {
  contingencyPercent: 0,
  overheadPercent: 0,
  profitPercent: 0,
  discountPercent: 0,
  vatPercent: 7.5,
};

function canUseStorage(): boolean {
  return typeof localStorage !== "undefined";
}

function readDraft(): Record<string, any> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return {};
  }
}

function writeDraft(payload: Record<string, any>) {
  if (!canUseStorage()) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

function notifyBillUpdated(bill: Bill | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BILL_UPDATED_EVENT, { detail: { bill } }),
  );
}

function makeBillId(): string {
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBill(bill: Bill): Bill {
  const createdAt = bill.createdAt ?? new Date().toISOString();
  bill.status ??= "draft";
  bill.version ??= 1;
  bill.rootBillId ??= bill.id;
  bill.parentBillId ??= null;
  bill.createdAt = createdAt;
  bill.updatedAt ??= createdAt;
  bill.completedAt ??= null;
  bill.rateMode ??= "all-in";
  bill.sections ??= [];
  for (const item of bill.sections.flatMap((section) => section.items)) {
    item.defaultRate ??= getStarterBillItemRate(item);
    if (!item.rateSource) {
      if (item.allInRate !== null && item.allInRate !== undefined) {
        item.rateSource = "manual";
        item.manualRate ??= item.allInRate;
      } else {
        item.rateSource = "default";
      }
    }
  }
  bill.materials ??= [];
  bill.assumptions ??= [];
  bill.exportOptions = {
    includeMaterialsSchedule: true,
    includeAssumptions: true,
    ...bill.exportOptions,
  };
  bill.sourceModules ??= [];
  bill.adjustments = { ...defaultAdjustments, ...bill.adjustments };
  return recalcBill(bill, false);
}

function readBillCollection(): { bills: Bill[]; activeBillId: string | null } {
  const draft = readDraft();
  const bills = Array.isArray(draft.bills)
    ? (draft.bills as Bill[]).map((bill) => normalizeBill(bill))
    : [];
  const legacyBill = draft.bill ? normalizeBill(draft.bill as Bill) : null;

  // Seamlessly migrate the original one-bill storage model.
  if (legacyBill && !bills.some((bill) => bill.id === legacyBill.id)) {
    bills.push(legacyBill);
  }

  return {
    bills,
    activeBillId:
      typeof draft.activeBillId === "string"
        ? draft.activeBillId
        : legacyBill?.id ?? bills[0]?.id ?? null,
  };
}

function writeBillCollection(bills: Bill[], activeBillId: string | null) {
  const draft = readDraft();
  const activeBill = bills.find((bill) => bill.id === activeBillId) ?? null;
  draft.bills = bills;
  draft.activeBillId = activeBill?.id ?? null;
  // Keep this alias for compatibility with earlier app builds.
  draft.bill = activeBill;
  writeDraft(draft);
}

function persistBill(bill: Bill, allowCompleted = false): Bill {
  const normalized = recalcBill(normalizeBill(bill), false);
  const { bills } = readBillCollection();
  const existing = bills.find((candidate) => candidate.id === normalized.id);

  if (
    !allowCompleted &&
    (existing?.status === "completed" || normalized.status === "completed")
  ) {
    throw new Error(
      "This bill is completed and locked. Create a new revision before editing it.",
    );
  }

  normalized.updatedAt = new Date().toISOString();
  const nextBills = bills.some((candidate) => candidate.id === normalized.id)
    ? bills.map((candidate) =>
        candidate.id === normalized.id ? normalized : candidate,
      )
    : [...bills, normalized];
  writeBillCollection(nextBills, normalized.id);
  notifyBillUpdated(normalized);
  return normalized;
}

export function isBillLocked(bill: Bill | null): boolean {
  return bill?.status === "completed";
}

export function loadBill(): Bill | null {
  const { bills, activeBillId } = readBillCollection();
  return bills.find((bill) => bill.id === activeBillId) ?? null;
}

export function loadBills(): Bill[] {
  return readBillCollection().bills
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function loadBillById(id: string): Bill | null {
  return readBillCollection().bills.find((bill) => bill.id === id) ?? null;
}

export function selectBill(id: string): Bill {
  const { bills } = readBillCollection();
  const bill = bills.find((candidate) => candidate.id === id);
  if (!bill) throw new Error("The selected bill could not be found.");
  writeBillCollection(bills, bill.id);
  notifyBillUpdated(bill);
  return bill;
}

export function saveBill(bill: Bill): Bill {
  return persistBill(bill);
}

export function createNewBill(overrides?: Partial<Bill>): Bill {
  const id = makeBillId();
  const now = new Date().toISOString();
  const bill: Bill = {
    id,
    billNumber: overrides?.billNumber ?? null,
    status: "draft",
    version: 1,
    rootBillId: id,
    parentBillId: null,
    title: overrides?.title ?? "Estimate",
    projectName: overrides?.projectName ?? null,
    clientName: overrides?.clientName ?? null,
    location: overrides?.location ?? null,
    currency: overrides?.currency ?? "NGN",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    sourceModules: [],
    rateMode: overrides?.rateMode ?? "all-in",
    sections: overrides?.sections ?? [],
    materials: overrides?.materials ?? [],
    assumptions: overrides?.assumptions ?? [],
    exportOptions: overrides?.exportOptions ?? {
      includeMaterialsSchedule: true,
      includeAssumptions: true,
    },
    adjustments: overrides?.adjustments ?? defaultAdjustments,
  };
  return saveBill(bill);
}

export function getOrCreateDraftBill(overrides?: Partial<Bill>): Bill {
  const current = loadBill();
  if (!current) return createNewBill(overrides);
  if (isBillLocked(current)) {
    // A completed issue is immutable. A fresh calculator result therefore
    // starts a new independent draft instead of silently targeting the old
    // completed bill. Revisions are still created explicitly from the
    // completed bill workspace.
    return createNewBill(overrides);
  }
  return current;
}

/**
 * Resolve the draft that belongs to a specific estimator workflow.
 *
 * Unlike getOrCreateDraftBill, this never falls back to some unrelated active
 * bill. That distinction is what lets several fence estimates coexist while
 * completed versions remain locked.
 */
export function getOrCreateLinkedDraftBill(
  billId: string | null,
  overrides?: Partial<Bill>,
): Bill {
  if (!billId) return createNewBill(overrides);

  const linked = loadBillById(billId);
  if (!linked) return createNewBill(overrides);
  if (isBillLocked(linked)) {
    throw new Error(
      `“${linked.title}” Version ${linked.version} is completed and locked. Start a new estimate for a separate bill, or create a revision to continue this bill.`,
    );
  }

  return selectBill(linked.id);
}

export function markBillCompleted(id: string): Bill {
  const bill = loadBillById(id);
  if (!bill) throw new Error("The selected bill could not be found.");
  if (bill.status === "completed") return selectBill(id);

  const completed = JSON.parse(JSON.stringify(bill)) as Bill;
  completed.status = "completed";
  completed.completedAt = new Date().toISOString();
  return persistBill(completed, true);
}

export function createBillRevision(id: string): Bill {
  const source = loadBillById(id);
  if (!source) throw new Error("The selected bill could not be found.");
  if (source.status !== "completed") {
    throw new Error(
      "Only a completed bill needs a revision. Continue editing this draft instead.",
    );
  }

  const { bills } = readBillCollection();
  const rootBillId = source.rootBillId || source.id;
  const highestVersion = bills
    .filter((bill) => bill.rootBillId === rootBillId)
    .reduce((highest, bill) => Math.max(highest, bill.version || 1), 1);
  const now = new Date().toISOString();
  const revision = JSON.parse(JSON.stringify(source)) as Bill;
  revision.id = makeBillId();
  revision.status = "draft";
  revision.version = highestVersion + 1;
  revision.rootBillId = rootBillId;
  revision.parentBillId = source.id;
  revision.createdAt = now;
  revision.updatedAt = now;
  revision.completedAt = null;
  revision.billNumber = source.billNumber
    ? `${source.billNumber.replace(/-R\d+$/, "")}-R${revision.version}`
    : null;
  return persistBill(revision);
}

export function deleteDraftBill(id: string): Bill | null {
  const { bills, activeBillId } = readBillCollection();
  const target = bills.find((bill) => bill.id === id);
  if (!target) return loadBill();
  if (target.status === "completed") {
    throw new Error("Completed bills are protected and cannot be deleted.");
  }

  const nextBills = bills.filter((bill) => bill.id !== id);
  const nextActiveId =
    activeBillId === id ? nextBills[0]?.id ?? null : activeBillId;
  writeBillCollection(nextBills, nextActiveId);
  const nextActive =
    nextBills.find((bill) => bill.id === nextActiveId) ?? null;
  notifyBillUpdated(nextActive);
  return nextActive;
}

export function addItemToBill(
  bill: Bill,
  sectionId: string,
  item: BillItem,
) {
  if (isBillLocked(bill)) {
    throw new Error(
      "This bill is completed and locked. Create a new revision before editing it.",
    );
  }
  let section = bill.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    section = { id: sectionId, title: "General", items: [] };
    bill.sections.push(section);
  }
  section.items.push(item);
  recalcBill(bill);
}

export function getBillItemRate(item: BillItem): number {
  if (item.rateSource === "default") return item.defaultRate ?? 0;
  if (item.rateSource === "analysed") return item.analysedRate ?? 0;
  if (item.rateSource === "manual") {
    if (item.manualRate !== null && item.manualRate !== undefined) {
      return item.manualRate;
    }
    if (item.allInRate !== null && item.allInRate !== undefined) {
      return item.allInRate;
    }
    return (
      (item.materialRate ?? 0) +
      (item.labourRate ?? 0) +
      (item.plantRate ?? 0) +
      (item.otherRate ?? 0)
    );
  }
  if (item.allInRate !== null && item.allInRate !== undefined) {
    return item.allInRate;
  }
  return (
    (item.materialRate ?? 0) +
    (item.labourRate ?? 0) +
    (item.plantRate ?? 0) +
    (item.otherRate ?? 0)
  );
}

export function isBillItemPriced(item: BillItem): boolean {
  if (item.rateSource === "default") {
    return item.defaultRate !== null && item.defaultRate !== undefined;
  }
  if (item.rateSource === "analysed") {
    return item.analysedRate !== null && item.analysedRate !== undefined;
  }
  if (item.rateSource === "manual") {
    return (
      item.manualRate !== null && item.manualRate !== undefined
    ) || (item.allInRate !== null && item.allInRate !== undefined) || [
      item.materialRate,
      item.labourRate,
      item.plantRate,
      item.otherRate,
    ].some((rate) => rate !== null && rate !== undefined);
  }
  return [
    item.allInRate,
    item.materialRate,
    item.labourRate,
    item.plantRate,
    item.otherRate,
  ].some((rate) => rate !== null && rate !== undefined);
}

export function recalcBill(bill: Bill, persist = true): Bill {
  const directCost = bill.sections.reduce(
    (sectionTotal, section) =>
      sectionTotal +
      section.items.reduce((itemTotal, item) => {
        const amount = item.billQuantity * getBillItemRate(item);
        item.amount = isBillItemPriced(item) ? amount : null;
        return itemTotal + amount;
      }, 0),
    0,
  );

  for (const section of bill.sections) {
    section.subtotal = section.items.reduce(
      (total, item) => total + item.billQuantity * getBillItemRate(item),
      0,
    );
  }

  const contingency =
    directCost * (bill.adjustments.contingencyPercent / 100);
  const overheadBase = directCost + contingency;
  const overhead = overheadBase * (bill.adjustments.overheadPercent / 100);
  const profitBase = overheadBase + overhead;
  const profit = profitBase * (bill.adjustments.profitPercent / 100);
  const beforeDiscount = profitBase + profit;
  const discount = beforeDiscount * (bill.adjustments.discountPercent / 100);
  const subTotalBeforeTax = beforeDiscount - discount;
  const vat = subTotalBeforeTax * (bill.adjustments.vatPercent / 100);
  const grandTotal = subTotalBeforeTax + vat;

  bill.totals = {
    directCost,
    subTotal: directCost,
    contingency,
    overhead,
    profit,
    discount,
    subTotalBeforeTax,
    vat,
    grandTotal,
  };

  if (persist) saveBill(bill);
  return bill;
}

export function replaceCalculationInBill(input: {
  bill: Bill;
  sectionId: string;
  sectionTitle: string;
  calculationId: string;
  module: string;
  workItem?: BillItem;
  workItems?: BillItem[];
  materials: ProcurementItem[];
  assumptions?: Bill["assumptions"];
}): Bill {
  const {
    bill,
    sectionId,
    sectionTitle,
    calculationId,
    module,
    workItem,
    workItems,
    materials,
    assumptions = [],
  } = input;

  return replaceCalculationSectionsInBill({
    bill,
    calculationId,
    module,
    sections: [
      {
        id: sectionId,
        title: sectionTitle,
        items: workItems ?? (workItem ? [workItem] : []),
      },
    ],
    materials,
    assumptions,
  });
}

export function replaceCalculationSectionsInBill(input: {
  bill: Bill;
  calculationId: string;
  module: string;
  sections: Bill["sections"];
  materials: ProcurementItem[];
  assumptions?: Bill["assumptions"];
}): Bill {
  const {
    bill,
    calculationId,
    module,
    sections: incomingSections,
    materials,
    assumptions = [],
  } = input;

  if (isBillLocked(bill)) {
    throw new Error(
      "This bill is completed and locked. Create a new revision before adding calculations.",
    );
  }

  const incomingWorkItems = incomingSections.flatMap((section) => section.items);
  const existingWorkItems = bill.sections
    .flatMap((existingSection) => existingSection.items)
    .filter((item) => item.sourceCalculationId === calculationId);

  for (const incomingItem of incomingWorkItems) {
    const existingItem = existingWorkItems.find(
      (candidate) => candidate.id === incomingItem.id,
    );
    if (!existingItem) continue;
    incomingItem.materialRate = existingItem.materialRate ?? null;
    incomingItem.labourRate = existingItem.labourRate ?? null;
    incomingItem.plantRate = existingItem.plantRate ?? null;
    incomingItem.otherRate = existingItem.otherRate ?? null;
    incomingItem.allInRate = existingItem.allInRate ?? null;
    incomingItem.rateSource = existingItem.rateSource;
    incomingItem.defaultRate = existingItem.defaultRate;
    incomingItem.analysedRate = existingItem.analysedRate;
    incomingItem.manualRate = existingItem.manualRate;
  }

  for (const section of bill.sections) {
    section.items = section.items.filter(
      (item) => item.sourceCalculationId !== calculationId,
    );
  }
  bill.sections = bill.sections.filter((section) => section.items.length > 0);

  for (const incomingSection of incomingSections) {
    if (incomingSection.items.length === 0) continue;
    let section = bill.sections.find(
      (candidate) => candidate.id === incomingSection.id,
    );
    if (!section) {
      section = {
        id: incomingSection.id,
        code: incomingSection.code,
        title: incomingSection.title,
        items: [],
      };
      bill.sections.push(section);
    } else {
      section.code = incomingSection.code;
      section.title = incomingSection.title;
    }
    section.items.push(...incomingSection.items);
  }

  bill.materials = bill.materials.filter(
    (material) => material.sourceCalculationId !== calculationId,
  );
  bill.materials.push(...materials);

  bill.assumptions = [
    ...bill.assumptions.filter(
      (assumption) => !assumption.id.startsWith(`${calculationId}:`),
    ),
    ...assumptions,
  ];
  bill.sourceModules = Array.from(
    new Set([...(bill.sourceModules ?? []), module]),
  );

  saveBill(bill);
  return bill;
}

export function removeBillItem(bill: Bill, itemId: string): Bill {
  if (isBillLocked(bill)) {
    throw new Error(
      "This bill is completed and locked. Create a new revision before editing it.",
    );
  }
  const item = bill.sections
    .flatMap((section) => section.items)
    .find((candidate) => candidate.id === itemId);
  if (!item) return bill;

  for (const section of bill.sections) {
    section.items = section.items.filter((candidate) => candidate.id !== itemId);
  }
  bill.sections = bill.sections.filter((section) => section.items.length > 0);
  if (item.sourceCalculationId) {
    bill.materials = bill.materials.filter(
      (material) => material.sourceCalculationId !== item.sourceCalculationId,
    );
  }
  saveBill(bill);
  return bill;
}
