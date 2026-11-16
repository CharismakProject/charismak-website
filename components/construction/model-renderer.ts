import * as Core from "three";

export type SceneEngine = Pick<typeof Core,
  "AmbientLight" | "ArrowHelper" | "Box3" | "BoxGeometry" | "BufferGeometry" | "CanvasTexture" | "Color" | "ConeGeometry" |
  "CylinderGeometry" | "DirectionalLight" | "EdgesGeometry" | "Float32BufferAttribute" | "GridHelper" | "Group" |
  "HemisphereLight" | "IcosahedronGeometry" | "Line" | "LineBasicMaterial" | "LineSegments" | "Mesh" |
  "MeshStandardMaterial" | "PerspectiveCamera" | "Raycaster" | "Scene" | "SphereGeometry" | "Vector2" | "Vector3">;
export type ModelRenderer = {
  domElement: HTMLElement | SVGElement;
  setSize: (width: number, height: number) => void;
  render: (scene: Core.Scene, camera: Core.Camera) => void;
  dispose?: () => void;
};

export async function createModelRenderer() {
  let Engine: SceneEngine = Core;
  let renderer: ModelRenderer | undefined;
  if ("gpu" in navigator) {
    try {
      const gpuEngine = await import("three/webgpu");
      const gpu = new gpuEngine.WebGPURenderer({ antialias: true, alpha: true });
      try {
        await gpu.init();
        gpu.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        gpu.toneMapping = Core.ACESFilmicToneMapping;
        gpu.toneMappingExposure = 1;
        gpu.shadowMap.enabled = true;
        renderer = gpu;
        Engine = gpuEngine;
      } catch { try { gpu.dispose(); } catch { /* Incomplete contexts cannot always be disposed. */ } }
    } catch { /* Continue with a compatible backend. */ }
  }
  if (!renderer) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (context) {
      const gl = new Core.WebGLRenderer({ canvas, context, antialias: true, alpha: true });
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      gl.toneMapping = Core.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1;
      gl.shadowMap.enabled = true;
      renderer = gl;
    }
  }
  const software = !renderer;
  if (!renderer) {
    const { SVGRenderer } = await import("three/addons/renderers/SVGRenderer.js");
    const svg = new SVGRenderer();
    svg.setClearColor(new Core.Color("#dce7f4"), 0);
    svg.setPrecision(2);
    renderer = svg;
  }
  return { Engine, renderer, software };
}
