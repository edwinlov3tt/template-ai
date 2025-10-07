# Task: Gradient Editor (Phase 2, advanced gradients)

## Context
- Purpose: Enable gradient editing with on-canvas handles and gradient stop manipulation
- Read:
  - docs/refactor/GRADIENT_EDITOR_SPEC.md
  - docs/refactor/COLOR_SYSTEM_OVERVIEW.md
  - screenshots/ for gradient UI reference

## Requirements
- Create: `src/components/color/GradientColorPicker.tsx` — Gradient tab UI
- Create: `src/components/color/GradientBar.tsx` — Gradient preview bar with stops
- Create: `src/components/color/GradientStopHandle.tsx` — Draggable stop handle
- Create: `src/components/color/GradientStyleChips.tsx` — Linear/Radial chips
- Create: `src/components/color/GradientOverlay.tsx` — On-canvas handles (SVG overlay)
- Create: `src/components/color/LinearGradientHandles.tsx` — Linear endpoints
- Create: `src/components/color/RadialGradientHandles.tsx` — Radial center/radius
- Create: `src/editor/color/gradientMath.ts` — Coordinate conversions
- Create tests: `src/editor/color/__tests__/gradientMath.test.ts`

## API (public)
### Store Actions
- `startEditingGradient(slotId: string): void`
- `stopEditingGradient(): void`
- `updateGradientStyle(style: 'linear' | 'radial'): void`
- `updateGradientAngle(angle: number): void`
- `updateGradientStop(index: number, stop: GradientStop): void`
- `addGradientStop(offset: number): void`
- `removeGradientStop(index: number): void`
- `selectGradientStop(index: number): void`

### Gradient Math
- `angleToVector(angle: number): { dx: number, dy: number }`
- `vectorToAngle(dx: number, dy: number): number`
- `gradientToPoints(bbox, angle): { x1, y1, x2, y2 }`
- `bboxToAbsolute(bbox, cx, cy, r): { cx, cy, r }`

## Behavior
- Gradient tab in ColorPanel (next to Solid tab)
- Linear gradient: endpoint handles + stop handles on line
- Radial gradient: center/radius handles + stop handles
- Pointer Events + setPointerCapture for all drag interactions
- CTM conversions for screen ↔ SVG coordinate math
- Min 2 stops, max 10 stops
- Click gradient bar → insert stop at position
- Drag stop → update offset
- Delete button enabled when stop selected

## UI Elements
1. Style chips: Linear | Radial
2. Gradient colors: recent gradients (3 swatches)
3. Gradient bar: current gradient with draggable stops
4. Color picker: for selected stop
5. Opacity slider: for selected stop
6. Angle slider (linear only)
7. Position inputs (radial: cx, cy, r)

## On-Canvas Handles
### Linear
- Line connecting start → end
- Two endpoint handles (10px circles)
- Stop handles along line (8px circles)

### Radial
- Circle showing gradient radius
- Center handle (10px circle)
- Radius handle on edge
- Stop handles along radius

## Guardrails
- MUST use setPointerCapture for all drags
- MUST use getScreenCTM().inverse() for coordinate conversions
- Never use offsetX/offsetY or clientX/clientY directly
- Always call sortStops() after offset changes
- Enforce 2-10 stops range
- Clamp stop colors to sRGB

## Tests
- Angle ↔ vector conversions (round-trip)
- BBox ↔ absolute conversions match
- Drag endpoint updates angle
- Add stop inserts at correct offset
- Remove stop decreases count
- Pointer capture prevents drag breaks

## References
- Pointer Events — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- setPointerCapture — https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- getScreenCTM — https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
- SVG Gradients — https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
