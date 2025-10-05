# Task: CoordinateSystem service (Phase 0, no UI changes)

## Context
- Purpose: centralize DOM↔SVG math with cached inverse CTM and explicit invalidation.
- Read:
  - docs/refactor/COORDINATE_SYSTEM_SPEC.md
  - docs/refactor/REFACTOR_CONTEXT.md

## Requirements
- Create: `src/editor/core/CoordinateSystem.ts`
- Create tests: `src/editor/core/__tests__/CoordinateSystem.test.ts`
- API (public):
  - `setSvg(svg: SVGSVGElement): void`
  - `invalidate(): void` (call on zoom/pan/resize/layout shift)
  - `screenToUser(p: {x:number;y:number}): {x:number;y:number}`
  - `userToScreen(p: {x:number;y:number}): {x:number;y:number}`
  - `pxDeltaToUser(dx:number, dy:number): {dx:number;dy:number}`
- Behavior:
  - Cache **inverse** CTM once per interaction; reuse until invalidated.
  - Use `getScreenCTM()`; fallback to `getCTM()` only when necessary.
  - Preserve `viewBox` semantics (no reliance on offsetX/Y).

## Guardrails
- Pointer Events only; compatible with `setPointerCapture()`.
- No React imports, side effects, or global listeners in this module.

## Tests
- Round-trip (`user→screen→user`) within epsilon for multiple zoom/pan combos.
- Cache invalidated on synthetic resize / zoom change.
- High-DPI sanity test (devicePixelRatio ≥ 2).

## References
- MDN: setPointerCapture — https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- MDN: Pointer events — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- MDN: getScreenCTM — https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
- MDN: viewBox — https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox
