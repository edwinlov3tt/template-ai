# Import Pipeline (Worker) — Spec

**Goal:** Run heavy SVG cleanup off the UI thread; enforce SVG invariants.

## Worker
- Implement with **Comlink**: https://github.com/GoogleChromeLabs/comlink (+ Vite plugin: https://www.npmjs.com/package/vite-plugin-comlink)
- Input: raw SVG string
- Output: `{ templateJSON, warnings: string[] }`

## Normalize
- SVGO with config that **keeps** `viewBox` (https://svgo.dev/docs/plugins/removeViewBox/) and can remove `width/height` in favor of `viewBox` (https://svgo.dev/docs/plugins/removeDimensions/).
- Normalize `xlink:href` → `href` (SVG2).

## Warnings
- Large data URIs (suggest externalization)
- Unsupported filters/masks/clipPaths
