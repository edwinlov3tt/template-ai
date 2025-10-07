# Gradient Editor — Spec

**Goal:** Enable gradient editing with on-canvas handles, gradient stop manipulation, and a pro-grade picker UI matching Canva's quality.

## Component Structure

### 1. Gradient Picker Tab (in ColorPanel)

Create `src/components/color/GradientColorPicker.tsx`

**UI Elements (from screenshots):**

#### Gradient Colors Section
- Label: "Gradient colors"
- Swatches: 3 recent gradients (circular chips showing gradient preview)
- Plus button: adds current gradient to recent
- Empty state: Shows 2 gray placeholder circles

#### Style Selection
- Label: "Style"
- Chips: Linear | Radial | Conic (phase 2)
- Visual icons in each chip
- Active chip highlighted with border

#### Gradient Bar Editor
- Shows current gradient as horizontal bar
- Draggable stop handles (circles) on bar
- Click on bar to add new stop
- Drag stop left/right to change position
- Click stop to select (highlighted)
- Delete button appears when stop selected

#### Color Picker for Selected Stop
- Same 2D picker as Solid tab
- Hue slider
- Hex input
- Only affects selected stop

#### Opacity Slider
- Label: "100%" (updates as slider moves)
- Range: 0-100%
- Only affects selected stop
- Shows checkerboard pattern under slider

#### Angle Slider (Linear only)
- Range: 0-360°
- Visual indicator: rotation icon
- Hidden for radial gradients

#### Position Controls (Radial only)
- cx, cy inputs (0-100%)
- r input (radius, 0-100%)
- Optional: fx, fy (focal point)
- Hidden for linear gradients

## On-Canvas Gradient Handles

Create `src/components/color/GradientOverlay.tsx`

### Linear Gradient Handles

**Visual:**
- Line connecting start → end points of gradient vector
- Two endpoint handles (circles, 10px diameter)
- Draggable stop handles along line (8px diameter)
- Rendered in SVG overlay (NOT clipped to canvas)

**Interactions:**
- Drag endpoints → change gradient angle + span
- Drag stop handles → change stop offset
- Click line → add new stop at position
- Pointer Events + setPointerCapture for smooth drag

**Math:**
- Convert angle + bbox → start/end points in viewBox coordinates
- Use `getScreenCTM().inverse()` to convert mouse deltas to SVG space
- Update `angle` based on endpoint positions

### Radial Gradient Handles

**Visual:**
- Circle showing gradient radius
- Center handle (circle, 10px diameter)
- Radius handle (circle on edge)
- Optional focal point handle (smaller circle, 6px)
- Draggable stop handles along radius

**Interactions:**
- Drag center → change cx, cy
- Drag radius handle → change r
- Drag focal → change fx, fy
- Drag stop handles → change stop offset

**Math:**
- cx, cy, r are in viewBox coordinates (0-100% of bbox)
- Use CTM for screen ↔ SVG conversions
- Radius handle stays perpendicular to gradient angle

## State Management

Update `src/state/editorStore.ts`:

**New State:**
```typescript
interface EditorState {
  // ... existing
  editingGradient: {
    slotId: string;
    paint: LinearGradientPaint | RadialGradientPaint;
    selectedStopIndex: number;
  } | null;
}
```

**New Actions:**
```typescript
startEditingGradient(slotId: string): void
stopEditingGradient(): void
updateGradientStyle(style: 'linear' | 'radial'): void
updateGradientAngle(angle: number): void
updateGradientStop(index: number, stop: GradientStop): void
addGradientStop(offset: number): void
removeGradientStop(index: number): void
selectGradientStop(index: number): void
updateGradientPosition(cx: number, cy: number, r: number): void
```

## Coordinate Math

Create `src/editor/color/gradientMath.ts`:

**Public API:**
```typescript
// Linear gradients
angleToVector(angle: number): { dx: number, dy: number }
vectorToAngle(dx: number, dy: number): number
gradientToPoints(
  bbox: { x: number, y: number, width: number, height: number },
  angle: number
): { x1: number, y1: number, x2: number, y2: number }

// Radial gradients
bboxToAbsolute(
  bbox: { x: number, y: number, width: number, height: number },
  cx: number, cy: number, r: number
): { cx: number, cy: number, r: number }
absoluteToBbox(
  bbox: { x: number, y: number, width: number, height: number },
  cx: number, cy: number, r: number
): { cx: number, cy: number, r: number }
```

## Pointer Event Handling

Use **Pointer Events + setPointerCapture** for all drag interactions:

```tsx
const handlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end' | 'stop') => {
  e.currentTarget.setPointerCapture(e.pointerId)
  // Store initial state
}

const handlePointerMove = (e: React.PointerEvent) => {
  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return

  // Convert screen deltas to SVG space
  const svg = svgRef.current
  const ctm = svg.getScreenCTM()!.inverse()
  const delta = { x: e.movementX, y: e.movementY }
  const svgDelta = {
    dx: delta.x * ctm.a + delta.y * ctm.c,
    dy: delta.x * ctm.b + delta.y * ctm.d
  }

  // Update gradient based on svgDelta
}

const handlePointerUp = (e: React.PointerEvent) => {
  e.currentTarget.releasePointerCapture(e.pointerId)
}
```

**References:**
- setPointerCapture — https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- getScreenCTM — https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM

## Gradient Stop Management

### Adding Stops
- Min 2 stops, max 10 stops (UX guideline)
- Click on gradient bar → insert stop at click position
- Auto-interpolate color at that offset
- Select newly added stop

### Removing Stops
- Select stop → delete button enabled
- Can't delete if only 2 stops remain
- Removes from `stops` array
- Auto-select nearest stop

### Reordering Stops
- Drag stop past another → they swap positions
- Always keep stops sorted by offset
- Use `sortStops()` utility after any change

## Component Files

```
src/components/color/
  GradientColorPicker.tsx       - Gradient tab UI
  GradientBar.tsx               - Gradient preview bar with stops
  GradientStopHandle.tsx        - Draggable stop handle
  GradientStyleChips.tsx        - Linear/Radial/Conic chips
  GradientOverlay.tsx           - On-canvas handles (SVG overlay)
  LinearGradientHandles.tsx     - Linear gradient endpoints
  RadialGradientHandles.tsx     - Radial gradient center/radius
```

```
src/editor/color/
  gradientMath.ts               - Coordinate conversions
```

## Testing

### Unit Tests
- `gradientMath.test.ts`
  - Angle ↔ vector conversions (round-trip)
  - BBox ↔ absolute conversions match
  - Edge cases: 0°, 90°, 180°, 270°

### Integration Tests
- Drag endpoint updates angle
- Add stop inserts at correct offset
- Remove stop decreases count
- Pointer capture prevents drag breaks

### Visual Tests
- Gradient renders match design mocks
- Handles stay correct size at all zoom levels
- Stop handles don't overlap

## Performance

- Debounce angle slider (100ms) to avoid excessive updates
- Only update changed `<stop>` attributes, not full gradient def
- Use `React.memo` on handle components
- Limit re-renders with `useMemo` for gradient SVG path

## Guardrails

1. **Pointer Capture** — always use setPointerCapture, never mousemove + mouseup
2. **CTM for all math** — never use offsetX/offsetY or clientX/clientY directly
3. **Sorted stops** — always call sortStops() after offset changes
4. **Min/max stops** — enforce 2-10 stops range
5. **Gamut-safe colors** — clamp stop colors to sRGB

## References

- **Pointer Events** — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- **setPointerCapture** — https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- **getScreenCTM** — https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
- **SVG Gradients** — https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
- **react-gradient-color-picker** (reference) — https://github.com/hxf31891/react-gradient-color-picker
