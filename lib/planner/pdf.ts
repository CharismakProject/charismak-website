"use client";

import { jsPDF } from "jspdf";

import type { ScheduleLine } from "./model";
import type { SpecRow } from "./spec";

const NAVY: [number, number, number] = [13, 51, 82];
const RED: [number, number, number] = [138, 26, 16];
const GREY: [number, number, number] = [90, 102, 117];
const INK: [number, number, number] = [27, 36, 51];

export const naira = (n: number) => `NGN ${Math.round(n).toLocaleString("en-NG")}`;

async function dataUrl(src: string): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    return await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => resolve(null); r.readAsDataURL(blob); });
  } catch { return null; }
}
const blobUrl = (blob: Blob) => new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(blob); });

export type SheetImage = { title: string; png: Blob; ratio: number };
export type RoomRow = { name: string; size: string; area: number };
export type DrawingSet = {
  title: string; project: string; location: string; revision: string; preparedBy: string; date: string;
  spaceLine: string;
  cover: Blob | null;
  layout: SheetImage; plan: SheetImage;
  elevations: SheetImage[]; sections: SheetImage[];
  views: { name: string; blob: Blob }[];
  spec: SpecRow[]; services: string[]; keySizes: string[]; notes: string;
  rooms: RoomRow[]; cost: { lines: ScheduleLine[]; total: number; unpriced: number };
};

/**
 * A drawing set in the style of a contractor's design proposal (A4 landscape): a cover with contents and a 3D
 * view, then one drawing per sheet with a header and a title block (project, drawing, drawing number, revision,
 * date, scale), ending with the specification schedule and the cost schedule.
 */
export async function buildDrawingSet(d: DrawingSet): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = 297, H = 210, M = 12;
  const logo = await dataUrl("/branding/charismak-logo-wide.jpg");
  const subtitle = [d.project, d.location].filter(Boolean).join(", ") || d.title;

  // Contents (sheet numbers start at 2 after the cover).
  type Sheet = { title: string; draw: (top: number, bottom: number) => Promise<void> | void; scale?: string };
  const sheets: Sheet[] = [];
  const fit = async (img: SheetImage | { png: Blob; ratio: number }, top: number, bottom: number, x = M, w = W - 2 * M) => {
    let iw = w, ih = iw / img.ratio;
    if (ih > bottom - top) { ih = bottom - top; iw = ih * img.ratio; }
    doc.addImage(await blobUrl(img.png), "PNG", x + (w - iw) / 2, top + (bottom - top - ih) / 2, iw, ih);
  };
  sheets.push({ title: "Layout plan", draw: (t, b) => fit(d.layout, t, b) });
  sheets.push({ title: "Floor plan, dimensioned", draw: (t, b) => fit(d.plan, t, b) });
  for (const e of d.elevations) sheets.push({ title: e.title, draw: (t, b) => fit(e, t, b) });
  for (const s of d.sections) sheets.push({ title: s.title, draw: (t, b) => fit(s, t, b) });
  for (let i = 0; i < d.views.length; i += 2) {
    const pair = d.views.slice(i, i + 2);
    sheets.push({ title: `3D views ${i + 1}${pair[1] ? ` and ${i + 2}` : ""}`, scale: "—", draw: async (t, b) => {
      const bw = (W - 2 * M - 8) / 2;
      for (let k = 0; k < pair.length; k++) {
        const x = M + k * (bw + 8), ih = Math.min(b - t - 10, bw / 1.6), y = t + (b - t - 10 - ih) / 2;
        doc.addImage(await blobUrl(pair[k].blob), "PNG", x, y, ih * 1.6, ih);
        doc.setDrawColor(221, 225, 231); doc.rect(x, y, ih * 1.6, ih);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...NAVY); doc.text(pair[k].name, x, y + ih + 5);
      }
    } });
  }
  sheets.push({ title: "Schedule of items and services", scale: "—", draw: (t, b) => {
    const colX = [M, M + 38, M + 72], specW = 112, right = M + 190;
    let y = t + 2;
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...RED);
    ["Item", "Size", "Specification"].forEach((h, i) => doc.text(h, colX[i], y));
    doc.setDrawColor(...NAVY); doc.line(M, y + 1.5, M + 72 + specW, y + 1.5); y += 6;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
    for (const r of d.spec) {
      const lines = doc.splitTextToSize(r.spec, specW) as string[], nameL = doc.splitTextToSize(`${r.name}${r.qty > 1 ? ` (×${r.qty})` : ""}`, 36) as string[];
      const rowH = Math.max(lines.length, nameL.length) * 3.6 + 2;
      if (y + rowH > b) break;
      doc.setFont("helvetica", "bold"); doc.text(nameL, colX[0], y); doc.setFont("helvetica", "normal");
      doc.text(r.size, colX[1], y); doc.text(lines, colX[2], y);
      y += rowH; doc.setDrawColor(221, 225, 231); doc.line(M, y - 2.2, M + 72 + specW, y - 2.2);
    }
    let ry = t + 2;
    const block = (title: string, items: string[]) => {
      if (!items.length) return;
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...NAVY); doc.text(title, right, ry); ry += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...INK);
      for (const it of items) { const ls = doc.splitTextToSize(it, W - M - right - 4) as string[]; if (ry + ls.length * 3.6 > b) return; doc.text("•", right, ry); doc.text(ls, right + 3, ry); ry += ls.length * 3.6 + 1.2; }
      ry += 3;
    };
    block("Services provision", d.services); block("Key sizes", d.keySizes); if (d.notes) block("Notes", [d.notes]);
  } });
  sheets.push({ title: "Rooms and cost schedule", scale: "—", draw: (t, b) => {
    let y = t + 2;
    const cols = [M, M + 100, M + 165, M + 185, M + 230];
    const head = (titles: string[], at: number[]) => { doc.setFillColor(...NAVY); doc.rect(M, y - 4.5, W - 2 * M, 7, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); titles.forEach((h, i) => doc.text(h, at[i] + 2, y)); y += 7; doc.setFont("helvetica", "normal"); doc.setTextColor(...INK); };
    if (d.rooms.length) {
      head(["Room", "Overall size (mm)", "", "", "Floor area"], cols);
      for (const r of d.rooms) { doc.text(r.name, cols[0] + 2, y); doc.text(r.size, cols[1] + 2, y); doc.text(`${r.area.toFixed(1)} m²`, cols[4] + 2, y); y += 6; }
      doc.setFont("helvetica", "bold"); doc.text("Total floor area", cols[1] + 2, y); doc.text(`${d.rooms.reduce((s, r) => s + r.area, 0).toFixed(1)} m²`, cols[4] + 2, y); y += 9;
    }
    head(["Item", "Size (mm)", "Qty", "Unit price", "Total"], cols);
    for (const l of d.cost.lines) {
      if (y > b - 14) break;
      doc.text(l.name, cols[0] + 2, y); doc.text(l.size, cols[1] + 2, y); doc.text(String(l.qty), cols[2] + 2, y);
      doc.text(l.unitPrice === null ? "—" : `${naira(l.unitPrice)}${l.source === "market" ? " *" : ""}`, cols[3] + 2, y);
      doc.text(l.total === null ? "not priced" : naira(l.total), cols[4] + 2, y); y += 5.6;
    }
    doc.setDrawColor(...NAVY); doc.line(M, y - 3, W - M, y - 3);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("Estimated total", cols[3] + 2, y + 2); doc.text(naira(d.cost.total), cols[4] + 2, y + 2);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...GREY);
    doc.text(["* Market price from the Charismak price list (Abuja); other prices entered by the user.", "Supply prices only; installation, delivery and taxes are not included. Verify prices before purchase."], M, Math.min(b, y + 9));
  } });

  // ---------- Cover ----------
  if (logo) doc.addImage(logo, "JPEG", M + 4, 16, 72, 20);
  doc.setFillColor(...RED); doc.rect(M + 4, 46, 18, 1.6, "F");
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(24);
  doc.text(doc.splitTextToSize(d.title, 118) as string[], M + 4, 60);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...GREY); doc.text(subtitle, M + 4, 82);
  let cy = 94;
  for (const [k, v] of [["Space", d.spaceLine], ["Revision", d.revision || "—"], ["Date", d.date], ["Prepared by", d.preparedBy || "—"]] as const) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...RED); doc.text(k, M + 4, cy);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(v, 78) as string[], M + 44, cy);
    doc.setDrawColor(221, 225, 231); doc.line(M + 4, cy + 2.5, M + 124, cy + 2.5); cy += 8;
  }
  cy += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("Contents", M + 4, cy); cy += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...INK);
  sheets.forEach((s, i) => { if (cy < H - 22) { doc.text(`${i + 1}. ${s.title}`, M + 6, cy); cy += 4.4; } });
  doc.setFontSize(7.5); doc.setTextColor(...GREY);
  doc.text("Prepared with the Charismak Space Planner · charismakproject.com", M + 4, H - 12);
  if (d.cover) { const iw = W - 140; doc.addImage(await blobUrl(d.cover), "PNG", 140, 0, iw, H); } else { doc.setFillColor(238, 241, 245); doc.rect(140, 0, W - 140, H, "F"); }

  // ---------- Sheets ----------
  for (let i = 0; i < sheets.length; i++) {
    const s = sheets[i], no = i + 2;
    doc.addPage();
    if (logo) doc.addImage(logo, "JPEG", M, 7, 40, 11);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...NAVY); doc.text(s.title, M + 50, 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...GREY); doc.text(`${d.title}${subtitle && subtitle !== d.title ? ` · ${subtitle}` : ""}`, M + 50, 18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...RED); doc.text(String(no), W - M, 15, { align: "right" });
    doc.setFillColor(...NAVY); doc.rect(M, 22, W - 2 * M, 0.9, "F");
    // Title block
    const tb = H - 26, cells: [string, string, number][] = [["Project", d.project || d.title, 0], ["Drawing", s.title, 70], ["Drawing no.", `SP-${String(no - 1).padStart(2, "0")}`, 150], ["Rev", d.revision || "—", 190], ["Date", d.date, 212], ["Scale", s.scale ?? "NTS", 250]];
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.rect(M, tb, W - 2 * M, 16);
    doc.line(M, tb + 10, W - M, tb + 10);
    for (const [k, v, x] of cells) {
      if (x) doc.line(M + x, tb, M + x, tb + 10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...RED); doc.text(k, M + x + 2, tb + 3.5);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...INK); doc.text((doc.splitTextToSize(v, (k === "Drawing" ? 78 : k === "Project" ? 66 : 36)) as string[])[0], M + x + 2, tb + 7.5);
    }
    doc.setFontSize(6.5); doc.setTextColor(...GREY); doc.text("Dimensions in mm. Concept design: dimensions to be confirmed on site before fabrication or construction.", M + 2, tb + 13.8);
    doc.setLineWidth(0.2);
    await s.draw(28, tb - 4);
  }
  return doc.output("blob");
}
