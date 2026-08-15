export type TruckCapacityBasis = "tonnes" | "cubic-metres";

export type BulkPurchaseAssumption = {
  densityTonnesPerM3: number;
  truckCapacity: number;
  truckCapacityBasis: TruckCapacityBasis;
};

export type BulkPurchaseConversion = {
  technicalVolumeM3: number;
  approximateWeightTonnes: number;
  truckCapacity: number;
  truckCapacityBasis: TruckCapacityBasis;
  exactTruckloads: number;
  fullTruckloads: number;
  fullLoadVolumeM3: number;
  fullLoadWeightTonnes: number;
};

const round = (value: number, precision = 6) =>
  Number(value.toFixed(precision));

const positive = (name: string, value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }
};

export function convertBulkMaterialToPurchaseUnits(input: {
  volumeM3: number;
  assumption: BulkPurchaseAssumption;
}): BulkPurchaseConversion {
  const { volumeM3, assumption } = input;
  if (!Number.isFinite(volumeM3) || volumeM3 < 0) {
    throw new Error("Bulk-material volume cannot be negative.");
  }
  positive("Bulk density", assumption.densityTonnesPerM3);
  positive("Truck capacity", assumption.truckCapacity);

  const approximateWeightTonnes = volumeM3 * assumption.densityTonnesPerM3;
  const exactTruckloads = assumption.truckCapacityBasis === "tonnes"
    ? approximateWeightTonnes / assumption.truckCapacity
    : volumeM3 / assumption.truckCapacity;
  const fullTruckloads = Math.ceil(exactTruckloads);
  const fullLoadWeightTonnes = assumption.truckCapacityBasis === "tonnes"
    ? fullTruckloads * assumption.truckCapacity
    : fullTruckloads * assumption.truckCapacity * assumption.densityTonnesPerM3;
  const fullLoadVolumeM3 = assumption.truckCapacityBasis === "cubic-metres"
    ? fullTruckloads * assumption.truckCapacity
    : fullLoadWeightTonnes / assumption.densityTonnesPerM3;

  return {
    technicalVolumeM3: round(volumeM3),
    approximateWeightTonnes: round(approximateWeightTonnes),
    truckCapacity: round(assumption.truckCapacity),
    truckCapacityBasis: assumption.truckCapacityBasis,
    exactTruckloads: round(exactTruckloads),
    fullTruckloads,
    fullLoadVolumeM3: round(fullLoadVolumeM3),
    fullLoadWeightTonnes: round(fullLoadWeightTonnes),
  };
}

export function formatBulkPurchaseSummary(conversion: BulkPurchaseConversion): string {
  const capacityUnit = conversion.truckCapacityBasis === "tonnes" ? "tonne" : "m³";
  return `Approx. ${conversion.approximateWeightTonnes.toLocaleString("en-NG", { maximumFractionDigits: 2 })} tonnes · ${conversion.exactTruckloads.toLocaleString("en-NG", { maximumFractionDigits: 2 })} × ${conversion.truckCapacity} ${capacityUnit} loads · plan ${conversion.fullTruckloads} full load${conversion.fullTruckloads === 1 ? "" : "s"}`;
}
