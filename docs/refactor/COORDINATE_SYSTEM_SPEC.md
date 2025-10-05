# CoordinateSystem Service — Spec

**Goal:** Centralize all DOM↔SVG coordinate math with caching and invalidation rules.

## Must implement
- `screenToUser(point: {x:number,y:number}): {x:number,y:number}`
- `userToScreen(point) → point`
- `pxDeltaToUser(dx:number, dy:number) → {dx,dy}` (uses cached **inverse** CTM)
- `setSvg(svg: SVGSVGElement)` and `invalidate()`

## Behavior
- Compute CTM once per interaction; reuse until invalidated.
- Use `https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM` for element-to-viewport transform; fall back to `https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getCTM` when needed.
- All conversions preserve the SVG **`viewBox`** contract (https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox).

## Input events
- Use **Pointer Events** (https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) and **pointer capture** (https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture).
- Do not rely on `offsetX/offsetY`.

## Testing
- Unit tests for zoom/pan changes, screen resize, high-DPI.
- Golden tests for round-trip: `user→screen→user` ≈ identity within epsilon.
