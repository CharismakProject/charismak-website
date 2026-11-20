/**
 * One material price list for the Rate Bank and the estimators.
 * Rate build-up lines that use one of these materials take their price from here, so a price change
 * flows through every rate. `buyStep` / `smallestBuy` describe how the material is actually bought,
 * for small jobs where you pay for whole bags, lengths or sheets rather than the exact quantity used.
 * Prices: Charismak Abuja purchase records and supplier quotes, November 2026 (see `source`).
 */

export type Material = {
  id: string;
  name: string;
  unit: string; // the unit rate lines use for this material
  price: number; // NGN per unit, Abuja
  buyStep: number; // the smallest increment you can buy, in `unit`
  smallestBuy: number; // the least you can practically buy for a small job, in `unit`
  buyNote: string; // how it is sold, in plain words
  source: string;
  checked: string; // ISO date the price was last checked
  assumption?: boolean; // buying rule is an assumption to be confirmed
};

const NOV = "2026-11-19";
const RECEIPTS = "Charismak purchase records & supplier quotes, Abuja";

export const MATERIALS: Material[] = [
  { id: "cement-50kg", name: "Cement, 50 kg bag", unit: "bag", price: 12_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold by the 50 kg bag", source: RECEIPTS, checked: NOV },
  { id: "sharp-sand", name: "Sharp / plaster sand", unit: "m³", price: 11_200, buyStep: 0.5, smallestBuy: 1, buyNote: "₦70,000 per 10-tonne tipper (≈ 6.25 m³); small yards sell from about 1 m³", source: RECEIPTS, checked: NOV, assumption: true },
  { id: "granite", name: "Granite (coarse aggregate), delivered", unit: "m³", price: 27_000, buyStep: 0.5, smallestBuy: 1, buyNote: "About ₦16,000–18,000 per tonne delivered (≈ 1.5 t per m³)", source: RECEIPTS, checked: NOV, assumption: true },
  { id: "laterite", name: "Laterite, imported fill", unit: "m³", price: 9_600, buyStep: 6.25, smallestBuy: 6.25, buyNote: "₦60,000 per 10-tonne tipper (≈ 6.25 m³)", source: RECEIPTS, checked: NOV },
  { id: "hardcore", name: "Hardcore (broken stone)", unit: "m³", price: 22_500, buyStep: 0.5, smallestBuy: 1, buyNote: "About ₦15,000 per tonne plus haulage", source: RECEIPTS, checked: NOV, assumption: true },
  { id: "block-225", name: "225 mm (9-inch) hollow sandcrete block", unit: "No.", price: 900, buyStep: 1, smallestBuy: 1, buyNote: "Sold per block", source: RECEIPTS, checked: NOV },
  { id: "block-150", name: "150 mm (6-inch) hollow sandcrete block", unit: "No.", price: 800, buyStep: 1, smallestBuy: 1, buyNote: "Sold per block", source: RECEIPTS, checked: NOV },
  { id: "timber-2x2", name: "2×2 timber, 3.6 m length", unit: "length", price: 1_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold per 12 ft length", source: RECEIPTS, checked: NOV },
  { id: "timber-2x3", name: "2×3 timber, 3.6 m length", unit: "length", price: 1_800, buyStep: 1, smallestBuy: 1, buyNote: "Sold per 12 ft length", source: RECEIPTS, checked: NOV },
  { id: "plank-1x12", name: "1×12 plank, 3.6 m length", unit: "length", price: 3_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold per 12 ft length", source: RECEIPTS, checked: NOV },
  { id: "marine-18-economy", name: "18 mm marine board, economy", unit: "sheet", price: 33_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold per 1.2 × 2.4 m sheet", source: RECEIPTS, checked: NOV },
  { id: "marine-18-premium", name: "18 mm marine board, premium", unit: "sheet", price: 40_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold per 1.2 × 2.4 m sheet", source: RECEIPTS, checked: NOV },
  { id: "nails", name: "Nails, 2–3 inch (bag)", unit: "bag", price: 31_000, buyStep: 0.04, smallestBuy: 0.04, buyNote: "₦31,000 per bag; also sold loose by the kg (≈ 1/25 bag)", source: RECEIPTS, checked: NOV, assumption: true },
  { id: "rebar-tmt", name: "High-yield TMT reinforcement", unit: "t", price: 1_100_000, buyStep: 0.0074, smallestBuy: 0.0074, buyNote: "≈ ₦1.1m/t; sold per 12 m length (Y10 ≈ 7.4 kg, Y12 ≈ 10.7 kg, Y20 ≈ 29.6 kg)", source: RECEIPTS, checked: NOV },
  { id: "brc-a142", name: "A142 BRC mesh, 2.4 × 4.8 m sheet", unit: "sheet", price: 44_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold per sheet", source: RECEIPTS, checked: NOV },
  { id: "dpm-1000g", name: "DPM polythene, 1000 gauge", unit: "kg", price: 2_000, buyStep: 1, smallestBuy: 1, buyNote: "Sold by roll or cut length; priced per kg", source: "Charismak Rate Bank reference", checked: NOV, assumption: true },
];

export const getMaterial = (id: string | undefined) => (id ? MATERIALS.find((m) => m.id === id) : undefined);

/** Which shared material a Rate Bank line uses, from its label and unit (only unambiguous matches). */
export function materialForLine(line: { label: string; unit: string; category: string }): string | undefined {
  if (line.category !== "material" && line.category !== "consumable") return undefined;
  const l = line.label.toLowerCase(), u = line.unit.toLowerCase();
  if (/cement/.test(l) && /bag/.test(u) && !/white/.test(l)) return "cement-50kg";
  if (/sharp sand|plaster\/sharp sand|plaster sand/.test(l) && u === "m³") return "sharp-sand";
  if (/granite|coarse aggregate/.test(l) && u === "m³") return "granite";
  if (/laterite/.test(l) && u === "m³") return "laterite";
  if (/hardcore/.test(l) && u === "m³") return "hardcore";
  if (/230 mm hollow block/.test(l)) return "block-225";
  if (/150 mm hollow block/.test(l)) return "block-150";
  if (/^2x2\b/.test(l) && /length/.test(u)) return "timber-2x2";
  if (/^2x3\b/.test(l) && /length/.test(u)) return "timber-2x3";
  if (/1x12 plank/.test(l)) return "plank-1x12";
  if (/economical marine plywood/.test(l)) return "marine-18-economy";
  if (/premium 18 mm marine plywood/.test(l)) return "marine-18-premium";
  if (/nails/.test(l) && u === "bag") return "nails";
  if (/tmt reinforcement/.test(l) && u === "t") return "rebar-tmt";
  if (/a142 mesh/.test(l) && u === "sheet") return "brc-a142";
  if (/dpm/.test(l) && u === "kg") return "dpm-1000g";
  return undefined;
}

/** What a small job has to buy: the quantity needed, rounded up to how the material is sold. */
export function toBuy(needed: number, material: Pick<Material, "buyStep" | "smallestBuy"> | undefined) {
  if (!(needed > 0)) return 0;
  if (!material) return needed;
  const steps = Math.ceil(needed / material.buyStep - 1e-9) * material.buyStep;
  return Math.round(Math.max(material.smallestBuy, steps) * 10000) / 10000;
}
