import type { EstimateInput, EstimateResult } from "./public-estimate-engine-v2";
import { buildCashFlow, categoryLabels, estimateDuration, inclusionsAndExclusions } from "./public-estimate-decisions";
import type { MaterialEstimateInput, MaterialEstimateResult } from "./material-estimate-engine";

const pdfMoney = (value: number) => `NGN ${Math.round(value).toLocaleString("en-NG")}`;
const qty = (value: number) => value < 10 ? value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") : Math.round(value).toLocaleString("en-NG");

async function imageDataUrl(url: string, alpha = 1) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, image.naturalWidth || image.width);
    canvas.height = Math.max(1, image.naturalHeight || image.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(objectUrl);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function inputSummary(input: EstimateInput) {
  const rows: Array<[string, string]> = [
    ["Estimate scope", categoryLabels[input.category]],
    ["Project location", input.location || "Not stated"],
    ["Specification", input.finishLevel.replace("-", " ")],
  ];
  if (input.category === "new-building") {
    rows.push(["Building use", input.buildingUse.replace("-", " ")]);
    if (input.landAreaM2) rows.push(["Land area", `${qty(input.landAreaM2)} m2`]);
    if (input.totalFloorAreaM2) rows.push(["Entered floor area", `${qty(input.totalFloorAreaM2)} m2`]);
    rows.push(["Floors", `${1 + Math.max(0, Math.round(input.floorsAboveGround))}`]);
    if (input.units) rows.push(["Units", `${input.units}`]);
    if (input.bedrooms) rows.push(["Bedrooms / rooms", `${input.bedrooms}`]);
    if (input.bathrooms) rows.push(["Bathrooms / WCs", `${input.bathrooms}`]);
    if (input.livingRooms) rows.push(["Living rooms", `${input.livingRooms}`]);
    rows.push(["Roof", input.roofType.replace(/-/g, " ")]);
  } else if (input.category === "structural-steel") {
    rows.push(["Steel structure", input.steelStructureType.replace(/-/g, " ")]);
    if (input.workAreaM2) rows.push(["Structural area", `${qty(input.workAreaM2)} m2`]);
    if (input.steelTonnes) rows.push(["Entered steel tonnage", `${qty(input.steelTonnes)} t`]);
    if (input.steelSpanM) rows.push(["Typical span", `${qty(input.steelSpanM)} m`]);
  } else {
    if (input.workAreaM2) rows.push(["Work area", `${qty(input.workAreaM2)} m2`]);
    if (input.category === "renovation") rows.push(["Renovation level", input.renovationIntensity.replace(/-/g, " ")]);
  }
  return rows;
}

export async function downloadEstimateBoqPdf({ input, result, level, score }: { input: EstimateInput; result: EstimateResult; level: "Quick" | "Detailed"; score?: number }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  const navy: [number, number, number] = [7, 30, 51];
  const blue: [number, number, number] = [13, 59, 102];
  const gold: [number, number, number] = [200, 164, 93];
  const grey: [number, number, number] = [58, 70, 83];
  const light: [number, number, number] = [247, 248, 250];
  const logo = await imageDataUrl("/Images/logo/logo.png", 1);
  const watermark = await imageDataUrl("/Images/logo/logo.png", 0.025);
  const duration = estimateDuration(input, result);
  const cashFlow = buildCashFlow(input, result);
  const scope = inclusionsAndExclusions(input, result);
  let y = 16;

  const addPage = () => {
    doc.addPage();
    y = 18;
  };
  const ensure = (height: number) => {
    if (y + height > 278) addPage();
  };
  const text = (value: string, size = 9, bold = false, color: [number, number, number] = grey, maxW = contentW, lineGap = 4.2) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, maxW) as string[];
    ensure(lines.length * lineGap + 1);
    doc.text(lines, margin, y);
    y += lines.length * lineGap;
  };

  if (logo) doc.addImage(logo, "PNG", margin, 12, 18, 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.setFontSize(16);
  doc.text("CHARISMAK PROJECT NIGERIA LIMITED", logo ? 37 : margin, 18);
  doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text("Design - Cost - Build | RC No. 1982890", logo ? 37 : margin, 23);
  doc.text("www.charismakproject.com | info@charismakproject.com | +234 706 661 9598", logo ? 37 : margin, 27);
  y = 39;
  doc.setFillColor(...navy);
  doc.rect(margin, y, contentW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(`${level.toUpperCase()} PRELIMINARY BILL OF QUANTITIES / COST PLAN`, margin + 6, y + 9);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Construction feasibility estimate - for planning and early budgeting", margin + 6, y + 15);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text(`Prepared ${new Date().toLocaleDateString("en-NG")}`, margin + 6, y + 21);
  y += 34;

  const summaryRows = inputSummary(input);
  doc.setFillColor(...light);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setTextColor(...blue);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PROJECT / ESTIMATE SUMMARY", margin + 3, y + 5.3);
  y += 11;
  summaryRows.forEach(([label, value]) => {
    ensure(7);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grey);
    doc.text(label, margin + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...navy);
    doc.text(doc.splitTextToSize(value, 95), margin + 72, y);
    y += 6;
  });
  y += 3;

  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(251, 249, 243);
  doc.roundedRect(margin, y, contentW, 26, 1, 1, "FD");
  doc.setTextColor(...grey);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("PLANNING RANGE", margin + 5, y + 6);
  doc.setTextColor(...navy);
  doc.setFontSize(14);
  doc.text(`${pdfMoney(result.low)} - ${pdfMoney(result.high)}`, margin + 5, y + 14);
  doc.setFontSize(8);
  doc.text(`Likely planning figure: ${pdfMoney(result.midpoint)}`, margin + 5, y + 20);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text(`Basis: ${qty(result.basisQuantity)} ${result.basisUnit} - ${result.basisLabel}${score ? ` | Input detail ${score}%` : ""}`, margin + 88, y + 14, { maxWidth: 85 });
  y += 34;

  const widths = [10, 78, 17, 19, 28, 28];
  const headers = ["S/N", "Description", "Unit", "Qty", "Low", "High"];
  const drawTableHeader = () => {
    ensure(10);
    doc.setFillColor(...navy);
    doc.rect(margin, y, contentW, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 1.5, y + 5.8);
      x += widths[i];
    });
    y += 9;
  };
  const drawRow = (cells: string[], bold = false, fill = false) => {
    const descLines = doc.splitTextToSize(cells[1], widths[1] - 3) as string[];
    const rowH = Math.max(8, descLines.length * 4.1 + 2.2);
    if (y + rowH > 276) { addPage(); drawTableHeader(); }
    if (fill) { doc.setFillColor(248, 249, 250); doc.rect(margin, y, contentW, rowH, "F"); }
    doc.setDrawColor(225, 229, 233);
    doc.rect(margin, y, contentW, rowH);
    let x = margin;
    cells.forEach((cell, i) => {
      if (i > 0) doc.line(x, y, x, y + rowH);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(i >= 4 ? 6.7 : 7);
      doc.setTextColor(...(bold ? navy : grey));
      const lines = i === 1 ? descLines : doc.splitTextToSize(cell, widths[i] - 3) as string[];
      doc.text(lines, x + 1.5, y + 5);
      x += widths[i];
    });
    y += rowH;
  };

  text("ELEMENTAL COST PLAN / PRELIMINARY BOQ", 9, true, blue, contentW, 4.5);
  y += 1;
  drawTableHeader();
  result.sections.forEach((item, index) => drawRow([String(index + 1), item.label, "L/S", "1", pdfMoney(item.low), pdfMoney(item.high)], false, index % 2 === 1));
  drawRow(["", "TOTAL PRELIMINARY CONSTRUCTION RANGE", "", "", pdfMoney(result.low), pdfMoney(result.high)], true, true);
  y += 5;

  text("COST BASIS / ELEMENT NOTES", 9, true, blue);
  result.sections.forEach((item) => text(`${item.label}: ${item.explanation}`, 7.4, false, grey, contentW, 3.7));
  y += 2;

  text("INDICATIVE PROGRAMME & CASH FLOW", 9, true, blue);
  text(`Indicative construction duration: ${duration.lowWeeks}-${duration.highWeeks} weeks. ${duration.note}`, 7.5, false, grey, contentW, 3.8);
  cashFlow.forEach((phase) => text(`${phase.label}: ${(phase.share * 100).toFixed(0)}% - ${pdfMoney(phase.low)} to ${pdfMoney(phase.high)}`, 7.4, false, grey, contentW, 3.7));
  y += 2;

  text("ASSUMPTIONS, INCLUSIONS & EXCLUSIONS", 9, true, blue);
  result.assumptions.forEach((item) => text(`- ${item}`, 7.2, false, grey, contentW, 3.6));
  scope.included.slice(0, 10).forEach((item) => text(`- Included: ${item}`, 7.2, false, grey, contentW, 3.6));
  scope.excluded.slice(0, 10).forEach((item) => text(`- Not specifically included: ${item}`, 7.2, false, grey, contentW, 3.6));
  y += 3;
  text("IMPORTANT: This is an elemental preliminary BOQ / cost plan generated from the information supplied. It is not a measured tender BOQ, quotation, payment certificate or contract price. Drawings, specifications, measured quantities, structural/MEP design and current supplier/subcontractor quotations are required before procurement or contract award.", 7.3, true, navy, contentW, 3.8);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (watermark) doc.addImage(watermark, "PNG", 67, 105, 76, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.setTextColor(244, 246, 248);
    doc.text("CHARISMAK", 105, 160, { align: "center", angle: 35 });
    doc.setDrawColor(225, 229, 233);
    doc.line(margin, 285, pageW - margin, 285);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 120, 130);
    doc.text("Charismak Project Nigeria Limited | Sankuru Close, off El-Amin Street, Maitama, Abuja", margin, 290);
    doc.text(`Page ${page} of ${pages}`, pageW - margin, 290, { align: "right" });
  }

  doc.save(`Charismak-${level.toLowerCase()}-${input.category}-preliminary-boq.pdf`);
}

export async function downloadMaterialSchedulePdf(input: MaterialEstimateInput, result: MaterialEstimateResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margin = 15;
  const contentW = 180;
  const logo = await imageDataUrl("/Images/logo/logo.png", 1);
  const watermark = await imageDataUrl("/Images/logo/logo.png", 0.025);
  let y = 15;
  if (logo) doc.addImage(logo, "PNG", margin, 10, 18, 18);
  doc.setTextColor(7, 30, 51);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CHARISMAK PROJECT NIGERIA LIMITED", logo ? 37 : margin, 17);
  doc.setFontSize(7.5);
  doc.setTextColor(58, 70, 83);
  doc.text("MATERIAL QUANTITY ESTIMATE / PROCUREMENT SCHEDULE", logo ? 37 : margin, 23);
  y = 36;
  doc.setFillColor(7, 30, 51);
  doc.rect(margin, y, contentW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(result.title.toUpperCase(), margin + 5, y + 8);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(result.basis, margin + 5, y + 15, { maxWidth: 165 });
  y += 30;

  const widths = [10, 80, 24, 28, 38];
  const headers = ["S/N", "Material", "Unit", "Calculated", "Procurement Qty"];
  const tableHeader = () => {
    doc.setFillColor(13, 59, 102);
    doc.rect(margin, y, contentW, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    let x = margin;
    headers.forEach((h, i) => { doc.text(h, x + 1.5, y + 5.8); x += widths[i]; });
    y += 9;
  };
  tableHeader();
  result.lines.forEach((line, index) => {
    const quantityText = Math.abs(line.quantityHigh - line.quantityLow) < 0.0001 ? qty(line.quantityLow) : `${qty(line.quantityLow)}-${qty(line.quantityHigh)}`;
    const procurement = line.procurementQuantity === undefined ? "Review range" : qty(line.procurementQuantity);
    const nameLines = doc.splitTextToSize(line.material, widths[1] - 3) as string[];
    const rowH = Math.max(8, nameLines.length * 4 + 2);
    if (y + rowH > 273) { doc.addPage(); y = 18; tableHeader(); }
    if (index % 2 === 1) { doc.setFillColor(248, 249, 250); doc.rect(margin, y, contentW, rowH, "F"); }
    doc.setDrawColor(225, 229, 233);
    doc.rect(margin, y, contentW, rowH);
    const cells = [String(index + 1), line.material, line.unit, quantityText, procurement];
    let x = margin;
    cells.forEach((cell, i) => {
      if (i > 0) doc.line(x, y, x, y + rowH);
      doc.setFont("helvetica", i === 4 ? "bold" : "normal");
      doc.setFontSize(7);
      doc.setTextColor(40, 50, 60);
      doc.text(i === 1 ? nameLines : doc.splitTextToSize(cell, widths[i] - 3), x + 1.5, y + 5);
      x += widths[i];
    });
    y += rowH;
  });

  y += 7;
  doc.setTextColor(13, 59, 102);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ASSUMPTIONS / NOTES", margin, y);
  y += 5;
  doc.setTextColor(58, 70, 83);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  [...result.assumptions, ...result.warnings].forEach((item) => {
    const lines = doc.splitTextToSize(`- ${item}`, contentW);
    if (y + lines.length * 4 > 276) { doc.addPage(); y = 18; }
    doc.text(lines, margin, y);
    y += lines.length * 4;
  });
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(7, 30, 51);
  doc.text("Material quantities are planning/procurement allowances. Final requirements must follow approved drawings, structural/MEP design, manufacturer data, site measurements and actual wastage conditions.", margin, y, { maxWidth: contentW });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (watermark) doc.addImage(watermark, "PNG", 67, 105, 76, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.setTextColor(244, 246, 248);
    doc.text("CHARISMAK", 105, 160, { align: "center", angle: 35 });
    doc.setDrawColor(225, 229, 233);
    doc.line(margin, 285, 195, 285);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 120, 130);
    doc.text("Charismak Project Nigeria Limited | www.charismakproject.com", margin, 290);
    doc.text(`Page ${page} of ${pages}`, 195, 290, { align: "right" });
  }
  doc.save(`Charismak-material-estimate-${input.category}.pdf`);
}
