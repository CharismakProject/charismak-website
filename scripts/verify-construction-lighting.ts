import assert from "node:assert/strict";
import * as Core from "three";
import { assertWalkthroughLighting, createWalkthroughLighting } from "../components/construction/construction-lighting";

async function verify() {
  // The r170 WebGPU bundle reads self at import time. No GPU or DOM is needed
  // to check its real constructor-based light registry.
  Object.assign(globalThis, { self: globalThis });
  const GPU = await import("three/webgpu");
  const canvas = { width: 1, height: 1, style: {}, addEventListener() {}, removeEventListener() {} } as unknown as HTMLCanvasElement;
  const renderer = new GPU.WebGPURenderer({ canvas });
  const mixedLights = createWalkthroughLighting(Core, false);
  assert.throws(() => assertWalkthroughLighting(renderer, mixedLights), /cannot recognise/, "Reproduce the black-model bug from mixed Three.js builds");
  const gpuLights = createWalkthroughLighting(GPU, false);
  assert.doesNotThrow(() => assertWalkthroughLighting(renderer, gpuLights), "Every hardware light must be registered by the actual renderer");
  for (const light of gpuLights) assert.ok(light.intensity > 0);
  assert.ok(renderer.library.fromMaterial(new GPU.MeshStandardMaterial({ color: "#d4c9b3" })));
  assert.doesNotThrow(() => assertWalkthroughLighting({}, createWalkthroughLighting(Core, true)), "Keep software/core rendering compatible");
  console.log("Construction lighting verified: mixed-build regression detected; WebGPU sky, fill, sun and standard materials recognised; core fallback retained.");
}

void verify().catch((error) => { console.error(error); process.exitCode = 1; });
