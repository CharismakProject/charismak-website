"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { acquireSceneReadOnlyLease, useScene } from "@pascal-app/core";
import { Viewer } from "@pascal-app/viewer";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ArrowRight, Home, MapPin, PencilRuler, RotateCcw } from "lucide-react";

import { priceDesign } from "@/lib/construction/design-takeoff";
import { generateHouseScene, normaliseHouse, QUICK_LIMITS, QUICK_PRESETS, type QuickHouse } from "@/lib/construction/quick-house";
import { RATE_LOCATIONS, ZONES } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const PARAMS_KEY = "charismak-quick-house-v1";

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

/** Frames the whole house whenever its size changes. */
function FitCamera({ width, length, floors }: { width: number; length: number; floors: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null;
  useEffect(() => {
    const d = Math.max(width, length) * 1.05 + floors * 2 + 6;
    camera.position.set(d * 0.8, d * 0.65 + floors * 1.5, -d * 0.9);
    controls?.target?.set(0, (floors * 3) / 2, 0);
    controls?.update?.();
  }, [camera, controls, width, length, floors]);
  return null;
}

/** Simple mode: pick a house, move a few sliders, see it in 3D with a live price. */
export default function QuickDesign({ onAdvanced }: { onAdvanced: (scene: Scene) => void }) {
  const [house, setHouse] = useState<QuickHouse>(QUICK_PRESETS[1].house);
  const [presetId, setPresetId] = useState<string | null>(QUICK_PRESETS[1].id);
  const [location, chooseLocation] = useRateLocation();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Restore the last house on this device.
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

  const scene = useMemo(() => generateHouseScene(house), [house]);
  const takeoff = useMemo(() => priceDesign(scene.nodes as never, location), [scene, location]);

  // Show the generated house in Pascal's viewer (read-only).
  useEffect(() => {
    const release = acquireSceneReadOnlyLease();
    return () => release();
  }, []);
  useEffect(() => {
    useScene.getState().setScene(scene.nodes as never, scene.rootNodeIds as never, {
      materials: scene.materials as never,
      collections: scene.collections as never,
      installedPlugins: scene.installedPlugins as never,
    });
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

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Controls */}
      <aside className="order-2 min-h-0 w-full flex-1 overflow-y-auto border-t border-white/10 bg-[#071A2E] p-4 text-white lg:order-1 lg:w-[360px] lg:flex-none lg:border-r lg:border-t-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 1 · Pick a building</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => { setPresetId(preset.id); setHouse(preset.house); }}
              aria-pressed={presetId === preset.id}
              className={`rounded-lg border p-2.5 text-left transition ${presetId === preset.id ? "border-[#D9B26A] bg-[#D9B26A]/15" : "border-white/10 bg-white/[0.03] hover:border-white/30"}`}
            >
              <Home className="h-4 w-4 text-[#D9B26A]" />
              <strong className="mt-1 block text-sm">{preset.label}</strong>
              <span className="text-[11px] text-white/50">{preset.note}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 2 · Make it yours</p>
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
                  <button key={floors} type="button" onClick={() => change({ floors })} aria-pressed={house.floors === floors} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold ${house.floors === floors ? "bg-[#D9B26A] text-[#02080F]" : "text-white/70"}`}>{floors}</button>
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

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Step 3 · See the cost</p>
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
        <div className="mt-3 rounded-lg border border-[#D9B26A]/40 bg-[#D9B26A]/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Estimated building cost</p>
          <p className="text-3xl font-bold text-[#F2C879]">{money(takeoff.total)}</p>
          <p className="text-xs text-white/60">{takeoff.floorArea} m² of floor · ≈ {money(takeoff.total / Math.max(1, takeoff.floorArea))}/m²</p>
          <button type="button" onClick={() => setShowBreakdown((value) => !value)} className="mt-2 text-xs font-bold text-[#F2C879] underline">
            {showBreakdown ? "Hide what’s included" : "Show what’s included"}
          </button>
          {showBreakdown ? (
            <ul className="mt-2 space-y-1 text-xs text-white/70">
              {groups.map(([group, amount]) => (
                <li key={group} className="flex justify-between gap-2"><span>{group}</span><span className="font-mono">{money(amount)}</span></li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-white/45">
          A quick budget from Charismak Rate Bank rates. It covers foundations, floors, walls, plaster, paint, roof, ceilings and fitting doors/windows. It does not include columns, beams, stairs, electrical, plumbing, tiling, external works or contractor margin.
        </p>

        <div className="mt-4 grid gap-2">
          <Link href="/quote" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#D9B26A] px-3 py-2.5 text-sm font-bold text-[#02080F] hover:bg-[#F2C879]">
            Get a proper quote <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => onAdvanced(scene)} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2.5 text-sm font-bold text-white hover:border-white/50">
            <PencilRuler className="h-4 w-4" /> Edit freely (advanced editor)
          </button>
          <button type="button" onClick={() => { setPresetId(QUICK_PRESETS[1].id); setHouse(QUICK_PRESETS[1].house); }} className="inline-flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> Start again
          </button>
        </div>
      </aside>

      {/* 3D view */}
      <div className="relative order-1 h-[42vh] min-h-[260px] w-full shrink-0 lg:order-2 lg:h-auto lg:flex-1">
        <Viewer>
          <OrbitControls makeDefault target={[0, 2, 0]} enableDamping maxPolarAngle={Math.PI * 0.49} />
          <FitCamera width={house.width} length={house.length} floors={house.floors} />
        </Viewer>
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">Drag to turn · pinch or scroll to zoom</p>
      </div>
    </div>
  );
}
