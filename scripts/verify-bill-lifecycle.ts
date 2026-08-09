import {
  createBillRevision,
  createNewBill,
  getOrCreateDraftBill,
  getOrCreateLinkedDraftBill,
  loadBill,
  loadBillById,
  loadBills,
  markBillCompleted,
  selectBill,
} from "../lib/billing/store";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  get length() {
    return this.values.size;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
});

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const first = createNewBill({
  title: "Completed Fence A",
  projectName: "Fence A",
});
const completedFirst = markBillCompleted(first.id);
assert(completedFirst.status === "completed", "Bill A should be completed.");

// This mirrors New Fence Estimate: it creates its own draft immediately.
const second = createNewBill({
  title: "Fence B",
  projectName: "Fence B",
});
assert(second.id !== first.id, "Bill B must have an independent ID.");
assert(loadBill()?.id === second.id, "Bill B must become the active bill.");

// Even if somebody opens Bill A, the Fence B workflow resolves its linked ID.
selectBill(first.id);
const restoredSecond = getOrCreateLinkedDraftBill(second.id);
assert(restoredSecond.id === second.id, "Fence B must reopen its linked bill.");
assert(loadBill()?.id === second.id, "Linked Bill B must become active again.");

let lockedWriteRejected = false;
try {
  getOrCreateLinkedDraftBill(first.id);
} catch {
  lockedWriteRejected = true;
}
assert(lockedWriteRejected, "A completed linked bill must remain locked.");

const firstRevision = createBillRevision(first.id);
assert(firstRevision.version === 2, "The revision should be Version 2.");
assert(firstRevision.status === "draft", "The revision should be editable.");
assert(
  loadBillById(first.id)?.status === "completed",
  "The original completed bill must remain unchanged.",
);

// Quick calculators must not be trapped by whichever completed bill was last
// viewed. They receive a fresh independent draft.
selectBill(first.id);
const calculatorBill = getOrCreateDraftBill({ title: "Concrete Calculation" });
assert(calculatorBill.status === "draft", "Calculator bill must be editable.");
assert(calculatorBill.id !== first.id, "Calculator must not reuse Bill A.");

assert(loadBills().length === 4, "All independent bills and revisions must remain saved.");

console.log("Bill lifecycle verification passed:");
console.log({
  completedBill: first.id,
  independentFenceBill: second.id,
  revision: firstRevision.id,
  calculatorBill: calculatorBill.id,
  savedBillCount: loadBills().length,
});
