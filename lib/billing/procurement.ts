import type { ProcurementItem } from "./models";

const round = (value: number, precision = 6) =>
  Number(value.toFixed(precision));

const materialName: Record<string, string> = {
  "cement-50kg": "Cement, 50 kg bags",
  "sharp-sand": "Sharp sand",
  "granite-aggregate": "Granite coarse aggregate",
  "water": "Construction water",
  "block-225": "225 mm sandcrete blocks",
  "binding-wire": "Binding wire",
  "formwork-sheet": "Formwork plywood sheets",
  "imported-fill": "Approved imported filling",
};

export function inferMaterialId(item: ProcurementItem): string {
  if (item.materialId) return item.materialId;
  const value = item.description.toLowerCase();
  if (value.includes("cement")) return "cement-50kg";
  if (value.includes("sharp sand")) return "sharp-sand";
  if (value.includes("coarse aggregate") || value.includes("granite")) {
    return "granite-aggregate";
  }
  if (value.includes("water")) return "water";
  if (value.includes("225mm") || value.includes("225 mm")) return "block-225";
  if (value.includes("binding wire")) return "binding-wire";
  if (value.includes("formwork") && value.includes("sheet")) {
    return "formwork-sheet";
  }
  if (value.includes("imported fill")) return "imported-fill";
  const bar = value.match(/y\s?(\d+)\s+reinforcement/);
  if (bar) return `reinforcement-y${bar[1]}`;
  return value
    .replace(/\b(for|to)\b.*$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || item.id;
}

export function consolidateProcurementItems(
  items: ProcurementItem[],
): ProcurementItem[] {
  const groups = new Map<
    string,
    ProcurementItem & { contributors: Set<string>; notesSet: Set<string> }
  >();

  for (const item of items) {
    const materialId = inferMaterialId(item);
    const unit = item.unit.trim().toLowerCase();
    const key = `${materialId}::${unit}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...item,
        id: `consolidated:${materialId}:${unit}`,
        materialId,
        description:
          materialName[materialId]
          ?? item.description.replace(/\s+[—–]\s+.+$/, "").replace(/\s+for\s+.+$/i, ""),
        calculatedQuantity: item.calculatedQuantity,
        purchaseQuantity: item.purchaseQuantity,
        wastagePercent: 0,
        contributors: new Set([item.sourceModule]),
        notesSet: new Set(item.notes ? [item.notes] : []),
      });
      continue;
    }

    existing.calculatedQuantity += item.calculatedQuantity;
    existing.purchaseQuantity += item.purchaseQuantity;
    existing.contributors.add(item.sourceModule);
    if (item.notes) existing.notesSet.add(item.notes);
  }

  return Array.from(groups.values()).map((group) => {
    const sources = Array.from(group.contributors).sort();
    const notes = Array.from(group.notesSet);
    return {
      id: group.id,
      materialId: group.materialId,
      sourceCalculationId: "consolidated",
      sourceModule: sources.join(", "),
      description: group.description,
      unit: group.unit,
      calculatedQuantity: round(group.calculatedQuantity),
      wastagePercent: 0,
      purchaseQuantity: round(group.purchaseQuantity),
      notes: `Combined from ${sources.join(", ")}.${notes.length === 1 ? ` ${notes[0]}` : ""}`,
    };
  });
}
