import { imageDataUrl } from "@/lib/projects/estimate-pdf";

import type { RateBankItem, RateCalculation, RateCostLine } from "./defaults";

const naira = (value: number) => `NGN ${Math.round(value).toLocaleString("en-NG")}`;
const qty = (value: number) => (Math.abs(value) >= 100 ? value.toLocaleString("en-NG", { maximumFractionDigits: 2 }) : Number(value.toFixed(4)).toString());

const CATEGORY_LABELS: Record<RateCostLine["category"], string> = {
  material: "Materials",
  consumable: "Materials",
  labour: "Labour",
  plant: "Plant & logistics",
  logistics: "Plant & logistics",
};

/** Download a branded A4 PDF of a rate build-up (public rate or the visitor's edited copy). */
export async function downloadRatePdf({
  item,
  lines,
  allowances,
  calculation,
  workQuantity,
  edited,
}: {
  item: RateBankItem;
  lines: RateCostLine[];
  allowances: RateBankItem["allowances"];
  calculation: RateCalculation;
  workQuantity: number;
  edited: boolean;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margin = 15;
  const contentW = 180;
  const navy: [number, number, number] = [7, 30, 51];
  const gold: [number, number, number] = [200, 164, 93];
  const grey: [number, number, number] = [58, 70, 83];
  const light: [number, number, number] = [247, 248, 250];
  let y = 15;

  const ensure = (height: number) => {
    if (y + height > 280) {
      doc.addPage();
      y = 18;
    }
  };
  const text = (value: string, size = 8, bold = false, color = grey, maxW = contentW, x = margin) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(value, maxW) as string[];
    ensure(wrapped.length * 4 + 1);
    doc.text(wrapped, x, y);
    y += wrapped.length * 4;
  };

  const logo = await imageDataUrl("/branding/charismak-full-logo.png", 1);
  if (logo) doc.addImage(logo, "PNG", margin, 9, 52, 15);
  else text("CHARISMAK PROJECT NIGERIA LIMITED", 14, true, navy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grey);
  doc.text("RC No. 1982890 | www.charismakproject.com | info@charismakproject.com | +234 706 661 9598", margin, 29);
  y = 35;

  doc.setFillColor(...navy);
  doc.rect(margin, y, contentW, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RATE BUILD-UP", margin + 6, y + 8);
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(item.title, contentW - 12) as string[], margin + 6, y + 14);
  doc.setTextColor(...gold);
  doc.setFontSize(7.5);
  doc.text(`${item.code}  |  Unit: ${item.unit}  |  ${item.city}, ${item.country}  |  Printed ${new Date().toLocaleDateString("en-NG")}`, margin + 6, y + 21);
  y += 31;

  text(edited ? "YOUR EDITED COPY — quantities, prices or allowances differ from the published Charismak rate." : `PUBLISHED CHARISMAK RATE — ${item.status === "verified" ? "verified reference" : "working reference, under validation"} (reviewed ${new Date(item.lastReviewed).toLocaleDateString("en-NG")}).`, 8, true, edited ? [168, 43, 5] : navy);
  y += 1;
  text(item.specification, 8);
  y += 3;

  // Table
  const cols = [
    { label: "Resource", w: 70 },
    { label: "Qty / unit", w: 20, right: true },
    { label: "Unit", w: 18 },
    { label: "Rate", w: 24, right: true },
    { label: "Per unit", w: 24, right: true },
    { label: `For ${qty(workQuantity)} ${item.unit}`, w: 24, right: true },
  ];
  const row = (cells: string[], bold = false, fill?: [number, number, number]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7.2);
    const first = doc.splitTextToSize(cells[0], cols[0].w - 2) as string[];
    const height = Math.max(6, first.length * 3.4 + 2.4);
    ensure(height);
    if (fill) {
      doc.setFillColor(...fill);
      doc.rect(margin, y - 4, contentW, height, "F");
    }
    doc.setTextColor(...grey);
    let x = margin + 1;
    cells.forEach((cell, index) => {
      const col = cols[index];
      if (index === 0) doc.text(first, x, y);
      else doc.text(cell, col.right ? x + col.w - 2 : x, y, col.right ? { align: "right" } : undefined);
      x += col.w;
    });
    y += height;
  };
  row(cols.map((col) => col.label), true, light);
  let current = "";
  for (const line of lines) {
    const group = CATEGORY_LABELS[line.category];
    if (group !== current) {
      current = group;
      row([group.toUpperCase(), "", "", "", "", ""], true);
    }
    const perUnit = line.quantity * line.unitRate;
    row([line.label, qty(line.quantity), line.unit, naira(line.unitRate), naira(perUnit), naira(perUnit * workQuantity)]);
  }
  y += 2;

  const summary: Array<[string, number, boolean?]> = [
    ["Direct cost (materials + labour + plant + logistics)", calculation.directCost],
    [`Material fluctuation (${(allowances.materialFluctuation * 100).toFixed(1)}%)`, calculation.materialFluctuation],
    [`Labour fluctuation (${(allowances.labourFluctuation * 100).toFixed(1)}%)`, calculation.labourFluctuation],
    [`Plant & logistics fluctuation (${(allowances.plantFluctuation * 100).toFixed(1)}%)`, calculation.plantFluctuation],
    [`Risk (${(allowances.risk * 100).toFixed(1)}%)`, calculation.risk],
    [`Overheads & profit (${(allowances.op * 100).toFixed(1)}%)`, calculation.op],
    [`RATE per ${item.unit}`, calculation.total, true],
  ];
  for (const [label, value, strong] of summary) {
    row([label, "", "", "", naira(value), naira(value * workQuantity)], Boolean(strong), strong ? [255, 249, 237] : undefined);
  }
  y += 4;

  if (item.status !== "verified" && item.validationNote) text(`Validation status: ${item.validationNote}`, 7.2);
  text("This build-up is a planning reference. Confirm current supplier prices, site output, specification and measured quantities before tendering, procurement or contract award. Prices vary by supplier, location, quantity, delivery and date.", 7.2);

  doc.save(`charismak-rate-${item.slug}${edited ? "-edited" : ""}.pdf`);
}
