import {
  createNewBill,
  getOrCreateLinkedDraftBill,
  loadBill,
  selectBill,
} from "../lib/billing/store";
import { calculateGuidedEstimate } from "../lib/projects/guided-estimate";
import {
  createRateEstimate,
  loadPriceItems,
  loadRateEstimateByProjectId,
  updatePriceItem,
} from "../lib/pricing/store";

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

// Structural steel must use explicit steel tonnage, never floor area as tonnes.
const steel = calculateGuidedEstimate("structural-steel", {
  floorAreaM2: 800,
  steelWeightTonnes: 10,
  finishLevel: "standard",
  preliminariesMode: "none",
  includeExternalWorks: true,
});
assert(steel.basisQuantity === 10, "Structural steel basis must be the entered tonnage.");
assert(steel.basisUnit === "tonne", "Structural steel basis unit must be tonne.");
assert(steel.low === 26_000_000, "10 t standard steel low benchmark should be ₦26m.");
assert(steel.high === 34_000_000, "10 t standard steel high benchmark should be ₦34m.");
assert(!steel.sections.some((section) => section.id === "external"), "Steel tonnage must not silently add external works.");

// A project-linked BOQ must reopen its own bill even if another project is active.
const billA = createNewBill({
  projectId: "project-a",
  title: "Project A BOQ",
});
const billB = createNewBill({
  projectId: "project-b",
  title: "Project B BOQ",
});
selectBill(billB.id);
const restoredA = getOrCreateLinkedDraftBill(billA.id);
assert(restoredA.id === billA.id, "Project A must reopen its linked BOQ.");
assert(restoredA.projectId === "project-a", "Project A BOQ must retain its project ID.");
assert(loadBill()?.id === billA.id, "Linked project BOQ must become the active bill.");

// An estimate must freeze the Price Library at creation.
const beforePrices = loadPriceItems();
const cementBefore = beforePrices.find((item) => item.id === "cement-50kg")?.rate;
assert(cementBefore !== undefined, "Starter cement rate should exist for this test.");

const estimate = createRateEstimate({
  projectId: "project-a",
  title: "Project A Estimate",
});
const snapshotBefore = estimate.priceItemsSnapshot?.find((item) => item.id === "cement-50kg")?.rate;
assert(snapshotBefore === cementBefore, "Estimate should capture the current cement rate.");

updatePriceItem("cement-50kg", { rate: 99_999 });
const reloaded = loadRateEstimateByProjectId("project-a");
const snapshotAfter = reloaded?.priceItemsSnapshot?.find((item) => item.id === "cement-50kg")?.rate;
assert(snapshotAfter === snapshotBefore, "Price Library edits must not silently rewrite an existing estimate snapshot.");

console.log("Estimator foundation verification passed:");
console.log({
  steelBasis: `${steel.basisQuantity} ${steel.basisUnit}`,
  projectABill: restoredA.id,
  projectBBill: billB.id,
  frozenCementRate: snapshotAfter,
  currentCementRate: loadPriceItems().find((item) => item.id === "cement-50kg")?.rate,
});
