import * as THREE from "three";
import { suggestProjectStage, type ModelPart } from "./project";
export type PlanPoint = [number, number];
export type PlanSegment = { a: PlanPoint; b: PlanPoint; type: "wall" | "door" | "window" };
export type TracePlan = { width: number; height: number; image: string; outline: PlanPoint[]; segments: PlanSegment[]; calibration: PlanPoint[]; distance: number; floors: number; storeyHeight: number; wallThickness: number };
const LIMIT = 1500000;

function asPart(mesh: THREE.Mesh, id: string, name: string): ModelPart {
  const geometry = mesh.geometry, positions = geometry.getAttribute("position");
  return { id, name, stage: suggestProjectStage(name), positions: Array.from(positions.array), indices: geometry.index ? Array.from(geometry.index.array) : undefined, matrix: mesh.matrixWorld.toArray() };
}
export async function import3D(file: File, report: (message: string) => void): Promise<ModelPart[]> {
  if (file.size > 80 * 1024 * 1024) throw new Error("Use a coordination model below 80 MB. Remove textures and unnecessary detail before exporting.");
  const extension = file.name.split(".").at(-1)?.toLowerCase(), data = await file.arrayBuffer();
  report(`Reading ${file.name}…`);
  if (extension === "ifc") return importIfc(new Uint8Array(data), report);
  let root: THREE.Object3D;
  if (extension === "glb" || extension === "gltf") {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const manager = new THREE.LoadingManager();
    manager.setURLModifier(url => { if (!/^(data:|blob:)/.test(url)) throw new Error("This model references external files. Export a self-contained GLB or embed all buffers and images in the glTF."); return url; });
    const gltf = await new GLTFLoader(manager).parseAsync(extension === "gltf" ? new TextDecoder().decode(data) : data, ""); root = gltf.scene;
  } else if (extension === "obj") {
    const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js"); root = new OBJLoader().parse(new TextDecoder().decode(data));
  } else if (extension === "stl") {
    const { STLLoader } = await import("three/addons/loaders/STLLoader.js"); root = new THREE.Mesh(new STLLoader().parse(data)); root.name = "STL mesh — choose its stage";
  } else throw new Error("Use IFC, GLB, embedded glTF, OBJ or STL. Export native RVT/NWD/DWG files to a supported coordination format first.");
  root.updateMatrixWorld(true);
  const parts: ModelPart[] = []; let vertices = 0;
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry.getAttribute("position")) return;
    vertices += mesh.geometry.getAttribute("position").count;
    if (vertices > LIMIT || parts.length > 10000) throw new Error("Model too detailed. Export fewer than 1.5 million vertices / 10,000 mesh elements.");
    parts.push(asPart(mesh, `mesh-${parts.length + 1}`, [mesh.parent?.name, mesh.name].filter(Boolean).join(" / ") || `Element ${parts.length + 1}`));
  });
  root.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry) mesh.geometry.dispose(); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => { for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose(); material.dispose(); }); });
  if (!parts.length) throw new Error("No mesh geometry found in this model.");
  return parts;
}
let ifcLoading: Promise<typeof import("web-ifc")> | undefined;
async function ifcLibrary() {
  if (!ifcLoading) ifcLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = "/construction-assets/web-ifc-api.js"; script.async = true;
    const timer = window.setTimeout(() => { ifcLoading = undefined; script.remove(); reject(new Error("The IFC reader download timed out. Check your connection and try again.")); }, 90000);
    script.onload = () => { window.clearTimeout(timer); resolve((window as unknown as { WebIFC: typeof import("web-ifc") }).WebIFC); };
    script.onerror = () => { window.clearTimeout(timer); ifcLoading = undefined; script.remove(); reject(new Error("The local IFC reader could not load. Reload and try again.")); }; document.head.appendChild(script);
  });
  return ifcLoading;
}
async function importIfc(data: Uint8Array, report: (message: string) => void) {
  const library = await ifcLibrary(), api = new library.IfcAPI(); api.SetWasmPath("/construction-assets/", true);
  await api.Init(undefined, true); const model = api.OpenModel(data, { COORDINATE_TO_ORIGIN: true, CIRCLE_SEGMENTS: 12 });
  if (model < 0) { api.Dispose(); throw new Error("The IFC reader could not open this file. Check its IFC export and schema."); }
  const parts: ModelPart[] = []; let count = 0;
  try {
    api.StreamAllMeshes(model, (mesh, index, total) => {
      if (index % 100 === 0) report(`Reading IFC elements: ${index + 1} / ${total}`);
      const type = api.GetNameFromTypeCode(api.GetLineType(model, mesh.expressID));
      const entity = api.GetLine(model, mesh.expressID, false), name = `${type} ${entity?.Name?.value ?? ""} #${mesh.expressID}`.trim();
      for (let n = 0; n < mesh.geometries.size(); n++) {
        const placed = mesh.geometries.get(n), geometry = api.GetGeometry(model, placed.geometryExpressID);
        const raw = api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize()), positions: number[] = [];
        for (let offset = 0; offset < raw.length; offset += 6) positions.push(raw[offset], raw[offset + 1], raw[offset + 2]);
        count += positions.length / 3;
        if (count > LIMIT || parts.length >= 10000) { geometry.delete(); throw new Error("IFC model too detailed. Export a lighter coordination model below 1.5 million vertices."); }
        parts.push({ id: `ifc-${mesh.expressID}-${n}`, name, stage: suggestProjectStage(type + " " + name), positions, indices: Array.from(api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize())), matrix: [...placed.flatTransformation] });
        geometry.delete();
      }
    }, true);
  } finally { api.CloseModel(model); api.Dispose(); }
  if (!parts.length) throw new Error("This IFC contains no renderable geometry.");
  return parts;
}

export async function readPlan(file: File, pageNumber = 1): Promise<{ image: string; width: number; height: number; pages: number }> {
  if (file.size > 30 * 1024 * 1024) throw new Error("Use a plan below 30 MB.");
  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist"); pdfjs.GlobalWorkerOptions.workerSrc = "/construction-assets/pdf.worker.mjs";
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
    const pdf = await task.promise;
    try {
      const page = await pdf.getPage(Math.min(pdf.numPages, Math.max(1, pageNumber))), base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(base.width, base.height)) });
      const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
      return { image: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, pages: pdf.numPages };
    } finally { await task.destroy(); }
  }
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Use a PDF, PNG, JPG or WebP plan, or a DXF vector drawing.");
  const bitmap = await createImageBitmap(file), scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale); canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { image: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, pages: 1 };
}
export async function readDxf(file: File) {
  if (file.size > 30 * 1024 * 1024) throw new Error("Use a DXF below 30 MB.");
  const { default: DxfParser } = await import("dxf-parser");
  const dxf = new DxfParser().parseSync(await file.text()); if (!dxf) throw new Error("Could not read the DXF drawing.");
  const lines: { layer: string; points: PlanPoint[]; closed: boolean }[] = [];
  for (const raw of dxf.entities.slice(0, 50000)) {
    const entity = raw as unknown as { type: string; layer?: string; vertices?: { x: number; y: number; bulge?: number }[]; shape?: boolean };
    if (!["LINE", "LWPOLYLINE", "POLYLINE"].includes(entity.type) || !entity.vertices?.length) continue;
    if (entity.vertices.some(point => point.bulge || !Number.isFinite(point.x) || !Number.isFinite(point.y))) continue;
    lines.push({ layer: entity.layer ?? "0", points: entity.vertices.map(point => [point.x, point.y]), closed: !!entity.shape });
  }
  if (!lines.length) throw new Error("No straight LINE / POLYLINE geometry found. Export an unblocked DXF or use a PDF plan.");
  return { lines, units: Number(dxf.header?.$INSUNITS ?? 0), layers: [...new Set(lines.map(line => line.layer))], skipped: dxf.entities.length - lines.length };
}

export function traceToModel(plan: TracePlan): { parts: ModelPart[]; unmatched: number } {
  if (plan.outline.length < 3 || plan.calibration.length !== 2 || !(plan.distance > 0)) throw new Error("Calibrate a known distance and close the building footprint before generating 3D.");
  if ((plan.outline.length + plan.segments.length) * plan.floors > 2000) throw new Error("This trace is too detailed for a simple generated model. Reduce the wall segments or import a 3D coordination model.");
  const pixels = Math.hypot(plan.calibration[1][0] - plan.calibration[0][0], plan.calibration[1][1] - plan.calibration[0][1]);
  if (pixels < 5) throw new Error("Choose two calibration points farther apart.");
  const scale = plan.distance / pixels, origin = plan.outline[0], parts: ModelPart[] = [];
  const toWorld = (p: PlanPoint): PlanPoint => [(p[0] - origin[0]) * scale, (p[1] - origin[1]) * scale];
  const outline = plan.outline.map(toWorld), walls: PlanSegment[] = [...plan.outline.map((point, index) => ({ a: point, b: plan.outline[(index + 1) % plan.outline.length], type: "wall" as const })), ...plan.segments.filter(segment => segment.type === "wall")].map(segment => ({ ...segment, a: toWorld(segment.a), b: toWorld(segment.b) }));
  const openings = plan.segments.filter(segment => segment.type !== "wall").map(segment => ({ ...segment, a: toWorld(segment.a), b: toWorld(segment.b), matched: false }));
  const add = (name: string, stage: ModelPart["stage"], geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4, line = false) => { parts.push({ id: `trace-${parts.length + 1}`, name, stage, positions: Array.from(geometry.getAttribute("position").array), indices: geometry.index ? Array.from(geometry.index.array) : undefined, matrix: matrix?.toArray(), line }); geometry.dispose(); };
  const wallBox = (name: string, a: PlanPoint, b: PlanPoint, bottom: number, height: number, thickness: number, stage: ModelPart["stage"]) => {
    if (height <= 0.001 || Math.hypot(b[0] - a[0], b[1] - a[1]) <= 0.01) return;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]), matrix = new THREE.Matrix4().makeRotationY(-Math.atan2(b[1] - a[1], b[0] - a[0])); matrix.setPosition((a[0] + b[0]) / 2, bottom + height / 2, (a[1] + b[1]) / 2);
    add(name, stage, new THREE.BoxGeometry(length, height, thickness), matrix);
  };
  const shape = new THREE.Shape(outline.map(p => new THREE.Vector2(p[0], -p[1])));
  const floorPlate = (name: string, y: number, stage: ModelPart["stage"]) => { const g = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false, steps: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); add(name, stage, g); };
  add("Setting-out perimeter", "setting-out", new THREE.BufferGeometry().setFromPoints([...outline, outline[0]].map(point => new THREE.Vector3(point[0], 0.02, point[1]))), undefined, true);
  walls.forEach((wall, index) => wallBox(`Schematic footing placeholder ${index + 1}`, wall.a, wall.b, -0.55, 0.45, Math.max(0.6, plan.wallThickness * 2), "foundations"));
  for (let floor = 0; floor < Math.min(20, Math.max(1, plan.floors)); floor++) {
    const bottom = floor * plan.storeyHeight + 0.15; floorPlate(`Floor slab level ${floor + 1}`, floor * plan.storeyHeight, "slabs");
    walls.forEach((wall, index) => {
      const dx = wall.b[0] - wall.a[0], dz = wall.b[1] - wall.a[1], length2 = dx * dx + dz * dz;
      if (length2 < 0.0001) return;
      const at = (t: number): PlanPoint => [wall.a[0] + dx * t, wall.a[1] + dz * t];
      const project = (p: PlanPoint) => ((p[0] - wall.a[0]) * dx + (p[1] - wall.a[1]) * dz) / length2;
      const cuts = openings.map(opening => { const t1 = project(opening.a), t2 = project(opening.b), p1 = at(t1), p2 = at(t2), distance = Math.max(Math.hypot(p1[0] - opening.a[0], p1[1] - opening.a[1]), Math.hypot(p2[0] - opening.b[0], p2[1] - opening.b[1])); return { opening, start: Math.max(0, Math.min(t1, t2)), end: Math.min(1, Math.max(t1, t2)), distance }; }).filter(cut => cut.distance < Math.max(0.3, plan.wallThickness * 1.5) && cut.end > cut.start && cut.start < 1 && cut.end > 0).sort((a, b) => a.start - b.start);
      let cursor = 0;
      const wallPiece = (a: PlanPoint, b: PlanPoint, low: number, high: number) => { const before = parts.length; wallBox(`Block wall L${floor + 1}-${index + 1}`, a, b, bottom + low, high - low, plan.wallThickness, "walls"); wallBox(`Plaster faces L${floor + 1}-${index + 1}`, a, b, bottom + low, high - low, plan.wallThickness + 0.025, "finishes"); if (parts.length === before + 2) parts[before + 1].covers = [parts[before].id]; };
      for (const cut of cuts) {
        if (cut.start < cursor) continue;
        wallPiece(at(cursor), at(cut.start), 0, plan.storeyHeight - 0.15);
        const head = Math.min(2.1, plan.storeyHeight - 0.25), sill = cut.opening.type === "window" ? Math.min(0.9, head / 2) : 0;
        wallPiece(at(cut.start), at(cut.end), head, plan.storeyHeight - 0.15); if (sill) wallPiece(at(cut.start), at(cut.end), 0, sill);
        wallBox(`${cut.opening.type} L${floor + 1}-${index + 1}`, at(cut.start), at(cut.end), bottom + sill, head - sill, 0.05, "fittings"); cut.opening.matched = true; cursor = cut.end;
      }
      wallPiece(at(cursor), at(1), 0, plan.storeyHeight - 0.15);
    });
  }
  floorPlate("Schematic flat roof — confirm roof design", plan.floors * plan.storeyHeight, "roof");
  return { parts, unmatched: openings.filter(opening => !opening.matched).length };
}
