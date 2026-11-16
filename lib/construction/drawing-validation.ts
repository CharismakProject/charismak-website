import { DRAWING_ROLES, type DrawingDocument, type DrawingLevel, type DrawingSheet } from "./drawing-types";
import type { TracePlan } from "./project-import";
const point = (value: unknown) => Array.isArray(value) && value.length === 2 && value.every(v => Number.isFinite(v) && Math.abs(v) <= 1e7);
const label = (value: unknown, limit = 160) => typeof value === "string" && value.length > 0 && value.length <= limit;
export function validatePlanTrace(plan: TracePlan) {
  if (!plan || typeof plan.image !== "string" || plan.image.length > 30 * 1024 * 1024 || !/^(data:image\/(png|jpeg|webp);base64,|$)/.test(plan.image) || ![plan.width, plan.height, plan.floors, plan.storeyHeight, plan.wallThickness].every(v => Number.isFinite(v) && v > 0 && v <= 1e7) || !Number.isFinite(plan.distance) || plan.distance < 0 || plan.distance > 1e7 || !Array.isArray(plan.outline) || plan.outline.length > 10000 || !plan.outline.every(point) || !Array.isArray(plan.calibration) || plan.calibration.length > 2 || !plan.calibration.every(point) || !Array.isArray(plan.segments) || plan.segments.length > 10000 || plan.segments.some(segment => !point(segment.a) || !point(segment.b) || !["wall", "door", "window"].includes(segment.type)) || (plan.anchor !== undefined && !point(plan.anchor))) throw new Error("Invalid saved plan trace.");
}
export function validateDrawingRegister(value: { drawingDocuments?: DrawingDocument[]; drawingSheets?: DrawingSheet[]; levels?: DrawingLevel[] }) {
  const { drawingDocuments: docs = [], drawingSheets: sheets = [], levels = [] } = value;
  if (!Array.isArray(docs) || docs.length > 100 || new Set(docs.map(doc => doc?.id)).size !== docs.length || docs.some(doc => !doc || !label(doc.id) || !label(doc.name, 512) || !["pdf", "image", "dxf"].includes(doc.kind) || !Number.isInteger(doc.pages) || doc.pages < 1 || doc.pages > 10000 || (doc.sha256 !== undefined && !/^[0-9a-f]{64}$/.test(doc.sha256)))) throw new Error("Invalid drawing document register.");
  if (!Array.isArray(levels) || levels.length > 100 || new Set(levels.map(level => level?.id)).size !== levels.length || levels.some(level => !level || !label(level.id) || (typeof level.name !== "string" || level.name.length > 120) || !Number.isFinite(level.elevation) || Math.abs(level.elevation) > 1e6 || !Number.isFinite(level.height) || level.height < 0.5 || level.height > 30)) throw new Error("Invalid building levels.");
  if (!Array.isArray(sheets) || sheets.length > 500 || new Set(sheets.map(sheet => sheet?.id)).size !== sheets.length) throw new Error("Invalid drawing sheet register.");
  let images = 0;
  for (const sheet of sheets) {
    const doc = docs.find(doc => doc.id === sheet?.documentId);
    if (!sheet || !label(sheet.id) || !doc || !label(sheet.sourceName, 512) || (typeof sheet.title !== "string" || sheet.title.length > 160) || typeof sheet.revision !== "string" || sheet.revision.length > 80 || !Number.isInteger(sheet.page) || sheet.page < 1 || sheet.page > doc.pages || !DRAWING_ROLES.includes(sheet.role) || (sheet.levelId !== null && !levels.some(level => level.id === sheet.levelId)) || typeof sheet.included !== "boolean" || !Number.isFinite(sheet.rotation) || Math.abs(sheet.rotation) > 360 || !point(sheet.offset)) throw new Error("Invalid drawing sheet or level assignment.");
    if (sheet.trace) { validatePlanTrace(sheet.trace); images += sheet.trace.image.length; }
  }
  if (images > 48 * 1024 * 1024) throw new Error("Saved sheet previews exceed 48 MB. Keep the sheets you need or use a lighter drawing PDF.");
}
