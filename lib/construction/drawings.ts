import * as THREE from "three";
import { traceToModel, type TracePlan } from "./project-import";
import type { ConstructionProject, ModelPart } from "./project";
import type { DrawingDocument, DrawingLevel, DrawingSheet } from "./drawing-types";

export const drawingId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export async function drawingFingerprint(file: File): Promise<string> { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))].map(byte => byte.toString(16).padStart(2, "0")).join(""); }
export const newPlanTrace = (page: { image: string; width: number; height: number }): TracePlan => ({ ...page, outline: [], segments: [], calibration: [], distance: 10, floors: 1, storeyHeight: 3, wallThickness: 0.225 });
export function documentSheets(document: DrawingDocument, first?: TracePlan): DrawingSheet[] {
  if (document.pages > 200) throw new Error("Use up to 200 pages per drawing document. Split a larger drawing set into volumes.");
  return Array.from({ length: document.pages }, (_, page) => ({ id: `${document.id}-page-${page + 1}`, documentId: document.id, sourceName: document.name, page: page + 1, title: `Page ${page + 1}`, revision: "", role: "reference", levelId: null, included: false, rotation: 0, offset: [0, 0], ...(page === 0 && first ? { trace: first } : {}) }));
}
export function appendDrawingDocument(project: ConstructionProject, document: DrawingDocument, first: TracePlan): ConstructionProject {
  const levels = project.levels?.length ? project.levels : [{ id: drawingId("level"), name: "Ground floor", elevation: project.groundLevel === undefined ? 0 : project.groundLevel + .45, height: 3 }];
  const docs = [...project.drawingDocuments ?? []], sheets = [...project.drawingSheets ?? []];
  if (project.planDraft && !sheets.length) {
    const legacy: DrawingDocument = { id: drawingId("document"), name: (project.sourceName || "Saved plan trace").slice(0, 512), pages: 1, kind: "image" };
    docs.push(legacy); sheets.push(...documentSheets(legacy, project.planDraft));
  }
  return { ...project, sourceName: document.name, levels, drawingDocuments: [...docs, document], drawingSheets: [...sheets, ...documentSheets(document, first)], planDraft: undefined };
}
export function modelLevels(project: Pick<ConstructionProject, "parts" | "levels">): DrawingLevel[] {
  const levels = new Map((project.levels ?? []).map(level => [level.id, level]));
  for (const part of project.parts) if (part.levelId && !levels.has(part.levelId)) levels.set(part.levelId, { id: part.levelId, name: part.source?.levelName ?? part.levelId, elevation: part.source?.levelElevation ?? 0, height: 3 });
  return [...levels.values()].sort((a, b) => a.elevation - b.elevation || a.name.localeCompare(b.name));
}

/** Builds schematic architecture from reviewed, independently scaled floor plans. */
export function assembleDrawingModel(project: ConstructionProject) {
  const included = (project.drawingSheets ?? []).filter(sheet => sheet.included);
  if (!included.length) throw new Error("Choose the floor-plan drawings to include in the model.");
  if (included.some(sheet => sheet.role !== "floor-plan" || !sheet.levelId || !sheet.trace)) throw new Error("Every included drawing must be a loaded floor plan assigned to a level.");
  const levelMap = new Map((project.levels ?? []).map(level => [level.id, level]));
  if (included.some(sheet => !levelMap.has(sheet.levelId!))) throw new Error("Assign each floor plan to a valid level.");
  const sheets = included.sort((a, b) => levelMap.get(a.levelId!)!.elevation - levelMap.get(b.levelId!)!.elevation);
  if (new Set(sheets.map(sheet => sheet.levelId)).size !== sheets.length) throw new Error("Include one floor-plan region per level. Exclude superseded revisions before building.");
  const parts: ModelPart[] = []; let unmatched = 0;
  const generatedLevels: DrawingLevel[] = [];
  for (const [index, sheet] of sheets.entries()) {
    const level = project.levels?.find(level => level.id === sheet.levelId);
    if (!level || !sheet.trace) throw new Error("Assign each floor plan to a valid level.");
    if (!sheet.trace.anchor) throw new Error(`Set a common alignment anchor on ${sheet.title}. Use the same grid point on every floor.`);
    const next = sheets[index + 1], nextLevel = project.levels?.find(item => item.id === next?.levelId);
    if (nextLevel && nextLevel.elevation < level.elevation + level.height - 0.01) throw new Error(`${level.name} overlaps the next level. Review finished floor elevations and floor-to-floor heights.`);
    if (nextLevel && nextLevel.elevation > level.elevation + level.height + 0.01) throw new Error(`${level.name} does not meet the next floor. Set its floor-to-floor height to ${nextLevel.elevation - level.elevation} m, or supply reviewed geometry for a split level.`);
    const built = traceToModel({ ...sheet.trace, floors: 1, storeyHeight: level.height }); unmatched += built.unmatched;
    const retained = built.parts.filter(part => (index === 0 || !["setting-out", "foundations"].includes(part.stage)) && (index === sheets.length - 1 || part.stage !== "roof"));
    const transform = new THREE.Matrix4().makeRotationY(sheet.rotation * Math.PI / 180); transform.setPosition(sheet.offset[0], level.elevation - 0.15, sheet.offset[1]);
    const ids = new Map(retained.map(part => [part.id, `${sheet.id}-${part.id}`]));
    for (const part of retained) {
      const matrix = part.matrix ? transform.clone().multiply(new THREE.Matrix4().fromArray(part.matrix)) : transform;
      const colour = part.stage === "finishes" ? "#e4d5b8" : part.stage === "walls" ? "#c77d49" : part.stage === "slabs" ? "#9eacb9" : part.stage === "foundations" ? "#8095af" : part.stage === "roof" ? "#31516c" : part.stage === "fittings" ? part.name.startsWith("door") ? "#956848" : "#62b4d3" : undefined;
      parts.push({ ...part, color: colour, id: ids.get(part.id)!, name: `${level.name} / ${part.name}`, matrix: Array.from(matrix.toArray()), levelId: level.id, source: { documentId: sheet.documentId, sheetId: sheet.id, page: sheet.page, levelName: level.name, levelElevation: level.elevation }, covers: part.covers?.map(id => ids.get(id)!).filter(Boolean), cutaway: part.stage === "roof" });
    }
    generatedLevels.push(level);
  }
  // Retain a BOQ link only when the source identity AND geometry still agree.
  const old = new Map(project.parts.map(part => [part.id, part]));
  const unchanged = new Set(parts.filter(part => {
    const before = old.get(part.id);
    const same = before && JSON.stringify([before.positions, before.indices, before.matrix]) === JSON.stringify([part.positions, part.indices, part.matrix]);
    if (same) part.stage = before.stage;
    return same;
  }).map(part => part.id));
  const detached = project.boq.reduce((sum, line) => sum + line.partIds.filter(id => !unchanged.has(id)).length, 0);
  const boq = project.boq.map(line => ({ ...line, partIds: line.partIds.filter(id => unchanged.has(id)) }));
  const lowest = generatedLevels[0];
  return { parts, boq, unmatched, detached, groundLevel: project.groundLevel ?? lowest.elevation - 0.45 };
}
