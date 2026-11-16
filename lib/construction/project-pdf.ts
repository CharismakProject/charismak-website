import { jsPDF } from "jspdf";
import { calculateRate } from "../rates/defaults";
import { lineAmount, projectCostSummary, proposeSchedule, workingDate, type ConstructionProject } from "./project";
import { exportMoney } from "./project-export-renderer";

export type ProjectPdfImage = { day: number; section?: boolean; data: string };
const plain = (text: string) => text.replace(/₦/g, "NGN ").replace(/²/g, "2").replace(/³/g, "3").replace(/[–—→]/g, " - ").replace(/[×]/g, " x ").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7e\n]/g, " ");
const number = (value: number) => value.toLocaleString("en-NG", { maximumFractionDigits: 3 });

/** PDF content is built from one project snapshot, including the user's latest edits. */
export function buildProjectPdf(project: ConstructionProject, images: ProjectPdfImage[], detailed = true) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const schedule = proposeSchedule(project), end = Math.max(1, ...schedule.map(stage => stage.finish)), costs = projectCostSummary(project);
  const money = (value: number) => project.boq.length ? exportMoney(value) : "BOQ not supplied";
  let y = 36, title = "Project overview";
  const text = (value: string, x: number, top: number, width: number, size = 11, bold = false, colour = "#203b4a") => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(colour);
    const lines = doc.splitTextToSize(plain(value), width); doc.text(lines, x, top); return lines.length * size * 0.43;
  };
  const heading = () => {
    doc.setFillColor("#0d2332"); doc.rect(0, 0, 297, 25, "F");
    text("CHARISMAK  /  CONSTRUCTION STUDIO", 15, 10, 267, 10, true, "#dfbd78"); text(title, 15, 19, 267, 15, true, "#ffffff");
    y = 36;
  };
  const page = (nextTitle: string) => { doc.addPage(); title = nextTitle; heading(); };
  const room = (height: number, repeat?: () => void) => { if (y + height > 192) { page(title); repeat?.(); } };
  const paragraph = (value: string) => {
    const lines: string[] = doc.setFontSize(11).splitTextToSize(plain(value), 267);
    for (const line of lines) { room(6); text(line, 15, y, 267); y += 5.5; } y += 3;
  };
  const picture = (day: number, section: boolean | undefined, x: number, top: number, width: number, height: number) => {
    const image = images.find(image => image.day === day && !!image.section === !!section);
    if (image) doc.addImage(image.data, "PNG", x, top, width, height);
  };
  heading();
  y += text(project.name, 15, y, 267, 21, true) + 2;
  picture(end, false, 15, y, 166, 94);
  const right = 190, top = y;
  text("PROJECT TOTAL WITH ALLOWANCES", right, top + 7, 91, 10, true);
  text(money(costs.total), right, top + 18, 91, 20, true);
  text(`Priced works: ${money(costs.works)}`, right, top + 31, 91);
  text(`${end} working days | ${project.workingDays}-day week\n${workingDate(project.start, 0, project.workingDays)} to ${workingDate(project.start, end - 1, project.workingDays)}\n${project.parts.length} model elements\n${project.boq.length} BOQ / programme items`, right, top + 44, 91);
  y += 105;
  paragraph("This report captures the current model, quantities, rates and proposed programme. Stage costs are planned allocations; they do not represent actual expenditure. Temporary setting-out profiles and strings are removed after the substructure.");

  page("Cost summary and review status");
  const summaryRow = (label: string, amount: number, note = "", bold = false) => { room(note ? 15 : 10); text(label, 15, y, 174, 12, bold); text(money(amount), 200, y, 82, 12, bold); y += 7; if (note) { text(note, 20, y, 253, 10); y += 7; } };
  summaryRow("BOQ priced works subtotal", costs.works, "Quantity x current unit rate; each BOQ item is counted once.");
  for (const charge of costs.charges) summaryRow(charge.label, charge.amount, `${number(charge.percentage * 100)}% of ${charge.basis === "works" ? "priced works" : "running subtotal"}: ${exportMoney(charge.base)}.`);
  summaryRow("PROJECT TOTAL", costs.total, "", true);
  y += 5;
  paragraph(`${project.boq.filter(line => !line.excluded && line.quantity > 0 && line.rate === null).length} unpriced items are excluded from the total. ${project.boq.filter(line => line.excluded).length} items are explicitly excluded in the BOQ. Model element links never multiply the bill quantity.`);
  paragraph("Working dates follow the selected weekly calendar; public holidays are not added automatically. Sequence, productivity, site access, procurement, temporary works and cost allowances require project review.");
  for (const note of project.reviewNotes ?? []) paragraph(note);

  page("Proposed construction programme");
  const programmeHeader = () => { text("Stage", 15, y, 82, 11, true); text("Days / link", 102, y, 36, 11, true); text("Start / finish", 142, y, 53, 11, true); text("Priced works NGN", 220, y, 62, 11, true); y += 8; };
  programmeHeader();
  for (const stage of schedule) {
    room(10, programmeHeader); text(stage.title, 15, y, 82); text(`${stage.days} / ${stage.predecessor === "none" ? "-" : stage.relationship + (stage.lag ? ` ${stage.lag > 0 ? "+" : ""}${stage.lag}` : "")}`, 102, y, 36);
    text(`${workingDate(project.start, stage.start, project.workingDays)} / ${workingDate(project.start, stage.finish - 1, project.workingDays)}`, 142, y, 74, 10);
    text(number(stage.amount), 220, y, 62); y += 9.5;
  }
  y += 3; paragraph("FS = finish to start; SS = start to start. Durations use the saved stage overrides or quantity / crew productivity. No structural or service design is inferred from costs.");

  schedule.forEach((stage, index) => {
    if (index % 2 === 0) page("Construction stages and related cost");
    const top = index % 2 === 0 ? 34 : 113;
    picture(stage.finish, false, 15, top, 126, 71.4);
    text(`${index + 1}. ${stage.title}`, 151, top + 8, 131, 15, true);
    text(`${workingDate(project.start, stage.start, project.workingDays)} to ${workingDate(project.start, stage.finish - 1, project.workingDays)} | ${stage.days} working days`, 151, top + 24, 131);
    text(`Priced works at this stage: ${exportMoney(stage.amount)}`, 151, top + 38, 131, 12, true);
    text(`${stage.lines.length} BOQ items; ${stage.parts} model elements. ${stage.missing} unpriced items excluded.`, 151, top + 50, 131);
    text(stage.id === "setting-out" ? "Pegs and strings are temporary. They disappear after the floor slab is finished." : stage.parts ? "Illustrative model; confirm dimensions and specifications against approved drawings." : "This stage carries programme / cost scope; no geometry is linked.", 151, top + 63, 131, 10);
  });
  if (project.parts.some(part => part.cutaway)) { page("Completed project - interior view"); picture(end, true, 15, 33, 267, 151.3); }

  if (detailed) {
    page("Detailed BOQ - current quantities and rates");
    const header = () => { text("Code / work description", 15, y, 123, 11, true); text("Quantity", 141, y, 22, 11, true); text("Unit", 167, y, 13, 11, true); text("Rate NGN", 187, y, 40, 11, true); text("Amount NGN", 234, y, 48, 11, true); y += 8; };
    header();
    for (const line of project.boq) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      const description = `${line.code ? line.code + " | " : ""}${line.description}`, height = Math.max(12, doc.splitTextToSize(plain(description), 122).length * 4.8 + 5);
      room(height, header); text(description, 15, y, 122); text(number(line.quantity), 141, y, 22); text(line.unit, 167, y, 13); text(line.rate === null ? "Unpriced" : number(line.rate), 187, y, 40); text(line.excluded ? "Excluded" : lineAmount(line) === null ? "Unpriced" : number(lineAmount(line)!), 234, y, 48); y += height;
      doc.setDrawColor("#dbe5eb"); doc.line(15, y - 4, 282, y - 4);
    }
    page("Rate build-ups - resources and allowances");
    paragraph("Resources are stated per unit of BOQ work. Consumption x resource unit price gives the resource cost. Missing prices remain unpriced. A retained manual BOQ rate can differ from the resource subtotal; this report does not invent a reconciliation.");
    for (const line of project.boq.filter(line => line.analysis)) {
      const analysis = line.analysis!;
      const itemTitle = `${line.code ? line.code + " | " : ""}${line.description}`;
      const rateText = `Current rate: ${line.rate === null ? "Unpriced" : exportMoney(line.rate)} / ${line.unit}. ${analysis.manual ? "Manual BOQ rate retained." : "Rate calculated from resources and allowances."}`;
      const missing = analysis.resources.some(resource => resource.quantity > 0 && resource.unitRate === null);
      const calculation = calculateRate(analysis.resources.map(resource => ({ ...resource, unitRate: resource.unitRate ?? 0 })), analysis.allowances);
      const allowances = Object.entries(analysis.allowances).map(([name, percentage]) => `${name}: ${number(percentage * 100)}%`).join("; ");
      const allowanceText = `Allowances: ${allowances}. ${missing ? "Resource calculation is incomplete; missing prices must be entered before using it as a calculated rate." : `Priced resource subtotal including these allowances: ${exportMoney(calculation.total)}.${analysis.manual ? " The retained BOQ rate remains the cost basis." : ""}`}`;
      const measure = (value: string, width: number, size = 11, bold = false) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); return doc.splitTextToSize(plain(value), width).length; };
      const resourceHeight = analysis.resources.reduce((sum, resource) => sum + Math.max(8, measure(`${resource.label} (${resource.category})`, 123) * 4.8 + 3), 0);
      const blockHeight = measure(itemTitle, 267, 12, true) * 12 * 0.43 + measure(rateText, 267) * 5.5 + resourceHeight + measure(allowanceText, 267) * 5.5 + 23;
      room(Math.min(156, blockHeight)); y += text(itemTitle, 15, y, 267, 12, true) + 3;
      paragraph(rateText);
      const resourceHeader = () => { text("Resource / category", 15, y, 124, 10, true); text("Qty / unit of work", 142, y, 46, 10, true); text("Unit price NGN", 194, y, 42, 10, true); text("Cost NGN", 241, y, 41, 10, true); y += 7; };
      resourceHeader();
      for (const resource of analysis.resources) {
        const height = Math.max(8, doc.setFontSize(11).splitTextToSize(plain(`${resource.label} (${resource.category})`), 123).length * 4.8 + 3);
        room(height, resourceHeader); text(`${resource.label} (${resource.category})`, 15, y, 123); text(`${number(resource.quantity)} ${resource.unit}`, 142, y, 46); text(resource.unitRate === null ? "Unpriced" : number(resource.unitRate), 194, y, 42); text(resource.unitRate === null ? "Unpriced" : number(resource.quantity * resource.unitRate), 241, y, 41); y += height;
      }
      paragraph(allowanceText);
      y += 3;
    }
  }
  const pages = doc.getNumberOfPages();
  for (let n = 1; n <= pages; n++) { doc.setPage(n); doc.setDrawColor("#dbe5eb"); doc.line(15, 198, 282, 198); text(`charismakproject.com | Proposed programme and cost snapshot | ${n} / ${pages}`, 15, 204, 267, 9); }
  doc.setProperties({ title: `${project.name} - construction programme and cost`, author: "Charismak Project Nigeria Limited", subject: "Construction sequence, BOQ and rate build-ups" });
  return doc;
}
