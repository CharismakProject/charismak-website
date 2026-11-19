"use client";

import { jsPDF } from "jspdf";

/**
 * Charismak-branded downloads for the Design Studio: a 3D image, the floor plan, a PDF report and a
 * construction video. Everything is made in the visitor's browser; nothing is uploaded.
 */

export type ExportInfo = {
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

const GOLD = "#F2C879";
const NAVY = "#02080F";
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
const logo = () => (logoPromise ??= loadImage("/branding/charismak-logo.png").catch(() => null));

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

/** Header and footer bands with the Charismak name, logo and the design's key numbers. */
async function brand(ctx: CanvasRenderingContext2D, w: number, h: number, info: ExportInfo, caption?: { title: string; note: string; spent?: number }) {
  const band = Math.round(Math.min(h * 0.085, w * 0.075));
  ctx.fillStyle = "rgba(2,8,15,0.92)";
  ctx.fillRect(0, 0, w, band);
  ctx.fillRect(0, h - band, w, band);
  const mark = await logo();
  const pad = Math.round(band * 0.22);
  let x = pad;
  if (mark) { const s = band - pad * 2; ctx.drawImage(mark, x, pad, s, s); x += s + pad; }
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "middle";
  // Shrink the name until it fits beside the web address.
  let size = Math.round(band * 0.36);
  ctx.font = `400 ${Math.round(band * 0.28)}px Arial, sans-serif`;
  const urlWidth = ctx.measureText("charismakproject.com").width;
  do { ctx.font = `700 ${size}px Arial, sans-serif`; size -= 1; } while (size > 8 && ctx.measureText("CHARISMAK PROJECT NIGERIA LIMITED").width > w - x - urlWidth - pad * 3);
  ctx.fillText("CHARISMAK PROJECT NIGERIA LIMITED", x, band / 2);
  ctx.fillStyle = "#fff";
  ctx.font = `400 ${Math.round(band * 0.28)}px Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("charismakproject.com", w - pad, band / 2);
  ctx.textAlign = "left";
  ctx.font = `700 ${Math.round(band * 0.3)}px Arial, sans-serif`;
  ctx.fillText(caption ? caption.title : `${info.title} · ${info.size}`, pad, h - band / 2 - band * 0.14);
  ctx.font = `400 ${Math.round(band * 0.22)}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(caption ? caption.note.slice(0, 120) : `${info.floorArea} m² · ${info.location} · indicative design and budget`, pad, h - band / 2 + band * 0.22);
  ctx.textAlign = "right";
  ctx.fillStyle = GOLD;
  ctx.font = `700 ${Math.round(band * 0.34)}px Arial, sans-serif`;
  ctx.fillText(caption?.spent !== undefined ? `${money(caption.spent)} spent` : money(info.total), w - pad, h - band / 2);
  ctx.textAlign = "left";
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
    doc.setFillColor(NAVY);
    doc.rect(0, 0, 297, 22, "F");
    if (mark) doc.addImage(mark, "PNG", 10, 4, 14, 14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(GOLD);
    doc.text("CHARISMAK PROJECT NIGERIA LIMITED", 28, 10);
    doc.setFontSize(10); doc.setTextColor("#ffffff"); doc.text(plain(title), 28, 17);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("charismakproject.com", 287, 13, { align: "right" });
    doc.setTextColor("#6b7280"); doc.setFontSize(7);
    doc.text(plain("Indicative design and early budget from Charismak Rate Bank rates. Not a quotation; verify on site and with drawings."), 10, 204);
  };
  const fit = async (blob: Blob, x: number, y: number, w: number, h: number) => {
    const s = await sizeOf(blob);
    const k = Math.min(w / s.w, h / s.h);
    doc.addImage(await dataUrl(blob), "PNG", x + (w - s.w * k) / 2, y + (h - s.h * k) / 2, s.w * k, s.h * k);
  };

  header(`${info.title} - design and budget`);
  if (hero) await fit(hero, 10, 28, 180, 112);
  doc.setTextColor("#0f172a"); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(plain(info.title), 198, 36);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(doc.splitTextToSize(plain(`${info.size} · ${info.floorArea} m2 of floor · prices for ${info.location}`), 89), 198, 43);
  doc.setFontSize(9); doc.setTextColor("#374151");
  doc.text(doc.splitTextToSize(plain(info.summary), 89), 198, 56);
  doc.setFillColor("#f8f1e1"); doc.rect(198, 84, 89, 26, "F");
  doc.setTextColor("#7c5a16"); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("ESTIMATED BUILDING COST", 202, 91);
  doc.setTextColor("#0f172a"); doc.setFontSize(18); doc.text(plain(money(info.total)), 202, 102);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(plain(`about ${money(info.total / Math.max(1, info.floorArea))} per m2`), 202, 107);
  let y = 118;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("ROOMS", 198, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  for (const room of info.rooms.slice(0, 16)) { doc.text(plain(room.name), 198, y); doc.text(`${room.area.toFixed(1)} m2`, 287, y, { align: "right" }); y += 4.2; }
  y = 148;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("COST SUMMARY", 10, y); y += 6;
  doc.setFont("helvetica", "normal");
  for (const [group, amount] of info.groups) { doc.text(plain(group), 10, y); doc.text(plain(money(amount)), 120, y, { align: "right" }); y += 5; }
  doc.setFont("helvetica", "bold"); doc.text("Total", 10, y + 1); doc.text(plain(money(info.total)), 120, y + 1, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#6b7280");
  doc.text(doc.splitTextToSize("Includes foundations (estimated), floors, walls, plaster, paint, roof, ceilings and fixing doors/windows. Excludes reinforcement design, electrical, plumbing, supply of doors/windows/fittings, external works, preliminaries, contractor margin and VAT.", 180), 10, y + 8);

  for (const [i, plan] of plans.entries()) {
    doc.addPage();
    header(`${info.title} - ${plans.length > 1 ? (i === 0 ? "ground floor plan" : "first floor plan") : "floor plan"}`);
    await fit(plan, 10, 26, 277, 172);
  }

  if (stages.length) {
    doc.addPage();
    header(`${info.title} - construction sequence`);
    const cols = 4, w = 66, h = 41;
    for (const [i, stage] of stages.entries()) {
      const x = 10 + (i % cols) * (w + 4.3), top = 28 + Math.floor(i / cols) * (h + 46);
      await fit(stage.image, x, top, w, h);
      doc.setTextColor("#0f172a"); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      doc.text(doc.splitTextToSize(plain(`${i + 1}. ${stage.title}`), w), x, top + h + 5);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#374151");
      doc.text(doc.splitTextToSize(plain(stage.note), w).slice(0, 4), x, top + h + 13);
      doc.setTextColor("#7c5a16"); doc.text(plain(`${money(stage.spent)} spent`), x, top + h + 31);
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
      ctx.fillStyle = NAVY;
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
