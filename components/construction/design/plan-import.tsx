"use client";

import { saveAsset } from "@pascal-app/core";
import { FileUp, LoaderCircle, X } from "lucide-react";
import { useMemo, useState } from "react";

import { detectWalls, type DxfLine } from "@/lib/construction/dxf-walls";
import { readDxf, readPlan } from "@/lib/construction/project-import";
import { buildImportedScene, buildTraceScene } from "@/lib/construction/quick-house";

type Scene = ReturnType<typeof buildImportedScene>;
type Dxf = { lines: DxfLine[]; units: number; layers: string[]; name: string };
type Picture = { image: string; width: number; height: number; pages: number; page: number; file: File };

/**
 * Import a floor plan into the Design Studio:
 *  • DXF (AutoCAD/Revit export): walls are found from the drawing's double lines and built as editable 3D walls.
 *  • PDF or image: laid under an empty level at its real size, to trace walls over in the editor.
 */
export default function PlanImport({ onOpen, onClose }: { onOpen: (scene: Scene) => void; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dxf, setDxf] = useState<Dxf | null>(null);
  const [layers, setLayers] = useState<Set<string>>(new Set());
  const [picture, setPicture] = useState<Picture | null>(null);
  const [widthMeters, setWidthMeters] = useState(20);

  const detected = useMemo(() => {
    if (!dxf || !layers.size) return null;
    try { return detectWalls(dxf.lines, dxf.units, layers); } catch { return null; }
  }, [dxf, layers]);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null); setDxf(null); setPicture(null);
    try {
      if (file.name.toLowerCase().endsWith(".dxf")) {
        setBusy("Reading the DXF drawing…");
        const read = await readDxf(file);
        const wallLayers = read.layers.filter((layer) => /wall|mur|a-wal|blk|block/i.test(layer));
        setLayers(new Set(wallLayers.length ? wallLayers : read.layers));
        setDxf({ ...read, lines: read.lines as DxfLine[], name: file.name });
      } else if (file.name.toLowerCase().endsWith(".dwg")) {
        throw new Error("DWG files can’t be read in the browser. In AutoCAD use File → Save As → DXF, or export a PDF, then import that.");
      } else {
        setBusy("Reading the plan…");
        const read = await readPlan(file);
        setPicture({ ...read, page: 1, file });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setBusy(null);
    }
  };

  const changePage = async (page: number) => {
    if (!picture) return;
    setBusy(`Reading page ${page}…`);
    try { setPicture({ ...(await readPlan(picture.file, page)), page, file: picture.file }); } catch (err) { setError(err instanceof Error ? err.message : "Could not read that page."); } finally { setBusy(null); }
  };

  const buildFromDxf = () => {
    if (!detected?.walls.length) return;
    if (detected.width > 120 || detected.length > 120) { setError(`The drawing measures ${detected.width.toFixed(0)} × ${detected.length.toFixed(0)} m — check the layers (title blocks, site plans) or the drawing units.`); return; }
    onOpen(buildImportedScene(detected));
  };

  const openToTrace = async () => {
    if (!picture) return;
    setBusy("Preparing the plan…");
    try {
      const blob = await (await fetch(picture.image)).blob();
      const url = await saveAsset(new File([blob], `${picture.file.name.replace(/\.[^.]+$/, "")}.png`, { type: "image/png" }));
      onOpen(buildTraceScene({ guideUrl: url, widthMeters, name: picture.file.name.replace(/\.[^.]+$/, "") }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare the plan.");
      setBusy(null);
    }
  };

  // Preview of detected walls, drawn to fit.
  const preview = detected?.walls.length ? (() => {
    const pad = 0.6, w = detected.width + pad * 2, h = detected.length + pad * 2;
    return (
      <svg viewBox={`${-pad} ${-pad} ${w} ${h}`} className="h-56 w-full rounded-md bg-white">
        {detected.walls.map((wall, i) => <line key={i} x1={wall.a[0]} y1={wall.a[1]} x2={wall.b[0]} y2={wall.b[1]} stroke={wall.thickness >= 0.2 ? "#0D3352" : "#6A1400"} strokeWidth={wall.thickness} strokeLinecap="square" />)}
      </svg>
    );
  })() : null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Import a floor plan" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#071A2E] p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Import your plan</p>
            <h2 className="mt-1 text-lg font-semibold">Build 3D from your drawing</h2>
            <p className="mt-1 text-xs text-white/60">DXF (from AutoCAD, Revit, ArchiCAD): walls are found and built automatically. PDF or photo: it’s laid under the editor at real size for you to trace the walls.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-white/60 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/25 bg-white/[0.03] px-4 py-6 text-center hover:border-[#D9B26A]">
          <FileUp className="h-6 w-6 text-[#D9B26A]" />
          <span className="text-sm font-bold">Choose a DXF, PDF, PNG or JPG</span>
          <span className="text-[11px] text-white/50">Stays on your device — nothing is uploaded</span>
          <input type="file" accept=".dxf,.dwg,.pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void choose(event.target.files?.[0])} />
        </label>

        {busy ? <p className="mt-3 flex items-center gap-2 text-xs text-[#F2C879]"><LoaderCircle className="h-4 w-4 animate-spin" /> {busy}</p> : null}
        {error ? <p className="mt-3 rounded-md bg-[#3A2A0B]/70 p-3 text-xs text-[#F7D58C]">{error}</p> : null}

        {dxf ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-white/70"><strong className="text-white">{dxf.name}</strong> · {dxf.lines.length.toLocaleString()} lines</p>
            <div>
              <p className="text-xs text-white/70">Layers to read walls from</p>
              <div className="mt-1 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {dxf.layers.map((layer) => (
                  <button key={layer} type="button" aria-pressed={layers.has(layer)} onClick={() => setLayers((current) => { const next = new Set(current); if (next.has(layer)) next.delete(layer); else next.add(layer); return next; })} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${layers.has(layer) ? "bg-[#D9B26A] text-[#02080F]" : "bg-white/5 text-white/70"}`}>{layer}</button>
                ))}
              </div>
            </div>
            {preview}
            {detected ? (
              <p className="text-xs text-white/70">
                {detected.walls.length} walls · {detected.width.toFixed(1)} × {detected.length.toFixed(1)} m
                {detected.paired ? " · thickness read from the double lines" : " · single lines found, so every line is treated as a 230 mm wall — untick layers that aren’t walls"}
              </p>
            ) : <p className="text-xs text-white/50">Pick at least one layer.</p>}
            <button type="button" disabled={!detected?.walls.length} onClick={buildFromDxf} className="w-full rounded-md bg-[#D9B26A] px-3 py-2.5 text-sm font-bold text-[#02080F] hover:bg-[#F2C879] disabled:opacity-50">Build editable 3D</button>
            <p className="text-[11px] text-white/45">Opens in the advanced editor: add doors and windows (Build), rooms, and press “Price this design”. Blocks (INSERT) such as doors and furniture are ignored.</p>
          </div>
        ) : null}

        {picture ? (
          <div className="mt-4 space-y-3">
            <img src={picture.image} alt="Imported plan" className="max-h-56 w-full rounded-md bg-white object-contain" />
            {picture.pages > 1 ? (
              <label className="flex items-center justify-between text-xs text-white/70">Page
                <select value={picture.page} onChange={(event) => void changePage(Number(event.target.value))} className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-white [&_option]:bg-[#071A2E]">
                  {Array.from({ length: picture.pages }, (_, i) => <option key={i} value={i + 1}>Page {i + 1}</option>)}
                </select>
              </label>
            ) : null}
            <label className="block text-xs text-white/70">
              Real width of the whole image, left edge to right edge (metres)
              <input type="number" min={2} max={300} step={0.5} value={widthMeters} onChange={(event) => setWidthMeters(Math.max(2, Number(event.target.value) || 20))} className="mt-1 w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white" />
            </label>
            <button type="button" onClick={() => void openToTrace()} disabled={Boolean(busy)} className="w-full rounded-md bg-[#D9B26A] px-3 py-2.5 text-sm font-bold text-[#02080F] hover:bg-[#F2C879] disabled:opacity-50">Open to trace</button>
            <p className="text-[11px] text-white/45">In the editor: Scene → your plan → “Set scale” and click two ends of a known dimension to make it exact, then Build → Wall to draw over the walls.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
