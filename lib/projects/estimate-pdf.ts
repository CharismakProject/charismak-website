import type { EstimateInput, EstimateResult } from "./public-estimate-engine-v2";
import {
  buildCashFlow,
  categoryLabels,
  estimateDuration,
  inclusionsAndExclusions,
} from "./public-estimate-decisions";

type MaterialScheduleLine = {
  id: string;
  material: string;
  unit: string;
  quantityLow: number;
  quantityHigh: number;
  procurementQuantity?: number;
  note?: string;
};

type MaterialScheduleResult = {
  category: string;
  title: string;
  basis: string;
  lines: MaterialScheduleLine[];
  assumptions: string[];
  warnings: string[];
};

type MaterialScheduleInput = {
  category: string;
  wastePercent?: number;
};

const pdfMoney = (value: number) => `NGN ${Math.round(value).toLocaleString("en-NG")}`;
const qty = (value: number) =>
  value < 10
    ? value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")
    : Math.round(value).toLocaleString("en-NG");

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

const readable = (value: string) => value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function inputSummary(input: EstimateInput) {
  const rows: Array<[string, string]> = [
    ["Estimate scope", categoryLabels[input.category]],
    ["Project location", input.location || "Not stated"],
    ["Specification", readable(input.finishLevel)],
  ];

  if (input.category === "new-building") {
    rows.push(["Building use", readable(input.buildingUse)]);
    if (input.landAreaM2) rows.push(["Land area", `${qty(input.landAreaM2)} m²`]);
    if (input.totalFloorAreaM2) rows.push(["Entered floor area", `${qty(input.totalFloorAreaM2)} m²`]);
    rows.push(["Number of floors", `${1 + Math.max(0, Math.round(input.floorsAboveGround))}`]);
    if (input.units) rows.push(["Units / apartments", `${input.units}`]);
    if (input.bedrooms) rows.push(["Bedrooms / rooms", `${input.bedrooms}`]);
    if (input.bathrooms) rows.push(["Bathrooms / WCs", `${input.bathrooms}`]);
    if (input.livingRooms) rows.push(["Living rooms", `${input.livingRooms}`]);
    if (input.kitchens) rows.push(["Kitchens", `${input.kitchens}`]);
    if (input.familyLounges) rows.push(["Family lounges", `${input.familyLounges}`]);
    if (input.studies) rows.push(["Study / office rooms", `${input.studies}`]);
    if (input.bqRooms) rows.push(["BQ / staff rooms", `${input.bqRooms}`]);
    rows.push(["Dining", readable(input.dining)]);
    rows.push(["Roof", readable(input.roofType)]);
    const external = [
      input.includeFence && "Fence",
      input.includeGatehouse && "Gatehouse",
      input.includePaving && "Paving/parking",
      input.includeDrainage && "Drainage",
      input.includeLandscaping && "Landscaping",
      input.includePool && "Pool",
    ].filter(Boolean).join(", ");
    if (external) rows.push(["External works", external]);
    if (input.includeFurniture) rows.push(["Furniture / FF&E", "Included"]);
  } else if (input.category === "structural-steel") {
    rows.push(["Steel structure", readable(input.steelStructureType)]);
    if (input.workAreaM2) rows.push(["Structural / covered area", `${qty(input.workAreaM2)} m²`]);
    if (input.steelTonnes) rows.push(["Entered steel tonnage", `${qty(input.steelTonnes)} t`]);
    if (input.steelSpanM) rows.push(["Typical clear span", `${qty(input.steelSpanM)} m`]);
    if (input.steelHeightM) rows.push(["Typical height", `${qty(input.steelHeightM)} m`]);
    if (input.steelBays) rows.push(["Number of bays", `${input.steelBays}`]);
    rows.push(["Fabrication scope", [input.steelErection && "Erection", input.steelCladding && "Cladding", input.craneRequired && "Crane", input.steelFoundations && "Bases/foundations"].filter(Boolean).join(", ") || "Fabrication basis"]);
  } else if (input.category === "renovation") {
    rows.push(["Property use", readable(input.renovationUse)]);
    if (input.workAreaM2) rows.push(["Renovation area", `${qty(input.workAreaM2)} m²`]);
    rows.push(["Renovation intensity", readable(input.renovationIntensity)]);
    if (input.bathroomRenovations) rows.push(["Bathrooms", `${input.bathroomRenovations}`]);
    if (input.kitchenRenovations) rows.push(["Kitchens", `${input.kitchenRenovations}`]);
    if (input.floorReplacementPercent) rows.push(["Floor replacement", `${input.floorReplacementPercent}%`]);
    if (input.ceilingReplacementPercent) rows.push(["Ceiling replacement", `${input.ceilingReplacementPercent}%`]);
    if (input.paintingPercent) rows.push(["Wall / painting refresh", `${input.paintingPercent}%`]);
    if (input.structuralAlteration) rows.push(["Structural alterations", "Included"]);
  } else if (input.category === "finishes") {
    if (input.workAreaM2) rows.push(["Finish area", `${qty(input.workAreaM2)} m²`]);
    rows.push(["Floor finish", readable(input.floorFinish)]);
    rows.push(["Wall finish", readable(input.wallFinish)]);
    rows.push(["Ceiling", readable(input.ceilingFinish)]);
    if (input.ceilingAreaM2) rows.push(["Ceiling area", `${qty(input.ceilingAreaM2)} m²`]);
    if (input.paintingAreaM2) rows.push(["Painting area", `${qty(input.paintingAreaM2)} m²`]);
  } else if (input.category === "furniture") {
    if (input.workAreaM2) rows.push(["Furnished area", `${qty(input.workAreaM2)} m²`]);
    rows.push(["Furniture level", readable(input.furnitureLevel)]);
    if (input.wardrobeLengthM) rows.push(["Wardrobes", `${qty(input.wardrobeLengthM)} linear m`]);
    if (input.kitchenCabinetLengthM) rows.push(["Kitchen cabinets", `${qty(input.kitchenCabinetLengthM)} linear m`]);
    if (input.bedroomFurnitureSets) rows.push(["Bedroom sets", `${input.bedroomFurnitureSets}`]);
    if (input.livingFurnitureSets) rows.push(["Living-room sets", `${input.livingFurnitureSets}`]);
    if (input.diningFurnitureSets) rows.push(["Dining sets", `${input.diningFurnitureSets}`]);
    if (input.officeWorkstations) rows.push(["Office workstations", `${input.officeWorkstations}`]);
  } else if (input.category === "external-works") {
    if (input.workAreaM2) rows.push(["Site / external area", `${qty(input.workAreaM2)} m²`]);
    if (input.fenceLengthM) rows.push(["Fence", `${qty(input.fenceLengthM)} m`]);
    if (input.gateCount) rows.push(["Gate sets", `${input.gateCount}`]);
    if (input.pavingAreaM2) rows.push(["Paving", `${qty(input.pavingAreaM2)} m²`]);
    if (input.drainageLengthM) rows.push(["Drainage", `${qty(input.drainageLengthM)} m`]);
    if (input.landscapingAreaM2) rows.push(["Landscaping", `${qty(input.landscapingAreaM2)} m²`]);
    if (input.gatehouseAreaM2) rows.push(["Gatehouse", `${qty(input.gatehouseAreaM2)} m²`]);
    if (input.poolAreaM2) rows.push(["Pool", `${qty(input.poolAreaM2)} m²`]);
  } else {
    if (input.workAreaM2) rows.push(["Serviced area", `${qty(input.workAreaM2)} m²`]);
    if (input.electricalPoints) rows.push(["Power / socket points", `${input.electricalPoints}`]);
    if (input.lightingPoints) rows.push(["Lighting points", `${input.lightingPoints}`]);
    if (input.mepBathrooms) rows.push(["Bathrooms / WC groups", `${input.mepBathrooms}`]);
    if (input.mepKitchens) rows.push(["Kitchens", `${input.mepKitchens}`]);
    if (input.acUnits) rows.push(["AC units / zones", `${input.acUnits}`]);
    rows.push(["Cooling system", readable(input.acSpec)]);
    if (input.waterHeaters) rows.push(["Water heaters", `${input.waterHeaters}`]);
    if (input.generatorKva) rows.push(["Generator", `${qty(input.generatorKva)} kVA`]);
    if (input.solarKw) rows.push(["Solar PV", `${qty(input.solarKw)} kW`]);
    if (input.includeBorehole) rows.push(["Borehole", "Included"]);
    if (input.includeSeptic) rows.push(["Septic / soakaway", "Included"]);
  }
  return rows;
}

export async function downloadEstimateBoqPdf({
  input,
  result,
  level,
  score,
}: {
  input: EstimateInput;
  result: EstimateResult;
  level: "Quick" | "Detailed";
  score?: number;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = 210;
  const margin = 15;
  const contentW = 180;
  const navy: [number, number, number] = [7, 30, 51];
  const blue: [number, number, number] = [13, 59, 102];
  const gold: [number, number, number] = [200, 164, 93];
  const grey: [number, number, number] = [58, 70, 83];
  const light: [number, number, number] = [247, 248, 250];
  const headerLogo = await imageDataUrl("/branding/charismak-full-logo.png", 1);
  const watermarkLogo = await imageDataUrl("/branding/charismak-full-logo.png", 0.018);
  const duration = estimateDuration(input, result);
  const cashFlow = buildCashFlow(input, result);
  const scope = inclusionsAndExclusions(input, result);
  let y = 15;

  const addPage = () => {
    doc.addPage();
    y = 18;
  };
  const ensure = (height: number) => {
    if (y + height > 278) addPage();
  };
  const text = (
    value: string,
    size = 8,
    bold = false,
    color: [number, number, number] = grey,
    maxW = contentW,
    lineGap = 4,
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, maxW) as string[];
    ensure(lines.length * lineGap + 1);
    doc.text(lines, margin, y);
    y += lines.length * lineGap;
  };

  if (headerLogo) doc.addImage(headerLogo, "PNG", margin, 9, 52, 15);
  else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.setFontSize(15);
    doc.text("CHARISMAK PROJECT NIGERIA LIMITED", margin, 17);
  }
  doc.setFontSize(7);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("RC No. 1982890 | www.charismakproject.com | info@charismakproject.com | +234 706 661 9598", margin, 29);
  y = 36;

  doc.setFillColor(...navy);
  doc.rect(margin, y, contentW, 27, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${level.toUpperCase()} PRELIMINARY BOQ / COST PLAN`, margin + 6, y + 9);
  doc.setFontSize(7.7);
  doc.setFont("helvetica", "normal");
  doc.text("Construction feasibility estimate for planning, budgeting and early project decisions", margin + 6, y + 15);
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.text(`Prepared ${new Date().toLocaleDateString("en-NG")}`, margin + 6, y + 21);
  y += 35;

  doc.setFillColor(...light);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setTextColor(...blue);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PROJECT / ESTIMATE SUMMARY", margin + 3, y + 5.3);
  y += 11;
  inputSummary(input).forEach(([label, value]) => {
    const valueLines = doc.splitTextToSize(value, 100) as string[];
    const rowH = Math.max(6, valueLines.length * 3.8 + 1);
    ensure(rowH);
    doc.setFontSize(7.3);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grey);
    doc.text(label, margin + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...navy);
    doc.text(valueLines, margin + 70, y);
    y += rowH;
  });
  y += 3;

  ensure(29);
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(251, 249, 243);
  doc.roundedRect(margin, y, contentW, 27, 1, 1, "FD");
  doc.setTextColor(...grey);
  doc.setFontSize(7.3);
  doc.setFont("helvetica", "bold");
  doc.text("PLANNING RANGE", margin + 5, y + 6);
  doc.setTextColor(...navy);
  doc.setFontSize(13.5);
  doc.text(`${pdfMoney(result.low)} - ${pdfMoney(result.high)}`, margin + 5, y + 14);
  doc.setFontSize(8);
  doc.text(`Likely planning figure: ${pdfMoney(result.midpoint)}`, margin + 5, y + 21);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Basis: ${qty(result.basisQuantity)} ${result.basisUnit} - ${result.basisLabel}${score ? ` | Input detail ${score}%` : ""}`,
    margin + 91,
    y + 12,
    { maxWidth: 82 },
  );
  y += 35;

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
    headers.forEach((header, index) => {
      doc.text(header, x + 1.5, y + 5.8);
      x += widths[index];
    });
    y += 9;
  };
  const drawRow = (cells: string[], bold = false, fill = false) => {
    const descLines = doc.splitTextToSize(cells[1], widths[1] - 3) as string[];
    const rowH = Math.max(8, descLines.length * 4 + 2.2);
    if (y + rowH > 276) {
      addPage();
      drawTableHeader();
    }
    if (fill) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    doc.setDrawColor(225, 229, 233);
    doc.rect(margin, y, contentW, rowH);
    let x = margin;
    cells.forEach((cell, index) => {
      if (index > 0) doc.line(x, y, x, y + rowH);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(index >= 4 ? 6.7 : 7);
      doc.setTextColor(...(bold ? navy : grey));
      const lines = index === 1 ? descLines : (doc.splitTextToSize(cell, widths[index] - 3) as string[]);
      doc.text(lines, x + 1.5, y + 5);
      x += widths[index];
    });
    y += rowH;
  };

  text("ELEMENTAL COST PLAN / PRELIMINARY BOQ", 9, true, blue, contentW, 4.5);
  y += 1;
  drawTableHeader();
  result.sections.forEach((item, index) =>
    drawRow([String(index + 1), item.label, "L/S", "1", pdfMoney(item.low), pdfMoney(item.high)], false, index % 2 === 1),
  );
  drawRow(["", "TOTAL PRELIMINARY CONSTRUCTION RANGE", "", "", pdfMoney(result.low), pdfMoney(result.high)], true, true);
  y += 5;

  text("HOW THE ELEMENTS WERE CALCULATED", 9, true, blue);
  result.sections.forEach((item) => text(`${item.label}: ${item.explanation}`, 7.2, false, grey, contentW, 3.6));
  y += 2;

  if (result.costDrivers.length) {
    text("MAIN COST DRIVERS", 9, true, blue);
    result.costDrivers.slice(0, 10).forEach((item) => text(`- ${item}`, 7.2, false, grey, contentW, 3.6));
    y += 2;
  }

  text("INDICATIVE PROGRAMME & CASH FLOW", 9, true, blue);
  text(`Indicative construction duration: ${duration.lowWeeks}-${duration.highWeeks} weeks. ${duration.note}`, 7.3, false, grey, contentW, 3.7);
  cashFlow.forEach((phase) => text(`${phase.label}: ${(phase.share * 100).toFixed(0)}% - ${pdfMoney(phase.low)} to ${pdfMoney(phase.high)}`, 7.2, false, grey, contentW, 3.6));
  y += 2;

  text("ASSUMPTIONS, INCLUSIONS & EXCLUSIONS", 9, true, blue);
  result.assumptions.forEach((item) => text(`- Assumption: ${item}`, 7.1, false, grey, contentW, 3.5));
  scope.included.slice(0, 12).forEach((item) => text(`- Included: ${item}`, 7.1, false, grey, contentW, 3.5));
  scope.excluded.slice(0, 12).forEach((item) => text(`- Excluded / not specifically allowed: ${item}`, 7.1, false, grey, contentW, 3.5));
  y += 3;
  text(
    "IMPORTANT: This is a preliminary elemental BOQ / cost plan generated from information supplied by the user. It is not a measured tender BOQ, quotation, payment certificate or contract price. Approved drawings, specifications, measured quantities, structural/MEP design and current supplier/subcontractor quotations are required before procurement or contract award.",
    7.2,
    true,
    navy,
    contentW,
    3.7,
  );

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (watermarkLogo) doc.addImage(watermarkLogo, "PNG", 28, 122, 154, 44);
    else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(246, 247, 249);
      doc.text("CHARISMAK", 105, 158, { align: "center", angle: 35 });
    }
    doc.setDrawColor(225, 229, 233);
    doc.line(margin, 285, pageW - margin, 285);
    doc.setFontSize(6.4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 120, 130);
    doc.text("Charismak Project Nigeria Limited | Sankuru Close, off El-Amin Street, Maitama, Abuja", margin, 290);
    doc.text(`Page ${page} of ${pages}`, pageW - margin, 290, { align: "right" });
  }

  doc.save(`Charismak-${level.toLowerCase()}-${input.category}-preliminary-boq.pdf`);
}

export async function downloadMaterialSchedulePdf(input: MaterialScheduleInput, result: MaterialScheduleResult) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margin = 15;
  const contentW = 180;
  const navy: [number, number, number] = [7, 30, 51];
  const blue: [number, number, number] = [13, 59, 102];
  const grey: [number, number, number] = [58, 70, 83];
  const gold: [number, number, number] = [200, 164, 93];
  const headerLogo = await imageDataUrl("/branding/charismak-full-logo.png", 1);
  const watermarkLogo = await imageDataUrl("/branding/charismak-full-logo.png", 0.018);
  let y = 15;

  const addPage = () => {
    doc.addPage();
    y = 18;
  };
  const ensure = (height: number) => {
    if (y + height > 276) addPage();
  };

  if (headerLogo) doc.addImage(headerLogo, "PNG", margin, 9, 52, 15);
  else {
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("CHARISMAK PROJECT NIGERIA LIMITED", margin, 17);
  }
  doc.setFontSize(7);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("RC No. 1982890 | www.charismakproject.com | info@charismakproject.com | +234 706 661 9598", margin, 29);
  y = 36;

  doc.setFillColor(...navy);
  doc.rect(margin, y, contentW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("PRELIMINARY MATERIAL REQUIREMENT SCHEDULE", margin + 5, y + 8);
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text(result.title.toUpperCase(), margin + 5, y + 14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.text(doc.splitTextToSize(result.basis, 165), margin + 5, y + 20);
  y += 36;

  doc.setFillColor(247, 248, 250);
  doc.rect(margin, y, contentW, 12, "F");
  doc.setTextColor(...grey);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(`Work item: ${readable(result.category)}`, margin + 3, y + 5);
  doc.text(`Waste / cutting allowance: ${input.wastePercent ?? 0}%`, margin + 90, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(`Prepared: ${new Date().toLocaleDateString("en-NG")}`, margin + 3, y + 9);
  y += 17;

  const widths = [8, 55, 18, 24, 18, 25, 32];
  const headers = ["S/N", "Material / specification", "Unit", "Calculated", "Waste", "Procure", "Basis / note"];
  const tableHeader = () => {
    ensure(11);
    doc.setFillColor(...blue);
    doc.rect(margin, y, contentW, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.3);
    let x = margin;
    headers.forEach((header, index) => {
      doc.text(doc.splitTextToSize(header, widths[index] - 2), x + 1, y + 4.2);
      x += widths[index];
    });
    y += 10;
  };
  tableHeader();

  result.lines.forEach((line, index) => {
    const calculated = Math.abs(line.quantityHigh - line.quantityLow) < 0.0001
      ? qty(line.quantityLow)
      : `${qty(line.quantityLow)}-${qty(line.quantityHigh)}`;
    const procurement = line.procurementQuantity === undefined ? "Review range" : qty(line.procurementQuantity);
    const materialLines = doc.splitTextToSize(line.material, widths[1] - 3) as string[];
    const noteLines = doc.splitTextToSize(line.note || "Calculated from the work-item inputs above.", widths[6] - 3) as string[];
    const rowH = Math.max(9, Math.max(materialLines.length, noteLines.length) * 3.7 + 2.5);
    if (y + rowH > 274) {
      addPage();
      tableHeader();
    }
    if (index % 2 === 1) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    doc.setDrawColor(225, 229, 233);
    doc.rect(margin, y, contentW, rowH);
    const cells = [
      String(index + 1),
      line.material,
      line.unit,
      calculated,
      `${input.wastePercent ?? 0}% incl.`,
      procurement,
      line.note || "Calculated from entered dimensions / quantities.",
    ];
    let x = margin;
    cells.forEach((cell, cellIndex) => {
      if (cellIndex > 0) doc.line(x, y, x, y + rowH);
      doc.setFont("helvetica", cellIndex === 5 ? "bold" : "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...(cellIndex === 5 ? navy : grey));
      const lines = cellIndex === 1
        ? materialLines
        : cellIndex === 6
          ? noteLines
          : (doc.splitTextToSize(cell, widths[cellIndex] - 2.2) as string[]);
      doc.text(lines, x + 1.1, y + 4.5);
      x += widths[cellIndex];
    });
    y += rowH;
  });

  y += 7;
  ensure(12);
  doc.setTextColor(...blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("ASSUMPTIONS / TECHNICAL NOTES", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.setFontSize(7);
  [...result.assumptions, ...result.warnings].forEach((item) => {
    const lines = doc.splitTextToSize(`- ${item}`, contentW) as string[];
    if (y + lines.length * 3.8 > 276) addPage();
    doc.text(lines, margin, y);
    y += lines.length * 3.8;
  });
  y += 3;
  ensure(18);
  doc.setFillColor(251, 249, 243);
  const disclaimer = "IMPORTANT: Quantities are preliminary procurement allowances, not a substitute for approved drawings, bar schedules, shop drawings, structural/MEP design, manufacturer coverage data or final site measurements. Whole-item procurement quantities are rounded conservatively where appropriate.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentW - 8) as string[];
  const boxH = disclaimerLines.length * 3.8 + 8;
  doc.rect(margin, y, contentW, boxH, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.setFontSize(6.9);
  doc.text(disclaimerLines, margin + 4, y + 5);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (watermarkLogo) doc.addImage(watermarkLogo, "PNG", 28, 122, 154, 44);
    else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(246, 247, 249);
      doc.text("CHARISMAK", 105, 158, { align: "center", angle: 35 });
    }
    doc.setDrawColor(225, 229, 233);
    doc.line(margin, 285, 195, 285);
    doc.setFontSize(6.4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 120, 130);
    doc.text("Charismak Project Nigeria Limited | www.charismakproject.com | Abuja, Nigeria", margin, 290);
    doc.text(`Page ${page} of ${pages}`, 195, 290, { align: "right" });
  }

  doc.save(`Charismak-material-schedule-${input.category}.pdf`);
}
