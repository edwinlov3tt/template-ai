# Task: Worker-based SVG Importer (Comlink + Vite)

## Context
- Heavy SVG cleanup off the UI thread; enforce invariants (keep `viewBox`, normalize `href`).

## Requirements
- Create worker: `src/workers/svgImport.worker.ts`
- Wire with Comlink + vite-plugin-comlink.
- Steps inside worker:
  1) SVGO (multipass) with **removeViewBox disabled** and `removeDimensions` enabled.
  2) Normalize `xlink:href` → `href`.
  3) Detect large data URIs and push warnings suggesting externalization.
  4) Return `{ templateJSON, warnings: string[] }`.

## Guardrails
- No DOM APIs in the worker.
- Structured warnings only; do not `console.log` in production build.

## Tests
- Preserves `viewBox`.
- Emits warnings for large embedded images.
- Builds minimal `templateJSON` with frames extracted from viewBox and element bboxes.

## References
- Comlink: https://github.com/GoogleChromeLabs/comlink
- vite-plugin-comlink: https://www.npmjs.com/package/vite-plugin-comlink
- SVGO removeViewBox docs: https://svgo.dev/docs/plugins/removeViewBox/
- SVGO removeDimensions: https://svgo.dev/docs/plugins/removeDimensions/
