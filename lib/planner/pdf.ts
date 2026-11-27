"use client";

import { jsPDF } from "jspdf";

import type { ScheduleLine } from "./model";

const NAVY: [number, number, number] = [13, 51, 82];
const RED: [number, number, number] = [138, 26, 16];
const GREY: [number, number, number] = [90, 102, 117];

export const naira = (n: number) => `NGN ${Math.round(n).toLocaleString("en-NG")}`;

async function dataUrl(src: string): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    return await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => resolve(null); r.readAsDataURL(blob); });
  } catch {
    return null;
  }
}

const blobUrl = (blob: Blob) => new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(blob); });

export type ReportInfo = { title: string; size: string; area: number | null; height: number; date: string };

/** Charismak-branded A4 report: plan page, then the schedule of items with prices. */
export type RoomRow = { name: string; size: string; area: number };

export async function buildPlannerPdf(info: ReportInfo, planPng: Blob, planRatio: number, lines: ScheduleLine[], total: number, unpriced: number, rooms: RoomRow[] = []) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = 297, H = 210, M = 12;
  const logo = await dataUrl("/branding/charismak-logo-wide.jpg");

  const header = (subtitle: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, 24, "F");
    if (logo) doc.addImage(logo, "JPEG", M, 4, 58, 16);
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("SPACE PLANNER REPORT", W - M, 10, { align: "right" });
    doc.setTextColor(...RED); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(subtitle, W - M, 16, { align: "right" });
    doc.setFillColor(...NAVY); doc.rect(0, 24, W, 1.2, "F");
  };
  const footer = (page: number) => {
    doc.setFillColor(...NAVY); doc.rect(0, H - 10, W, 10, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8);
    doc.text("Charismak Project Nigeria Limited  ·  charismakproject.com  ·  +234 706 661 9598  ·  Maitama, Abuja", M, H - 4);
    doc.text(`Indicative layout and budget — verify on site · Page ${page}`, W - M, H - 4, { align: "right" });
  };

  // Page 1: title block + plan
  header(`${info.title} · ${info.date}`);
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(info.title, M, 35);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GREY);
  doc.text([`Overall size: ${info.size}`, `Floor area: ${info.area ? `${info.area.toFixed(1)} m²` : "—"}   ·   Ceiling height: ${info.height} mm`, `Items placed: ${lines.reduce((s, l) => s + l.qty, 0)}   ·   Estimated total: ${naira(total)}${unpriced ? ` (+${unpriced} unpriced)` : ""}`], M, 42);
  const top = 56, avW = W - 2 * M, avH = H - 10 - top - 4;
  let pw = avW, ph = pw / planRatio;
  if (ph > avH) { ph = avH; pw = ph * planRatio; }
  doc.setDrawColor(221, 225, 231); doc.rect((W - pw) / 2 - 1, top - 1, pw + 2, ph + 2);
  doc.addImage(await blobUrl(planPng), "PNG", (W - pw) / 2, top, pw, ph);
  doc.setFontSize(8); doc.setTextColor(...GREY);
  doc.text("Floor plan · dimensions in millimetres · not to scale", W / 2, top + ph + 3.5, { align: "center" });
  footer(1);

  // Page 2+: schedule
  let page = 2;
  doc.addPage(); header(rooms.length ? "Rooms and schedule of items" : "Schedule of items");
  let y = 35;
  const bar = (titles: string[], at: number[]) => {
    doc.setFillColor(...NAVY); doc.rect(M, y - 5, W - 2 * M, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    titles.forEach((h, i) => doc.text(h, at[i] + 2, y));
    y += 8;
  };
  if (rooms.length) {
    doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Rooms", M, y); y += 9;
    const rc = [M, M + 120, M + 210];
    bar(["Room", "Overall size (mm)", "Floor area"], rc);
    doc.setFont("helvetica", "normal");
    rooms.forEach((r, i) => {
      if (i % 2) { doc.setFillColor(246, 247, 249); doc.rect(M, y - 5, W - 2 * M, 7.5, "F"); }
      doc.setTextColor(27, 36, 51); doc.setFontSize(9);
      [r.name, r.size, `${r.area.toFixed(1)} m²`].forEach((t, j) => doc.text(t, rc[j] + 2, y));
      y += 7.5;
    });
    doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
    doc.text("Total floor area", rc[1] + 2, y + 1); doc.text(`${rooms.reduce((t, r) => t + r.area, 0).toFixed(1)} m²`, rc[2] + 2, y + 1);
    y += 12;
  }
  doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Schedule of items", M, y); y += 9;
  const cols = [M, M + 95, M + 160, M + 180, M + 225];
  const heads = ["Item", "Size (mm)", "Qty", "Unit price", "Total"];
  const head = () => bar(heads, cols);
  head();
  doc.setFont("helvetica", "normal");
  lines.forEach((l, i) => {
    if (y > H - 30) { footer(page); doc.addPage(); page += 1; header("Schedule of items (continued)"); y = 36; head(); doc.setFont("helvetica", "normal"); }
    if (i % 2) { doc.setFillColor(246, 247, 249); doc.rect(M, y - 5, W - 2 * M, 7.5, "F"); }
    doc.setTextColor(27, 36, 51); doc.setFontSize(9);
    doc.text(l.name, cols[0] + 2, y);
    doc.text(l.size, cols[1] + 2, y);
    doc.text(String(l.qty), cols[2] + 2, y);
    doc.text(l.unitPrice === null ? "—" : `${naira(l.unitPrice)}${l.source === "market" ? " *" : ""}`, cols[3] + 2, y);
    doc.text(l.total === null ? "not priced" : naira(l.total), cols[4] + 2, y);
    y += 7.5;
  });
  y += 2;
  doc.setDrawColor(...NAVY); doc.line(M, y - 4, W - M, y - 4);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text("Estimated total", cols[3] + 2, y + 2);
  doc.text(naira(total), cols[4] + 2, y + 2);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GREY);
  doc.text(["* Market price from the Charismak price list (Abuja). Other prices were entered by the user.", "Supply prices only unless stated; installation, delivery and taxes are not included. Verify prices and sizes before purchase or construction."], M, y + 10);
  footer(page);
  return doc.output("blob");
}
