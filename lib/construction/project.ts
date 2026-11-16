import type { Resource } from "./costs";
import type { RateBankItem } from "../rates/defaults";
import type { TracePlan } from "./project-import";
export const PROJECT_STAGES = [
  { id: "planning", title: "Planning & mobilisation", color: "#8c67c7" }, { id: "setting-out", title: "Setting out", color: "#f43f89" },
  { id: "earthworks", title: "Excavation & earthworks", color: "#895331" }, { id: "foundations", title: "Foundations", color: "#7797c4" },
  { id: "frame", title: "Columns, beams & steel", color: "#265fac" }, { id: "slabs", title: "Floors & slabs", color: "#d29a42" },
  { id: "walls", title: "Blockwork & walls", color: "#d96b35" }, { id: "roof", title: "Roof structure & cover", color: "#183e60" },
  { id: "plumbing", title: "Plumbing & drainage", color: "#138dba" }, { id: "electrical", title: "Electrical installation", color: "#a34bc5" },
  { id: "finishes", title: "Plaster, finishes & paint", color: "#32a49a" }, { id: "fittings", title: "Doors, windows & fittings", color: "#36b8d9" },
  { id: "external", title: "External works", color: "#51933b" }, { id: "handover", title: "Testing & handover", color: "#617282" },
  { id: "unmapped", title: "Needs stage mapping", color: "#9a9ca2" },
] as const;
export type ProjectStage = typeof PROJECT_STAGES[number]["id"];
export type ModelPart = { id: string; name: string; stage: ProjectStage; positions: number[]; indices?: number[]; matrix?: number[]; line?: boolean; covers?: string[]; color?: string; cutaway?: boolean };
export type BoqLine = { id: string; code: string; description: string; section: string; quantity: number; unit: string; rate: number | null; originalAmount: number | null; stage: ProjectStage; output: number; crews: number; duration: number | null; partIds: string[]; notes: string[]; excluded?: boolean; analysis?: { resources: Resource[]; allowances: RateBankItem["allowances"]; bankSlug?: string; manual: boolean; baseRate: number | null } };
export type ProjectCharge = { id: string; label: string; percentage: number; basis: "works" | "running" };
export type StageRule = { days?: number; predecessor?: ProjectStage | "none"; relationship?: "FS" | "SS"; lag?: number; parallel?: boolean };
export type ConstructionProject = { version: 1; id: string; name: string; sourceName: string; sourceKind: string; parts: ModelPart[]; boq: BoqLine[]; start: string; workingDays: 5 | 6 | 7; rules: Partial<Record<ProjectStage, StageRule>>; unitScale: number; upAxis: "y" | "z"; createdAt: string; charges?: ProjectCharge[]; reviewNotes?: string[]; groundLevel?: number; planDraft?: TracePlan };
export const stageInfo = (id: ProjectStage) => PROJECT_STAGES.find(stage => stage.id === id) ?? PROJECT_STAGES.at(-1)!;
export const roundProject = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const projectMoney = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
export const emptyProject = (): ConstructionProject => ({ version: 1, id: `project-${Date.now()}`, name: "My construction project", sourceName: "", sourceKind: "", parts: [], boq: [], start: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()), workingDays: 6, rules: {}, unitScale: 1, upAxis: "y", createdAt: new Date().toISOString() });
export function replaceProjectDrawing(old: ConstructionProject, parts: ModelPart[], sourceName: string, sourceKind: string): ConstructionProject {
  const teachingBill = old.boq.length > 0 && old.boq.every(line => line.id.startsWith("example-"));
  return { ...old, name: old.name === "My construction project" || old.name.startsWith("Example bungalow") ? sourceName.replace(/\.[a-z0-9]+$/i, "") : old.name, parts, boq: teachingBill ? [] : old.boq, sourceName, sourceKind, unitScale: 1, upAxis: "y", planDraft: undefined };
}
export function replaceProjectBoq(old: ConstructionProject, boq: BoqLine[]): ConstructionProject {
  return { ...old, boq, ...(old.sourceKind === "traced example" ? { parts: [], sourceName: "", sourceKind: "", name: "My construction project" } : {}) };
}

export function suggestProjectStage(text: string): ProjectStage {
  const s = text.toLowerCase().replace(/[_./-]/g, " ");
  const rules: [ProjectStage, RegExp][] = [
    ["setting-out", /setting\s*out|set\s*out|survey|grid\s*line/], ["handover", /handover|commission|testing|snag|as\s*built/],
    ["planning", /mobilis|mobiliz|preliminar|approval|design\s*fee/], ["earthworks", /excavat|earthwork|cart\s*away|disposal|backfill|site\s*clear/],
    ["foundations", /footing|foundation|pile\b|blinding|substruct|column\s*base|starter\s*column|ifcfooting/], ["frame", /roof\s*beam|ring\s*beam|lintel|column/], ["roof", /roof|rafter|purlin|gutter|ridge|truss/],
    ["electrical", /electr|cable|conduit|socket|lighting|earthing|distribution\s*board|ifccable/], ["plumbing", /plumb|pipe|soil\s*stack|drain|sanitary|water\s*tank|basin|\bwc\b|ifcflow/],
    ["fittings", /window|glazing|door|ironmonger|cabinet|joinery|ifcdoor|ifcwindow/], ["finishes", /plaster|paint|tiling|tiles|screed|ceiling|cladding|finish|ifccovering/],
    ["slabs", /slab|floor\s*plate|floor\s*deck|oversite/], ["walls", /blockwork|masonry|wall|partition/],
    ["frame", /column|beam|reinforc|rebar|formwork|steel|bracing|ifcmember/], ["external", /paving|landscap|external|fence|gate|interlock/],
  ];
  return rules.find(([, expression]) => expression.test(s))?.[0] ?? "unmapped";
}
export function costNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string" || !raw.trim() || /%/.test(raw)) return null;
  const value = raw.trim().replace(/[₦,$£€\s]/g, "").replace(/^NGN/i, "");
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)) return null;
  const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null;
}
export function normaliseWorkUnit(raw: unknown) {
  const s = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (/^(m3|m³|cum|cu\.m)$/.test(s)) return "m³";
  if (/^(m2|m²|sqm|sq\.m)$/.test(s)) return "m²";
  if (/^(no\.?|nos\.?|nr|number|pcs|pc)$/.test(s)) return "No.";
  if (/^(tonne?s?|tons?|t)$/.test(s)) return "t";
  if (/^(lm|lin\.m|metre?s?|m)$/.test(s)) return "m";
  return String(raw ?? "").trim() || "item";
}
export function starterOutput(stage: ProjectStage, unit: string) {
  if (unit === "m³") return stage === "earthworks" ? 10 : 15;
  if (unit === "m²") return stage === "walls" ? 12 : stage === "finishes" ? 20 : 25;
  if (unit === "m") return stage === "plumbing" || stage === "electrical" ? 20 : 30;
  if (unit === "t") return 0.8;
  if (unit === "kg") return 400;
  if (unit === "No." || unit === "point") return 4;
  return 1;
}
export const lineAmount = (line: BoqLine) => line.excluded || line.rate === null ? null : roundProject(line.quantity * line.rate);
export const lineDuration = (line: BoqLine) => line.excluded || line.quantity === 0 ? 0 : Math.min(3650, Math.max(1, Math.ceil(line.duration ?? (line.quantity / Math.max(0.001, line.output) / Math.max(1, line.crews)))));
export function projectCostSummary(project: Pick<ConstructionProject, "boq" | "charges">, worksOverride?: number) {
  const works = worksOverride ?? roundProject(project.boq.reduce((sum, line) => sum + (lineAmount(line) ?? 0), 0));
  let total = works;
  const charges = (project.charges ?? []).map(charge => {
    const base = charge.basis === "works" ? works : total, amount = roundProject(base * charge.percentage);
    total = roundProject(total + amount);
    return { ...charge, base, amount };
  });
  return { works, charges, total: roundProject(total) };
}

export type ColumnMap = { code: number; description: number; quantity: number; unit: number; rate: number; amount: number };
const aliases: Record<keyof ColumnMap, RegExp> = { code: /^(item|item\s*no|item\s*code|code|ref|reference|s\/n|sn|no)\.?$/i, description: /description|particular|work\s*item|details\s*of\s*work/i, quantity: /^(qty|quantity|quantities|qnty)\.?$/i, unit: /^(unit|units|uom|u\/m)$/i, rate: /^(unit\s*rate|rate|rate\s*ngn|rate\s*₦|unit\s*price|price)\b/i, amount: /amount|line\s*total|total\s*cost/i };
export function detectBoqColumns(rows: unknown[][]) {
  let best = { header: -1, map: { code: -1, description: -1, quantity: -1, unit: -1, rate: -1, amount: -1 } as ColumnMap, score: 0 };
  rows.slice(0, 60).forEach((row, header) => {
    const map = Object.fromEntries(Object.entries(aliases).map(([key, expression]) => [key, row.findIndex(cell => expression.test(String(cell ?? "").trim().replace(/[():]/g, "")))])) as ColumnMap;
    const score = Object.values(map).filter(value => value >= 0).length + (map.description >= 0 ? 2 : 0);
    if (map.description >= 0 && score > best.score) best = { header, map, score };
  });
  return best;
}
export function parseBoqRows(rows: unknown[][], map: ColumnMap, header: number, sheet = "BOQ"): { lines: BoqLine[]; skipped: number; warnings: string[] } {
  if (map.description < 0) throw new Error("Choose the work-description column before importing.");
  const lines: BoqLine[] = [], warnings: string[] = []; let section = sheet, skipped = 0, inSummary = false;
  let headings: string[] = [];
  rows.slice(header + 1, header + 20001).forEach((row, index) => {
    const description = String(row[map.description] ?? "").trim(); if (!description) return;
    if (/^(?:work\s*)?description$/i.test(description)) { headings = []; inSummary = false; skipped++; return; }
    if (/^(?:general\s+)?summary$/i.test(description)) { inSummary = true; skipped++; return; }
    if (inSummary || /^(sub\s*total|grand\s*total|total(?:\s+carried|\s+for|\s+to|\s+of|$)|vat|value\s*added\s*tax|carried\s*forward|brought\s*forward)\b/i.test(description) || /\bto\s+(?:general\s+)?summary\b/i.test(description)) { skipped++; return; }
    const unitRaw = map.unit >= 0 ? String(row[map.unit] ?? "").trim() : "";
    const quantityRaw = map.quantity >= 0 ? costNumber(row[map.quantity]) : null, amount = map.amount >= 0 ? costNumber(row[map.amount]) : null;
    if (quantityRaw === null && !unitRaw && amount === null) { headings = [...headings.filter(item => item !== description), description].slice(-6); section = headings.join(" · "); return; }
    if (quantityRaw === null && amount !== null && !unitRaw && (headings.length === 0 || !String(row[map.code] ?? "").trim())) { skipped++; warnings.push(`Row ${header + index + 2}: amount-only subtotal / allowance needs separate review (${description.slice(0, 60)}).`); return; }
    const quantity = quantityRaw ?? (amount !== null && (!unitRaw || /item|sum|lump/i.test(unitRaw)) ? 1 : null);
    if (quantity === null || quantity < 0) { skipped++; warnings.push(`Row ${header + index + 2}: quantity needs review (${description.slice(0, 60)}).`); return; }
    const unit = normaliseWorkUnit(unitRaw), importedRate = map.rate >= 0 ? costNumber(row[map.rate]) : null;
    const rate = importedRate !== null && importedRate >= 0 ? importedRate : amount !== null && amount >= 0 && quantity > 0 ? amount / quantity : null;
    const directStage = suggestProjectStage(description), contextStage = suggestProjectStage(section);
    const stage = directStage === "unmapped" || (["walls", "frame"].includes(directStage) && ["finishes", "fittings", "plumbing", "electrical"].includes(contextStage)) ? contextStage : directStage, notes: string[] = [];
    const excluded = /^(?:n\/?a|not\s*applicable|excluded|not\s*included)$/i.test(String(map.amount >= 0 ? row[map.amount] ?? "" : "").trim());
    if (excluded) notes.push("Amount marked N/A / excluded in the source BOQ. Its printed rate is retained for reference and excluded from project cost until you include the item.");
    if (importedRate === null && amount !== null && rate !== null) notes.push("Rate derived from supplied amount ÷ quantity.");
    if (rate !== null && amount !== null && Math.abs(quantity * rate - amount) > Math.max(1, Math.abs(amount) * 0.001)) notes.push("BOQ amount differs from quantity × rate. Simulation uses quantity × rate; confirm the source bill.");
    if (stage === "unmapped") notes.push("Choose a construction stage.");
    notes.push("Productivity is an editable starter assumption, not a committed programme.");
    lines.push({ id: `boq-${sheet.replace(/[^a-z0-9]/gi, "").slice(0, 12)}-${header + index + 2}`, code: map.code >= 0 ? String(row[map.code] ?? "").trim() : "", description, section, quantity, unit, rate: rate === null ? null : roundProject(rate), originalAmount: amount, stage, output: starterOutput(stage, unit), crews: 1, duration: unit === "item" ? 5 : null, partIds: [], notes, ...(excluded ? { excluded: true } : {}) });
  });
  if (!lines.length) warnings.push("No measurable work items found. Check the sheet, header row and column mapping.");
  return { lines, skipped, warnings };
}

export type ScheduledStage = { id: ProjectStage; title: string; color: string; start: number; finish: number; days: number; amount: number; missing: number; lines: BoqLine[]; parts: number; predecessor: ProjectStage | "none"; relationship: "FS" | "SS"; lag: number };
export function proposeSchedule(project: ConstructionProject): ScheduledStage[] {
  const active = PROJECT_STAGES.filter(stage => project.boq.some(line => line.stage === stage.id) || project.parts.some(part => part.stage === stage.id));
  const result: ScheduledStage[] = [];
  for (const stage of active) {
    const lines = project.boq.filter(line => line.stage === stage.id), rule = project.rules[stage.id] ?? {};
    const normalDays = lines.length ? rule.parallel ? Math.max(...lines.map(lineDuration)) : lines.reduce((sum, line) => sum + lineDuration(line), 0) : 1;
    const days = Math.max(1, Math.ceil(rule.days && Number.isFinite(rule.days) ? rule.days : normalDays));
    const predecessor = rule.predecessor === "none" ? undefined : result.find(item => item.id === rule.predecessor) ?? result.at(-1);
    const relationship = rule.relationship === "SS" ? "SS" : "FS", lag = Number.isFinite(rule.lag) ? Math.round(rule.lag!) : 0;
    const start = Math.max(0, predecessor ? (relationship === "SS" ? predecessor.start : predecessor.finish) + lag : 0);
    result.push({ ...stage, start, finish: start + days, days, amount: roundProject(lines.reduce((sum, line) => sum + (lineAmount(line) ?? 0), 0)), missing: lines.filter(line => !line.excluded && line.quantity > 0 && line.rate === null).length, lines, parts: project.parts.filter(part => part.stage === stage.id).length, predecessor: predecessor?.id ?? "none", relationship, lag });
  }
  return result;
}
export function workingDate(start: string, index: number, workingDays: 5 | 6 | 7) {
  const date = new Date(`${/^\d{4}-\d{2}-\d{2}$/.test(start) ? start : "2026-01-01"}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) throw new Error("Choose a valid project start date.");
  const allowed = () => workingDays === 7 || (date.getUTCDay() !== 0 && (workingDays === 6 || date.getUTCDay() !== 6));
  while (!allowed()) date.setUTCDate(date.getUTCDate() + 1);
  const whole = Math.max(0, Math.floor(index)), weeks = Math.floor(whole / workingDays);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  for (let n = 0; n < whole % workingDays;) { date.setUTCDate(date.getUTCDate() + 1); if (allowed()) n++; }
  if (!Number.isFinite(date.getTime())) return "Review programme duration";
  return date.toISOString().slice(0, 10);
}
export function plannedCostAt(schedule: ScheduledStage[], day: number) {
  return roundProject(schedule.reduce((sum, stage) => sum + stage.amount * Math.min(1, Math.max(0, (day - stage.start) / stage.days)), 0));
}
export function validateProject(value: unknown): ConstructionProject {
  const p = value as ConstructionProject;
  if (!p || p.version !== 1 || !Array.isArray(p.parts) || !Array.isArray(p.boq) || p.parts.length > 10000 || p.boq.length > 20000) throw new Error("This is not a supported Charismak project file.");
  let vertices = 0;
  for (const part of p.parts) {
    if (typeof part.id !== "string" || typeof part.name !== "string" || !PROJECT_STAGES.some(stage => stage.id === part.stage) || !Array.isArray(part.positions) || part.positions.length % 3 || part.positions.some(v => !Number.isFinite(v) || Math.abs(v) > 1e9)) throw new Error("A model element contains invalid geometry.");
    vertices += part.positions.length / 3;
    if (part.indices && (!Array.isArray(part.indices) || part.indices.some(v => !Number.isInteger(v) || v < 0 || v >= part.positions.length / 3))) throw new Error("A model element has invalid face indices.");
    if (part.covers && (!Array.isArray(part.covers) || part.covers.some(id => typeof id !== "string"))) throw new Error("Invalid finish-layer mapping.");
    if (part.color !== undefined && !/^#[0-9a-f]{6}$/i.test(part.color)) throw new Error("Invalid model material colour.");
    if (part.cutaway !== undefined && typeof part.cutaway !== "boolean") throw new Error("Invalid cutaway setting.");
    if (part.matrix && (part.matrix.length !== 16 || part.matrix.some(v => !Number.isFinite(v)))) throw new Error("Invalid model transform.");
  }
  if (vertices > 1500000) throw new Error("This model exceeds the browser limit of 1.5 million vertices. Export a lighter coordination model.");
  if (new Set(p.parts.map(part => part.id)).size !== p.parts.length || new Set(p.boq.map(line => line.id)).size !== p.boq.length) throw new Error("Model / BOQ IDs must be unique.");
  if (p.charges && (!Array.isArray(p.charges) || p.charges.length > 20 || new Set(p.charges.map(charge => charge.id)).size !== p.charges.length || p.charges.some(charge => !charge || typeof charge.id !== "string" || typeof charge.label !== "string" || !Number.isFinite(charge.percentage) || charge.percentage < 0 || charge.percentage > 1 || !["works", "running"].includes(charge.basis)))) throw new Error("Invalid project percentage allowance.");
  if (p.reviewNotes && (!Array.isArray(p.reviewNotes) || p.reviewNotes.length > 50 || p.reviewNotes.some(note => typeof note !== "string" || note.length > 2000))) throw new Error("Invalid project review notes.");
  if (p.groundLevel !== undefined && (!Number.isFinite(p.groundLevel) || Math.abs(p.groundLevel) > 1e9)) throw new Error("Invalid ground datum.");
  if (p.planDraft) {
    const plan = p.planDraft;
    const point = (value: unknown) => Array.isArray(value) && value.length === 2 && value.every(v => Number.isFinite(v) && Math.abs(v) <= 1e7);
    if (typeof plan.image !== "string" || plan.image.length > 30 * 1024 * 1024 || !/^(data:image\/(png|jpeg|webp);base64,|$)/.test(plan.image) || ![plan.width, plan.height, plan.floors, plan.storeyHeight, plan.wallThickness].every(v => Number.isFinite(v) && v > 0 && v <= 1e7) || !Number.isFinite(plan.distance) || plan.distance < 0 || plan.distance > 1e7 || !Array.isArray(plan.outline) || plan.outline.length > 10000 || !plan.outline.every(point) || !Array.isArray(plan.calibration) || plan.calibration.length > 2 || !plan.calibration.every(point) || !Array.isArray(plan.segments) || plan.segments.length > 10000 || plan.segments.some(segment => !point(segment.a) || !point(segment.b) || !["wall", "door", "window"].includes(segment.type))) throw new Error("Invalid saved plan trace.");
  }
  for (const line of p.boq) {
    if (line?.excluded !== undefined && typeof line.excluded !== "boolean") throw new Error("Invalid BOQ exclusion setting.");
    if (!line || typeof line.id !== "string" || typeof line.description !== "string" || !Number.isFinite(line.quantity) || line.quantity < 0 || line.quantity > 1e9 || (line.rate !== null && (!Number.isFinite(line.rate) || line.rate < 0 || line.rate > 1e9)) || !PROJECT_STAGES.some(stage => stage.id === line.stage)) throw new Error("The project contains an invalid BOQ line.");
    if (line.analysis && (!Array.isArray(line.analysis.resources) || line.analysis.resources.length > 100 || line.analysis.resources.some(resource => !resource || typeof resource.id !== "string" || typeof resource.label !== "string" || !Number.isFinite(resource.quantity) || resource.quantity < 0 || (resource.unitRate !== null && (!Number.isFinite(resource.unitRate) || resource.unitRate < 0))) || !line.analysis.allowances || Object.values(line.analysis.allowances).some(value => !Number.isFinite(value) || value < 0 || value > 1))) throw new Error("A resource build-up contains invalid values.");
  }
  const start = /^\d{4}-\d{2}-\d{2}$/.test(p.start) && Number.isFinite(new Date(`${p.start}T12:00:00Z`).getTime()) ? p.start : emptyProject().start;
  return { ...emptyProject(), ...p, name: String(p.name || "Imported project").slice(0, 120), start, rules: p.rules && typeof p.rules === "object" ? p.rules : {}, boq: p.boq.map(line => ({ ...line, code: String(line.code ?? ""), unit: String(line.unit ?? "item"), section: String(line.section ?? ""), notes: Array.isArray(line.notes) ? line.notes.filter(note => typeof note === "string").slice(0, 50) : [], partIds: Array.isArray(line.partIds) ? line.partIds.filter(id => typeof id === "string" && p.parts.some(part => part.id === id)) : [], output: Number.isFinite(line.output) && line.output > 0 ? line.output : starterOutput(line.stage, line.unit), crews: Number.isFinite(line.crews) && line.crews >= 1 ? Math.min(100, line.crews) : 1, duration: line.duration !== null && Number.isFinite(line.duration) && line.duration > 0 ? Math.min(3650, line.duration) : null })), unitScale: Number.isFinite(p.unitScale) && p.unitScale > 0 && p.unitScale <= 1000 ? p.unitScale : 1, upAxis: p.upAxis === "z" ? "z" : "y", workingDays: [5, 6, 7].includes(p.workingDays) ? p.workingDays : 6 };
}
