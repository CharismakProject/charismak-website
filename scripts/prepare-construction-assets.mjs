import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const out = resolve("public/construction-assets");
await mkdir(out, { recursive: true });
for (const [source, name] of [["web-ifc/web-ifc.wasm", "web-ifc.wasm"], ["web-ifc/web-ifc-api-iife.js", "web-ifc-api.js"], ["web-ifc/LICENSE.md", "web-ifc-license.md"], ["pdfjs-dist/build/pdf.worker.mjs", "pdf.worker.mjs"], ["pdfjs-dist/LICENSE", "pdfjs-license.txt"]]) await copyFile(resolve("node_modules", source), resolve(out, name));
console.log("Prepared local IFC and PDF import assets.");
