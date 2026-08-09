import type { PriceCategory, PriceItem } from "./models";

const columns = [
  "code",
  "description",
  "category",
  "unit",
  "rate",
  "currency",
  "location",
  "source",
  "default_rate",
  "country_code",
  "region",
  "source_url",
  "confidence",
  "updated_at",
] as const;

const requiredColumns = [
  "code",
  "description",
  "category",
  "unit",
  "rate",
  "currency",
  "location",
  "source",
] as const;

const escapeCell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function exportPriceItemsCsv(items: PriceItem[]): string {
  return [
    columns.join(","),
    ...items.map((item) =>
      [
        item.code,
        item.description,
        item.category,
        item.unit,
        item.rate,
        item.currency,
        item.location,
        item.source,
        item.defaultRate ?? null,
        item.countryCode ?? "",
        item.region ?? "",
        item.sourceUrl ?? "",
        item.confidence ?? "manual",
        item.updatedAt,
      ].map(escapeCell).join(","),
    ),
  ].join("\r\n");
}

function parseRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export function importPriceItemsCsv(csv: string, existing: PriceItem[]): PriceItem[] {
  const rows = parseRows(csv);
  if (rows.length < 2) throw new Error("The price CSV has no data rows.");
  const headings = rows[0].map((heading) => heading.toLowerCase());
  const missing = requiredColumns.filter((column) => !headings.includes(column));
  if (missing.length > 0) {
    throw new Error(`The price CSV is missing: ${missing.join(", ")}.`);
  }

  const validCategories: PriceCategory[] = ["material", "labour", "plant", "subcontract"];
  const now = new Date().toISOString();
  const items = existing.map((item) => ({ ...item }));

  for (const row of rows.slice(1)) {
    const value = (column: typeof columns[number]) => row[headings.indexOf(column)] ?? "";
    const code = value("code").trim();
    if (!code) continue;
    const categoryValue = value("category") as PriceCategory;
    const category = validCategories.includes(categoryValue) ? categoryValue : "material";
    const rawRate = value("rate");
    const parsedRate = rawRate === "" ? null : Number(rawRate);
    const rate = parsedRate !== null && Number.isFinite(parsedRate) ? Math.max(0, parsedRate) : null;
    const existingItem = items.find(
      (candidate) => candidate.code.toLowerCase() === code.toLowerCase(),
    );
    const rawDefaultRate = value("default_rate");
    const parsedDefaultRate = rawDefaultRate === "" ? null : Number(rawDefaultRate);
    const defaultRate = parsedDefaultRate !== null && Number.isFinite(parsedDefaultRate)
      ? Math.max(0, parsedDefaultRate)
      : existingItem?.defaultRate ?? null;
    const confidenceValue = value("confidence");
    const confidence = ["starter", "manual", "index-adjusted", "verified"].includes(confidenceValue)
      ? confidenceValue as PriceItem["confidence"]
      : existingItem?.confidence ?? "manual";
    const item: PriceItem = {
      ...existingItem,
      id: existingItem?.id ?? `price-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      code,
      description: value("description") || code,
      category,
      unit: value("unit") || "item",
      rate,
      defaultRate,
      currency: value("currency") || "NGN",
      countryCode: value("country_code") || existingItem?.countryCode || "NG",
      region: value("region") || existingItem?.region || "",
      location: value("location") || "Abuja",
      source: value("source") || "CSV import",
      sourceUrl: value("source_url") || existingItem?.sourceUrl || null,
      confidence,
      updatedAt: value("updated_at") || now,
      active: existingItem?.active ?? true,
    };
    const existingIndex = items.findIndex((candidate) => candidate.id === item.id);
    if (existingIndex >= 0) items[existingIndex] = item;
    else items.push(item);
  }
  return items;
}
