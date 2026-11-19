"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { acquireSceneReadOnlyLease, useScene } from "@pascal-app/core";
import { useViewer, Viewer } from "@pascal-app/viewer";
import { Html, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ArrowRight, Download, Eye, Film, FileText, Footprints, Image as ImageIcon, LayoutGrid, Pause, Play, Home, MapPin, Moon, PencilRuler, RotateCcw, Shuffle, Sofa, Sun, Sunset, Trees, X } from "lucide-react";

import { priceDesign } from "@/lib/construction/design-takeoff";
import PlanDrawing from "./plan-drawing";
import CaptureBridge, { type CaptureFn } from "./capture-bridge";
import { brandedImage, buildPdf, isBlankFrame, buildVideo, download, fileName, planPng, type ExportInfo, type StageFrame } from "@/lib/construction/design-export";
import { BUILD_STAGES, costToStage, LAST_STAGE, stageNodes } from "@/lib/construction/build-stages";
import {
  FLOOR_FINISHES,
  generateHouseScene,
  normaliseHouse,
  QUICK_LIMITS,
  QUICK_PRESETS,
  randomHouse,
  ROOF_FINISHES,
  sizeLimits,
  WALL_FINISHES,
  type QuickHouse,
} from "@/lib/construction/quick-house";
import { RATE_LOCATIONS, ZONES } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const PARAMS_KEY = "charismak-quick-house-v3";

type Scene = ReturnType<typeof generateHouseScene>;

function Slider({ label, value, unit, min, max, step = 1, onChange }: { label: string; value: number; unit?: string; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs text-white/70">
        <span>{label}</span>
        <strong className="font-mono text-sm text-white">{value}{unit}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1.5 w-full accent-[#D9B26A]" />
    </label>
  );
}

function Swatches<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: readonly { id: V; label: string; swatch: string }[]; onChange: (value: V) => void }) {
  const current = options.find((option) => option.id === value);
  return (
    <div>
      <span className="flex items-baseline justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="text-white">{current?.label}</span>
      </span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${value === option.id ? "scale-110 border-[#F2C879] ring-2 ring-[#F2C879]/40" : "border-white/20"}`}
            style={{ background: option.swatch }}
          />
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, label, icon, onChange }: { on: boolean; label: string; icon: React.ReactNode; onChange: (on: boolean) => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-bold transition ${on ? "bg-[#D9B26A] text-[#02080F]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
      {icon} {label}
    </button>
  );
}

/** Frames the whole house whenever its size changes. */
function FitCamera({ width, length, floors, inside = false }: { width: number; length: number; floors: number; inside?: boolean }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null;
  useEffect(() => {
    if (inside) {
      // Close, steep view straight into the rooms.
      const d = Math.max(width, length) * 0.75 + 3;
      camera.position.set(d * 0.25, d * 1.05 + floors * 3, -d * 0.55);
      controls?.target?.set(0, (floors - 1) * 3.3, 0);
    } else {
      const d = Math.max(width, length) * 1.1 + floors * 2 + 8;
      camera.position.set(d * 0.8, d * 0.7 + floors * 1.5, -d * 0.95);
      controls?.target?.set(0, (floors * 3) / 2, 0);
    }
    controls?.update?.();
  }, [camera, controls, width, length, floors, inside]);
  return null;
}

/** Room names floating over each space of the floor being viewed. */
function RoomLabels({ nodes, floor }: { nodes: Scene["nodes"]; floor: number }) {
  const labels = useMemo(() => {
    return Object.values(nodes)
      .filter((node) => node.type === "zone" && node.parentId && Number(nodes[node.parentId]?.level ?? 0) === floor)
      .map((node) => {
        const points = node.polygon as [number, number][];
        let a = 0, cx = 0, cz = 0;
        points.forEach(([x1, z1], i) => {
          const [x2, z2] = points[(i + 1) % points.length];
          const cross = x1 * z2 - x2 * z1;
          a += cross;
          cx += (x1 + x2) * cross;
          cz += (z1 + z2) * cross;
        });
        return { id: node.id, name: String(node.name), x: cx / (3 * a), z: cz / (3 * a) };
      });
  }, [nodes, floor]);
  return (
    <>
      {labels.map((label) => (
        <Html key={label.id} position={[label.x, floor * 3.3 + 1.2, label.z]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">{label.name}</span>
        </Html>
      ))}
    </>
  );
}

/** Simple mode: pick a house, style it, see inside, and watch the price change. */
export default function QuickDesign({ onAdvanced }: { onAdvanced: (scene: Scene) => void }) {
  const [house, setHouse] = useState<QuickHouse>(QUICK_PRESETS[1].house);
  const [presetId, setPresetId] = useState<string | null>(QUICK_PRESETS[1].id);
  const [inside, setInside] = useState(false);
  const [viewFloor, setViewFloor] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<"midday" | "golden" | "night">("midday");
  const [walking, setWalking] = useState(false);
  const [view, setView] = useState<"split" | "3d" | "plan">("split");
  const [planFloor, setPlanFloor] = useState(0);
  const [stage, setStage] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  // Play construction: one stage every 2.8 s, then hold the finished building.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStage((current) => {
        const next = (current ?? -1) + 1;
        if (next >= LAST_STAGE) { setPlaying(false); return LAST_STAGE; }
        return next;
      });
    }, 2800);
    return () => window.clearInterval(timer);
  }, [playing]);

  // Branded downloads, all made in the browser.
  const captureRef = useRef<CaptureFn | null>(null);
  const onCaptureReady = useCallback((capture: CaptureFn | null) => { captureRef.current = capture; }, []);
  const planRefs = useRef<(SVGSVGElement | null)[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const [location, chooseLocation] = useRateLocation();
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PARAMS_KEY) ?? "null");
      if (saved && typeof saved === "object") {
        setHouse(normaliseHouse(saved as QuickHouse));
        setPresetId(null);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  // Sliders stay instant; the 3D house rebuilds from the deferred value so dragging stays smooth.
  const deferredHouse = useDeferredValue(house);
  const scene = useMemo(() => generateHouseScene(deferredHouse), [deferredHouse]);
  const takeoff = useMemo(() => priceDesign(scene.nodes as never, location), [scene, location]);

  // What the viewer shows: "see inside" lifts the roof and ceilings and hides floors above the chosen one.
  const shown = useMemo(() => {
    const base = stage === null ? scene.nodes : stageNodes(scene.nodes, stage, { width: deferredHouse.width / 2, length: deferredHouse.length / 2 });
    if (!inside && !walking) {
      // Roof on: indoor furniture is hidden (some models draw through the roof otherwise; it is covered anyway).
      const halfW = deferredHouse.width / 2;
      const halfL = deferredHouse.length / 2;
      const copy: typeof scene.nodes = {};
      for (const [id, node] of Object.entries(base)) {
        const [x = 0, , z = 0] = (node.position as number[] | undefined) ?? [];
        const indoor = node.type === "item" && Math.abs(x) < halfW && Math.abs(z) < halfL;
        copy[id] = indoor && (stage === null || stage >= LAST_STAGE) ? { ...node, visible: false } : node;
      }
      return copy;
    }
    if (!inside) return base;
    const levelOf = (id: string | null): number => {
      let node = id ? scene.nodes[id] : undefined;
      for (let guard = 0; node && guard < 10; guard += 1) {
        if (node.type === "level") return Number(node.level ?? 0);
        node = node.parentId ? scene.nodes[node.parentId] : undefined;
      }
      return 0;
    };
    const copy: typeof scene.nodes = {};
    for (const [id, node] of Object.entries(base)) {
      const hide = node.type === "roof" || node.type === "ceiling" || (node.type === "level" && Number(node.level) > viewFloor) || (node.type !== "level" && levelOf(node.parentId) > viewFloor);
      copy[id] = hide ? { ...node, visible: false } : node;
    }
    return copy;
  }, [scene, inside, viewFloor, walking, deferredHouse.width, deferredHouse.length, stage]);

  useEffect(() => {
    const release = acquireSceneReadOnlyLease();
    return () => {
      useViewer.getState().setWalkthroughMode(false);
      release();
    };
  }, []);
  // Viewer modes: cut the walls down to see inside, light, and the first-person walk.
  useEffect(() => {
    // Walls always stand full height; "see inside" lifts the roof and ceilings instead of cutting walls.
    useViewer.getState().setWallMode("up");
  }, [inside]);
  useEffect(() => {
    useViewer.getState().setTimeOfDay(timeOfDay as never);
  }, [timeOfDay]);
  useEffect(() => {
    const viewer = useViewer.getState();
    if (walking) {
      viewer.setWalkthroughInputMode(window.matchMedia?.("(pointer: coarse)").matches ? "touch" : "desktop");
      viewer.setWalkthroughMode(true);
    } else {
      viewer.setWalkthroughMode(false);
    }
  }, [walking]);
  useEffect(() => {
    useScene.getState().setScene(shown as never, scene.rootNodeIds as never, {
      materials: scene.materials as never,
      collections: scene.collections as never,
      installedPlugins: scene.installedPlugins as never,
    });
  }, [shown, scene]);
  useEffect(() => {
    try {
      window.localStorage.setItem(PARAMS_KEY, JSON.stringify(scene.house));
    } catch {
      // storage unavailable
    }
  }, [scene]);

  const change = (patch: Partial<QuickHouse>) => {
    setPresetId(null);
    setHouse((current) => normaliseHouse({ ...current, ...patch }));
  };

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of takeoff.lines) map.set(line.group, (map.get(line.group) ?? 0) + line.amount);
    return Array.from(map.entries());
  }, [takeoff]);
  const furniture = Object.values(scene.nodes).filter((node) => node.type === "item").length;
  const bedrooms = Object.values(scene.nodes).filter((node) => node.type === "zone" && /bedroom/i.test(String(node.name))).length;
  const limits = sizeLimits(house.plan);
  const exportInfo = (): ExportInfo => ({
    title: currentPreset?.label ?? "Charismak design",
    size: `${house.width} × ${house.length} m · ${house.floors} floor${house.floors > 1 ? "s" : ""}`,
    summary: currentPreset?.summary ?? "",
    floorArea: takeoff.floorArea,
    total: takeoff.total,
    location: location.name,
    groups,
    rooms: scene.plan.floors.flatMap((floor) => floor.rooms.map((room) => {
      const poly = room.poly.map(([x, y]) => [x * (house.width / (scene.plan.W + 0.23)), y * (house.length / (scene.plan.L + 0.23))]);
      return { name: room.name, area: Math.abs(poly.reduce((acc, [x1, y1], i) => { const [x2, y2] = poly[(i + 1) % poly.length]; return acc + x1 * y2 - x2 * y1; }, 0)) / 2 };
    })),
  });
  const plansAsPng = async () => (await Promise.all(planRefs.current.slice(0, house.floors).map((svg) => (svg ? planPng(svg) : null)))).filter(Boolean) as Blob[];
  const captureStages = async (): Promise<StageFrame[]> => {
    const capture = captureRef.current;
    if (!capture) return [];
    setInside(false); setWalking(false); setPlaying(false);
    const frames: StageFrame[] = [];
    for (let i = 0; i < BUILD_STAGES.length; i += 1) {
      setStage(i);
      setBusy(`Filming stage ${i + 1} of ${BUILD_STAGES.length}…`);
      await wait(i === 0 ? 2500 : 1800);
      // A frame caught mid-rebuild comes out blank (a tiny PNG): give it more time and try again.
      let image = await capture();
      for (let attempt = 0; attempt < 5 && (!image || (await isBlankFrame(image))); attempt += 1) {
        await wait(1500);
        image = await capture();
      }
      if (image && !(await isBlankFrame(image))) frames.push({ image, title: BUILD_STAGES[i].title, note: BUILD_STAGES[i].note, spent: costToStage(takeoff.lines, i) });
    }
    setStage(null);
    return frames;
  };
  const run = async (label: string, job: () => Promise<void>, wide = true) => {
    if (busy) return;
    setBusy(label);
    const before = view;
    try {
      // Photograph the full-width 3D view, then put the screen back as it was.
      if (wide && view !== "3d") { setView("3d"); await wait(1500); }
      await job();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Download failed. Please try again.");
    } finally {
      setView(before);
      setBusy(null);
    }
  };
  const downloadImage = () => run("Preparing image…", async () => {
    let shot = await captureRef.current?.();
    if (shot && (await isBlankFrame(shot))) { await wait(1500); shot = await captureRef.current?.(); }
    if (!shot) throw new Error("Could not capture the 3D view. Switch to the 3D view and try again.");
    download(await brandedImage(shot, exportInfo()), fileName(exportInfo().title, "png"));
  });
  const downloadPlan = () => run("Preparing plan…", async () => {
    const plans = await plansAsPng();
    plans.forEach((plan, i) => download(plan, fileName(`${exportInfo().title}-plan${plans.length > 1 ? `-floor-${i + 1}` : ""}`, "png")));
  }, false);
  const downloadPdf = () => run("Preparing PDF…", async () => {
    const info = exportInfo();
    const hero = await captureRef.current?.() ?? null;
    const plans = await plansAsPng();
    const stages = await captureStages();
    setBusy("Writing PDF…");
    download(await buildPdf(info, hero, plans, stages), fileName(info.title, "pdf"));
  });
  const downloadVideo = () => run("Preparing video…", async () => {
    const info = exportInfo();
    const frames = await captureStages();
    if (!frames.length) throw new Error("Could not capture the 3D view. Switch to the 3D view and try again.");
    setBusy("Recording video (about 20 s)…");
    const video = await buildVideo(info, frames);
    download(video.blob, fileName(`${info.title}-construction`, video.ext));
  });
  const currentPreset = QUICK_PRESETS.find((preset) => preset.id === house.plan);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="order-2 min-h-0 w-full flex-1 overflow-y-auto border-t border-white/10 bg-[#071A2E] p-4 text-white lg:order-1 lg:w-[380px] lg:flex-none lg:border-r lg:border-t-0">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 1 · Pick a building</p>
          <button type="button" onClick={() => { setPresetId(null); setHouse(randomHouse()); }} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D9B26A] to-[#F29644] px-3 py-1 text-[11px] font-bold text-[#02080F] shadow hover:brightness-110">
            <Shuffle className="h-3.5 w-3.5" /> Surprise me
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => { setPresetId(preset.id); setHouse(preset.house); setViewFloor(0); }} aria-pressed={house.plan === preset.id} className={`rounded-lg border p-2.5 text-left transition ${house.plan === preset.id ? "border-[#D9B26A] bg-[#D9B26A]/15" : "border-white/10 bg-white/[0.03] hover:border-white/30"}`}>
              <Home className="h-4 w-4 text-[#D9B26A]" />
              <strong className="mt-1 block text-sm">{preset.label}</strong>
              <span className="text-[11px] text-white/50">{preset.note}</span>
            </button>
          ))}
        </div>

        {currentPreset ? <p className="mt-2 text-[11px] leading-5 text-white/55"><strong className="text-white/80">{currentPreset.label}:</strong> {currentPreset.summary}. Every room, toilet and the compound are drawn; tap “See inside” to look around.</p> : null}

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 2 · Shape it</p>
        <div className="mt-2 space-y-3">
          <Slider label="Width" value={house.width} unit=" m" min={limits.width[0]} max={limits.width[1]} step={0.5} onChange={(width) => change({ width })} />
          <Slider label="Length" value={house.length} unit=" m" min={limits.length[0]} max={limits.length[1]} step={0.5} onChange={(length) => change({ length })} />
          <Slider label="Roof steepness" value={house.roofPitch} unit="°" min={QUICK_LIMITS.roofPitch[0]} max={QUICK_LIMITS.roofPitch[1]} onChange={(roofPitch) => change({ roofPitch })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-white/70">Floors</span>
              <p className="mt-1 rounded-md bg-white/5 px-2 py-1.5 text-xs font-bold text-white/80">{house.floors} (set by the plan)</p>
            </div>
            <div>
              <span className="text-xs text-white/70">Roof</span>
              <div className="mt-1 flex rounded-md bg-white/5 p-0.5">
                {(["gable", "hip"] as const).map((roofType) => (
                  <button key={roofType} type="button" onClick={() => change({ roofType })} aria-pressed={house.roofType === roofType} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold capitalize ${house.roofType === roofType ? "bg-[#D9B26A] text-[#02080F]" : "text-white/70"}`}>{roofType}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 3 · Style it</p>
        <div className="mt-2 space-y-3">
          <Swatches label="Walls" value={house.walls} options={WALL_FINISHES} onChange={(walls) => change({ walls })} />
          <Swatches label="Roof" value={house.roof} options={ROOF_FINISHES} onChange={(roof) => change({ roof })} />
          <Swatches label="Floors" value={house.floor} options={FLOOR_FINISHES} onChange={(floor) => change({ floor })} />
          <div className="flex gap-2">
            <Toggle on={house.furnished} label="Furniture" icon={<Sofa className="h-3.5 w-3.5" />} onChange={(furnished) => change({ furnished })} />
            <Toggle on={house.outdoor} label="Garden & fence" icon={<Trees className="h-3.5 w-3.5" />} onChange={(outdoor) => change({ outdoor })} />
          </div>
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 4 · See the cost</p>
        <label className="relative mt-2 block">
          <span className="sr-only">State for prices</span>
          <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#D9B26A]" />
          <select value={location.id} onChange={(event) => chooseLocation(event.target.value)} className="h-9 w-full rounded-md border border-white/15 bg-white/10 pl-9 pr-3 text-sm text-white outline-none [&_optgroup]:bg-[#071A2E] [&_option]:bg-[#071A2E]">
            {ZONES.map((zone) => (
              <optgroup key={zone} label={zone}>
                {RATE_LOCATIONS.filter((loc) => loc.zone === zone).map((loc) => <option key={loc.id} value={loc.id}>{loc.name}{loc.status === "provisional" ? " (provisional)" : ""}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="mt-3 rounded-lg border border-[#D9B26A]/40 bg-gradient-to-br from-[#D9B26A]/15 to-transparent p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Estimated building cost</p>
          <p className="text-3xl font-bold text-[#F2C879]">{money(takeoff.total)}</p>
          <p className="text-xs text-white/60">{takeoff.floorArea} m² · ≈ {money(takeoff.total / Math.max(1, takeoff.floorArea))}/m² · {bedrooms} bedroom{bedrooms === 1 ? "" : "s"} · {furniture} items placed</p>
          <button type="button" onClick={() => setShowBreakdown((value) => !value)} className="mt-2 text-xs font-bold text-[#F2C879] underline">
            {showBreakdown ? "Hide what’s included" : "Show what’s included"}
          </button>
          {showBreakdown ? (
            <ul className="mt-2 space-y-1 text-xs text-white/70">
              {groups.map(([group, amount]) => <li key={group} className="flex justify-between gap-2"><span>{group}</span><span className="font-mono">{money(amount)}</span></li>)}
            </ul>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-white/45">
          Quick budget from Charismak Rate Bank rates: foundations, floors (and tiles if chosen), walls, plaster, paint, roof, ceilings and fitting doors/windows. Furniture, columns, beams, stairs, electrical, plumbing, external works and contractor margin are not included.
        </p>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 5 · Download (Charismak branded)</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([["PDF report", FileText], ["3D image", ImageIcon], ["Floor plan", LayoutGrid], ["Build video", Film]] as const).map(([label, Icon]) => (
            <button key={label} type="button" disabled={Boolean(busy)} onClick={() => void (label === "PDF report" ? downloadPdf() : label === "3D image" ? downloadImage() : label === "Floor plan" ? downloadPlan() : downloadVideo())} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-2 text-xs font-bold text-white hover:border-[#D9B26A] disabled:opacity-50">
              <Icon className="h-3.5 w-3.5 text-[#D9B26A]" /> {label}
            </button>
          ))}
        </div>
        {busy ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#F2C879]"><Download className="h-3.5 w-3.5 animate-bounce" /> {busy}</p> : null}

        <div className="mt-4 grid gap-2">
          <Link href="/quote" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#D9B26A] px-3 py-2.5 text-sm font-bold text-[#02080F] hover:bg-[#F2C879]">
            Get a proper quote <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => onAdvanced(scene)} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2.5 text-sm font-bold text-white hover:border-white/50">
            <PencilRuler className="h-4 w-4" /> Edit freely (advanced editor)
          </button>
          <button type="button" onClick={() => { setPresetId(QUICK_PRESETS[1].id); setHouse(QUICK_PRESETS[1].house); setInside(false); }} className="inline-flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> Start again
          </button>
        </div>
      </aside>

      <div className="order-1 flex w-full shrink-0 flex-col lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1 lg:flex-row">
      <div className={`relative h-[46vh] min-h-[280px] w-full lg:h-auto ${view === "plan" ? "hidden" : "lg:flex-1"}`}>
        <Viewer>
          <CaptureBridge onReady={onCaptureReady} />
          {walking ? null : (
            <>
              <OrbitControls makeDefault target={[0, 2, 0]} enableDamping maxPolarAngle={Math.PI * 0.49} />
              {inside ? <RoomLabels nodes={scene.nodes} floor={viewFloor} /> : null}
              <FitCamera width={deferredHouse.width} length={deferredHouse.length} floors={inside ? viewFloor + 1 : deferredHouse.floors} inside={inside} />
            </>
          )}
        </Viewer>
        {walking ? (
          <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">Walking inside · arrow keys / WASD to move, mouse to look (on phones use the on-screen controls)</span>
            <button type="button" onClick={() => setWalking(false)} className="inline-flex items-center gap-1.5 rounded-full bg-[#D9B26A] px-3 py-1.5 text-xs font-bold text-[#02080F]">
              <X className="h-3.5 w-3.5" /> Stop walking
            </button>
          </div>
        ) : null}
        <div className={`absolute left-3 top-3 flex flex-wrap gap-2 ${walking ? "hidden" : ""}`}>
          <div className="flex rounded-full bg-black/60 p-0.5 backdrop-blur" role="group" aria-label="View">
            {([["split", "3D + plan"], ["3d", "3D"], ["plan", "Plan"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`rounded-full px-2.5 py-1 text-xs font-bold ${view === id ? "bg-white text-[#02080F]" : "text-white/80"}`}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => { setInside(false); setStage(0); setPlaying(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#0E7C66] px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:brightness-110">
            <Play className="h-3.5 w-3.5" /> {stage !== null && stage < LAST_STAGE ? "Restart build" : "Play construction"}
          </button>
          <button type="button" onClick={() => setWalking(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D9B26A] to-[#F29644] px-3 py-1.5 text-xs font-bold text-[#02080F] shadow-lg">
            <Footprints className="h-3.5 w-3.5" /> Walk inside
          </button>
          <button type="button" onClick={() => setInside((value) => !value)} aria-pressed={inside} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur ${inside ? "bg-[#D9B26A] text-[#02080F]" : "bg-black/60 text-white hover:bg-black/75"}`}>
            <Eye className="h-3.5 w-3.5" /> {inside ? "Put the roof back" : "See inside"}
          </button>
          {inside && house.floors > 1 ? (
            <div className="flex rounded-full bg-black/60 p-0.5 backdrop-blur">
              {Array.from({ length: house.floors }, (_, f) => (
                <button key={f} type="button" onClick={() => setViewFloor(f)} aria-pressed={viewFloor === f} className={`rounded-full px-3 py-1 text-xs font-bold ${viewFloor === f ? "bg-white text-[#02080F]" : "text-white/80"}`}>{f === 0 ? "Ground" : `Floor ${f + 1}`}</button>
              ))}
            </div>
          ) : null}
        </div>
        {stage !== null && !walking ? (
          <div className="absolute inset-x-3 bottom-14 mx-auto max-w-xl rounded-xl bg-black/75 p-3 text-white shadow-xl backdrop-blur">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F2C879]">
              <span>Stage {stage + 1} of {BUILD_STAGES.length}</span>
              <span className="font-mono text-xs normal-case tracking-normal text-white">{money(costToStage(takeoff.lines, stage))} spent</span>
            </div>
            <p className="mt-1 text-sm font-bold">{BUILD_STAGES[stage].title}</p>
            <p className="text-xs text-white/70">{BUILD_STAGES[stage].note}</p>
            <div className="mt-2 flex items-center gap-1">
              {BUILD_STAGES.map((item, i) => (
                <button key={item.title} type="button" title={item.title} aria-label={item.title} onClick={() => { setPlaying(false); setStage(i); }} className={`h-1.5 flex-1 rounded-full ${i <= stage ? "bg-[#F2C879]" : "bg-white/20"}`} />
              ))}
              <button type="button" onClick={() => setPlaying((p) => !p)} className="ml-2 rounded-full bg-white/15 p-1" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
              <button type="button" onClick={() => { setPlaying(false); setStage(null); }} className="rounded-full bg-white/15 p-1" aria-label="Close"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ) : null}
        <div className={`absolute bottom-3 right-3 flex rounded-full bg-black/60 p-0.5 backdrop-blur ${walking ? "hidden" : ""}`} role="group" aria-label="Time of day">
          {([["midday", "Day", Sun], ["golden", "Sunset", Sunset], ["night", "Night", Moon]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setTimeOfDay(id)} aria-pressed={timeOfDay === id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${timeOfDay === id ? "bg-white text-[#02080F]" : "text-white/80"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <p className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70 ${walking ? "hidden" : ""}`}>Drag to turn · pinch or scroll to zoom</p>
      </div>
      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0 w-[1200px]">
        {Array.from({ length: house.floors }, (_, f) => <PlanDrawing key={f} ref={(el) => { planRefs.current[f] = el; }} house={deferredHouse} floor={f} />)}
      </div>
      {view !== "3d" && !walking ? (
        <div className={`relative flex min-h-[320px] flex-col border-l border-white/10 bg-white ${view === "plan" ? "flex-1" : "lg:w-[42%]"}`}>
          {house.floors > 1 ? (
            <div className="absolute left-2 top-2 z-10 flex rounded-full bg-[#02080F]/80 p-0.5">
              {Array.from({ length: house.floors }, (_, f) => (
                <button key={f} type="button" onClick={() => setPlanFloor(f)} aria-pressed={planFloor === f} className={`rounded-full px-3 py-1 text-xs font-bold ${planFloor === f ? "bg-white text-[#02080F]" : "text-white/80"}`}>{f === 0 ? "Ground" : `Floor ${f + 1}`}</button>
              ))}
            </div>
          ) : null}
          {view === "plan" ? <button type="button" onClick={() => setView("split")} className="absolute right-2 top-2 z-10 rounded-full bg-[#D9B26A] px-3 py-1 text-xs font-bold text-[#02080F]">Show 3D</button> : null}
          <PlanDrawing house={deferredHouse} floor={Math.min(planFloor, house.floors - 1)} className="h-full max-h-[80vh] w-full lg:max-h-none" />
        </div>
      ) : null}
      </div>
    </div>
  );
}
