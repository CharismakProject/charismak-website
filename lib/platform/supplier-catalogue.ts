import type { PriceItem } from "@/lib/pricing/models";
import { SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";

const readableUnit = (unit: string) => {
  if (unit === "nr") return "piece";
  if (unit === "m") return "linear metre";
  if (unit === "m²") return "m²";
  if (unit === "m³") return "m³";
  return unit || "item";
};

const preferredUnits: Record<string, string[]> = {
  "cement-50kg": ["50 kg bag"],
  "sharp-sand": ["10 tonne tipper", "20 tonne tipper", "30 tonne tipper", "m³"],
  "granite-aggregate": ["tonne", "10 tonne tipper", "20 tonne tipper", "30 tonne tipper"],
  water: ["5,000 L tanker", "10,000 L tanker", "litre"],
  "block-225": ["piece", "100 pieces"],
  "reinforcement-steel": ["12 m length", "tonne", "kg"],
  "binding-wire": ["coil", "roll", "kg"],
  "formwork-sheet": ["1.22 × 2.44 m sheet"],
  "formwork-timber": ["piece", "length"],
  nails: ["kg"],
  "emulsion-paint": ["20 L bucket", "4 L bucket", "litre"],
  "floor-tile": ["carton", "m²"],
  "tile-adhesive": ["20 kg bag"],
  "cable-2-5": ["coil", "roll", "metre"],
  "conduit-20": ["length", "bundle"],
  "socket-13a": ["piece"],
  "back-box": ["piece"],
  "ppr-pipe-25": ["length", "bundle"],
  "soil-pipe-110": ["length", "bundle"],
  "longspan-roof-sheet": ["linear metre", "cut sheet"],
  "concrete-mixer": ["hire/day", "hire/week", "purchase unit"],
};

export function supplierUnitOptions(item: PriceItem): string[] {
  const configured = item.marketUnitOptions?.filter(Boolean) ?? [];
  const preferred = preferredUnits[item.id] ?? [];
  const primary = item.marketUnit ? [item.marketUnit] : [];
  const technical = [readableUnit(item.unit)];
  return Array.from(new Set([...preferred, ...primary, ...configured, ...technical].filter(Boolean)));
}

export function supplierDefaultUnit(item: PriceItem): string {
  return supplierUnitOptions(item)[0] || readableUnit(item.unit);
}

const normalizedText = (item: PriceItem) =>
  [
    item.id,
    item.code,
    item.description,
    item.brand,
    item.specification,
    item.marketUnit,
    ...(item.marketUnitOptions ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export function supplierCatalogueItemMatchesCategories(
  item: PriceItem,
  supplierCategoryIds: string[] | null | undefined,
) {
  const categoryIds = (supplierCategoryIds ?? []).filter(Boolean);
  if (!categoryIds.length) return true;

  const selectedForms = SUPPLIER_FORMS.filter((form) => categoryIds.includes(form.id));
  if (!selectedForms.length) return true;

  const text = normalizedText(item);
  return selectedForms.some((form) =>
    form.keywords.some((keyword) => text.includes(keyword.toLowerCase())),
  );
}

export function supplierCatalogueLabel(item: PriceItem) {
  return [item.description, item.brand, item.specification].filter(Boolean).join(" · ");
}
