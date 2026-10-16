"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Layers, Maximize2, RotateCcw } from "lucide-react";

import type { RateBankItem } from "@/lib/rates/defaults";
import { buildAccurateRateScene } from "./rate-specific-scenes";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

type CameraFlight = {
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  to: { target: THREE.Vector3; position: THREE.Vector3 };
  t: number;
};

const ids = (lineId: string | string[]) => (Array.isArray(lineId) ? lineId : [lineId]);

export default function RateExplodedViewer({ item }: { item: RateBankItem }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const selectRef = useRef<(lineIds: string[] | null) => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const flyRef = useRef<(explode: boolean) => void>(() => {});
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState<string[] | null>(null);
  const scene = useMemo(() => buildAccurateRateScene(item), [item]);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const world = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    world.environment = environment;
    world.environmentIntensity = 0.55;
    world.fog = new THREE.Fog("#E4EAF0", 12, 34);
    world.add(new THREE.HemisphereLight("#FFF6E8", "#B9A88A", 0.7));
    // Late-afternoon sun for long, soft shadows.
    const sun = new THREE.DirectionalLight("#FFE7C2", 2.6);
    sun.position.set(6, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    world.add(sun);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);
    camera.position.copy(scene.overview.position);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(scene.overview.target);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minDistance = 1.2;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.48;
    let flight: CameraFlight | null = null;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      flight = null;
    });
    const flyTo = (view: { target: THREE.Vector3; position: THREE.Vector3 }) => {
      flight = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), to: view, t: 0 };
    };
    flyRef.current = (explode) => flyTo(explode ? scene.focus : scene.overview);

    // Surrounding structure fades back when the item is taken apart.
    const contextMaterials: Array<THREE.Material & { opacity: number }> = [];
    scene.context.forEach((object) => {
      world.add(object);
      if (object.userData.keepVisible) return;
      object.traverse((child) => {
        const material = (child as THREE.Mesh).material as THREE.Material | undefined;
        if (material && !Array.isArray(material)) {
          material.transparent = true;
          material.userData.baseOpacity = material.opacity;
          contextMaterials.push(material as THREE.Material & { opacity: number });
        }
      });
    });

    const base = scene.parts.map((part) => part.object.position.clone());
    const baseScales = scene.parts.map((part) => part.object.scale.clone());
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

    // Optional, real PBR maps elevate earth and concrete beyond flat procedural colours.
    // If the texture host is unavailable, the procedural textures above remain in place.
    let texturesCancelled = false;
    const ownedTextures = new Set<THREE.Texture>();
    const roleTargets = new Map<string, THREE.Mesh[]>();
    const captureRole = (root: THREE.Object3D) => {
      const role = root.userData.rateSceneRole as string | undefined;
      if (!role) return;
      const targets = roleTargets.get(role) ?? [];
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) targets.push(child);
      });
      roleTargets.set(role, targets);
    };
    scene.context.forEach(captureRole);
    scene.parts.forEach((part) => captureRole(part.object));

    const loadSurfaceMaps = (
      roles: string[],
      diffuseUrl: string,
      normalUrl: string,
      repeat: [number, number],
      minimumRoughness: number,
      normalStrength: number,
    ) => {
      const targetMeshes = [...new Set(roles.flatMap((role) => roleTargets.get(role) ?? []))];
      if (!targetMeshes.length) return;
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      let diffuse: THREE.Texture | null = null;
      let normal: THREE.Texture | null = null;
      let failed = false;

      const setupTexture = (texture: THREE.Texture, isNormal: boolean) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat[0], repeat[1]);
        texture.colorSpace = isNormal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
      };

      const applyIfReady = () => {
        if (texturesCancelled || failed || !diffuse || !normal) return;
        ownedTextures.add(diffuse);
        ownedTextures.add(normal);
        targetMeshes.forEach((mesh) => {
          const previous = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const updated = previous.map((original) => {
            const sourceMaterial = original as THREE.MeshStandardMaterial;
            if (sourceMaterial.map) ownedTextures.add(sourceMaterial.map);
            if (sourceMaterial.normalMap) ownedTextures.add(sourceMaterial.normalMap);
            const material = original.clone() as THREE.MeshStandardMaterial;
            material.color.set("#FFFFFF");
            material.map = diffuse;
            material.normalMap = normal;
            material.normalScale.set(normalStrength, normalStrength);
            material.roughness = Math.max(material.roughness, minimumRoughness);
            material.needsUpdate = true;
            return material;
          });
          mesh.material = Array.isArray(mesh.material) ? updated : updated[0];
        });
      };

      const handleError = () => { failed = true; };
      loader.load(diffuseUrl, (texture) => {
        if (texturesCancelled) {
          texture.dispose();
          return;
        }
        ownedTextures.add(texture);
        diffuse = texture;
        setupTexture(texture, false);
        applyIfReady();
      }, undefined, handleError);
      loader.load(normalUrl, (texture) => {
        if (texturesCancelled) {
          texture.dispose();
          return;
        }
        ownedTextures.add(texture);
        normal = texture;
        setupTexture(texture, true);
        applyIfReady();
      }, undefined, handleError);
    };

    const polyHaven = "https://dl.polyhaven.org/file/ph-assets/Textures/png/1k";
    loadSurfaceMaps(
      ["site-ground", "excavated-earth-bank", "prepared-compacted-subgrade", "compacted-backfill-lift", "laterite-fill-layer"],
      `${polyHaven}/terrain_red_01/terrain_red_01_diff_1k.png`,
      `${polyHaven}/terrain_red_01/terrain_red_01_nor_gl_1k.png`,
      [3.2, 2.2],
      0.93,
      0.42,
    );
    loadSurfaceMaps(
      ["thin-ground-blinding", "blinding-finish-surface", "cast-concrete-sample", "cast-concrete-finish"],
      `${polyHaven}/rough_concrete/rough_concrete_diff_1k.png`,
      `${polyHaven}/rough_concrete/rough_concrete_nor_gl_1k.png`,
      [2.8, 1.9],
      0.76,
      0.32,
    );

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
      flyTo(targetRef.current ? scene.focus : scene.overview);
      controls.autoRotate = !targetRef.current;
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
        if (part.hideOnExplode) {
          part.object.visible = eased < 0.98;
          part.object.traverse((child) => {
            const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if (material) {
              material.transparent = true;
              material.opacity = 1 - eased;
            }
          });
        }
        if (part.appearOnExplode) {
          part.object.visible = eased > 0.02;
          part.object.scale.copy(baseScales[index]).multiplyScalar(Math.max(eased, 0.001));
        }
      });
      contextMaterials.forEach((material) => {
        material.opacity = material.userData.baseOpacity * (1 - 0.75 * eased);
        material.depthWrite = eased < 0.5;
      });
      if (flight) {
        flight.t = Math.min(1, flight.t + 0.018);
        const k = flight.t * flight.t * (3 - 2 * flight.t);
        camera.position.lerpVectors(flight.fromPos, flight.to.position, k);
        controls.target.lerpVectors(flight.fromTarget, flight.to.target, k);
        if (flight.t >= 1) flight = null;
      }
      controls.update();
      renderer.render(world, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      texturesCancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      world.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const assigned = Array.isArray(object.material) ? object.material : [object.material];
          assigned.forEach((material) => {
            materials.add(material);
            const possibleTextures = material as THREE.Material & {
              map?: THREE.Texture | null;
              normalMap?: THREE.Texture | null;
              roughnessMap?: THREE.Texture | null;
              metalnessMap?: THREE.Texture | null;
              aoMap?: THREE.Texture | null;
              emissiveMap?: THREE.Texture | null;
              alphaMap?: THREE.Texture | null;
            };
            [
              possibleTextures.map,
              possibleTextures.normalMap,
              possibleTextures.roughnessMap,
              possibleTextures.metalnessMap,
              possibleTextures.aoMap,
              possibleTextures.emissiveMap,
              possibleTextures.alphaMap,
            ].forEach((texture) => { if (texture) ownedTextures.add(texture); });
          });
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      ownedTextures.forEach((texture) => texture.dispose());
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scene]);

  if (!scene) return null;

  const toggle = () => {
    targetRef.current = exploded ? 0 : 1;
    flyRef.current(!exploded);
    setExploded(!exploded);
  };

  const selectedLines = selected ? item.lines.filter((line) => selected.includes(line.id)) : [];

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#C7D3DE] bg-[linear-gradient(180deg,#8FB5D0_0%,#DCE4E6_44%,#B99B77_100%)] shadow-[0_18px_48px_rgba(7,30,51,0.12)]">
        <div ref={mountRef} className="h-[470px] w-full touch-none sm:h-[540px] md:h-[620px] xl:h-[700px]" />
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
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-[#071E33]/90 text-white shadow-lg transition hover:bg-[#0D3B66]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const element = mountRef.current?.parentElement;
              if (element?.requestFullscreen) void element.requestFullscreen().catch(() => {});
            }}
            aria-label="Open 3D view fullscreen"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-[#071E33]/90 text-white shadow-lg transition hover:bg-[#0D3B66]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/25 bg-[#071E33]/85 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg">
          Interactive 3D render
        </span>
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-2 text-[11px] text-[#25394B] shadow-sm">
          Drag to rotate · pinch or scroll to zoom · tap a part to see its cost
        </p>
      </div>

      <div className="rounded-2xl border border-[#DCE4EC] bg-white p-4">
        <section className="mb-4 rounded-xl border border-[#DCE4EC] bg-[#F6F8FA] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Construction method</p>
          <ol className="mt-2 space-y-2">
            {(scene.process ?? [
              "Review the specification and set out the work.",
              "Prepare the substrate and install the specified materials using the appropriate trade method.",
              "Check alignment, level, finish and readiness for the next operation.",
            ]).map((step, index) => (
              <li key={step} className="flex gap-2 text-xs leading-5 text-[#425466]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0D3B66] text-[10px] font-bold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 border-t border-[#DCE4EC] pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">Intended end result</p>
            <p className="mt-1 text-xs leading-5 text-[#425466]">{scene.endResult ?? "Illustrative construction element. Confirm exact dimensions and finishing requirements against the drawings and specification."}</p>
          </div>
        </section>
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
          Representative 3D scope illustration. Confirm dimensions and specifications against project drawings; amounts are direct costs per {item.unit} before fluctuation, risk and O/P.
        </p>
      </div>
    </div>
  );
}
