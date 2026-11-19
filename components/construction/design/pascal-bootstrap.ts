import { type AnyNodeDefinition, nodeRegistry, registerNode } from "@pascal-app/core";
import { builtinPlugin } from "@pascal-app/nodes";
import { configureViewer } from "@pascal-app/viewer";

// Icons, sounds, furniture models, materials and sky lighting are self-hosted from /public
// (MIT assets copied from the Pascal Editor repository; see third_party/pascal-editor).
configureViewer({
  assetsBaseUrl: window.location.origin,
  iconsBaseUrl: "/icons",
  sfxBaseUrl: "/audios/sfx",
});

// Register every built-in node kind once (walls, slabs, roofs, doors, windows, items…).
for (const def of builtinPlugin.nodes ?? []) {
  if (!nodeRegistry.has((def as AnyNodeDefinition).kind)) registerNode(def as AnyNodeDefinition);
}
