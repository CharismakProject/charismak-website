import type * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { assertWalkthroughLighting, createWalkthroughLighting } from "./construction-lighting";
import { createModelRenderer } from "./model-renderer";
import { buildTeachingModel, type TeachingModelId } from "./teaching-models";

export type ViewMode = "iso" | "plan" | "front";
export type TeachingSceneState = { step: number; section: boolean; exploded: boolean; paths: boolean; selected: string | null };
export type TeachingSceneHandle = {
  update: (state: TeachingSceneState) => void;
  view: (mode: ViewMode) => void;
  focus: (partId: string) => void;
  dispose: () => void;
};

export async function createTeachingScene(host: HTMLElement, id: TeachingModelId, onSelect: (partId: string) => void): Promise<TeachingSceneHandle> {
  const { Engine, renderer, software } = await createModelRenderer();
  const world = new Engine.Scene(), geometry = buildTeachingModel(Engine, id, software);
  world.add(geometry.root);
  const lighting = createWalkthroughLighting(Engine, software);
  assertWalkthroughLighting(renderer, lighting);
  lighting[2].shadow.camera.top = lighting[2].shadow.camera.right = 24;
  lighting[2].shadow.camera.bottom = lighting[2].shadow.camera.left = -24;
  world.add(...lighting, lighting[2].target);
  const camera = new Engine.PerspectiveCamera(36, 1, 0.05, 220);
  const center = new Engine.Vector3(...geometry.center), radius = geometry.radius;
  const controls = new OrbitControls(camera, renderer.domElement as HTMLElement);
  controls.enableDamping = true; controls.dampingFactor = 0.09;
  controls.minDistance = 0.7; controls.maxDistance = radius * 5.5;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.copy(center);
  const element = renderer.domElement;
  element.setAttribute("aria-label", "Interactive construction model. Drag to rotate, scroll or pinch to zoom. Use the component list to inspect parts with a keyboard.");
  element.setAttribute("data-renderer", software ? "svg" : "gpu");
  (element as HTMLElement).style.touchAction = "none";
  host.appendChild(element);
  let dirty = true, disposed = false, frame = 0, lastPaint = 0;
  let state: TeachingSceneState = { step: 0, section: true, exploded: false, paths: false, selected: null };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const view = (mode: ViewMode) => {
    controls.target.copy(center);
    const distance = radius * (camera.aspect < 0.85 ? 3.4 : 2.9);
    const offset = mode === "plan" ? new Engine.Vector3(0, distance, 0.01) : mode === "front" ? new Engine.Vector3(0, radius * 0.13, distance) : new Engine.Vector3(distance * 0.67, distance * 0.5, distance * 0.72);
    camera.position.copy(center).add(offset); controls.update(); dirty = true;
  };
  const resize = () => {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); dirty = true;
  };
  resize(); view("iso");
  const observer = new ResizeObserver(resize); observer.observe(host);
  controls.addEventListener("change", () => { dirty = true; });

  const routeGroup = new Engine.Group(); world.add(routeGroup);
  routeGroup.userData.ignorePick = true;
  const routes = geometry.paths.map(path => {
    const group = new Engine.Group(); routeGroup.add(group);
    const points = path.points.map(p => new Engine.Vector3(...p));
    const line = new Engine.Line(new Engine.BufferGeometry().setFromPoints(points), new Engine.LineBasicMaterial({ color: path.color }));
    group.add(line);
    const segments = points.slice(1).map((point, n) => point.distanceTo(points[n]));
    const total = segments.reduce((sum, length) => sum + length, 0);
    const markers = Array.from({ length: id === "plumbing" || id === "electrical" ? 3 : 4 }, () => {
      const mesh = new Engine.Mesh(new Engine.SphereGeometry(0.095, 8, 6), new Engine.MeshStandardMaterial({ color: path.color, emissive: path.color, emissiveIntensity: 0.35 }));
      group.add(mesh); return mesh;
    });
    const at = (fraction: number) => {
      let distance = fraction * total;
      for (let n = 0; n < segments.length; n++) {
        if (distance <= segments[n]) return points[n].clone().lerp(points[n + 1], distance / segments[n]);
        distance -= segments[n];
      }
      return points.at(-1)!.clone();
    };
    return { path, group, markers, at };
  });
  const highlights = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const clearHighlight = () => {
    for (const [mesh, original] of highlights) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => material.dispose()); mesh.material = original;
    }
    highlights.clear();
  };
  const highlight = (partId: string | null) => {
    clearHighlight();
    if (!partId) return;
    geometry.parts.get(partId)?.forEach(group => group.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      highlights.set(mesh, mesh.material);
      const brighten = (material: THREE.Material) => {
        const clone = material.clone() as THREE.MeshStandardMaterial;
        if (clone.emissive) { clone.emissive.set("#e9c278"); clone.emissiveIntensity = 0.28; }
        return clone;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(brighten) : brighten(mesh.material);
    }));
  };
  const update = (next: TeachingSceneState) => {
    if (next.selected !== state.selected) highlight(next.selected);
    state = next;
    geometry.stages.forEach((stage, n) => { stage.visible = n <= state.step; stage.position.y = state.exploded ? n * 0.85 : 0; });
    geometry.root.traverse(object => {
      if (object.userData.hideInSection) object.visible = !state.section;
      if (typeof object.userData.removeAfter === "number") object.visible = state.step < object.userData.removeAfter;
    });
    routes.forEach(route => { route.group.visible = state.paths && !state.exploded && route.path.step <= state.step; });
    dirty = true;
  };
  update(state);
  const focus = (partId: string) => {
    const groups = geometry.parts.get(partId); if (!groups?.length) return;
    const detail = geometry.focus[partId];
    geometry.root.updateMatrixWorld(true);
    const bounds = new Engine.Box3(); groups.filter(group => group.parent?.visible).forEach(group => bounds.expandByObject(group));
    if (bounds.isEmpty()) return;
    const target = detail ? new Engine.Vector3(...detail.point) : bounds.getCenter(new Engine.Vector3());
    const size = detail?.radius ?? Math.max(1.4, bounds.getSize(new Engine.Vector3()).length() * 0.42);
    controls.target.copy(target);
    camera.position.copy(target).add(new Engine.Vector3(size * 1.8, size * 1.2, size * 2));
    controls.update(); dirty = true;
  };
  const raycaster = new Engine.Raycaster(), pointer = new Engine.Vector2();
  let down = { x: 0, y: 0 };
  const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
  const pointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
    const bounds = element.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(geometry.stages, true)) {
      let object: THREE.Object3D | null = hit.object, partId: string | undefined, visible = true;
      while (object) { if (!object.visible) visible = false; if (object.userData.partId) partId = object.userData.partId; object = object.parent; }
      if (visible && partId) { onSelect(partId); break; }
    }
  };
  element.addEventListener("pointerdown", pointerDown as EventListener);
  element.addEventListener("pointerup", pointerUp as EventListener);
  const render = (time: number) => {
    if (disposed) return;
    controls.update();
    const animated = state.paths && !state.exploded && !reducedMotion && routes.some(route => route.group.visible);
    if ((dirty || animated) && (!software || time - lastPaint > 45)) {
      routes.forEach(route => route.markers.forEach((marker, n) => marker.position.copy(route.at(((reducedMotion ? 0 : time / 6000) + n / route.markers.length) % 1))));
      renderer.render(world, camera); dirty = false; lastPaint = time;
    }
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return { update, view, focus, dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); clearHighlight();
    element.removeEventListener("pointerdown", pointerDown as EventListener); element.removeEventListener("pointerup", pointerUp as EventListener);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    world.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => materials.add(material));
    });
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
    renderer.dispose?.(); element.remove();
  } };
}
