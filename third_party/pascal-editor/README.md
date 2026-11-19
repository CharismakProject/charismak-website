# Pascal Editor (third-party, MIT)

The Design Studio at `/construction-studio/design` uses the `@pascal-app/*` npm packages
(core, viewer, editor, nodes) and these static assets copied from
https://github.com/pascalorg/editor (`apps/editor/public`):

- `public/icons/*` (except `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, which are Charismak's)
- `public/audios/`, `public/items/`, `public/material/`, `public/hdri/`, `public/cursor.svg`

Copyright (c) 2026 Pascal Group Inc. Licensed under the MIT License — see `LICENSE` in this folder.

`public/decoders/` holds the Draco and Basis decoders from three.js 0.187.0 (`examples/jsm/libs`),
MIT/Apache-2.0 licensed by their authors, so models and textures decode without third-party CDNs.
