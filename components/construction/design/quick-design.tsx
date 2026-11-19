"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { acquireSceneReadOnlyLease, useScene } from "@pascal-app/core";
import { useViewer, Viewer } from "@pascal-app/viewer";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ArrowRight, Eye, Footprints, Home, MapPin, Moon, PencilRuler, RotateCcw, Shuffle, Sofa, Sun, Sunset, Trees, X } from "lucide-react";

import { priceDesign } from "@/lib/construction/design-takeoff";
import {
  FLOOR_FINISHES,
  generateHouseScene,
  normaliseHouse,
  QUICK_LIMITS,
  QUICK_PRESETS,
  randomHouse,
  ROOF_FINISHES,
  WALL_FINISHES,
  type QuickHouse,
} from "@/lib/construction/quick-house";
import { RATE_LOCATIONS, ZONES } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const PARAMS_KEY = "charismak-quick-house-v2";

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
function FitCamera({ width, length, floors }: { width: number; length: number; floors: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null;
  useEffect(() => {
    const d = Math.max(width, length) * 1.1 + floors * 2 + 8;
    camera.position.set(d * 0.8, d * 0.7 + floors * 1.5, -d * 0.95);
    controls?.target?.set(0, (floors * 3) / 2, 0);
    controls?.update?.();
  }, [camera, controls, width, length, floors]);
  return null;
}

/** Simple mode: pick a house, style it, see inside, and watch the price change. */
export default function QuickDesign({ onAdvanced }: { onAdvanced: (scene: Scene) => void }) {
  const [house, setHouse] = useState<QuickHouse>(QUICK_PRESETS[1].house);
  const [presetId, setPresetId] = useState<string | null>(QUICK_PRESETS[1].id);
  const [inside, setInside] = useState(false);
  const [viewFloor, setViewFloor] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<"midday" | "golden" | "night">("midday");
  const [walking, setWalking] = useState(false);
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
    if (!inside) return scene.nodes;
    const levelOf = (id: string | null): number => {
      let node = id ? scene.nodes[id] : undefined;
      for (let guard = 0; node && guard < 10; guard += 1) {
        if (node.type === "level") return Number(node.level ?? 0);
        node = node.parentId ? scene.nodes[node.parentId] : undefined;
      }
      return 0;
    };
    const copy: typeof scene.nodes = {};
    for (const [id, node] of Object.entries(scene.nodes)) {
      const hide = node.type === "roof" || node.type === "ceiling" || (node.type === "level" && Number(node.level) > viewFloor) || (node.type !== "level" && levelOf(node.parentId) > viewFloor);
      copy[id] = hide ? { ...node, visible: false } : node;
    }
    return copy;
  }, [scene, inside, viewFloor]);

  useEffect(() => {
    const release = acquireSceneReadOnlyLease();
    return () => {
      useViewer.getState().setWalkthroughMode(false);
      release();
    };
  }, []);
  // Viewer modes: cut the walls down to see inside, light, and the first-person walk.
  useEffect(() => {
    useViewer.getState().setWallMode(inside ? "cutaway" : "up");
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
  const bedrooms = Object.values(scene.nodes).filter((node) => node.type === "zone" && node.name === "Bedroom").length;

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
            <button key={preset.id} type="button" onClick={() => { setPresetId(preset.id); setHouse(preset.house); }} aria-pressed={presetId === preset.id} className={`rounded-lg border p-2.5 text-left transition ${presetId === preset.id ? "border-[#D9B26A] bg-[#D9B26A]/15" : "border-white/10 bg-white/[0.03] hover:border-white/30"}`}>
              <Home className="h-4 w-4 text-[#D9B26A]" />
              <strong className="mt-1 block text-sm">{preset.label}</strong>
              <span className="text-[11px] text-white/50">{preset.note}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 2 · Shape it</p>
        <div className="mt-2 space-y-3">
          <Slider label="Width" value={house.width} unit=" m" min={QUICK_LIMITS.width[0]} max={QUICK_LIMITS.width[1]} step={0.5} onChange={(width) => change({ width })} />
          <Slider label="Length" value={house.length} unit=" m" min={QUICK_LIMITS.length[0]} max={QUICK_LIMITS.length[1]} step={0.5} onChange={(length) => change({ length })} />
          <Slider label="Rooms per floor" value={house.rooms} min={QUICK_LIMITS.rooms[0]} max={QUICK_LIMITS.rooms[1]} onChange={(rooms) => change({ rooms })} />
          <Slider label="Roof steepness" value={house.roofPitch} unit="°" min={QUICK_LIMITS.roofPitch[0]} max={QUICK_LIMITS.roofPitch[1]} onChange={(roofPitch) => change({ roofPitch })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-white/70">Floors</span>
              <div className="mt-1 flex rounded-md bg-white/5 p-0.5">
                {[1, 2, 3].map((floors) => (
                  <button key={floors} type="button" onClick={() => { change({ floors }); setViewFloor((f) => Math.min(f, floors - 1)); }} aria-pressed={house.floors === floors} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold ${house.floors === floors ? "bg-[#D9B26A] text-[#02080F]" : "text-white/70"}`}>{floors}</button>
                ))}
              </div>
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

      <div className="relative order-1 h-[46vh] min-h-[280px] w-full shrink-0 lg:order-2 lg:h-auto lg:flex-1">
        <Viewer>
          {walking ? null : (
            <>
              <OrbitControls makeDefault target={[0, 2, 0]} enableDamping maxPolarAngle={Math.PI * 0.49} />
              <FitCamera width={deferredHouse.width} length={deferredHouse.length} floors={inside ? viewFloor + 1 : deferredHouse.floors} />
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
        <div className={`absolute bottom-3 right-3 flex rounded-full bg-black/60 p-0.5 backdrop-blur ${walking ? "hidden" : ""}`} role="group" aria-label="Time of day">
          {([["midday", "Day", Sun], ["golden", "Sunset", Sunset], ["night", "Night", Moon]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => setTimeOfDay(id)} aria-pressed={timeOfDay === id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${timeOfDay === id ? "bg-white text-[#02080F]" : "text-white/80"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <p className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70 ${walking ? "hidden" : ""}`}>Drag to turn · pinch or scroll to zoom</p>
      </div>
    </div>
  );
}
