import type { TracePlan } from "./project-import";

export const DRAWING_ROLES = ["reference", "floor-plan", "roof-plan", "section", "elevation", "structural", "mep", "detail"] as const;
export type DrawingRole = typeof DRAWING_ROLES[number];
export type DrawingDocument = { id: string; name: string; pages: number; kind: "pdf" | "image" | "dxf"; sha256?: string };
export type DrawingLevel = { id: string; name: string; elevation: number; height: number };
/** A page may contain several independently calibrated drawing regions. */
export type DrawingSheet = {
  id: string; documentId: string; sourceName: string; page: number; title: string; revision: string;
  role: DrawingRole; levelId: string | null; included: boolean; rotation: number; offset: [number, number]; trace?: TracePlan;
};
