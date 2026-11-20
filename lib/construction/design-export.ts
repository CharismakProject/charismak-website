"use client";

import { jsPDF } from "jspdf";

/**
 * Charismak-branded downloads for the Design Studio: a 3D image, the floor plan, a PDF report and a
 * construction video. Everything is made in the visitor's browser; nothing is uploaded.
 */

export type ExportInfo = {
  product?: string; // "Design Studio" (default) or "Construction Explorer"
  title: string; // e.g. "2-bed bungalow"
  size: string; // e.g. "11.0 × 6.0 m · 1 floor"
  summary: string;
  floorArea: number;
  total: number;
  location: string;
  groups: [string, number][];
  rooms: { name: string; area: number }[];
};
export type StageFrame = { image: Blob; title: string; note: string; spent: number };

// Charismak brand: logo navy and maroon on white, with the website's gold as the accent.
const NAVY = "#0D3352";
const MAROON = "#6A1400";
const GOLD = "#C8A45D";
const GOLD_SOFT = "#E8C77F";
const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const plain = (text: string) => text.replace(/₦/g, "NGN ").replace(/²/g, "2").replace(/[–—→]/g, " - ").replace(/[×]/g, "x").replace(/[‘’]/g, "'").replace(/[^\x20-\x7e\n]/g, " ");

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});
const blobImage = async (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  try { return await loadImage(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
};
let logoPromise: Promise<HTMLImageElement | null> | null = null;
/** The full Charismak logo (mark + "Charismak Project Nigeria Limited · Design, Cost & Build"), on white. */
const logo = () => (logoPromise ??= loadImage("/branding/charismak-logo-wide.jpg").catch(() => null));

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export const fileName = (title: string, ext: string) => `charismak-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;

const toBlob = (canvas: HTMLCanvasElement, type = "image/png", quality?: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas"))), type, quality));

/** White header with the Charismak logo, a maroon rule, and a navy footer with the design's key numbers. */
async function brand(ctx: CanvasRenderingContext2D, w: number, h: number, info: ExportInfo, caption?: { title: string; note: string; spent?: number }) {
  const head = Math.round(Math.min(h * 0.11, w * 0.085));
  const foot = Math.round(head * 0.9);
  const pad = Math.round(head * 0.18);
  ctx.textBaseline = "middle";
  // Header
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, head);
  const mark = await logo();
  if (mark) {
    const lh = head - pad * 1.4;
    ctx.drawImage(mark, pad, (head - lh) / 2, (lh * mark.naturalWidth) / mark.naturalHeight, lh);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = `700 ${Math.round(head * 0.34)}px Arial, sans-serif`;
    ctx.fillText("CHARISMAK PROJECT NIGERIA LIMITED", pad, head / 2);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = NAVY;
  ctx.font = `700 ${Math.round(head * 0.2)}px Arial, sans-serif`;
  ctx.fillText(caption ? "CONSTRUCTION SEQUENCE" : (info.product ?? "Design Studio").toUpperCase(), w - pad, head / 2 - head * 0.13);
  ctx.fillStyle = MAROON;
  ctx.font = `400 ${Math.round(head * 0.17)}px Arial, sans-serif`;
  ctx.fillText("charismakproject.com", w - pad, head / 2 + head * 0.15);
  ctx.textAlign = "left";
  ctx.fillStyle = MAROON;
  ctx.fillRect(0, head, w, Math.max(3, Math.round(head * 0.05)));
  // Footer
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, h - foot, w, foot);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, h - foot, w, Math.max(2, Math.round(foot * 0.04)));
  const priceText = caption?.spent !== undefined ? `${money(caption.spent)} spent` : money(info.total);
  ctx.font = `700 ${Math.round(foot * 0.36)}px Arial, sans-serif`;
  const priceW = ctx.measureText(priceText).width;
  const room = w - priceW - pad * 3;
  const fit = (text: string, weight: number, size: number) => {
    let s = size;
    do { ctx.font = `${weight} ${s}px Arial, sans-serif`; s -= 1; } while (s > 8 && ctx.measureText(text).width > room);
  };
  const title = caption ? caption.title : `${info.title} · ${info.size}`;
  const sub = caption ? caption.note : `${info.floorArea ? `${info.floorArea} m² of floor · ` : ""}prices for ${info.location} · indicative design and budget`;
  ctx.fillStyle = "#ffffff";
  fit(title, 700, Math.round(foot * 0.3));
  ctx.fillText(title, pad, h - foot / 2 - foot * 0.15);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  fit(sub, 400, Math.round(foot * 0.2));
  ctx.fillText(sub, pad, h - foot / 2 + foot * 0.22);
  ctx.textAlign = "right";
  ctx.fillStyle = GOLD_SOFT;
  ctx.font = `700 ${Math.round(foot * 0.36)}px Arial, sans-serif`;
  ctx.fillText(priceText, w - pad, h - foot / 2);
  ctx.textAlign = "left";
}

/** Photographs a plain WebGL/WebGPU canvas: read inside an animation frame, after the scene has drawn. */
export function captureCanvas(canvas: HTMLCanvasElement | null | undefined) {
  return new Promise<Blob | null>((resolve) => {
    if (!canvas) return resolve(null);
    requestAnimationFrame(() => {
      try { canvas.toBlob((blob) => resolve(blob), "image/png"); } catch { resolve(null); }
    });
  });
}

/** True when a captured frame is (nearly) one flat colour — the 3D view had not finished drawing. */
export async function isBlankFrame(blob: Blob) {
  try {
    const image = await blobImage(blob);
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 20;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, 32, 20);
    const data = ctx.getImageData(0, 0, 32, 20).data;
    let sum = 0, sq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) { const l = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; sum += l; sq += l * l; }
    const mean = sum / n;
    return Math.sqrt(Math.max(0, sq / n - mean * mean)) < 6;
  } catch {
    return true;
  }
}

export async function brandedImage(shot: Blob, info: ExportInfo) {
  const image = await blobImage(shot);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);
  await brand(ctx, canvas.width, canvas.height, info);
  return toBlob(canvas);
}

/** The plan SVG on screen, rasterised to PNG (white background, ~2400 px wide). */
export async function planPng(svg: SVGSVGElement, width = 2400) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const [, , vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);
  const height = Math.round((width * vh) / vw);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return toBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const dataUrl = (blob: Blob) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob); });
const sizeOf = async (blob: Blob) => { const image = await blobImage(blob); return { w: image.naturalWidth, h: image.naturalHeight }; };

/** A4 landscape report: cover with the 3D view and key figures, floor plans, cost summary, construction stages. */
export async function buildPdf(info: ExportInfo, hero: Blob | null, plans: Blob[], stages: StageFrame[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const mark = await logo();
  const header = (title: string) => {
    if (mark) doc.addImage(mark, "JPEG", 10, 6, 45, 15.1);
    else { doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(NAVY); doc.text("CHARISMAK PROJECT NIGERIA LIMITED", 10, 15); }
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(NAVY);
    doc.text(plain(title), 287, 13, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(MAROON);
    doc.text(`${info.product ?? "Design Studio"}  |  charismakproject.com`, 287, 19, { align: "right" });
    doc.setFillColor(NAVY); doc.rect(10, 23.5, 277, 0.9, "F");
    doc.setFillColor(MAROON); doc.rect(10, 24.6, 277, 0.4, "F");
    // Footer
    doc.setFillColor(NAVY); doc.rect(0, 201, 297, 9, "F");
    doc.setTextColor("#ffffff"); doc.setFontSize(7.5);
    doc.text("Charismak Project Nigeria Limited  -  Design, Cost & Build  -  Abuja, Nigeria", 10, 206.5);
    doc.setTextColor(GOLD_SOFT);
    doc.text(plain("Indicative design and early budget from Charismak Rate Bank rates. Not a quotation."), 287, 206.5, { align: "right" });
  };
  const fit = async (blob: Blob, x: number, y: number, w: number, h: number) => {
    const s = await sizeOf(blob);
    const k = Math.min(w / s.w, h / s.h);
    doc.addImage(await dataUrl(blob), "PNG", x + (w - s.w * k) / 2, y + (h - s.h * k) / 2, s.w * k, s.h * k);
  };

  header(`${info.title} - design and budget`);
  if (hero) { doc.setDrawColor("#d6dce5"); doc.rect(10, 30, 180, 112); await fit(hero, 10.3, 30.3, 179.4, 111.4); }
  doc.setTextColor(NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(plain(info.title), 198, 37);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(doc.splitTextToSize(plain(`${info.size}${info.floorArea ? ` · ${info.floorArea} m2 of floor` : ""} · prices for ${info.location}`), 89), 198, 43);
  doc.setFontSize(9); doc.setTextColor("#374151");
  doc.text(doc.splitTextToSize(plain(info.summary), 89), 198, 56);
  doc.setFillColor(NAVY); doc.rect(198, 84, 89, 26, "F"); doc.setFillColor(GOLD); doc.rect(198, 84, 1.6, 26, "F");
  doc.setTextColor(GOLD_SOFT); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("ESTIMATED BUILDING COST", 202, 91);
  doc.setTextColor("#ffffff"); doc.setFontSize(18); doc.text(plain(money(info.total)), 202, 102);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); if (info.floorArea) doc.text(plain(`about ${money(info.total / info.floorArea)} per m2`), 202, 107);
  let y = 118;
  if (info.rooms.length) { doc.setTextColor(MAROON); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("ROOMS", 198, y); } y += 5; doc.setTextColor(NAVY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  for (const room of info.rooms.slice(0, 16)) { doc.text(plain(room.name), 198, y); doc.text(`${room.area.toFixed(1)} m2`, 287, y, { align: "right" }); y += 4.2; }
  y = 152;
  // Long stage lists (the Construction Explorer models) get their own page.
  if (info.groups.length > 7) { doc.addPage(); header(`${info.title} - cost by stage`); y = 36; }
  doc.setTextColor(MAROON); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(info.groups.length > 7 ? "COST BY STAGE" : "COST SUMMARY", 10, y); y += 6; doc.setTextColor(NAVY);
  doc.setFont("helvetica", "normal");
  for (const [group, amount] of info.groups.slice(0, 30)) { doc.text(plain(group).slice(0, 70), 10, y); doc.text(plain(money(amount)), info.groups.length > 7 ? 200 : 120, y, { align: "right" }); y += 5; }
  const right = info.groups.length > 7 ? 200 : 120;
  doc.setDrawColor(NAVY); doc.line(10, y - 2.5, right, y - 2.5); doc.setFont("helvetica", "bold"); doc.text("Total", 10, y + 1); doc.text(plain(money(info.total)), right, y + 1, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#6b7280");
  if (!info.product || info.product === "Design Studio") doc.text(doc.splitTextToSize("Includes foundations and roof carcass (estimated), floors, walls, plaster, paint, roof covering, ceilings, and doors/windows (supply as provisional allowances). Excludes reinforcement design, electrical, plumbing, sanitary fittings, external works, preliminaries, contractor margin and VAT.", 180), 10, y + 8);

  for (const [i, plan] of plans.entries()) {
    doc.addPage();
    header(`${info.title} - ${plans.length > 1 ? (i === 0 ? "ground floor plan" : "first floor plan") : "floor plan"}`);
    await fit(plan, 10, 28, 277, 170);
  }

  if (stages.length) {
    const cols = 4, w = 66, h = 41;
    for (const [i, stage] of stages.entries()) {
      if (i % 8 === 0) { doc.addPage(); header(`${info.title} - construction sequence${stages.length > 8 ? ` (${Math.floor(i / 8) + 1}/${Math.ceil(stages.length / 8)})` : ""}`); }
      const k = i % 8;
      const x = 10 + (k % cols) * (w + 4.3), top = 30 + Math.floor(k / cols) * (h + 42);
      await fit(stage.image, x, top, w, h);
      doc.setTextColor(NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(doc.splitTextToSize(plain(`${i + 1}. ${stage.title}`), w), x, top + h + 5);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#374151");
      doc.text(doc.splitTextToSize(plain(stage.note), w).slice(0, 4), x, top + h + 13);
      doc.setTextColor(MAROON); doc.text(plain(`${money(stage.spent)} spent`), x, top + h + 31);
    }
  }
  return doc.output("blob");
}

/** A short branded film of the build: each stage held ~2.4 s with a cross-fade. WebM, or MP4 where the browser records it. */
export async function buildVideo(info: ExportInfo, frames: StageFrame[], width = 1280, height = 800) {
  if (typeof MediaRecorder === "undefined" || !frames.length) throw new Error("This browser cannot record video.");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const images = await Promise.all(frames.map((frame) => blobImage(frame.image)));
  const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const done = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: type.split(";")[0] })); });
  const cover = (image: HTMLImageElement, alpha: number) => {
    const k = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, (width - image.naturalWidth * k) / 2, (height - image.naturalHeight * k) / 2, image.naturalWidth * k, image.naturalHeight * k);
    ctx.globalAlpha = 1;
  };
  const hold = 2400, fade = 500;
  recorder.start(250);
  const start = performance.now();
  const total = frames.length * hold + 1200;
  await new Promise<void>((resolve) => {
    const tick = async () => {
      const t = performance.now() - start;
      const i = Math.min(frames.length - 1, Math.floor(t / hold));
      const into = t - i * hold;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      if (i > 0 && into < fade) cover(images[i - 1], 1);
      cover(images[i], i > 0 && into < fade ? into / fade : 1);
      await brand(ctx, width, height, info, { title: `Stage ${i + 1} of ${frames.length}: ${frames[i].title}`, note: frames[i].note, spent: frames[i].spent });
      if (t < total) requestAnimationFrame(() => void tick());
      else resolve();
    };
    void tick();
  });
  recorder.stop();
  return { blob: await done, ext: type.startsWith("video/mp4") ? "mp4" : "webm" };
}
