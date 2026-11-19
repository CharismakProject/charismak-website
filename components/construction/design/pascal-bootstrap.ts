import { type AnyNodeDefinition, nodeRegistry, registerNode } from "@pascal-app/core";
import { builtinPlugin } from "@pascal-app/nodes";
import { configureViewer } from "@pascal-app/viewer";

// Icons, sounds, furniture models, materials and sky lighting are self-hosted from /public
// (MIT assets copied from the Pascal Editor repository; see third_party/pascal-editor).
configureViewer({
  assetsBaseUrl: window.location.origin,
  iconsBaseUrl: "/icons",
  sfxBaseUrl: "/audios/sfx",
  // Draco (models) and Basis/KTX2 (textures) decoders are self-hosted from three.js 0.187,
  // so furniture and textured finishes load without Google/CDN access.
  decoders: { dracoPath: "/decoders/draco/", basisPath: "/decoders/basis/" },
});

// Register every built-in node kind once (walls, slabs, roofs, doors, windows, items…).
for (const def of builtinPlugin.nodes ?? []) {
  if (!nodeRegistry.has((def as AnyNodeDefinition).kind)) registerNode(def as AnyNodeDefinition);
}
