import * as XLSX from "xlsx";

import type { Bill } from "./models";
import {
  consolidateProcurementItems,
  getPracticalPurchaseSummary,
} from "./procurement";
import { getBillItemRate, isBillItemPriced, recalcBill } from "./store";

const currency = (value: number, code: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: code || "NGN",
    maximumFractionDigits: 2,
  }).format(value);

const number = (value: number, precision = 3) =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: precision,
  }).format(value);

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function isBillPriced(bill: Bill): boolean {
  return bill.sections.some((section) => section.items.some(isBillItemPriced));
}

export function createBillWorkbook(billInput: Bill): XLSX.WorkBook {
  const bill = recalcBill(billInput, false);
  const exportOptions = {
    includeMaterialsSchedule: true,
    includeAssumptions: true,
    ...bill.exportOptions,
  };
  const consolidatedMaterials = consolidateProcurementItems(bill.materials);
  const workbook = XLSX.utils.book_new();
  const status = isBillPriced(bill)
    ? "PRICED BILL OF QUANTITIES"
    : "UNPRICED BILL OF QUANTITIES";

  const coverRows = [
    ["CHARISMAK PROJECT NIGERIA LIMITED"],
    ["DESIGN, COST & BUILD"],
    [],
    [status],
    [bill.title],
    [],
    ["Project", bill.projectName ?? ""],
    ["Client", bill.clientName ?? ""],
    ["Location", bill.location ?? ""],
    ["Currency", bill.currency],
    ["Version", bill.version],
    ["Document status", bill.status === "completed" ? "COMPLETED / LOCKED" : "DRAFT"],
    ["Created", new Date(bill.createdAt).toLocaleDateString("en-NG")],
    ["Completed", bill.completedAt ? new Date(bill.completedAt).toLocaleDateString("en-NG") : ""],
  ];
  const cover = XLSX.utils.aoa_to_sheet(coverRows);
  cover["!cols"] = [{ wch: 42 }, { wch: 42 }];
  XLSX.utils.book_append_sheet(workbook, cover, "Cover");

  const boqRows: unknown[][] = [
    [status],
    [bill.title],
    [],
    [
      "S/N",
      "DESCRIPTION",
      "UNIT",
      "QTY",
      "MATERIAL RATE",
      "LABOUR RATE",
      "PLANT / OTHER RATE",
      "TOTAL RATE",
      "AMOUNT",
    ],
  ];
  const itemRows: number[] = [];
  let serial = 1;

  for (const section of bill.sections) {
    boqRows.push(["", section.title.toUpperCase()]);
    for (const item of section.items) {
      const excelRow = boqRows.length + 1;
      itemRows.push(excelRow);
      boqRows.push([
        serial++,
        item.description,
        item.unit,
        item.billQuantity,
        item.materialRate ?? "",
        item.labourRate ?? "",
        (item.plantRate ?? 0) + (item.otherRate ?? 0) || "",
        getBillItemRate(item),
        "",
      ]);
    }
  }

  boqRows.push([]);
  const directCostRow = boqRows.length + 1;
  boqRows.push(["", "DIRECT CONSTRUCTION COST", "", "", "", "", "", "", ""]);
  const boq = XLSX.utils.aoa_to_sheet(boqRows);

  for (const row of itemRows) {
    boq[`I${row}`] = { t: "n", f: `D${row}*H${row}` };
  }
  boq[`I${directCostRow}`] = {
    t: "n",
    f: itemRows.length
      ? `SUM(${itemRows.map((row) => `I${row}`).join(",")})`
      : "0",
  };
  boq["!cols"] = [
    { wch: 8 },
    { wch: 72 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(workbook, boq, "BOQ");

  const materialRows = [
    [
      "S/N",
      "MATERIAL",
      "UNIT",
      "CALCULATED QTY",
      "WASTAGE %",
      "PURCHASE QTY",
      "PRACTICAL PURCHASE",
      "NOTES",
    ],
    ...consolidatedMaterials.map((material, index) => [
      index + 1,
      material.description,
      material.unit,
      material.calculatedQuantity,
      material.wastagePercent,
      material.purchaseQuantity,
      getPracticalPurchaseSummary(material) ?? "",
      material.notes ?? "",
    ]),
  ];
  const materials = XLSX.utils.aoa_to_sheet(materialRows);
  materials["!cols"] = [
    { wch: 8 },
    { wch: 52 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 52 },
    { wch: 54 },
  ];
  if (exportOptions.includeMaterialsSchedule) {
    XLSX.utils.book_append_sheet(workbook, materials, "Materials Schedule");
  }

  const costRows: unknown[][] = [
    ["COST SUMMARY", "PERCENTAGE", "AMOUNT"],
    ["Direct construction cost", "", { t: "n", f: `BOQ!I${directCostRow}` }],
    ["Contingency", bill.adjustments.contingencyPercent, { t: "n", f: "C2*B3/100" }],
    ["Overhead", bill.adjustments.overheadPercent, { t: "n", f: "(C2+C3)*B4/100" }],
    ["Profit", bill.adjustments.profitPercent, { t: "n", f: "(C2+C3+C4)*B5/100" }],
    ["Discount", bill.adjustments.discountPercent, { t: "n", f: "(C2+C3+C4+C5)*B6/100" }],
    ["Subtotal before tax", "", { t: "n", f: "C2+C3+C4+C5-C6" }],
    ["VAT", bill.adjustments.vatPercent, { t: "n", f: "C7*B8/100" }],
    ["GRAND TOTAL", "", { t: "n", f: "C7+C8" }],
  ];
  const costSummary = XLSX.utils.aoa_to_sheet(costRows);
  costSummary["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(workbook, costSummary, "Cost Summary");

  const assumptionRows = [
    ["CALCULATION ASSUMPTIONS", "VALUE"],
    ...bill.assumptions.map((assumption) => [assumption.label, assumption.value]),
  ];
  const assumptions = XLSX.utils.aoa_to_sheet(assumptionRows);
  assumptions["!cols"] = [{ wch: 52 }, { wch: 72 }];
  if (exportOptions.includeAssumptions) {
    XLSX.utils.book_append_sheet(workbook, assumptions, "Assumptions");
  }

  return workbook;
}

export function downloadBillWorkbook(bill: Bill): string {
  const workbook = createBillWorkbook(bill);
  const safeTitle = (bill.title || "Charismak-Estimate")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  const filename = `${safeTitle || "Charismak-Estimate"}-V${bill.version}-${bill.status}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return filename;
}

export function openBillPrintView(billInput: Bill): void {
  const bill = recalcBill(billInput, false);
  const exportOptions = {
    includeMaterialsSchedule: true,
    includeAssumptions: true,
    ...bill.exportOptions,
  };
  const consolidatedMaterials = consolidateProcurementItems(bill.materials);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("The print window was blocked. Allow pop-ups and try again.");
  }

  const status = isBillPriced(bill)
    ? "Priced Bill of Quantities"
    : "Unpriced Bill of Quantities";
  const itemRows = bill.sections
    .flatMap((section) =>
      section.items.map((item) => ({ section: section.title, item })),
    )
    .map(
      ({ section, item }, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(section)}</strong><br>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.unit)}</td>
          <td class="number">${number(item.billQuantity)}</td>
          <td class="number">${isBillItemPriced(item) ? currency(getBillItemRate(item), bill.currency) : ""}</td>
          <td class="number">${item.amount === null || item.amount === undefined ? "" : currency(item.amount, bill.currency)}</td>
        </tr>`,
    )
    .join("");
  const materialRows = consolidatedMaterials
    .map(
      (material, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(material.description)}</td>
          <td>${escapeHtml(material.unit)}</td>
          <td class="number">${number(material.calculatedQuantity)}</td>
          <td class="number">${number(material.purchaseQuantity)}</td>
          <td>${escapeHtml(getPracticalPurchaseSummary(material) ?? "")}</td>
          <td>${escapeHtml(material.notes ?? "")}</td>
        </tr>`,
    )
    .join("");
  const assumptionRows = bill.assumptions
    .map(
      (assumption) => `
        <tr><td>${escapeHtml(assumption.label)}</td><td>${escapeHtml(assumption.value)}</td></tr>`,
    )
    .join("");
  const supportingSchedules =
    exportOptions.includeMaterialsSchedule || exportOptions.includeAssumptions
      ? `<section class="page">
          <div class="page-header"><strong>${escapeHtml(bill.title)}</strong><span>CPNL</span></div>
          ${exportOptions.includeMaterialsSchedule ? `<h2>Materials Procurement Schedule</h2>
          <table>
            <thead><tr><th>S/N</th><th>Material</th><th>Unit</th><th>Calculated Qty</th><th>Purchase Qty</th><th>Practical Purchase</th><th>Notes</th></tr></thead>
            <tbody>${materialRows || '<tr><td colspan="7">No material quantities.</td></tr>'}</tbody>
          </table>` : ""}
          ${exportOptions.includeAssumptions ? `<h3>Calculation Assumptions</h3>
          <table><tbody>${assumptionRows || '<tr><td>No assumptions recorded.</td><td></td></tr>'}</tbody></table>` : ""}
        </section>`
      : "";

  printWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(status)} - ${escapeHtml(bill.title)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #071e33; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
          .cover { min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; border: 2px solid #0d3b66; padding: 20mm; }
          .logo { width: 100%; max-width: 430px; height: auto; margin: 0 auto; display: block; }
          .cover-copy { text-align: center; }
          .cover h1 { margin: 18px 0 8px; font-size: 28px; letter-spacing: .08em; text-transform: uppercase; }
          .cover h2 { margin: 0; color: #c8320a; font-size: 20px; }
          .meta { margin: 28px auto 0; width: 82%; border-top: 1px solid #0d3b66; }
          .meta div { display: grid; grid-template-columns: 110px 1fr; padding: 8px 0; border-bottom: 1px solid #d6dfe9; text-align: left; }
          .brand-bar { height: 10px; background: linear-gradient(90deg,#071e33 0 68%,#c8320a 68% 86%,#e7b34b 86%); }
          .page { page-break-after: always; }
          .page:last-child { page-break-after: auto; }
          .page-header { display: flex; justify-content: space-between; gap: 24px; align-items: end; border-bottom: 3px solid #0d3b66; padding-bottom: 8px; margin-bottom: 12px; }
          .page-header strong { font-size: 14px; }
          h2 { margin: 0 0 12px; font-size: 18px; }
          h3 { margin: 20px 0 8px; font-size: 13px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0d3b66; color: white; font-size: 9px; letter-spacing: .04em; text-transform: uppercase; }
          th, td { border: 1px solid #36566e; padding: 7px; vertical-align: top; }
          .number { text-align: right; white-space: nowrap; }
          .summary { margin-left: auto; width: 60%; }
          .summary td:first-child { font-weight: 700; }
          .grand td { background: #071e33; color: white; font-size: 13px; font-weight: 700; }
          .muted { color: #526579; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <section class="cover">
          <div class="brand-bar"></div>
          <div class="cover-copy">
            <img class="logo" src="${window.location.origin}/branding/charismak-full-logo.png" alt="Charismak Project Nigeria Limited">
            <h1>${escapeHtml(status)}</h1>
            <h2>${escapeHtml(bill.title)}</h2>
            <div class="meta">
              <div><strong>Project</strong><span>${escapeHtml(bill.projectName || bill.title)}</span></div>
              <div><strong>Client</strong><span>${escapeHtml(bill.clientName || "Not specified")}</span></div>
              <div><strong>Location</strong><span>${escapeHtml(bill.location || "Not specified")}</span></div>
              <div><strong>Version</strong><span>Version ${bill.version}</span></div>
              <div><strong>Status</strong><span>${bill.status === "completed" ? "COMPLETED / LOCKED" : "DRAFT"}</span></div>
              <div><strong>Created</strong><span>${escapeHtml(new Date(bill.createdAt).toLocaleDateString("en-NG"))}</span></div>
              ${bill.completedAt ? `<div><strong>Completed</strong><span>${escapeHtml(new Date(bill.completedAt).toLocaleDateString("en-NG"))}</span></div>` : ""}
            </div>
          </div>
          <p class="muted">Prepared with Charismak Construction Estimator</p>
        </section>

        <section class="page">
          <div class="page-header"><strong>${escapeHtml(bill.title)}</strong><span>CPNL</span></div>
          <h2>Bill of Quantities</h2>
          <table>
            <thead><tr><th>S/N</th><th>Description</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>${itemRows || '<tr><td colspan="6">No BOQ items.</td></tr>'}</tbody>
          </table>
        </section>

        ${supportingSchedules}

        <section class="page">
          <div class="page-header"><strong>${escapeHtml(bill.title)}</strong><span>CPNL</span></div>
          <h2>General Summary</h2>
          <table class="summary">
            <tbody>
              <tr><td>Direct construction cost</td><td class="number">${currency(bill.totals?.directCost ?? 0, bill.currency)}</td></tr>
              <tr><td>Contingency (${number(bill.adjustments.contingencyPercent)}%)</td><td class="number">${currency(bill.totals?.contingency ?? 0, bill.currency)}</td></tr>
              <tr><td>Overhead (${number(bill.adjustments.overheadPercent)}%)</td><td class="number">${currency(bill.totals?.overhead ?? 0, bill.currency)}</td></tr>
              <tr><td>Profit (${number(bill.adjustments.profitPercent)}%)</td><td class="number">${currency(bill.totals?.profit ?? 0, bill.currency)}</td></tr>
              <tr><td>Discount (${number(bill.adjustments.discountPercent)}%)</td><td class="number">-${currency(bill.totals?.discount ?? 0, bill.currency)}</td></tr>
              <tr><td>Subtotal before tax</td><td class="number">${currency(bill.totals?.subTotalBeforeTax ?? 0, bill.currency)}</td></tr>
              <tr><td>VAT (${number(bill.adjustments.vatPercent)}%)</td><td class="number">${currency(bill.totals?.vat ?? 0, bill.currency)}</td></tr>
              <tr class="grand"><td>Grand total</td><td class="number">${currency(bill.totals?.grandTotal ?? 0, bill.currency)}</td></tr>
            </tbody>
          </table>
        </section>
        <script>
          window.addEventListener('load', () => setTimeout(() => window.print(), 350));
        </script>
      </body>
    </html>`);
  printWindow.document.close();
}
