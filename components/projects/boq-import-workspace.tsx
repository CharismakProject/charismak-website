"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import * as XLSX from "xlsx";

import type { BillItem, BillSection } from "@/lib/billing/models";
import { createNewBill } from "@/lib/billing/store";
import type { UniversalProject } from "@/lib/projects/models";
import { saveProject } from "@/lib/projects/store";

type ImportedRow = {
  section: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
};

const headerAliases = {
  section: ["section", "bill", "element", "trade", "work section"],
  code: ["code", "item", "item no", "item number", "ref", "reference"],
  description: ["description", "work description", "item description", "particulars", "details"],
  unit: ["unit", "uom"],
  quantity: ["quantity", "qty", "bill quantity"],
  rate: ["rate", "unit rate", "price"],
  amount: ["amount", "total", "value"],
} as const;

const clean = (value: unknown) => String(value ?? "").trim();
const normalize = (value: unknown) => clean(value).toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
const numberValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(clean(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const findHeaderRow = (rows: unknown[][]) => {
  let best = { index: -1, score: 0 };
  rows.slice(0, 15).forEach((row, index) => {
    const cells = row.map(normalize);
    const score = Object.values(headerAliases).filter((aliases) =>
      aliases.some((alias) => cells.includes(alias)),
    ).length;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 3 ? best.index : -1;
};

const columnIndex = (headers: unknown[], key: keyof typeof headerAliases) => {
  const aliases = headerAliases[key];
  return headers.findIndex((header) => aliases.includes(normalize(header) as never));
};

export const parseBoqRows = (matrix: unknown[][]): ImportedRow[] => {
  const headerRow = findHeaderRow(matrix);
  if (headerRow < 0) throw new Error("The sheet needs headers for Description, Unit and Quantity. Rate or Amount is also recommended.");
  const headers = matrix[headerRow];
  const columns = {
    section: columnIndex(headers, "section"),
    code: columnIndex(headers, "code"),
    description: columnIndex(headers, "description"),
    unit: columnIndex(headers, "unit"),
    quantity: columnIndex(headers, "quantity"),
    rate: columnIndex(headers, "rate"),
    amount: columnIndex(headers, "amount"),
  };
  if (columns.description < 0 || columns.unit < 0 || columns.quantity < 0) {
    throw new Error("I could not identify Description, Unit and Quantity columns in this sheet.");
  }

  let currentSection = "Imported BOQ";
  return matrix.slice(headerRow + 1).flatMap((row) => {
    const description = clean(row[columns.description]);
    const unit = clean(row[columns.unit]);
    const quantity = numberValue(row[columns.quantity]);
    const explicitSection = columns.section >= 0 ? clean(row[columns.section]) : "";
    if (explicitSection) currentSection = explicitSection;

    // Common BOQ spreadsheets use a description-only row as a section heading.
    if (description && !unit && quantity === 0) {
      currentSection = description;
      return [];
    }
    if (!description || !unit || quantity <= 0) return [];

    const amount = columns.amount >= 0 ? numberValue(row[columns.amount]) : 0;
    const suppliedRate = columns.rate >= 0 ? numberValue(row[columns.rate]) : 0;
    const rate = suppliedRate || (amount > 0 ? amount / quantity : 0);
    return [{
      section: explicitSection || currentSection,
      code: columns.code >= 0 ? clean(row[columns.code]) : "",
      description,
      unit,
      quantity,
      rate,
      amount: amount || quantity * rate,
    }];
  });
};

const makeId = (prefix: string, index: number) => `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

export default function BoqImportWorkspace({
  project,
  onBack,
  onOpenBill,
}: {
  project: UniversalProject;
  onBack: () => void;
  onOpenBill: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sections = useMemo(() => new Set(rows.map((row) => row.section)).size, [rows]);
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows]);

  const chooseFile = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    setRows([]);
    setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("The spreadsheet has no readable sheet.");
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], { header: 1, defval: "", raw: true });
      const imported = parseBoqRows(matrix);
      if (!imported.length) throw new Error("No measurable BOQ rows were found. Check that quantities are greater than zero.");
      setSheetName(firstSheet);
      setRows(imported);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read this spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  const createBill = () => {
    if (!rows.length) return;
    const grouped = new Map<string, ImportedRow[]>();
    rows.forEach((row) => grouped.set(row.section, [...(grouped.get(row.section) ?? []), row]));
    const billSections: BillSection[] = [...grouped.entries()].map(([title, sectionRows], sectionIndex) => ({
      id: makeId("import-section", sectionIndex),
      code: null,
      title,
      items: sectionRows.map((row, itemIndex): BillItem => ({
        id: makeId("import-item", sectionIndex * 10000 + itemIndex),
        sourceCalculationId: null,
        sourceModule: "BOQ import",
        itemCode: row.code || null,
        description: row.description,
        unit: row.unit,
        calculatedQuantity: row.quantity,
        billQuantity: row.quantity,
        allInRate: row.rate,
        rateSource: "manual",
        manualRate: row.rate,
        amount: row.amount,
        notes: `Imported from ${fileName}${sheetName ? ` · ${sheetName}` : ""}`,
      })),
    }));
    const bill = createNewBill({
      title: `${project.name} BOQ`,
      projectName: project.name,
      clientName: project.clientName,
      location: project.location,
      currency: project.currency,
      rateMode: "all-in",
      sourceModules: ["BOQ import"],
      sections: billSections,
      assumptions: [{ id: makeId("import-assumption", 0), label: "Imported source", value: `${fileName} · ${sheetName}` }],
    });
    saveProject({
      ...project,
      linkedBillId: bill.id,
      scope: { ...(project.scope ?? {}), source: "imported", confidence: "professional" },
    });
    onOpenBill();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#617286]"><ArrowLeft className="h-4 w-4" />Projects</button>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#087A50]">Professional import</p>
        <h1 className="mt-1 text-2xl font-bold text-[#081B36]">Turn an existing spreadsheet into a working BOQ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">Upload Excel or CSV. The importer finds section, description, unit, quantity, rate and amount columns, then lets you review the detected items before creating the bill.</p>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B8C7D6] bg-[#F8FAFC] p-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E9F8F1] text-[#087A50]">{loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}</span>
          <strong className="mt-4 text-[#081B36]">{fileName || "Choose an Excel or CSV BOQ"}</strong>
          <span className="mt-2 text-xs text-[#617286]">.xlsx, .xls or .csv · first worksheet is imported</span>
          <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)} className="sr-only" />
        </label>
        {message ? <p className="mt-4 flex gap-2 rounded-xl border border-[#F4C9BC] bg-[#FFF1EC] p-4 text-sm text-[#A82A09]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</p> : null}
      </section>

      {rows.length ? (
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#087A50]"><CheckCircle2 className="h-4 w-4" />Ready to import</p><h2 className="mt-1 text-xl font-bold text-[#081B36]">{rows.length} items across {sections} section{sections === 1 ? "" : "s"}</h2><p className="mt-1 text-xs text-[#617286]">Detected from {sheetName}. You can edit quantities and rates in the BOQ after import.</p></div>
            <button type="button" onClick={createBill} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white"><FileSpreadsheet className="h-4 w-4" />Create working BOQ</button>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-[#DCE4EC]">
            <table className="min-w-[760px] w-full text-left text-xs">
              <thead className="bg-[#F4F7FA] text-[#617286]"><tr>{["Section", "Code", "Description", "Unit", "Qty", "Rate", "Amount"].map((label) => <th key={label} className="px-3 py-3 font-bold">{label}</th>)}</tr></thead>
              <tbody>{rows.slice(0, 30).map((row, index) => <tr key={`${row.description}-${index}`} className="border-t border-[#E5EBF1]"><td className="max-w-36 truncate px-3 py-3">{row.section}</td><td className="px-3 py-3">{row.code || "—"}</td><td className="max-w-72 px-3 py-3 font-semibold text-[#081B36]">{row.description}</td><td className="px-3 py-3">{row.unit}</td><td className="px-3 py-3">{row.quantity.toLocaleString()}</td><td className="px-3 py-3">{row.rate.toLocaleString()}</td><td className="px-3 py-3 font-semibold">{row.amount.toLocaleString()}</td></tr>)}</tbody>
              <tfoot><tr className="border-t border-[#DCE4EC] bg-[#FBFCFE]"><td colSpan={6} className="px-3 py-3 text-right font-bold">Detected total</td><td className="px-3 py-3 font-black text-[#081B36]">₦{total.toLocaleString()}</td></tr></tfoot>
            </table>
          </div>
          {rows.length > 30 ? <p className="mt-3 text-[11px] text-[#617286]">Previewing the first 30 of {rows.length} items. All items will be imported.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
