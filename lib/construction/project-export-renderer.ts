import { plannedCostAt, projectCostSummary, proposeSchedule, stageInfo, workingDate, type ConstructionProject } from "./project";
import { visibleProjectParts } from "./project-visibility";

type Point = [number, number, number];
type Face = { id: string; a: Point; b: Point; c: Point; rgb: number[] };
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Point, b: Point): Point => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalise = (a: Point): Point => { const d = Math.hypot(...a) || 1; return a.map(n => n / d) as Point; };
const colour = (hex: string) => [1, 3, 5].map(n => parseInt(hex.slice(n, n + 2), 16));
export const exportMoney = (n: number) => `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const exportFilename = (name: string) => name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "Charismak_Project";

/** A depth-buffered, flat-colour export renderer. It also works without a GPU. */
export function createProjectExportRenderer(project: ConstructionProject, width: number, height: number) {
  const schedule = proposeSchedule(project);
  const vertices = project.parts.reduce((sum, part) => sum + part.positions.length / 3, 0);
  if (vertices > 180000) throw new Error("Export a lighter model (up to 180,000 vertices) for video and illustrated PDF export.");
  const points = project.parts.map(part => {
    const result: Point[] = [];
    for (let i = 0; i < part.positions.length; i += 3) {
      let [x, y, z] = part.positions.slice(i, i + 3);
      if (part.matrix) {
        const m = part.matrix, w = m[3] * x + m[7] * y + m[11] * z + m[15];
        const divisor = w || 1;
        [x, y, z] = [(m[0] * x + m[4] * y + m[8] * z + m[12]) / divisor, (m[1] * x + m[5] * y + m[9] * z + m[13]) / divisor, (m[2] * x + m[6] * y + m[10] * z + m[14]) / divisor];
      }
      result.push(project.upAxis === "z" ? [x * project.unitScale, z * project.unitScale, -y * project.unitScale] : [x * project.unitScale, y * project.unitScale, z * project.unitScale]);
    }
    return result;
  });
  const low: Point = [Infinity, Infinity, Infinity], high: Point = [-Infinity, -Infinity, -Infinity];
  points.forEach(group => group.forEach(p => p.forEach((v, n) => { low[n] = Math.min(low[n], v); high[n] = Math.max(high[n], v); })));
  if (!vertices) { low.fill(0); high.fill(1); }
  const centre = low.map((v, n) => (v + high[n]) / 2) as Point;
  const right = normalise([0.78, 0, -0.63]), forward = normalise([0.5, 0.62, 0.62]), up = normalise(cross(forward, right));
  const raw = (p: Point): Point => { const q = minus(p, centre); return [dot(q, right), -dot(q, up), dot(q, forward)]; };
  const projected = points.map(group => group.map(raw));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  projected.forEach(group => group.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }));
  if (!vertices) { minX = minY = 0; maxX = maxY = 1; }
  const zoom = Math.min(width * 0.86 / Math.max(1, maxX - minX), height * 0.8 / Math.max(1, maxY - minY));
  const screen = (p: Point): Point => [(p[0] - (minX + maxX) / 2) * zoom + width / 2, (p[1] - (minY + maxY) / 2) * zoom + height * 0.48, p[2]];
  const faces: Face[] = [], lines: { id: string; a: Point; b: Point; rgb: number[] }[] = [];
  project.parts.forEach((part, n) => {
    const rgb = colour(part.color ?? stageInfo(part.stage).color), p = projected[n].map(screen), world = points[n];
    if (part.line) { for (let j = 1; j < p.length; j++) lines.push({ id: part.id, a: p[j - 1], b: p[j], rgb }); return; }
    const indices = part.indices ?? Array.from({ length: p.length }, (_, i) => i);
    for (let j = 0; j + 2 < indices.length; j += 3) {
      const [a, b, c] = indices.slice(j, j + 3);
      const normal = normalise(cross(minus(world[b], world[a]), minus(world[c], world[a])));
      const light = 0.62 + 0.34 * Math.abs(dot(normal, normalise([-0.3, 0.85, 0.45])));
      faces.push({ id: part.id, a: p[a], b: p[b], c: p[c], rgb: rgb.map(v => Math.round(v * light)) });
    }
  });
  const datum = project.groundLevel === undefined ? low[1] - 0.08 : project.groundLevel * project.unitScale - 0.08;
  const ground = [[low[0] - 1.2, datum, low[2] - 1.2], [high[0] + 1.2, datum, low[2] - 1.2], [high[0] + 1.2, datum, high[2] + 1.2], [low[0] - 1.2, datum, high[2] + 1.2]].map(p => screen(raw(p as Point)));
  const pixels = new Uint8ClampedArray(width * height * 4), depth = new Float32Array(width * height);
  const triangle = ({ a, b, c, rgb }: Pick<Face, "a" | "b" | "c" | "rgb">) => {
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) < 0.01) return;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = ((b[0] - x - 0.5) * (c[1] - y - 0.5) - (b[1] - y - 0.5) * (c[0] - x - 0.5)) / area;
      const v = ((c[0] - x - 0.5) * (a[1] - y - 0.5) - (c[1] - y - 0.5) * (a[0] - x - 0.5)) / area;
      const w = 1 - u - v;
      if (u < -0.001 || v < -0.001 || w < -0.001) continue;
      const z = u * a[2] + v * b[2] + w * c[2], index = y * width + x;
      if (z <= depth[index]) continue;
      depth[index] = z; const offset = index * 4;
      pixels[offset] = rgb[0]; pixels[offset + 1] = rgb[1]; pixels[offset + 2] = rgb[2];
    }
  };
  return (day: number, section = false) => {
    depth.fill(-Infinity);
    for (let n = 0; n < pixels.length; n += 4) { pixels[n] = 225; pixels[n + 1] = 234; pixels[n + 2] = 241; pixels[n + 3] = 255; }
    const excavation = schedule.find(stage => stage.id === "earthworks"), slab = schedule.find(stage => stage.id === "slabs");
    if (!section && !(excavation && day >= excavation.start && day < (slab?.finish ?? excavation.finish))) {
      triangle({ a: ground[0], b: ground[1], c: ground[2], rgb: [70, 92, 111] }); triangle({ a: ground[0], b: ground[2], c: ground[3], rgb: [70, 92, 111] });
    }
    const visible = visibleProjectParts(project.parts, { day, schedule, section });
    for (const face of faces) if (visible.has(face.id)) triangle(face);
    for (const line of lines) if (visible.has(line.id)) {
      const steps = Math.ceil(Math.max(Math.abs(line.a[0] - line.b[0]), Math.abs(line.a[1] - line.b[1])));
      for (let n = 0; n <= steps; n++) {
        const t = steps ? n / steps : 0, x = Math.round(line.a[0] + (line.b[0] - line.a[0]) * t), y = Math.round(line.a[1] + (line.b[1] - line.a[1]) * t), z = line.a[2] + (line.b[2] - line.a[2]) * t;
        if (x < 0 || y < 0 || x >= width || y >= height || z + 0.04 < depth[y * width + x]) continue;
        const offset = (y * width + x) * 4; pixels.set([...line.rgb, 255], offset);
      }
    }
    return pixels;
  };
}

function wrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { ctx.fillText(line, x, y); y += lineHeight; line = word; }
    else line += (line ? " " : "") + word;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineHeight;
}

export function createVideoPresentation(project: ConstructionProject, ctx: CanvasRenderingContext2D) {
  const width = 900, height = 510, render = createProjectExportRenderer(project, width, height), image = ctx.createImageData(width, height);
  const schedule = proposeSchedule(project), end = Math.max(1, ...schedule.map(stage => stage.finish)), cost = projectCostSummary(project);
  const money = (value: number) => project.boq.length ? exportMoney(value) : "BOQ not supplied";
  return (progress: number) => {
    const intro = progress < 0.05, complete = progress >= 0.87, inside = progress >= 0.87 && progress < 0.94;
    const day = intro || complete ? end : Math.min(end, (progress - 0.05) / 0.82 * end);
    const active = schedule.filter(stage => day >= stage.start && day < stage.finish);
    ctx.fillStyle = "#0d2332"; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#dfbd78"; ctx.font = "bold 18px sans-serif"; ctx.fillText("CHARISMAK  /  CONSTRUCTION STUDIO", 30, 37);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px sans-serif";
    const title = project.name.length > 67 ? project.name.slice(0, 64) + "…" : project.name; ctx.fillText(title, 30, 81);
    ctx.font = "16px sans-serif"; ctx.fillStyle = "#b2c9d7"; ctx.fillText("Proposed construction sequence · quantities, rates and programme", 30, 110);
    image.data.set(render(day, inside)); ctx.putImageData(image, 20, 135);
    const x = 945;
    ctx.fillStyle = "#dfbd78"; ctx.font = "bold 14px sans-serif"; ctx.fillText(intro ? "THE PROJECT" : complete ? "COMPLETED PROJECT" : `WORKING DAY ${Math.min(end, Math.floor(day) + 1)} / ${end}`, x, 160);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px sans-serif";
    wrappedText(ctx, intro ? "From setting out to handover" : complete ? inside ? "See inside" : "Ready for handover" : active.map(stage => stage.title).join(" + ") || "Between stages", x, 204, 305, 34);
    ctx.fillStyle = "#b2c9d7"; ctx.font = "16px sans-serif"; ctx.fillText(workingDate(project.start, Math.min(Math.floor(day), end - 1), project.workingDays), x, 323);
    ctx.fillStyle = "#b2c9d7"; ctx.font = "14px sans-serif"; ctx.fillText(intro ? "PROJECT TOTAL WITH ALLOWANCES" : "PLANNED COST TO THIS POINT", x, 377);
    ctx.fillStyle = "#dfbd78"; ctx.font = "bold 25px sans-serif"; ctx.fillText(money(intro || complete ? cost.total : projectCostSummary(project, plannedCostAt(schedule, day)).total), x, 412);
    ctx.fillStyle = "#b2c9d7"; ctx.font = "14px sans-serif"; ctx.fillText("PRICED WORKS", x, 464); ctx.fillStyle = "#ffffff"; ctx.font = "20px sans-serif"; ctx.fillText(money(cost.works), x, 494);
    ctx.fillStyle = "#b2c9d7"; ctx.font = "14px sans-serif";
    wrappedText(ctx, `${project.boq.filter(line => !line.excluded && line.quantity > 0 && line.rate === null).length} unpriced items excluded. Proposed dates and cost allocation need project review.`, x, 543, 305, 22);
    ctx.fillStyle = "#304b5e"; ctx.fillRect(30, 666, 1220, 7); ctx.fillStyle = "#dfbd78"; ctx.fillRect(30, 666, 1220 * (intro ? 0 : Math.min(1, (progress - 0.05) / 0.82)), 7);
    ctx.fillStyle = "#b2c9d7"; ctx.font = "13px sans-serif"; ctx.fillText("charismakproject.com  ·  Planning illustration; not a construction method statement or expenditure report.", 30, 702);
  };
}
