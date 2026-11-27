"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { Plan } from "@/lib/planner/model";

type Api = { setView: (i: number) => void; setCut: (on: boolean) => void; dispose: () => void };

/**
 * Interactive 3D view of the plan: drag to turn, pinch or scroll to zoom, six saved views
 * (aerial ×2, from above, cutaway, two inside views at eye height) and full / cut walls.
 * three.js loads only when this is shown; it draws only when something changes.
 */
export default function Viewer3d({ plan }: { plan: Plan }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [names, setNames] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    let disposed = false;
    setState("loading");
    (async () => {
      const T = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { buildScene, applyView } = await import("@/lib/planner/three-view");
      const el = host.current;
      if (!el || disposed) return;
      let renderer: import("three").WebGLRenderer;
      try { renderer = new T.WebGLRenderer({ antialias: true }); } catch { setState("failed"); return; }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace;
      let w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      renderer.domElement.style.touchAction = "none";
      el.appendChild(renderer.domElement);
      const built = buildScene(T, plan);
      const camera = new T.PerspectiveCamera(35, w / h, 10, 1e6);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.maxPolarAngle = Math.PI * 0.495;
      const render = () => renderer.render(built.scene, camera);
      controls.addEventListener("change", render);
      const list = built.views(w / h);
      const setView = (i: number) => { const v = list[i]; if (!v) return; applyView(T, camera, built, v); controls.target.set(...v.target); controls.update(); render(); };
      const setCutFn = (on: boolean) => { built.cutWalls(on ? 1200 : Infinity); render(); };
      const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render(); });
      ro.observe(el);
      api.current = {
        setView, setCut: setCutFn,
        dispose: () => {
          ro.disconnect(); controls.dispose();
          built.scene.traverse((o) => { const m = o as import("three").Mesh; if (m.geometry) m.geometry.dispose(); });
          built.materials.all().forEach((m) => m.dispose());
          renderer.dispose(); renderer.domElement.remove();
        },
      };
      setNames(list.map((v) => v.name));
      setView(0); setActive(0); setCut(false);
      setState("ready");
    })().catch(() => { if (!disposed) setState("failed"); });
    return () => { disposed = true; api.current?.dispose(); api.current = null; };
  }, [plan]);

  const choose = (i: number) => { setActive(i); api.current?.setView(i); setCut(i === 3); };
  const toggleCut = () => { const next = !cut; setCut(next); api.current?.setCut(next); };

  return (
    <div>
      <div ref={host} className="relative h-[52vh] min-h-[320px] w-full overflow-hidden rounded-lg border border-[#DDE1E7] bg-[#EEF1F5]">
        {state !== "ready" ? (
          <div className="absolute inset-0 grid place-items-center text-sm text-[#5A6675]">
            {state === "loading" ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Building the 3D model…</span> : "3D could not be shown in this browser. The drawings and schedule are unaffected."}
          </div>
        ) : null}
      </div>
      {state === "ready" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#0D3352]">View</span>
          {names.map((n, i) => <button key={n} type="button" title={n} onClick={() => choose(i)} aria-pressed={active === i} className={`h-10 min-w-10 rounded-md border px-3 text-sm font-bold ${active === i ? "border-[#0D3352] bg-[#0D3352] text-white" : "border-[#0D3352] bg-white text-[#0D3352]"}`}>{i + 1}</button>)}
          <button type="button" onClick={toggleCut} aria-pressed={cut} className={`h-10 rounded-md border px-3 text-sm font-bold ${cut ? "border-[#0D3352] bg-[#0D3352] text-white" : "border-[#0D3352] bg-white text-[#0D3352]"}`}>{cut ? "Cut walls" : "Full walls"}</button>
          <span className="w-full text-xs text-[#5A6675]">{names[active]} · drag to turn, pinch or scroll to zoom.</span>
        </div>
      ) : null}
    </div>
  );
}
