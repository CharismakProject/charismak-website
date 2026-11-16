import type * as THREE from "three";

type LightingEngine = Pick<typeof THREE, "AmbientLight" | "DirectionalLight" | "HemisphereLight">;

// WebGPURenderer registers lights by constructor identity. Its lights must
// therefore be instantiated from the same module as the renderer itself.
export function createWalkthroughLighting(Engine: LightingEngine, software: boolean) {
  const sky = new Engine.HemisphereLight(0xe6f0ff, 0x526475, software ? 0.7 : 1.1);
  const fill = new Engine.AmbientLight(0xffffff, software ? 0.42 : 0.25);
  const sun = new Engine.DirectionalLight(0xffeed7, software ? 0.55 : 2.2);
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
