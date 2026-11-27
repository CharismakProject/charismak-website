"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Lightbulb, Spline, DoorOpen, Download, FileUp, Hand, Minus, MousePointer2, Plus, RotateCw, Ruler, Square, Trash2, Undo2, AppWindow, Maximize, FileText, Image as ImageIcon } from "lucide-react";

import ElevationSvg from "./elevation-svg";
import PlanSvg from "./plan-svg";
import { examplePlan } from "@/lib/planner/example";
import { itemMount, planElevations } from "@/lib/planner/elevation";
import { CATALOG, CATEGORIES, catalogItem, marketPrice, DOOR_PRICE_ID, WINDOW_PRICE_ID, WINDOW_HEIGHT } from "@/lib/planner/catalog";
import { arcOf, bulgeForRadius, bulgeThrough, bounds, CUT_LABELS, defaultCuts, detectRooms, dist, emptyPlan, outlineWalls, pointAtLength, projectOnWall, readSaved, schedule, SHAPE_LABEL, shapeOutline, snapPoint, STORAGE_KEY, uid, wallLength, withLength, type Item, type Plan, type Pt, type RoomShape, type Snap } from "@/lib/planner/model";
import { buildPlannerPdf, naira } from "@/lib/planner/pdf";

type Step = "start" | "scale" | "build" | "report";
type Tool = "select" | "pan" | "wall" | "arc" | "door" | "window" | `item:${string}` | `shape:${RoomShape}`;
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
  const [chainStart, setChainStart] = useState<Pt | null>(null);
  const [arcEnd, setArcEnd] = useState<Pt | null>(null);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [ortho, setOrtho] = useState(true);
  const [typed, setTyped] = useState("");
  const [shapeSize, setShapeSize] = useState({ w: "3600", l: "3000", a: "", b: "" });
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
  const elevationRefs = useRef<(SVGSVGElement | null)[]>([]);
  const [views, setViews] = useState<{ blobs: Blob[]; urls: string[]; state: "idle" | "making" | "done" | "failed" }>({ blobs: [], urls: [], state: "idle" });
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
    for (const w of plan.walls) { const r = projectOnWall(p, w); if (!best || r.distance < best.distance) best = { wallId: w.id, t: r.t, distance: r.distance }; }
    return best && best.distance < Math.max(tolerance * 1.5, 400) ? best : null;
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    // Keyboard goes to the drawing (typed lengths, Enter, Esc), not to the last button pressed.
    if (document.activeElement instanceof HTMLElement && document.activeElement.tagName !== "INPUT") document.activeElement.blur();
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
    if (tool === "arc") {
      if (!draftStart) { const sp = snapPoint(p, plan.walls, tolerance).pt; setDraftStart(sp); setCursor(sp); setMessage("Now tap where the curved wall ends (or type its chord length and press Enter)."); return; }
      if (!arcEnd) {
        const end = snapPoint(p, plan.walls, tolerance, draftStart, ortho).pt;
        if (dist(end, draftStart) < 50) return;
        setArcEnd(end); setTyped(""); setMessage("Now tap a point the curve passes through (or type the radius and press Enter).");
        return;
      }
      addArc(bulgeThrough(draftStart, arcEnd, snapPoint(p, plan.walls, tolerance).pt));
      return;
    }
    if (tool === "wall") {
      const sp = snapPoint(p, plan.walls, tolerance, draftStart, ortho).pt;
      if (!draftStart) { setDraftStart(sp); setChainStart(sp); setCursor(sp); return; }
      addWallTo(sp);
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
    if (tool.startsWith("shape:")) {
      const shape = tool.slice(6) as RoomShape;
      const w = Number(shapeSize.w), l = Number(shapeSize.l);
      if (!(w >= 500 && l >= 500)) { setMessage("Type the shape's width and length in millimetres first."); return; }
      const corner = snapPoint(p, plan.walls, tolerance).pt;
      const pts = shapeOutline(shape, corner.x, corner.y, w, l, shapeSize.a ? Number(shapeSize.a) : undefined, shapeSize.b ? Number(shapeSize.b) : undefined);
      commit((pl) => ({ ...pl, walls: [...pl.walls, ...outlineWalls(pts)] }));
      setTool("select");
      setMessage(`${SHAPE_LABEL[shape]} drawn with its top-left corner where you tapped. Its walls can be edited one by one.`);
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
    const hit = (e.target as Element).closest?.("[data-id]")?.getAttribute("data-id") ?? null;
    if (tool === "select") setSelected(hit);
    const item = hit && tool === "select" ? plan.items.find((i) => i.id === hit) : undefined;
    drag.current = { id: item ? item.id : null, start: p, origin: item ? { x: item.x, y: item.y } : p, view, moved: false };
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
    if (tool === "wall" || tool === "arc" || tool.startsWith("shape:")) {
      const raw = toWorld(e.clientX, e.clientY);
      const sn = snapPoint(raw, plan.walls, tolerance, (tool === "wall" || (tool === "arc" && !arcEnd)) ? draftStart : null, ortho);
      setSnap(sn);
      if (draftStart) setCursor(tool === "arc" && arcEnd && sn.kind === "free" ? raw : sn.pt);
      return;
    }
    const d = drag.current;
    if (!d) return;
    if (d.id) {
      const p = toWorld(e.clientX, e.clientY);
      const nx = Math.round((d.origin.x + p.x - d.start.x) / 10) * 10, ny = Math.round((d.origin.y + p.y - d.start.y) / 10) * 10;
      if (!d.moved) { setHistory((h) => [...h.slice(-49), plan]); d.moved = true; }
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

  const rooms = useMemo(() => detectRooms(plan.walls, plan.tags), [plan.walls, plan.tags]);
  const selRoom = selected?.startsWith("room:") ? rooms.find((r) => `room:${r.key}` === selected) : undefined;
  const renameRoom = (name: string) => {
    if (!selRoom) return;
    if (selRoom.tagId) setPlan((pl) => ({ ...pl, tags: pl.tags.map((t) => (t.id === selRoom.tagId ? { ...t, name } : t)) }));
    else commit((pl) => ({ ...pl, tags: [...pl.tags, { id: uid("t"), name, x: selRoom.label.x, y: selRoom.label.y }] }));
  };
  // ----- Guidance: what to do next, and what the current tool expects -----
  const roomsNamed = rooms.length > 0 && rooms.every((r) => r.tagId);
  const steps: { id: string; label: string; done: boolean; hint: string; tools: [string, Tool][] }[] = [
    { id: "walls", label: "Draw the walls", done: rooms.length > 0, tools: [["Wall", "wall"], ["Curved wall", "arc"]],
      hint: plan.backdrop ? "Trace over your plan: choose Wall, tap a corner, then the next corner, and so on. Walls can start or end on any point of another wall. Close the outline so the room is found." : "Choose Wall and tap from corner to corner, or use “Draw a shape”. Close the outline so the room is found." },
    { id: "openings", label: "Add doors and windows", done: plan.openings.length > 0, tools: [["Door", "door"], ["Window", "window"]],
      hint: "Choose Door or Window, then tap on the wall where it goes. Select it afterwards to change its width or slide it along the wall." },
    { id: "items", label: "Place fittings and furniture", done: plan.items.length > 0, tools: [],
      hint: "Pick an item under “Add items” and tap the plan to place it. Drag to move it; select it to resize, turn, set its height or its price." },
    { id: "rooms", label: "Name the rooms", done: roomsNamed, tools: [["Select", "select"]],
      hint: "Choose Select and tap inside each room to give it a name (Kitchen, Bedroom 1…)." },
    { id: "report", label: "Open the report", done: false, tools: [],
      hint: "See the plan, wall elevations, 3D views and the priced schedule, then download the PDF." },
  ];
  const current = steps.find((x) => !x.done) ?? steps[steps.length - 1];
  const toolHint = tool === "wall" ? (draftStart ? "Tap the next corner · or type a length and press Enter · Close joins back to the start · Done finishes" : "Tap where the wall starts — it snaps to corners and to any point on a wall")
    : tool === "arc" ? (!draftStart ? "Tap where the curved wall starts" : !arcEnd ? "Tap where it ends (or type the chord length)" : "Tap a point the curve passes through (or type the radius)")
    : tool === "door" || tool === "window" ? `Tap on a wall to add a ${tool}`
    : tool.startsWith("item:") ? `Tap the plan to place: ${catalogItem(tool.slice(5))?.name ?? "item"}`
    : tool.startsWith("shape:") ? "Tap where the shape’s top-left corner goes"
    : tool === "pan" ? "Drag to move the view · pinch or scroll to zoom"
    : "Tap a wall, door, item or room to edit it · drag items to move them";
  const loadExample = () => {
    if ((plan.walls.length || plan.items.length) && !window.confirm("Load the example? Your current plan on this device will be replaced.")) return;
    const ex = examplePlan();
    commit(ex); setSelected(null); setStep("build"); setTool("select"); requestFit(ex);
    setMessage("Example loaded: the Mpape kitchen. Look around, tap things to see their settings, then open the report.");
  };

  const removeSelected = () => {
    if (!selected) return;
    if (selRoom) { if (selRoom.tagId) commit((pl) => ({ ...pl, tags: pl.tags.filter((t) => t.id !== selRoom.tagId) })); setSelected(null); return; }
    commit((pl) => ({ ...pl, walls: pl.walls.filter((w) => w.id !== selected), openings: pl.openings.filter((o) => o.id !== selected && o.wallId !== selected), items: pl.items.filter((i) => i.id !== selected) }));
    setSelected(null);
  };
  const rotateSelected = () => commit((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selected ? { ...i, rot: (i.rot + 90) % 360 } : i)) }));

  const finishWall = () => { setDraftStart(null); setChainStart(null); setArcEnd(null); setCursor(null); setTyped(""); setTool("select"); };
  /** Add the curved wall being drawn, with the given bulge; ready for the next one. */
  const addArc = (bulge: number | null) => {
    if (!draftStart || !arcEnd) return;
    if (bulge === null || Math.abs(bulge) < 1) { setMessage("Those three points are in a straight line — tap a point off the line to make a curve."); return; }
    const wall = { id: uid("w"), a: draftStart, b: arcEnd, thickness: 150, bulge };
    commit((pl) => ({ ...pl, walls: [...pl.walls, wall] }));
    setDraftStart(null); setArcEnd(null); setCursor(null); setTyped("");
    setMessage("Curved wall added. Tap a new start point for another, or choose another tool.");
  };
  /** Which side of the chord the pointer is on (+1 / -1), for a typed radius. */
  const chordSide = () => {
    if (!draftStart || !arcEnd || !cursor) return 1;
    const c = dist(draftStart, arcEnd) || 1, n = { x: -(arcEnd.y - draftStart.y) / c, y: (arcEnd.x - draftStart.x) / c };
    return Math.sign((cursor.x - (draftStart.x + arcEnd.x) / 2) * n.x + (cursor.y - (draftStart.y + arcEnd.y) / 2) * n.y) || 1;
  };
  /** Add a wall from the current start to `end`, then carry on from `end` (closing the loop ends the chain). */
  const addWallTo = (end: Pt) => {
    if (!draftStart || dist(draftStart, end) < 50) return;
    const wall = { id: uid("w"), a: draftStart, b: end, thickness: 150 };
    commit((pl) => ({ ...pl, walls: [...pl.walls, wall] }));
    setTyped("");
    if (chainStart && dist(end, chainStart) < 5) { setDraftStart(null); setChainStart(null); setCursor(null); return; }
    setDraftStart(end);
  };
  /** Typed length, like AutoCAD: the wall goes that far in the direction the pointer shows (right if none yet). */
  const commitTyped = () => {
    const len = Number(typed);
    if (!draftStart || !(len > 0)) return;
    if (tool === "arc") {
      if (!arcEnd) { const toward = cursor && dist(cursor, draftStart) > 1 ? cursor : { x: draftStart.x + 1, y: draftStart.y }; setArcEnd(pointAtLength(draftStart, toward, len)); setTyped(""); setMessage("Now tap a point the curve passes through (or type the radius and press Enter)."); return; }
      const b = bulgeForRadius(dist(draftStart, arcEnd), len, chordSide());
      if (b === null) { setMessage(`The radius must be at least half the chord (${Math.ceil(dist(draftStart, arcEnd) / 2)} mm).`); return; }
      addArc(b);
      return;
    }
    const toward = cursor && dist(cursor, draftStart) > 1 ? cursor : { x: draftStart.x + 1, y: draftStart.y };
    addWallTo(pointAtLength(draftStart, toward, len));
  };
  const closeChain = () => { if (draftStart && chainStart && dist(draftStart, chainStart) > 50) addWallTo(chainStart); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((tool === "wall" || tool === "arc") && draftStart) {
        if (/^[0-9]$/.test(e.key)) { setTyped((t) => (t + e.key).slice(0, 6)); e.preventDefault(); return; }
        if (e.key === "Backspace" && typed) { setTyped((t) => t.slice(0, -1)); e.preventDefault(); return; }
        if (e.key === "Enter") { if (typed) commitTyped(); else finishWall(); return; }
        if (e.key.toLowerCase() === "c" && tool === "wall") { closeChain(); return; }
      }
      if (e.key === "Escape") { finishWall(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected) removeSelected();
      if (e.key.toLowerCase() === "r" && selected) rotateSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selWall = plan.walls.find((w) => w.id === selected);
  const selOpening = plan.openings.find((o) => o.id === selected);
  const selItem = plan.items.find((i) => i.id === selected);

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
    const next = { ...plan, walls: [...plan.walls, ...outlineWalls(shapeOutline(room.shape, 0, 0, w, l))] };
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
      tags: plan.tags.map((t) => ({ ...t, ...scalePt(t) })),
    };
    commit(next); setCalib([]); setStep("build"); setTool("wall"); requestFit(next);
    setMessage("Scale set. Trace the walls: tap a corner, tap the next corner, and so on. Walls can start or end on any point of another wall.");
  };

  // ----- Step 4: report -----
  const sched = useMemo(() => schedule(plan), [plan]);
  const elevations = useMemo(() => (step === "report" ? planElevations(plan) : []), [plan, step]);
  // 3D views are made only on the report step (three.js loads on demand).
  useEffect(() => {
    if (step !== "report" || !plan.walls.length) return;
    let cancelled = false, made: string[] = [];
    setViews({ blobs: [], urls: [], state: "making" });
    import("@/lib/planner/three-view").then(({ render3dViews }) => render3dViews(plan)).then((blobs) => {
      if (cancelled) return;
      made = blobs.map((b) => URL.createObjectURL(b));
      setViews({ blobs, urls: made, state: blobs.length ? "done" : "failed" });
    }).catch(() => { if (!cancelled) setViews({ blobs: [], urls: [], state: "failed" }); });
    return () => { cancelled = true; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [step, plan]);
  const roomRows = rooms.map((r) => { const xs = r.pts.map((q) => q.x), ys = r.pts.map((q) => q.y); return { name: r.name, size: `${Math.round(Math.max(...xs) - Math.min(...xs))} × ${Math.round(Math.max(...ys) - Math.min(...ys))}`, area: r.area }; });
  const area = rooms.length ? rooms.reduce((t, r) => t + r.area, 0) : null;
  const b = bounds(plan.walls.length ? { ...plan, items: [], backdrop: null } : plan);
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
      const { planPng } = await import("@/lib/construction/design-export");
      const png = await planPngBlob();
      const pdf = await buildPlannerPdf({ title: plan.title || "My space", size: sizeText, area, height: plan.height, date: today() }, png, 1.6, sched.lines, sched.total, sched.unpriced, roomRows, views.blobs, await Promise.all(elevations.map(async (e, i) => { const svg = elevationRefs.current[i]; const vb = svg?.viewBox.baseVal; return svg && vb ? { title: `Section ${e.letter} — ${Math.round(e.length)} mm wall${e.curved ? " (curved, unrolled)" : ""}`, png: await planPng(svg, 2400), ratio: vb.width / vb.height } : null; })).then((list) => list.filter((x): x is NonNullable<typeof x> => !!x)));
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
          <ol className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[["Upload or start", "Upload a plan, or type a room size."], ["Set the scale", "Tap one known dimension on the plan."], ["Build", "Draw walls, add doors, windows and fittings."], ["Report", "Plan, elevations, 3D and prices — download the PDF."]].map(([t, d], i) => (
              <li key={t} className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="text-xs font-bold text-[var(--cx-gold)]">Step {i + 1}</span><p className="font-semibold">{t}</p><p className="text-xs text-white/70">{d}</p></li>
            ))}
          </ol>
        ) : null}
        {step === "start" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--cx-gold)]/40 bg-[var(--cx-gold)]/10 p-4">
            <p className="text-sm"><b>New here?</b> Open a finished example — a kitchen in a 2-bedroom apartment in Mpape — and see how it works.</p>
            <button type="button" onClick={loadExample} className={`${btn} bg-[var(--cx-gold)] text-[#0A1A2F]`}><Lightbulb className="h-4 w-4" />Load example</button>
          </div>
        ) : null}
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

        {step === "scale" ? (
          <div className="mb-3 rounded-2xl border border-[var(--cx-gold)]/40 bg-[var(--cx-panel)] p-3 md:p-4">
            <p className="text-sm font-semibold">Set the scale <span className="font-normal text-white/70">({calib.length}/2 points tapped)</span></p>
            <p className="text-sm text-white/80">Find a line on your plan with a dimension written on it. Tap both ends, type that dimension, then press Apply. You can also skip this and draw to typed sizes.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input aria-label="Real length in millimetres" inputMode="numeric" placeholder="Length in mm, e.g. 3000" value={calibLength} onChange={(e) => setCalibLength(e.target.value.replace(/\D/g, ""))} className="w-48 rounded-lg bg-white px-3 py-2 text-sm text-[#0A1A2F] outline-none" />
              <button type="button" onClick={applyScale} disabled={calib.length !== 2 || !calibLength} className={`${btn} bg-[var(--cx-gold)] text-[#0A1A2F]`}>Apply scale</button>
              <button type="button" onClick={() => setCalib([])} className={`${btn} bg-white/10`}>Clear points</button>
              <button type="button" onClick={() => { setStep("build"); setTool("wall"); }} className={`${btn} bg-white/5 text-white/80`}>Skip</button>
            </div>
          </div>
        ) : null}
        {step === "build" ? (
          <div className="mb-3 rounded-2xl border border-[var(--cx-gold)]/40 bg-[var(--cx-panel)] p-3 md:p-4">
            <div className="flex flex-wrap gap-1.5">
              {steps.map((x, i) => (
                <span key={x.id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${x === current ? "bg-[var(--cx-gold)] text-[#0A1A2F]" : x.done ? "bg-white/10 text-white" : "bg-white/5 text-white/50"}`}>{x.done ? <Check className="h-3 w-3" /> : `${i + 1}.`} {x.label}</span>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold">Next: {current.label}</p>
            <p className="text-sm text-white/80">{current.hint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {current.tools.map(([label, t]) => <button key={label} type="button" onClick={() => { setTool(t); setDraftStart(null); setArcEnd(null); setCursor(null); }} className={`${btn} ${tool === t ? "bg-[var(--cx-gold)] text-[#0A1A2F]" : "bg-white/10"}`}>{label}</button>)}
              {current.id === "items" ? <button type="button" onClick={() => document.getElementById("items-card")?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`${btn} bg-white/10`}>Show items</button> : null}
              {current.id === "report" || current.id === "rooms" ? <button type="button" onClick={() => goto("report")} className={`${btn} ${current.id === "report" ? "bg-[var(--cx-gold)] text-[#0A1A2F]" : "bg-white/5 text-white/80"}`}><FileText className="h-4 w-4" />{current.id === "report" ? "See report" : "Skip to report"}</button> : null}
            </div>
          </div>
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
                    {toolBtn("arc", "Curved wall", Spline)}
                    {toolBtn("door", "Door", DoorOpen)}
                    {toolBtn("window", "Window", AppWindow)}
                    {tool === "wall" || (tool === "arc" && !arcEnd) ? <button type="button" onClick={() => setOrtho((o) => !o)} aria-pressed={ortho} title="Ortho: keep walls straight (off = 15° steps)" className={`${btn} ${ortho ? "bg-white/20 text-white" : "bg-white/5 text-white/60"}`}>Ortho {ortho ? "on" : "off"}</button> : null}
                    {(tool === "wall" || tool === "arc") && draftStart ? (
                      <>
                        <label className="flex items-center gap-1 rounded-lg bg-white/10 px-2 text-xs font-bold">{tool === "arc" ? (arcEnd ? "Radius" : "Chord") : "Length"}
                          <input aria-label="Wall length in millimetres" inputMode="numeric" placeholder="mm" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter") commitTyped(); }} className="w-20 rounded bg-white px-2 py-1 text-sm text-[#0A1A2F] outline-none" />
                        </label>
                        <button type="button" onClick={commitTyped} disabled={!typed} className={`${btn} bg-white/10`}>Add</button>
                        {tool === "wall" ? <button type="button" onClick={closeChain} className={`${btn} bg-white/10`}>Close</button> : null}
                        <button type="button" onClick={finishWall} className={`${btn} bg-white text-[#0A1A2F]`}>Done</button>
                      </>
                    ) : null}
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
                {step === "build" ? <p className="pointer-events-none absolute left-2 top-2 z-10 max-w-[90%] rounded-lg bg-[#0A1A2F]/85 px-3 py-1.5 text-xs font-semibold text-white">{toolHint}</p> : null}
                <PlanSvg
                  ref={svgRef}
                  plan={plan}
                  box={viewBox}
                  selected={selected}
                  draft={tool === "arc" && draftStart && arcEnd ? { a: draftStart, b: arcEnd, bulge: (typed ? bulgeForRadius(dist(draftStart, arcEnd), Number(typed), chordSide()) : cursor ? bulgeThrough(draftStart, arcEnd, cursor) : null) ?? undefined } : draftStart && cursor ? { a: draftStart, b: typed && dist(cursor, draftStart) > 1 ? pointAtLength(draftStart, cursor, Number(typed)) : cursor } : null}
                  rooms={rooms}
                  snap={tool === "wall" || tool.startsWith("shape:") ? snap : null}
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
                      <h2 className="font-semibold">Room · {selRoom.area.toFixed(1)} m²</h2>
                      <label className="block text-xs font-bold text-white/80">Name<input className={field} value={selRoom.name} onChange={(e) => renameRoom(e.target.value)} /></label>
                      <p className="text-[11px] text-white/60">Rooms are found automatically from closed walls. Move or add walls to change a room; its area updates by itself.</p>
                    </div>
                  ) : null}
                  {selWall ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold">{selWall.bulge ? "Curved wall" : "Wall"}</h2>
                      {(() => { const arc = arcOf(selWall); return arc ? (
                        <div className="space-y-3">
                          <p className="text-xs text-white/75">Arc length {Math.round(arc.length)} mm · chord {Math.round(arc.chord)} mm</p>
                          <label className="block text-xs font-bold text-white/80">Radius (mm)<input className={field} inputMode="numeric" key={`r-${selWall.id}-${Math.round(arc.r)}`} defaultValue={Math.round(arc.r)} onBlur={(e) => { const b = bulgeForRadius(arc.chord, Number(e.target.value), Math.sign(arc.bulge), Math.abs(arc.bulge) > arc.r); if (b === null) { setMessage(`The radius must be at least ${Math.ceil(arc.chord / 2)} mm for this wall.`); return; } commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, bulge: b } : w)) })); }} /></label>
                          <label className="block text-xs font-bold text-white/80">Bulge (mm, + / − flips the side)<input className={field} inputMode="numeric" key={`b-${selWall.id}-${Math.round(arc.bulge)}`} defaultValue={Math.round(arc.bulge)} onBlur={(e) => { const v = Number(e.target.value.replace(/[^0-9-]/g, "")); commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, bulge: v || 0 } : w)) })); }} /></label>
                          <button type="button" onClick={() => commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, bulge: 0 } : w)) }))} className={`${btn} w-full bg-white/5`}>Make straight</button>
                        </div>
                      ) : <button type="button" onClick={() => commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, bulge: Math.round(wallLength(w) / 5) } : w)) }))} className={`${btn} w-full bg-white/5`}><Spline className="h-4 w-4" />Make curved</button>; })()}
                      <label className="block text-xs font-bold text-white/80">Length (mm)<input className={field} inputMode="numeric" key={`l-${selWall.id}-${Math.round(wallLength(selWall))}`} defaultValue={Math.round(wallLength(selWall))} onBlur={(e) => { const v = Number(e.target.value); if (v > 50) commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? withLength(w, v) : w)) })); }} /></label>
                      <label className="block text-xs font-bold text-white/80">Thickness (mm)<input className={field} inputMode="numeric" value={selWall.thickness} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); commit((pl) => ({ ...pl, walls: pl.walls.map((w) => (w.id === selWall.id ? { ...w, thickness: v || 0 } : w)) })); }} /></label>
                    </div>
                  ) : null}
                  {selOpening ? (
                    <div className="space-y-3">
                      <h2 className="font-semibold capitalize">{selOpening.kind}</h2>
                      <label className="block text-xs font-bold text-white/80">Width (mm)<input className={field} inputMode="numeric" value={selOpening.width} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); commit((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, width: v || 0 } : o)) })); }} /></label>
                      {selOpening.kind === "door" ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => commit((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, swing: (o.swing ?? 1) === 1 ? -1 : 1 } : o)) }))} className={`${btn} bg-white/10`}>Flip side</button>
                          <button type="button" onClick={() => commit((pl) => ({ ...pl, openings: pl.openings.map((o) => (o.id === selOpening.id ? { ...o, hinge: o.hinge ? 0 : 1 } : o)) }))} className={`${btn} bg-white/10`}>Swap hinge</button>
                        </div>
                      ) : null}
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
                      <label className="block text-xs font-bold text-white/80">Height above floor (mm)<input className={field} inputMode="numeric" value={itemMount(selItem)} onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); setPlan((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selItem.id ? { ...i, mount: v } : i)) })); }} /></label>
                      {priceField(selItem.price, marketPrice(catalogItem(selItem.type)?.priceId)?.rate ?? null, (v) => commit((pl) => ({ ...pl, items: pl.items.map((i) => (i.id === selItem.id ? { ...i, price: v } : i)) })))}
                      <button type="button" onClick={rotateSelected} className={`${btn} w-full bg-white/5`}><RotateCw className="h-4 w-4" />Turn 90°</button>
                    </div>
                  ) : null}
                  {selRoom && !selRoom.tagId ? null : <button type="button" onClick={removeSelected} className={`${btn} mt-3 w-full bg-[#8A1A10]/30 text-white hover:bg-[#8A1A10]/50`}><Trash2 className="h-4 w-4" />{selRoom ? "Clear name" : "Delete"}</button>}
                </div>
              ) : null}

              {step === "build" ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-4">
                  <h2 className="font-semibold">Draw a shape</h2>
                  <p className="mt-1 text-xs text-white/65">Type the size, pick a shape, then tap where its top-left corner goes. It draws ordinary walls you can edit.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-xs font-bold text-white/80">Width<input className={field} inputMode="numeric" value={shapeSize.w} onChange={(e) => setShapeSize({ ...shapeSize, w: e.target.value.replace(/\D/g, "") })} /></label>
                    <label className="text-xs font-bold text-white/80">Length<input className={field} inputMode="numeric" value={shapeSize.l} onChange={(e) => setShapeSize({ ...shapeSize, l: e.target.value.replace(/\D/g, "") })} /></label>
                    {CUT_LABELS[(tool.startsWith("shape:") ? tool.slice(6) : "rect") as RoomShape] ? (CUT_LABELS[tool.slice(6) as RoomShape] ?? []).map((label, idx) => (
                      <label key={label} className="text-xs font-bold text-white/80">{label}<input className={field} inputMode="numeric" placeholder={String(defaultCuts(tool.slice(6) as RoomShape, Number(shapeSize.w) || 0, Number(shapeSize.l) || 0)[idx ? "b" : "a"])} value={idx ? shapeSize.b : shapeSize.a} onChange={(e) => setShapeSize({ ...shapeSize, [idx ? "b" : "a"]: e.target.value.replace(/\D/g, "") })} /></label>
                    )) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {SHAPES.map((sh) => (
                      <button key={sh} type="button" onClick={() => { setTool(`shape:${sh}`); setMessage(`Tap where the top-left corner of the ${SHAPE_LABEL[sh].toLowerCase()} goes. It snaps to walls.`); }} aria-pressed={tool === `shape:${sh}`} className={`rounded-lg border px-1 py-2 text-xs font-bold ${tool === `shape:${sh}` ? "border-[var(--cx-gold)] bg-[var(--cx-gold)]/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <svg viewBox="0 0 40 30" className="mx-auto mb-1 h-6 w-8" fill="none" stroke="currentColor" strokeWidth="3"><polygon points={sh === "L" ? "2,2 20,2 20,15 38,15 38,28 2,28" : sh === "T" ? "2,2 38,2 38,12 26,12 26,28 14,28 14,12 2,12" : sh === "U" ? "2,2 14,2 14,16 26,16 26,2 38,2 38,28 2,28" : "2,2 38,2 38,28 2,28"} /></svg>
                        {SHAPE_LABEL[sh].replace("-shape", "")}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === "build" ? (
                <div id="items-card" className="rounded-2xl border border-white/10 bg-[var(--cx-panel)] p-4">
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
                  <p className="mt-3 text-white/75">{rooms.length ? `${rooms.length} room${rooms.length > 1 ? "s" : ""} · ` : ""}{plan.walls.length} walls · {plan.openings.length} doors/windows · {plan.items.length} items{area ? ` · ${area.toFixed(1)} m²` : ""}</p>
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
                  <PlanSvg ref={reportSvg} plan={plan} box={reportBox} rooms={rooms} markers={elevations.map((e) => ({ letter: e.letter, at: e.marker.at, look: e.marker.look }))} showBackdrop={false} className="h-auto w-full" />
                  <p className="mt-1 text-center text-xs text-[#5A6675]">Floor plan · dimensions in millimetres · not to scale</p>
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#0D3352]">3D views</h3>
                {views.state === "making" ? <p className="mt-2 text-sm text-[#5A6675]">Making the 3D views…</p> : null}
                {views.state === "failed" ? <p className="mt-2 text-sm text-[#8A1A10]">3D views could not be made in this browser. The plan, elevations and schedule are unaffected.</p> : null}
                {views.urls.length ? <div className="mt-2 grid gap-3 md:grid-cols-2">{views.urls.map((u, i) => <img key={u} src={u} alt={i ? "3D cutaway view, walls cut at 1.2 m" : "Aerial 3D view"} className="w-full rounded-lg border border-[#DDE1E7]" />)}</div> : null}
                <p className="mt-1 text-xs text-[#5A6675]">Indicative massing: items shown as blocks at their mounting heights.</p>
                {elevations.length ? (
                  <>
                    <h3 className="mt-6 text-lg font-bold text-[#0D3352]">Wall elevations</h3>
                    <p className="text-xs text-[#5A6675]">Each wall as seen from inside the room; the lettered markers on the plan show where you stand. Dimensions in millimetres.</p>
                    <div className="mt-2 space-y-4">
                      {elevations.map((e, i) => (
                        <div key={e.letter} className="rounded-lg border border-[#DDE1E7] p-2">
                          <p className="text-sm font-bold text-[#0D3352]">Section {e.letter} — {Math.round(e.length)} mm wall{e.curved ? " (curved, shown unrolled)" : ""}</p>
                          <ElevationSvg ref={(el) => { elevationRefs.current[i] = el; }} e={e} className="h-auto w-full" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {roomRows.length ? (
                  <>
                    <h3 className="mt-6 text-lg font-bold text-[#0D3352]">Rooms</h3>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-sm">
                        <thead><tr className="bg-[#0D3352] text-left text-white">{["Room", "Overall size (mm)", "Floor area"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
                        <tbody>{roomRows.map((r, i) => <tr key={i} className={i % 2 ? "bg-[#F6F7F9]" : ""}><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2">{r.size}</td><td className="px-3 py-2">{r.area.toFixed(1)} m²</td></tr>)}</tbody>
                        <tfoot><tr className="border-t-2 border-[#0D3352] font-bold text-[#0D3352]"><td className="px-3 py-2" colSpan={2}>Total floor area</td><td className="px-3 py-2">{roomRows.reduce((t, r) => t + r.area, 0).toFixed(1)} m²</td></tr></tfoot>
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
