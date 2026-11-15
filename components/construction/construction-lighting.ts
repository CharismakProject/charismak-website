import type * as THREE from "three";

type LightingEngine = Pick<typeof THREE, "AmbientLight" | "DirectionalLight" | "HemisphereLight">;

// WebGPURenderer registers lights by constructor identity. Its lights must
// therefore be instantiated from the same module as the renderer itself.
export function createWalkthroughLighting(Engine: LightingEngine, software: boolean) {
  const sky = new Engine.HemisphereLight(0xe8f6ff, 0x96765a, 2.2);
  const fill = new Engine.AmbientLight(0xffffff, software ? 0.65 : 0.35);
  const sun = new Engine.DirectionalLight(0xffeed7, software ? 0.65 : 3.1);
  sun.position.set(-9, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, far: 60 });
  sun.shadow.normalBias = 0.04;
  return [sky, fill, sun] as const;
}

export function assertWalkthroughLighting(renderer: object, lights: readonly THREE.Light[]) {
  const library = (renderer as { library?: { getLightNodeClass: (constructor: THREE.Light["constructor"]) => unknown } }).library;
  if (!library) return;
  for (const light of lights) {
    if (!library.getLightNodeClass(light.constructor)) {
      throw new Error(`Renderer cannot recognise ${light.type}: use the renderer's own Three.js constructors.`);
    }
  }
}
