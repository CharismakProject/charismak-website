import assert from "node:assert/strict";
import { BoxGeometry } from "three";
import { emptyProject, proposeSchedule, type ModelPart } from "../lib/construction/project";
import { createProjectExportRenderer } from "../lib/construction/project-export-renderer";
import { buildProjectPdf } from "../lib/construction/project-pdf";

async function verify() {
  const box = new BoxGeometry(1, 1, 1);
  const part = (id: string, stage: ModelPart["stage"], color: string, x: number): ModelPart => {
    const geometry = box.clone().translate(x, 0.5, 0);
    return { id, name: id, stage, color, positions: Array.from(geometry.getAttribute("position").array), indices: Array.from(geometry.index!.array) };
  };
  const project = { ...emptyProject(), name: "Export verification", start: "2026-11-16", parts: [part("temporary-peg", "setting-out", "#ff0000", -2), part("slab", "slabs", "#00aa44", 0)], boq: [{ id: "B1", code: "B1", description: "Test floor slab", section: "Floors", quantity: 5, unit: "m3", rate: 100, originalAmount: 500, stage: "slabs" as const, output: 1, crews: 1, duration: 3, partIds: ["slab"], notes: [] }], charges: [{ id: "p", label: "Preliminaries", percentage: .1, basis: "works" as const }] };
  const schedule = proposeSchedule(project), end = Math.max(...schedule.map(stage => stage.finish));
  const render = createProjectExportRenderer(project, 320, 180);
  const red = (pixels: Uint8ClampedArray) => { let count = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 100 && pixels[i + 1] < 10 && pixels[i + 2] < 10) count++; return count; };
  assert.ok(red(render(schedule.find(stage => stage.id === "setting-out")!.finish)) > 0, "Export shows pegs at setting out");
  assert.equal(red(render(end)), 0, "Export removes pegs from the finished project");
  assert.ok(red(render(schedule.find(stage => stage.id === "setting-out")!.finish)) > 0, "Export can rewind temporary works");
  const data = render(end); assert.equal(data.length, 320 * 180 * 4); assert.ok(data.every((v, i) => i % 4 !== 3 || v === 255), "Export has opaque pixels");
  const snapshot = structuredClone(project); snapshot.boq[0].quantity = 8;
  const pdf = buildProjectPdf(snapshot, [], true);
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(pdf.output("arraybuffer")), useSystemFonts: true });
  const document = await task.promise;
  let text = "";
  for (let n = 1; n <= document.numPages; n++) { const page = await document.getPage(n); text += (await page.getTextContent()).items.map(item => "str" in item ? item.str : "").join(" "); }
  assert.ok(text.includes("NGN 880.00"), "PDF uses edited quantities and recalculates project allowances");
  assert.ok(text.includes("Test floor slab"), "PDF includes the current BOQ");
  assert.ok(text.includes("2026-11-16"), "PDF includes the proposed dates");
  assert.ok(text.includes("Temporary setting-out"), "PDF explains temporary works removal");
  await task.destroy(); box.dispose();
  console.log("Construction exports verified: temporary-work lifecycle, raster output, edited BOQ totals, allowances, dates and readable PDF content.");
}
void verify().catch(error => { console.error(error); process.exitCode = 1; });
