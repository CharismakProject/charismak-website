"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DoorOpen, Download, FileUp, Hand, Minus, MousePointer2, Plus, RotateCw, Ruler, Square, Trash2, Undo2, AppWindow, Maximize, FileText, Image as ImageIcon } from "lucide-react";

import PlanSvg from "./plan-svg";
import { CATALOG, CATEGORIES, catalogItem, marketPrice, DOOR_PRICE_ID, WINDOW_PRICE_ID, WINDOW_HEIGHT } from "@/lib/planner/catalog";
import { allWalls, bounds, CUT_LABELS, defaultCuts, dist, emptyPlan, floorArea, newRoom, projectOnWall, readSaved, roomArea, roomOf, schedule, SHAPE_LABEL, snapEnd, snapRoom, STORAGE_KEY, uid, wallLength, withLength, type Item, type Plan, type Pt, type RoomShape } from "@/lib/planner/model";
import { buildPlannerPdf, naira } from "@/lib/planner/pdf";

type Step = "start" | "scale" | "build" | "report";
type Tool = "select" | "pan" | "wall" | "door" | "window" | `item:${string}` | `room:${RoomShape}`;
const SHAPES: RoomShape[] = ["rect", "L", "T", "U"];
type View = { x: number; y: number; w: number };

const STEPS: { id: Step; label: string }[] = [
  { id: "start", label: "1 · Upload" },
  { id: "scale", label: "2 · Scale" },
  { id: "build", label: "3 · Build" },
  { id: "report", label: "4 · Report" },
];

const field = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--cx-gold)]";
const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-40";
const fit = (plan: Plan, aspect: number): View => {
  const b = bounds(plan), pad = 900;
  let w = b.maxX - b.minX + pad * 2, h = b.maxY - b.minY + pad * 2;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return { x: (b.minX + b.maxX) / 2 - w / 2, y: (b.minY + b.maxY) / 2 - h / 2, w };
};
const today = () => new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default function SpacePlanner() {
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [history, setHistory] = useState<Plan[]>([]);
  const [step, setStep] = useState<Step>("start");
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<Pt | null>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [calib, setCalib] = useState<Pt[]>([]);
  const [calibLength, setCalibLength] = useState("");
  const [room, setRoom] = useState({ w: "3000", l: "1800", shape: "rect" as RoomShape });
  const [view, setView] = useState<View>({ x: -1000, y: -1000, w: 8000 });
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reportSvg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string | null; start: Pt; origin: Pt; view: View; moved: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; view: View } | null>(null);
  const pendingFit = useRef<Plan | null>(null);

  // Restore the last plan from this browser.
  useEffect(() => {
    let saved: Plan | null = null;
    try { saved = readSaved(window.localStorage.getItem(STORAGE_KEY)); } catch { /* storage unavailable */ }
    if (saved) { setPlan(saved); setStep(saved.walls.length || saved.items.length ? "build" : "start"); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); }
      catch {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...plan, backdrop: null })); setMessage("Saved on this device without the uploaded plan picture (it is too large to keep)."); } catch { /* ignore */ }
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [plan, loaded]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.max(200, e.contentRect.width), h = Math.max(200, e.contentRect.height);
      setSize({ w, h });
      if (pendingFit.current) { setView(fit(pendingFit.current, w / h)); pendingFit.current = null; }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  const aspect = size.w / size.h;
  const viewBox = { x: view.x, y: view.y, w: view.w, h: view.w / aspect };
  const zoomFit = useCallback(() => setView(fit(plan, aspect)), [plan, aspect]);
  /** Fit the view to a plan once the drawing area is on screen and measured. */
  const requestFit = (target: Plan) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) setView(fit(target, r.width / r.height));
    else pendingFit.current = target;
  };

  const commit = useCallback((next: Plan | ((p: Plan) => Plan)) => {
    setPlan((prev) => { setHistory((h) => [...h.slice(-49), prev]); return typeof next === "function" ? next(prev) : next; });
  }, []);
  const undo = () => setHistory((h) => { if (!h.length) return h; setPlan(h[h.length - 1]); return h.slice(0, -1); });

  const toWorld = (clientX: number, clientY: number): Pt => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const m = svg.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : pt;
    return { x: p.x, y: p.y };
  };
  const tolerance = view.w / 60;

  const zoom = (factor: number, about?: Pt) => setView((v) => {
    const c = about ?? { x: v.x + v.w / 2, y: v.y + (v.w / aspect) / 2 };
    const w = Math.min(200000, Math.max(800, v.w * factor));
    const k = w / v.w;
    return { x: c.x - (c.x - v.x) * k, y: c.y - (c.y - v.y) * k, w };
  });

  const nearestWall = (p: Pt) => {
    let best: { wallId: string; t: number; distance: number } | null = null;
    for (const w of allWalls(plan)) { const r = projectOnWall(p, w); if (!best || r.distance < best.distance) best = { wallId: w.id, t: r.t, distance: r.distance }; }
    return best && best.distance < Math.max(tolerance * 1.5, 400) ? best : null;
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), view };
      drag.current = null;
      return;
    }
    const p = toWorld(e.clientX, e.clientY);
    if (step === "scale") {
      setCalib((c) => (c.length >= 2 ? [p] : [...c, p]));
      return;
    }
    if (step !== "build") return;
    if (tool === "wall") {
      const s = draftStart ? snapEnd(draftStart, p, allWalls(plan), tolerance) : snapEnd(p, p, allWalls(plan), tolerance);
      if (!draftStart) { setDraftStart(s); setCursor(s); return; }
      if (dist(draftStart, s) < 50) return;
      const wall = { id: uid("w"), a: draftStart, b: s, thickness: 150 };
      commit((pl) => ({ ...pl, walls: [...pl.walls, wall] }));
      setDraftStart(s);
      return;
    }
    if (tool === "door" || tool === "window") {
      const near = nearestWall(p);
      if (!near) { setMessage("Tap on a wall to add a " + tool + "."); return; }
      const o = { id: uid("o"), wallId: near.wallId, kind: tool, t: near.t, width: tool === "door" ? 900 : 1200 } as const;
      commit((pl) => ({ ...pl, openings: [...pl.openings, o] }));
      setSelected(o.id);
      setTool("select");
      return;
    }
    if (tool.startsWith("room:")) {
      const shape = tool.slice(5) as RoomShape;
      const r = newRoom(shape, Math.round(p.x / 10) * 10, Math.round(p.y / 10) * 10, `Room ${plan.rooms.length + 1}`);
      const placed = { ...r, ...snapRoom(plan, r, r.x, r.y, tolerance * 2) };
      commit((pl) => ({ ...pl, rooms: [...pl.rooms, placed] }));
      setSelected(placed.id);
      setTool("select");
      setMessage("Room added. Drag it against another room to join them; edit its name and sizes on the right.");
      return;
    }
    if (tool.startsWith("item:")) {
      const c = catalogItem(tool.slice(5));
      if (!c) return;
      const it: Item = { id: uid("i"), type: c.type, x: Math.round(p.x / 10) * 10, y: Math.round(p.y / 10) * 10, w: c.w, d: c.d, h: c.h, rot: 0 };
      commit((pl) => ({ ...pl, items: [...pl.items, it] }));
      setSelected(it.id);
      setTool("select");
      return;
    }
    const raw = (e.target as Element).closest?.("[data-id]")?.getAttribute("data-id") ?? null;
    const hit = raw ? roomOf(raw) ?? raw : null;
    if (tool === "select") setSelected(hit);
    const item = hit ? plan.items.find((i) => i.id === hit) : undefined;
    const rm = hit ? plan.rooms.find((r) => r.id === hit) : undefined;
    const target = tool === "select" ? item ?? rm : undefined;
    drag.current = { id: target ? target.id : null, start: p, origin: target ? { x: target.x, y: target.y } : p, view, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const base = pinch.current.view, w = Math.min(200000, Math.max(800, base.w * (pinch.current.d / d)));
      const c = { x: base.x + base.w / 2, y: base.y + base.w / aspect / 2 };
      setView({ x: c.x - w / 2, y: c.y - w / aspect / 2, w });
      return;
    }
    if (tool === "wall" && draftStart) { setCursor(snapEnd(draftStart, toWorld(e.clientX, e.clientY), allWalls(plan), tolerance)); return; }
    const d = drag.current;
    if (!d) return;
    if (d.id) {
      const p = toWorld(e.clientX, e.clientY);
      const nx = Math.round((d.origin.x + p.x - d.start.x) / 10) * 10, ny = Math.round((d.origin.y + p.y - d.start.y) / 10) * 10;
      if (!d.moved) { setHistory((h) => [...h.slice(-49), plan]); d.moved = true; }
      const rm = plan.rooms.find((r) => r.id === d.id);
      if (rm) {
        const at = snapRoom(plan, rm, d.origin.x + p.x - d.start.x, d.origin.y + p.y - d.start.y, tolerance);
        setPlan((pl) => ({ ...pl, rooms: pl.rooms.map((r) => (r.id === d.id ? { ...r, ...at } : r)) }));
        return;
      }
      setPlan((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === d.id ? { ...i, x: nx, y: ny } : i)) }));
    } else {
      // Pan: measure against the view at drag start so the drawing follows the finger.
      const k = d.view.w / size.w;
      const svg = svgRef.current?.getBoundingClientRect();
      if (!svg) return;
      const startClient = { x: (d.start.x - d.view.x) / k + svg.left, y: (d.start.y - d.view.y) / k + svg.top };
      setView({ ...d.view, x: d.view.x - (e.clientX - startClient.x) * k, y: d.view.y - (e.clientY - startClient.y) * k });
    }
  };
  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const removeSelected = () => {
    if (!selected) return;
    commit((pl) => ({ ...pl, walls: pl.walls.filter((w) => w.id !== selected), rooms: pl.rooms.filter((r) => r.id !== selected), openings: pl.openings.filter((o) => o.id !== selected && o.wallId !== selected && roomOf(o.wallId) !== selected), items: pl.items.filter((i) => i.id !== selected) }));
    setSelected(null);
  };
  const rotateSelected = () => commit((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selected ? { ...i, rot: (i.rot + 90) % 360 } : i)), rooms: pl.rooms.map((r) => (r.id === selected ? { ...r, rot: (r.rot + 90) % 360 } : r)) }));

  const finishWall = () => { setDraftStart(null); setCursor(null); setTool("select"); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") { setDraftStart(null); setCursor(null); setTool("select"); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected) removeSelected();
      if (e.key.toLowerCase() === "r" && selected) rotateSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selWall = plan.walls.find((w) => w.id === selected);
  const selOpening = plan.openings.find((o) => o.id === selected);
  const selItem = plan.items.find((i) => i.id === selected);
  const selRoom = plan.rooms.find((r) => r.id === selected);
  const editRoom = (patch: Partial<typeof plan.rooms[number]>) => commit((pl) => ({ ...pl, rooms: pl.rooms.map((r) => (r.id === selected ? { ...r, ...patch } : r)) }));

  // ----- Step 1: start -----
  const onUpload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMessage("Reading your plan…");
    try {
      const { readPlan } = await import("@/lib/construction/project-import");
      const pic = await readPlan(file);
      const next: Plan = { ...plan, backdrop: { image: pic.image, pxW: pic.width, pxH: pic.height, mmPerPx: 10, x: 0, y: 0, opacity: 0.55 } };
      commit(next);
      requestFit(next);
      setCalib([]); setStep("scale"); setMessage("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That file could not be read.");
    } finally { setBusy(false); }
  };
  const startRoom = () => {
    const w = Number(room.w), l = Number(room.l);
    if (!(w >= 500 && l >= 500)) { setMessage("Enter the room width and length in millimetres (for example 3000 and 1800)."); return; }
    const next = { ...plan, rooms: [...plan.rooms, { ...newRoom(room.shape, 0, 0, plan.rooms.length ? `Room ${plan.rooms.length + 1}` : "Room 1", w, l) }] };
    commit(next); setStep("build"); setTool("select"); requestFit(next); setMessage("");
  };

  // ----- Step 2: scale -----
  const applyScale = () => {
    const real = Number(calibLength);
    const b = plan.backdrop;
    if (calib.length !== 2 || !(real > 0) || !b) { setMessage("Tap both ends of a line with a known length, then type that length in millimetres."); return; }
    const k = real / dist(calib[0], calib[1]);
    const scalePt = (p: Pt) => ({ x: b.x + (p.x - b.x) * k, y: b.y + (p.y - b.y) * k });
    const next: Plan = {
      ...plan,
      backdrop: { ...b, mmPerPx: b.mmPerPx * k },
      walls: plan.walls.map((w) => ({ ...w, a: scalePt(w.a), b: scalePt(w.b) })),
      items: plan.items.map((i) => ({ ...i, ...scalePt(i) })),
      rooms: plan.rooms.map((r) => ({ ...r, ...scalePt(r), w: r.w * k, l: r.l * k, a: r.a * k, b: r.b * k })),
    };
    commit(next); setCalib([]); setStep("build"); setTool("wall"); requestFit(next);
    setMessage("Scale set. Now trace the walls: tap at a corner, tap at the next corner, and so on.");
  };

  // ----- Step 4: report -----
  const sched = useMemo(() => schedule(plan), [plan]);
  const roomRows = plan.rooms.map((r) => ({ name: r.name, shape: SHAPE_LABEL[r.shape], size: `${Math.round(r.w)} × ${Math.round(r.l)}`, area: roomArea(r) }));
  const area = useMemo(() => floorArea(plan), [plan]);
  const b = bounds(allWalls(plan).length ? { ...plan, items: [], backdrop: null } : plan);
  const sizeText = `${Math.round(b.maxX - b.minX)} × ${Math.round(b.maxY - b.minY)} mm`;
  const reportBox = useMemo(() => { const v = fit({ ...plan, backdrop: null }, 1.6); return { x: v.x, y: v.y, w: v.w, h: v.w / 1.6 }; }, [plan]);

  const planPngBlob = async () => {
    const { planPng } = await import("@/lib/construction/design-export");
    if (!reportSvg.current) throw new Error("Plan not ready");
    return planPng(reportSvg.current, 2400);
  };
  const downloadBlob = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 2000); };
  const slug = (plan.title || "space").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const downloadPdf = async () => {
    setBusy(true); setMessage("Making your PDF…");
    try {
      const png = await planPngBlob();
      const pdf = await buildPlannerPdf({ title: plan.title || "My space", size: sizeText, area, height: plan.height, date: today() }, png, 1.6, sched.lines, sched.total, sched.unpriced, roomRows);
      downloadBlob(pdf, `charismak-${slug}-report.pdf`); setMessage("");
    } catch { setMessage("The PDF could not be made in this browser. Try again, or use a desktop browser."); }
    finally { setBusy(false); }
  };
  const downloadPng = async () => {
    setBusy(true);
    try { downloadBlob(await planPngBlob(), `charismak-${slug}-plan.png`); } catch { setMessage("The picture could not be made."); } finally { setBusy(false); }
  };

  const goto = (s: Step) => {
    if (s === "scale" && !plan.backdrop) { setMessage("Upload a plan first to set its scale, or start with a room size."); return; }
    setStep(s); setDraftStart(null); setCursor(null); setMessage("");
    if (s === "build" || s === "scale") requestFit(plan);
  };

  const toolBtn = (id: Tool, label: string, Icon: typeof Square) => (
    <button key={id} type="button" onClick={() => { setTool(id); setDraftStart(null); setCursor(null); }} aria-pressed={tool === id} className={`${btn} ${tool === id ? "bg-[var(--cx-gold)] text-[#0A1A2F]" : "bg-white/5 text-white hover:bg-white/10"}`}><Icon className="h-4 w-4" />{label}</button>
  );

  const priceField = (own: number | null | undefined, market: number | null, onChange: (v: number | null) => void, perNote?: string) => (
    <div>
      <label className="text-xs font-bold text-white/80">Price (₦)</label>
      <input className={field} inputMode="numeric" placeholder={market !== null ? `Market: ${market.toLocaleString("en-NG")}` : "Enter your price"} value={own ?? ""} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); onChange(v ? Number(v) : null); }} />
      <p className="mt-1 text-[11px] text-white/60">{own !== undefined && own !== null ? "Your price" : market !== null ? `Using market price${perNote ? ` (${perNote})` : ""}. Type to use your own.` : "No market price for this item — enter your own."}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--cx-void)] pt-20 text-white">
      <div className="mx-auto max-w-[1500px] px-3 pb-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cx-gold)]">Construction Studio</p>
            <h1 className="text-2xl font-semibold md:text-3xl">Space Planner</h1>
          </div>
          <nav className="flex flex-wrap gap-1 rounded-xl bg-white/5 p-1" aria-label="Steps">
            {STEPS.map((s) => <button key={s.id} type="button" onClick={() => goto(s.id)} aria-current={step === s.id ? "step" : undefined} className={`rounded-lg px-3 py-2 text-xs font-bold md:text-sm ${step === s.id ? "bg-[var(--cx-gold)] text-[#0A1A2F]" : "text-white/75 hover:bg-white/10"}`}>{s.label}</button>)}
          </nav>
        </div>
        {message ? <p className="mb-3 rounded-lg border border-[var(--cx-gold)]/40 bg-[var(--cx-gold)]/10 px-3 py-2 text-sm text-white">{message}</p> : null}

        {step === "start" ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-6">
              <FileUp className="h-7 w-7 text-[var(--cx-gold)]" />
              <h2 className="mt-3 text-xl font-semibold">Upload a plan</h2>
              <p className="mt-2 text-sm text-white/75">A PDF, photo or screenshot of your floor plan. Next you set its scale using one known dimension, then trace the walls over it.</p>
              <label className={`${btn} mt-5 cursor-pointer bg-[var(--cx-gold)] text-[#0A1A2F]`}>
                <FileUp className="h-4 w-4" />{busy ? "Reading…" : "Choose plan file"}
                <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void onUpload(e.target.files?.[0])} />
              </label>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-6">
              <Square className="h-7 w-7 text-[var(--cx-gold)]" />
              <h2 className="mt-3 text-xl font-semibold">Start with a room size</h2>
              <p className="mt-2 text-sm text-white/75">No plan? Pick a shape and type the overall size in millimetres. You can add more rooms and join them in the next step.</p>
              <div className="mt-4 flex flex-wrap gap-1">{SHAPES.map((sh) => <button key={sh} type="button" onClick={() => setRoom({ ...room, shape: sh })} aria-pressed={room.shape === sh} className={`rounded-full px-3 py-1 text-xs font-bold ${room.shape === sh ? "bg-white text-[#0A1A2F]" : "bg-white/5 text-white/80"}`}>{SHAPE_LABEL[sh]}</button>)}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <label className="text-xs font-bold text-white/80">Width<input className={field} inputMode="numeric" value={room.w} onChange={(e) => setRoom({ ...room, w: e.target.value })} /></label>
                <label className="text-xs font-bold text-white/80">Length<input className={field} inputMode="numeric" value={room.l} onChange={(e) => setRoom({ ...room, l: e.target.value })} /></label>
                <label className="text-xs font-bold text-white/80">Height<input className={field} inputMode="numeric" value={plan.height} onChange={(e) => setPlan({ ...plan, height: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></label>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={startRoom} className={`${btn} bg-[var(--cx-gold)] text-[#0A1A2F]`}>Draw the room</button>
                <button type="button" onClick={() => { setStep("build"); setTool("wall"); setMessage("Tap where a wall starts, then tap where it ends. Keep tapping to continue; press Done when finished."); }} className={`${btn} bg-white/5 text-white hover:bg-white/10`}>Blank canvas</button>
              </div>
            </div>
            {plan.walls.length || plan.items.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 md:col-span-2">
                You have a saved plan on this device ({plan.walls.length} walls, {plan.items.length} items). <button type="button" className="font-bold text-[var(--cx-gold)]" onClick={() => goto("build")}>Continue it</button> or <button type="button" className="font-bold text-white underline" onClick={() => { if (window.confirm("Start a new plan? The saved one on this device will be replaced.")) { commit(emptyPlan()); setSelected(null); } }}>start a new one</button>.
              </div>
            ) : null}
          </section>
        ) : null}

        {step === "scale" || step === "build" ? (
          <section className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--cx-panel)]">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-2">
                {step === "build" ? (
                  <>
                    {toolBtn("select", "Select", MousePointer2)}
                    {toolBtn("pan", "Move view", Hand)}
                    {toolBtn("wall", "Wall", Ruler)}
                    {toolBtn("door", "Door", DoorOpen)}
                    {toolBtn("window", "Window", AppWindow)}
                    {tool === "wall" && draftStart ? <button type="button" onClick={finishWall} className={`${btn} bg-white text-[#0A1A2F]`}>Done</button> : null}
                  </>
                ) : <span className="px-2 text-sm text-white/80">Tap both ends of a dimension line on your plan.</span>}
                <span className="ml-auto flex gap-1">
                  <button type="button" aria-label="Undo" onClick={undo} disabled={!history.length} className={`${btn} bg-white/5`}><Undo2 className="h-4 w-4" /></button>
                  <button type="button" aria-label="Zoom out" onClick={() => zoom(1.25)} className={`${btn} bg-white/5`}><Minus className="h-4 w-4" /></button>
                  <button type="button" aria-label="Zoom in" onClick={() => zoom(0.8)} className={`${btn} bg-white/5`}><Plus className="h-4 w-4" /></button>
                  <button type="button" aria-label="Fit to screen" onClick={zoomFit} className={`${btn} bg-white/5`}><Maximize className="h-4 w-4" /></button>
                </span>
              </div>
              <div ref={box} className="relative min-h-[50vh] flex-1 touch-none select-none bg-white" onWheel={(e) => zoom(e.deltaY > 0 ? 1.12 : 0.89, toWorld(e.clientX, e.clientY))}>
                <PlanSvg
                  ref={svgRef}
                  plan={plan}
                  box={viewBox}
                  selected={selected}
                  draft={draftStart && cursor ? { a: draftStart, b: cursor } : null}
                  calibration={step === "scale" ? calib : undefined}
                  className={`absolute inset-0 h-full w-full ${tool === "pan" ? "cursor-grab" : tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
              </div>
            </div>

            <aside className="space-y-3">
              {step === "scale" ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-4">
                  <h2 className="font-semibold">Set the scale</h2>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/80">
                    <li>Find a line on the plan with a dimension written on it.</li>
                    <li>Tap its two ends ({calib.length}/2 tapped).</li>
                    <li>Type that dimension in millimetres.</li>
                  </ol>
                  <label className="mt-3 block text-xs font-bold text-white/80">Real length (mm)<input className={field} inputMode="numeric" placeholder="e.g. 3000" value={calibLength} onChange={(e) => setCalibLength(e.target.value.replace(/\D/g, ""))} /></label>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={applyScale} className={`${btn} flex-1 bg-[var(--cx-gold)] text-[#0A1A2F]`}>Apply scale</button>
                    <button type="button" onClick={() => setCalib([])} className={`${btn} bg-white/5`}>Clear</button>
                  </div>
                  {plan.backdrop ? <label className="mt-4 block text-xs font-bold text-white/80">Plan visibility<input type="range" min={0.15} max={1} step={0.05} value={plan.backdrop.opacity} onChange={(e) => setPlan({ ...plan, backdrop: { ...plan.backdrop!, opacity: Number(e.target.value) } })} className="w-full" /></label> : null}
                </div>
              ) : null}

              {step === "build" && (selWall || selOpening || selItem || selRoom) ? (
                <div className="rounded-2xl border border-[var(--cx-gold)]/40 bg-[var(--cx-panel)] p-4">
                  {selRoom ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold">Room · {roomArea(selRoom).toFixed(1)} m²</h2>
                      <label className="block text-xs font-bold text-white/80">Name<input className={field} value={selRoom.name} onChange={(e) => setPlan((pl) => ({ ...pl, rooms: pl.rooms.map((r) => (r.id === selRoom.id ? { ...r, name: e.target.value } : r)) }))} /></label>
                      <div className="flex flex-wrap gap-1">{SHAPES.map((sh) => <button key={sh} type="button" onClick={() => editRoom({ shape: sh, ...defaultCuts(sh, selRoom.w, selRoom.l) })} aria-pressed={selRoom.shape === sh} className={`rounded-full px-3 py-1 text-xs font-bold ${selRoom.shape === sh ? "bg-white text-[#0A1A2F]" : "bg-white/5 text-white/80"}`}>{SHAPE_LABEL[sh]}</button>)}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {([["w", "Width"], ["l", "Length"], ...(CUT_LABELS[selRoom.shape] ? [["a", CUT_LABELS[selRoom.shape]![0]], ["b", CUT_LABELS[selRoom.shape]![1]]] : []), ["thickness", "Wall thickness"]] as [keyof typeof selRoom, string][]).map(([k, label]) => (
                          <label key={k} className="text-xs font-bold text-white/80">{label}<input className={field} inputMode="numeric" value={Math.round(Number(selRoom[k]))} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); setPlan((pl) => ({ ...pl, rooms: pl.rooms.map((r) => (r.id === selRoom.id ? { ...r, [k]: v || 0 } : r)) })); }} /></label>
                        ))}
                      </div>
                      <button type="button" onClick={rotateSelected} className={`${btn} w-full bg-white/5`}><RotateCw className="h-4 w-4" />Turn 90°</button>
                      <p className="text-[11px] text-white/60">Drag the room to move it; it snaps to the edges of other rooms so walls line up.</p>
                    </div>
                  ) : null}
                  {selWall ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold">Wall</h2>
                      <label className="block text-xs font-bold text-white/80">Length (mm)<input className={field} inputMode="numeric" key={`l-${selWall.id}-${Math.round(wallLength(selWall))}`} defaultValue={Math.round(wallLength(selWall))} onBlur={(e) => { const v = Number(e.target.value); if (v > 50) commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? withLength(w, v) : w)) })); }} /></label>
                      <label className="block text-xs font-bold text-white/80">Thickness (mm)<input className={field} inputMode="numeric" value={selWall.thickness} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, thickness: v || 0 } : w)) })); }} /></label>
                    </div>
                  ) : null}
                  {selOpening ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold capitalize">{selOpening.kind}</h2>
                      <label className="block text-xs font-bold text-white/80">Width (mm)<input className={field} inputMode="numeric" value={selOpening.width} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); commit((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, width: v || 0 } : o)) })); }} /></label>
                      <label className="block text-xs font-bold text-white/80">Position along wall<input type="range" min={0} max={1} step={0.01} value={selOpening.t} onChange={(e) => { const t = Number(e.target.value); setPlan((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, t } : o)) })); }} className="w-full" /></label>
                      {priceField(selOpening.price, selOpening.kind === "door" ? marketPrice(DOOR_PRICE_ID)?.rate ?? null : (() => { const m = marketPrice(WINDOW_PRICE_ID); return m ? Math.round((m.rate * selOpening.width * WINDOW_HEIGHT) / 1e6) : null; })(), (v) => commit((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, price: v } : o)) })), selOpening.kind === "window" ? `${WINDOW_HEIGHT} mm high, priced per m²` : undefined)}
                    </div>
                  ) : null}
                  {selItem ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold">{catalogItem(selItem.type)?.name ?? selItem.type}</h2>
                      <label className="block text-xs font-bold text-white/80">Label (optional)<input className={field} value={selItem.label ?? ""} onChange={(e) => setPlan((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selItem.id ? { ...i, label: e.target.value } : i)) }))} /></label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["w", "d", "h"] as const).map((k) => (
                          <label key={k} className="text-xs font-bold text-white/80">{k === "w" ? "Width" : k === "d" ? "Depth" : "Height"}<input className={field} inputMode="numeric" value={selItem[k]} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); setPlan((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selItem.id ? { ...i, [k]: v || 0 } : i)) })); }} /></label>
                        ))}
                      </div>
                      {priceField(selItem.price, marketPrice(catalogItem(selItem.type)?.priceId)?.rate ?? null, (v) => commit((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selItem.id ? { ...i, price: v } : i)) })))}
                      <button type="button" onClick={rotateSelected} className={`${btn} w-full bg-white/5`}><RotateCw className="h-4 w-4" />Turn 90°</button>
                    </div>
                  ) : null}
                  <button type="button" onClick={removeSelected} className={`${btn} mt-3 w-full bg-[#8A1A10]/30 text-white hover:bg-[#8A1A10]/50`}><Trash2 className="h-4 w-4" />Delete</button>
                </div>
              ) : null}

              {step === "build" ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-4">
                  <h2 className="font-semibold">Add a room</h2>
                  <p className="mt-1 text-xs text-white/65">Pick a shape, then tap the plan. Drag rooms together to join them.</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {SHAPES.map((sh) => (
                      <button key={sh} type="button" onClick={() => { setTool(`room:${sh}`); setMessage(`Tap the plan to place a ${SHAPE_LABEL[sh].toLowerCase()} room.`); }} aria-pressed={tool === `room:${sh}`} className={`rounded-lg border px-1 py-2 text-xs font-bold ${tool === `room:${sh}` ? "border-[var(--cx-gold)] bg-[var(--cx-gold)]/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <svg viewBox="0 0 40 30" className="mx-auto mb-1 h-6 w-8" fill="none" stroke="currentColor" strokeWidth="3"><polygon points={sh === "L" ? "2,2 20,2 20,15 38,15 38,28 2,28" : sh === "T" ? "2,2 38,2 38,12 26,12 26,28 14,28 14,12 2,12" : sh === "U" ? "2,2 14,2 14,16 26,16 26,2 38,2 38,28 2,28" : "2,2 38,2 38,28 2,28"} /></svg>
                        {SHAPE_LABEL[sh].replace("-shape", "")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "build" ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-4">
                  <h2 className="font-semibold">Add items</h2>
                  <p className="mt-1 text-xs text-white/65">Pick an item, then tap the plan to place it. Drag to move; select to resize, turn or price it.</p>
                  <div className="mt-3 flex flex-wrap gap-1">{CATEGORIES.map((c) => <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs font-bold ${category === c ? "bg-white text-[#0A1A2F]" : "bg-white/5 text-white/80"}`}>{c}</button>)}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {CATALOG.filter((c) => c.category === category).map((c) => (
                      <button key={c.type} type="button" onClick={() => { setTool(`item:${c.type}`); setMessage(`Tap the plan to place: ${c.name}`); }} aria-pressed={tool === `item:${c.type}`} className={`rounded-lg border px-2 py-2 text-left text-xs font-bold ${tool === `item:${c.type}` ? "border-[var(--cx-gold)] bg-[var(--cx-gold)]/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        {c.name}<span className="block text-[10px] font-normal text-white/60">{c.point ? "point" : `${c.w} × ${c.d}`}{marketPrice(c.priceId) ? " · market price" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "build" ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                  <label className="block text-xs font-bold text-white/80">Project name<input className={field} value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} /></label>
                  <p className="mt-3 text-white/75">{plan.rooms.length ? `${plan.rooms.length} rooms · ` : ""}{plan.walls.length} walls · {plan.openings.length} doors/windows · {plan.items.length} items{area ? ` · ${area.toFixed(1)} m²` : ""}</p>
                  <p className="mt-1 font-bold text-[var(--cx-gold)]">Estimated: {naira(sched.total)}{sched.unpriced ? ` (+${sched.unpriced} unpriced)` : ""}</p>
                  <button type="button" onClick={() => goto("report")} className={`${btn} mt-3 w-full bg-[var(--cx-gold)] text-[#0A1A2F]`}><FileText className="h-4 w-4" />See report</button>
                </div>
              ) : null}
            </aside>
          </section>
        ) : null}

        {step === "report" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void downloadPdf()} disabled={busy} className={`${btn} bg-[var(--cx-gold)] text-[#0A1A2F]`}><Download className="h-4 w-4" />{busy ? "Working…" : "Download PDF"}</button>
              <button type="button" onClick={() => void downloadPng()} disabled={busy} className={`${btn} bg-white/5`}><ImageIcon className="h-4 w-4" />Plan picture (PNG)</button>
              <button type="button" onClick={() => goto("build")} className={`${btn} bg-white/5`}>Back to build</button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white text-[#1B2433]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#0D3352] px-5 py-4">
                <img src="/branding/charismak-logo-wide.jpg" alt="Charismak Project Nigeria Limited" className="h-12 w-auto" />
                <div className="text-right text-sm"><b className="block text-[#8A1A10]">Space Planner report</b>{today()}</div>
              </div>
              <div className="p-5">
                <h2 className="text-2xl font-bold text-[#0D3352]">{plan.title || "My space"}</h2>
                <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-[#0D3352] bg-[#DDE1E7] text-sm sm:grid-cols-4">
                  {[["Overall size", sizeText], ["Floor area", area ? `${area.toFixed(1)} m²` : "—"], ["Ceiling height", `${plan.height} mm`], ["Estimated total", naira(sched.total)]].map(([k, v]) => <div key={k} className="bg-white p-3"><b className="block text-xs text-[#8A1A10]">{k}</b>{v}</div>)}
                </div>
                <div className="mt-4 rounded-lg border border-[#DDE1E7] p-2">
                  <PlanSvg ref={reportSvg} plan={plan} box={reportBox} showBackdrop={false} className="h-auto w-full" />
                  <p className="mt-1 text-center text-xs text-[#5A6675]">Floor plan · dimensions in millimetres · not to scale</p>
                </div>
                {roomRows.length ? (
                  <>
                    <h3 className="mt-6 text-lg font-bold text-[#0D3352]">Rooms</h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead><tr className="bg-[#0D3352] text-left text-white">{["Room", "Shape", "Overall size (mm)", "Floor area"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
                        <tbody>{roomRows.map((r, i) => <tr key={i} className={i % 2 ? "bg-[#F6F7F9]" : ""}><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2">{r.shape}</td><td className="px-3 py-2">{r.size}</td><td className="px-3 py-2">{r.area.toFixed(1)} m²</td></tr>)}</tbody>
                        <tfoot><tr className="border-t-2 border-[#0D3352] font-bold text-[#0D3352]"><td className="px-3 py-2" colSpan={3}>Total floor area</td><td className="px-3 py-2">{roomRows.reduce((t, r) => t + r.area, 0).toFixed(1)} m²</td></tr></tfoot>
                      </table>
                    </div>
                  </>
                ) : null}
                <h3 className="mt-6 text-lg font-bold text-[#0D3352]">Schedule of items</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead><tr className="bg-[#0D3352] text-left text-white">{["Item", "Size (mm)", "Qty", "Unit price", "Total"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
                    <tbody>
                      {sched.lines.map((l, i) => <tr key={l.key} className={i % 2 ? "bg-[#F6F7F9]" : ""}><td className="px-3 py-2 font-semibold">{l.name}</td><td className="px-3 py-2">{l.size}</td><td className="px-3 py-2">{l.qty}</td><td className="px-3 py-2">{l.unitPrice === null ? "—" : `${naira(l.unitPrice)}${l.source === "market" ? " *" : ""}`}</td><td className="px-3 py-2">{l.total === null ? <span className="text-[#8A1A10]">not priced</span> : naira(l.total)}</td></tr>)}
                      {!sched.lines.length ? <tr><td colSpan={5} className="px-3 py-4 text-[#5A6675]">Nothing placed yet.</td></tr> : null}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-[#0D3352] font-bold text-[#0D3352]"><td className="px-3 py-2" colSpan={4}>Estimated total</td><td className="px-3 py-2">{naira(sched.total)}</td></tr></tfoot>
                  </table>
                </div>
                <p className="mt-3 text-xs text-[#5A6675]">* Market price from the Charismak price list (Abuja). Other prices were entered by you. Supply prices only; installation, delivery and taxes are not included. Verify prices and sizes before purchase or construction.</p>
              </div>
            </div>
            <p className="text-sm text-white/70">Need it built or fitted out? <Link href="/quote" className="font-bold text-[var(--cx-gold)]">Ask Charismak for a quote</Link>.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
