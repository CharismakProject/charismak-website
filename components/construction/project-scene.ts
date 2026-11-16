import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createModelRenderer } from "./model-renderer";
import { assertWalkthroughLighting, createWalkthroughLighting } from "./construction-lighting";
import { stageInfo, type ModelPart, type ProjectStage, type ScheduledStage } from "@/lib/construction/project";
import { visibleProjectParts } from "@/lib/construction/project-visibility";
export type ProjectViewState = { day: number; schedule: ScheduledStage[]; hidden: ProjectStage[]; selected: string | null; section?: boolean; levelId?: string; colourMode?: "materials" | "stages" };
export type ProjectScene = { update: (value: ProjectViewState) => void; view: (mode: "iso" | "plan" | "front") => void; focus: (id: string) => void; dispose: () => void };

export async function createProjectScene(host: HTMLElement, parts: ModelPart[], scale: number, upAxis: "y" | "z", onSelect: (id: string) => void, groundLevel?: number): Promise<ProjectScene> {
  const { Engine, renderer, software } = await createModelRenderer();
  const world = new Engine.Scene(), root = new Engine.Group(); world.add(root);
  const lights = createWalkthroughLighting(Engine, software); assertWalkthroughLighting(renderer, lights); world.add(...lights, lights[2].target);
  const partObjects = new Map<string, THREE.Object3D>(), materials = new Map<string, THREE.MeshStandardMaterial>();
  const subdivideForPainter = (geometry: THREE.BufferGeometry) => {
    const plain = geometry.index ? geometry.toNonIndexed() : geometry, positions = plain.getAttribute("position").array;
    const output: number[] = [];
    const triangle = (a: number[], b: number[], c: number[], depth: number) => {
      const distance = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      const lengths = [distance(a, b), distance(b, c), distance(c, a)], longest = Math.max(...lengths);
      if (longest < 1.7 || depth >= 7 || output.length > 30000) { output.push(...a, ...b, ...c); return; }
      const midpoint = (p: number[], q: number[]) => p.map((v, n) => (v + q[n]) / 2);
      if (lengths[0] === longest) { const m = midpoint(a, b); triangle(a, m, c, depth + 1); triangle(m, b, c, depth + 1); }
      else if (lengths[1] === longest) { const m = midpoint(b, c); triangle(a, b, m, depth + 1); triangle(a, m, c, depth + 1); }
      else { const m = midpoint(c, a); triangle(a, b, m, depth + 1); triangle(m, b, c, depth + 1); }
    };
    for (let n = 0; n < positions.length; n += 9) triangle(Array.from(positions.slice(n, n + 3)), Array.from(positions.slice(n + 3, n + 6)), Array.from(positions.slice(n + 6, n + 9)), 0);
    if (plain !== geometry) plain.dispose(); geometry.dispose();
    return new Engine.BufferGeometry().setAttribute("position", new Engine.Float32BufferAttribute(output, 3));
  };
  let triangles = 0;
  for (const part of parts) {
    let geometry = new Engine.BufferGeometry(); geometry.setAttribute("position", new Engine.Float32BufferAttribute(part.positions, 3)); if (part.indices) geometry.setIndex(part.indices);
    if (part.matrix) geometry.applyMatrix4(new THREE.Matrix4().fromArray(part.matrix));
    geometry.scale(scale, scale, scale); if (upAxis === "z") geometry.rotateX(-Math.PI / 2);
    if (software && !part.line && (part.indices?.length ?? part.positions.length / 3) / 3 + triangles > 16000) {
      geometry.computeBoundingBox(); const box = geometry.boundingBox!, center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()); geometry.dispose(); geometry = new Engine.BoxGeometry(Math.max(0.02, size.x), Math.max(0.02, size.y), Math.max(0.02, size.z)); geometry.translate(center.x, center.y, center.z);
    }
    if (software && !part.line && (geometry.index?.count ?? geometry.getAttribute("position").count) < 1500 && triangles < 14000) geometry = subdivideForPainter(geometry);
    triangles += (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
    let object: THREE.Object3D;
    if (part.line) object = new Engine.Line(geometry, new Engine.LineBasicMaterial({ color: part.color ?? stageInfo(part.stage).color, linewidth: 2 }));
    else {
      geometry.computeVertexNormals();
      const material = new Engine.MeshStandardMaterial({ color: part.color ?? stageInfo(part.stage).color, roughness: part.material?.roughness ?? 0.9, metalness: part.material?.metalness ?? 0, side: THREE.DoubleSide });
      materials.set(part.id, material); const mesh = new Engine.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; object = mesh;
      if (parts.length < 1500) { const edge = new Engine.LineSegments(new Engine.EdgesGeometry(geometry, 28), new Engine.LineBasicMaterial({ color: "#17283d", transparent: true, opacity: 0.48 })); object.add(edge); }
    }
    object.name = part.name; object.userData.partId = part.id; root.add(object); partObjects.set(part.id, object);
  }
  const bounds = new Engine.Box3().setFromObject(root), size = bounds.getSize(new Engine.Vector3()), rawCenter = bounds.getCenter(new Engine.Vector3());
  root.position.set(-rawCenter.x, -bounds.min.y, -rawCenter.z); root.updateMatrixWorld(true);
  const radius = Math.max(2, size.length() * 0.5), center = new Engine.Vector3(0, size.y * 0.43, 0);
  const datum = groundLevel === undefined ? 0 : groundLevel * scale + root.position.y;
  const ground = new Engine.Mesh(new Engine.BoxGeometry(radius * 2.6, 0.08, radius * 2.6, software ? 14 : 1, 1, software ? 14 : 1), new Engine.MeshStandardMaterial({ color: "#30475f", roughness: 1 })); ground.position.y = datum - 0.1; ground.renderOrder = software && groundLevel === undefined ? -100 : 0; world.add(ground);
  const grid = new Engine.GridHelper(radius * 2.6, 24, 0xc3d1e1, 0x637d98); grid.position.y = datum - 0.05; world.add(grid);
  const camera = new Engine.PerspectiveCamera(38, 1, 0.01, Math.max(2000, radius * 20));
  const controls = new OrbitControls(camera, renderer.domElement as HTMLElement); controls.target.copy(center); controls.enableDamping = true; controls.minDistance = Math.max(0.2, radius / 50); controls.maxDistance = radius * 12; controls.maxPolarAngle = Math.PI * 0.49;
  let dirty = true, disposed = false, frame = 0, previous = 0;
  const view = (mode: "iso" | "plan" | "front") => { const d = radius * (camera.aspect < 0.8 ? 4 : 2.8); controls.target.copy(center); camera.position.copy(center).add(mode === "plan" ? new Engine.Vector3(0, d, 0.001) : mode === "front" ? new Engine.Vector3(0, d * 0.1, d) : new Engine.Vector3(d * 0.7, d * 0.6, d * 0.75)); controls.update(); dirty = true; };
  const resize = () => { camera.aspect = Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight); camera.updateProjectionMatrix(); renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)); dirty = true; };
  const element = renderer.domElement; element.setAttribute("aria-label", "Your project model. Drag to rotate, scroll or pinch to zoom. Select an element to link it to the construction programme."); element.setAttribute("data-project-renderer", software ? "simplified" : "hardware"); (element as HTMLElement).style.touchAction = "none"; host.appendChild(element);
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); view("iso"); controls.addEventListener("change", () => { dirty = true; });
  const update = (state: ProjectViewState) => {
    const max = Math.max(1, ...state.schedule.map(stage => stage.finish));
    const visible = visibleProjectParts(parts, state);
    if (groundLevel !== undefined) {
      const excavation = state.schedule.find(stage => stage.id === "earthworks"), slab = state.schedule.find(stage => stage.id === "slabs");
      const belowGroundView = state.section || (excavation && state.day >= excavation.start && state.day < (slab?.finish ?? excavation.finish));
      ground.visible = !belowGroundView; grid.visible = !state.section;
    }
    const groups = new Map<ProjectStage, ModelPart[]>();
    for (const part of parts) groups.set(part.stage, [...groups.get(part.stage) ?? [], part]);
    for (const [stageId, group] of groups) {
      const stage = state.schedule.find(item => item.id === stageId), fraction = !stage || state.day >= max ? 1 : Math.min(1, Math.max(0, (state.day - stage.start) / stage.days));
      group.forEach(part => {
        const object = partObjects.get(part.id)!; object.visible = visible.has(part.id);
        const material = materials.get(part.id); if (material) { material.color.set(state.colourMode === "stages" ? stageInfo(part.stage).color : part.color ?? stageInfo(part.stage).color); material.roughness = state.colourMode === "stages" ? .9 : part.material?.roughness ?? .9; material.metalness = state.colourMode === "stages" ? 0 : part.material?.metalness ?? 0; material.emissive.set(part.id === state.selected ? "#f0c24d" : fraction > 0 && fraction < 1 ? "#4d3512" : "#000000"); material.emissiveIntensity = part.id === state.selected ? 0.35 : 0.1; }
      });
    }
    dirty = true;
  };
  const focus = (id: string) => { const object = partObjects.get(id); if (!object) return; const box = new Engine.Box3().setFromObject(object), target = box.getCenter(new Engine.Vector3()), r = Math.max(0.7, box.getSize(new Engine.Vector3()).length() * 0.65); controls.target.copy(target); camera.position.copy(target).add(new Engine.Vector3(r * 1.4, r, r * 1.7)); controls.update(); dirty = true; };
  const pointer = new Engine.Vector2(), raycaster = new Engine.Raycaster(); let down: [number, number] = [0, 0];
  const pointerDown = (event: Event) => { const e = event as PointerEvent; down = [e.clientX, e.clientY]; };
  const pointerUp = (event: Event) => { const e = event as PointerEvent; if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return; const b = element.getBoundingClientRect(); pointer.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); raycaster.setFromCamera(pointer, camera); for (const hit of raycaster.intersectObjects(root.children, true)) { let object: THREE.Object3D | null = hit.object, id: string | undefined, visible = true; while (object) { if (!object.visible) visible = false; id ??= object.userData.partId; object = object.parent; } if (visible && id) { onSelect(id); break; } } };
  element.addEventListener("pointerdown", pointerDown); element.addEventListener("pointerup", pointerUp);
  const render = (time: number) => { if (disposed) return; controls.update(); if (dirty && (!software || time - previous > 50)) { renderer.render(world, camera); dirty = false; previous = time; } frame = requestAnimationFrame(render); }; frame = requestAnimationFrame(render);
  return { update, view, focus, dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); element.removeEventListener("pointerdown", pointerDown); element.removeEventListener("pointerup", pointerUp); const mats = new Set<THREE.Material>(), geometries = new Set<THREE.BufferGeometry>(); world.traverse(object => { const mesh = object as THREE.Mesh; if (mesh.geometry) geometries.add(mesh.geometry); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => mats.add(material)); }); mats.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose()); renderer.dispose?.(); element.remove(); } };
}
