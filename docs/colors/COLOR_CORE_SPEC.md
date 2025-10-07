# Color Core System — Spec

**Goal:** Foundation for solid colors and gradients with native SVG rendering, modern color math, and zero glitches.

## Must Implement

### 1. Paint Type System

Define normalized paint types in `src/editor/color/types.ts`:

```typescript
export type SolidPaint = {
  kind: 'solid';
  color: string;      // hex or oklch(...) format
  opacity?: number;   // 0..1, defaults to 1
};

export type GradientStop = {
  offset: number;     // 0..1
  color: string;      // hex or oklch(...)
  opacity?: number;   // 0..1, defaults to 1
};

export type LinearGradientPaint = {
  kind: 'linear-gradient';
  angle: number;      // degrees, 0 = right, 90 = down
  stops: GradientStop[];
};

export type RadialGradientPaint = {
  kind: 'radial-gradient';
  cx: number;         // center x (0..1 of bbox)
  cy: number;         // center y (0..1 of bbox)
  r: number;          // radius (0..1 of bbox)
  fx?: number;        // focal x (defaults to cx)
  fy?: number;        // focal y (defaults to cy)
  stops: GradientStop[];
};

export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;
```

### 2. Color Math Utilities

Create `src/editor/color/colorMath.ts`:

**Public API:**
- `parseColor(input: string): Color | null` — accepts hex, oklch, rgb, hsl, names
- `toHex(color: string): string` — normalize to #rrggbb
- `toOklch(color: string): string` — convert to oklch(...) format
- `clampToSrgb(color: string): string` — gamut-map to sRGB when needed
- `interpolate(c1: string, c2: string, t: number): string` — blend colors (0..1)
- `contrastRatio(fg: string, bg: string): number` — WCAG contrast (1..21)

**Dependencies:**
- Use **culori** for OKLCH/OKLab conversions and gamut mapping
  https://culorijs.org/api/
- Use **chroma-js** for interpolations and color harmonies
  https://gka.github.io/chroma.js/

### 3. Gradient SVG Management

Create `src/editor/color/gradientDefs.ts`:

**Public API:**
- `ensureGradientDef(svg: SVGSVGElement, slotId: string, paint: Paint): string`
  - Ensures a `<defs>` section exists
  - Creates or updates `<linearGradient>` or `<radialGradient>` with stable ID
  - Updates `<stop>` elements with correct offset/color/opacity
  - Returns gradient ID for use in `fill="url(#id)"`

- `removeGradientDef(svg: SVGSVGElement, slotId: string): void`
  - Removes gradient def when slot is deleted or paint changes to solid

**Behavior:**
- Gradient ID format: `grad-{slotId}` (stable per slot)
- Only update changed `<stop>` attributes (not full DOM replace)
- Support both `<linearGradient>` and `<radialGradient>`
- Preserve `<defs>` order for deterministic output

**References:**
- MDN: `<linearGradient>` — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient
- MDN: `<radialGradient>` — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient
- MDN: `<stop>` — https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop

### 4. Paint Validators

Create `src/editor/color/validators.ts`:

**Public API:**
- `validatePaint(paint: unknown): paint is Paint` — type guard
- `validateGradientStops(stops: GradientStop[]): boolean`
  - At least 2 stops
  - Offsets in range 0..1
  - Offsets sorted ascending
- `sortStops(stops: GradientStop[]): GradientStop[]` — ensure sorted by offset
- `clampStop(stop: GradientStop): GradientStop` — clamp offset to 0..1

## Schema Changes

Update `src/schema/types.ts`:

```typescript
// In Slot interface, change fill from string to Paint
export interface Slot {
  // ... existing properties
  fill?: Paint;           // NEW: replaces string fill
  stroke?: SolidPaint;    // NEW: strokes only support solid
}
```

**Migration:**
- Existing templates with `fill: "#rrggbb"` auto-migrate to `{ kind: 'solid', color: "#rrggbb" }`
- Use a migration util: `migrateLegacyFill(fill: string | Paint): Paint`

## Store Integration

Update `src/state/editorStore.ts`:

**New Actions:**
- `updateSlotFill(slotId: string, paint: Paint): void`
- `addDocumentSwatch(paint: Paint): void` — adds to document colors
- `addRecentPaint(paint: Paint): void` — adds to LRU cache (max 10)

**New State:**
- `documentSwatches: Paint[]` — swatches used in current template
- `recentPaints: Paint[]` — LRU cache of recently used paints

## Rendering Integration

Update `src/editor/svg/SlotRenderer.tsx`:

**Changes:**
- Check `slot.fill.kind`:
  - If `'solid'`: use `fill={slot.fill.color}` and `fill-opacity={slot.fill.opacity}`
  - If `'linear-gradient'` or `'radial-gradient'`: call `ensureGradientDef()` and use `fill="url(#grad-{slotId})"`
- On slot delete: call `removeGradientDef()`
- On fill change: update gradient def or switch to solid

## Testing

### Unit Tests
Create `src/editor/color/__tests__/`:

- **colorMath.test.ts**
  - Round-trip conversions (hex → oklch → hex)
  - Gamut clamping (out-of-sRGB colors)
  - Interpolation produces valid colors
  - Contrast ratio matches WCAG formula

- **gradientDefs.test.ts**
  - Creates valid SVG `<linearGradient>` and `<radialGradient>`
  - Updates only changed `<stop>` attributes
  - Removes defs cleanly
  - Stable IDs across updates

- **validators.test.ts**
  - Rejects invalid paint types
  - Sorts stops correctly
  - Clamps offsets to 0..1

### Integration Tests
- Paint → SVG → render pipeline
- Legacy fill migration
- Store actions update gradients

## Guardrails

1. **Never remove viewBox** — SVG defs require viewBox for scaling
2. **No canvas fallbacks** — use native SVG only
3. **No CSS gradients** — linear-gradient() is not portable
4. **Gamut-safe** — always clamp out-of-sRGB colors
5. **Deterministic output** — same input → same SVG structure

## Files to Create

```
src/editor/color/
  types.ts              - Paint type definitions
  colorMath.ts          - Color conversions (culori/chroma wrappers)
  gradientDefs.ts       - SVG gradient management
  validators.ts         - Paint validators
  migrations.ts         - Legacy fill → Paint migration
  __tests__/
    colorMath.test.ts
    gradientDefs.test.ts
    validators.test.ts
```

## Dependencies

Install:
```bash
npm install culori chroma-js
npm install -D @types/culori @types/chroma-js
```

## References

- **culori** — https://culorijs.org/api/
- **chroma-js** — https://gka.github.io/chroma.js/
- **SVG Gradients** — https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
- **WCAG Contrast** — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
