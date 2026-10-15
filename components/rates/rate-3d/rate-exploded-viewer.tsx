"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Layers, RotateCcw } from "lucide-react";

import type { RateBankItem } from "@/lib/rates/defaults";
import { buildRateScene } from "./scenes";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const ids = (lineId: string | string[]) => (Array.isArray(lineId) ? lineId : [lineId]);

export default function RateExplodedViewer({ item }: { item: RateBankItem }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const selectRef = useRef<(lineIds: string[] | null) => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState<string[] | null>(null);
  const scene = useMemo(() => buildRateScene(item.slug), [item.slug]);

  const directCost = item.lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0);
  const modelled = useMemo(
    () => new Set(scene?.parts.flatMap((part) => ids(part.lineId)) ?? []),
    [scene],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !scene) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const world = new THREE.Scene();
    world.add(new THREE.HemisphereLight("#ffffff", "#8a8f96", 1.6));
    const sun = new THREE.DirectionalLight("#ffffff", 1.6);
    sun.position.set(3, 5, 4);
    world.add(sun);
    const grid = new THREE.GridHelper(4, 16, "#c9d3dd", "#e3e9ef");
    world.add(grid);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
    const home = scene.target.clone().add(new THREE.Vector3(0.75, 0.45, 1).normalize().multiplyScalar(scene.cameraDistance));
    camera.position.copy(home);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(scene.target);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    const base = scene.parts.map((part) => part.object.position.clone());
    const meshes: THREE.Mesh[] = [];
    scene.parts.forEach((part) => {
      world.add(part.object);
      part.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData.lineIds = ids(part.lineId);
          meshes.push(child);
        }
      });
    });

    const highlight = (lineIds: string[] | null) => {
      meshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const hit = lineIds && (mesh.userData.lineIds as string[]).some((id) => lineIds.includes(id));
        material.emissive.set(hit ? "#F2B544" : "#000000");
        material.emissiveIntensity = hit ? 0.45 : 0;
      });
    };
    selectRef.current = (lineIds) => {
      highlight(lineIds);
      setSelected(lineIds);
    };
    resetRef.current = () => {
      camera.position.copy(home);
      controls.target.copy(scene.target);
      controls.autoRotate = true;
    };

    // Click (not drag) selects the part under the pointer.
    const raycaster = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => (down = { x: event.clientX, y: event.clientY });
    const onUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1),
        camera,
      );
      const hit = raycaster.intersectObjects(meshes.filter((mesh) => mesh.visible), false)[0];
      const lineIds = hit ? (hit.object.userData.lineIds as string[]).filter((id) => id !== "__context") : [];
      selectRef.current(lineIds.length ? lineIds : null);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let t = 0;
    let frame = 0;
    const tick = () => {
      t += (targetRef.current - t) * 0.08;
      const eased = t * t * (3 - 2 * t);
      scene.parts.forEach((part, index) => {
        part.object.position.copy(base[index]).addScaledVector(part.dir, eased);
        if (part.appearOnExplode) {
          part.object.visible = eased > 0.02;
          part.object.scale.setScalar(Math.max(eased, 0.001));
        }
      });
      controls.update();
      renderer.render(world, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      world.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scene]);

  if (!scene) return null;

  const toggle = () => {
    targetRef.current = exploded ? 0 : 1;
    setExploded(!exploded);
  };

  const selectedLines = selected ? item.lines.filter((line) => selected.includes(line.id)) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl border border-[#DCE4EC] bg-[linear-gradient(180deg,#F8FAFC,#EEF2F6)]">
        <div ref={mountRef} className="h-[360px] w-full touch-none md:h-[460px]" />
        <div className="absolute left-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#071E33] px-4 text-xs font-black text-white shadow-lg transition hover:bg-[#0D3B66]"
          >
            <Layers className="h-4 w-4 text-[#F2B544]" />
            {exploded ? "Assemble" : "Disassemble"}
          </button>
          <button
            type="button"
            onClick={() => resetRef.current()}
            aria-label="Reset view"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#DCE4EC] bg-white text-[#0D3B66] shadow"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-[#617286]">
          Drag to rotate · pinch or scroll to zoom · tap a part to see its cost
        </p>
      </div>

      <div className="rounded-2xl border border-[#DCE4EC] bg-white p-4">
        {selectedLines.length ? (
          <div className="mb-4 rounded-xl bg-[#FFF9ED] p-3">
            {selectedLines.map((line) => {
              const amount = line.quantity * line.unitRate;
              return (
                <div key={line.id} className="py-1">
                  <strong className="block text-sm text-[#071E33]">{line.label}</strong>
                  <span className="text-xs text-[#617286]">
                    {Number(line.quantity.toFixed(4))} {line.unit} × {money(line.unitRate, item.currency)} ={" "}
                    <strong className="text-[#071E33]">{money(amount, item.currency)}</strong>
                    {directCost ? ` · ${Math.round((amount / directCost) * 100)}% of direct cost` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mb-4 rounded-xl bg-[#F6F8FA] p-3 text-xs leading-5 text-[#617286]">
            Tap a part in the model, or a line below, to see what it adds to this rate per {item.unit}.
          </p>
        )}

        <ul className="space-y-1">
          {item.lines.map((line) => {
            const isModelled = modelled.has(line.id);
            const active = selected?.includes(line.id);
            return (
              <li key={line.id}>
                <button
                  type="button"
                  onClick={() => selectRef.current(active ? null : [line.id])}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition ${active ? "bg-[#FFF1D6]" : "hover:bg-[#F6F8FA]"}`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                    style={{ background: isModelled ? scene.colors[line.id] ?? "#C9C5BC" : "transparent" }}
                  />
                  <span className="min-w-0 flex-1 text-[#3A4653]">
                    {line.label}
                    {!isModelled ? <span className="text-[#9AA9B8]"> · not modelled</span> : null}
                  </span>
                  <strong className="shrink-0 text-[#071E33]">{money(line.quantity * line.unitRate, item.currency)}</strong>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t border-[#E6EBEF] pt-3 text-[11px] leading-5 text-[#7A8B9E]">
          Illustrative model of 1 {item.unit}; amounts are direct costs before fluctuation, risk and O/P.
        </p>
      </div>
    </div>
  );
}
