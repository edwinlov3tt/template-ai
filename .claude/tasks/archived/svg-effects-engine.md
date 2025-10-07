# Task: SVG Effects Engine

**Branch**: `feature/svg-effects-engine`
**Wave**: 1 (Independent)
**Dependencies**: None

## Objective

Build a reusable SVG filter engine that generates optimized `<defs>` nodes for text effects (shadow, neon, glitch, etc.) with parameter caching and hash-based deduplication.

## Requirements

### 1. Effects Manager Core (src/editor/effects/EffectsManager.ts)

```typescript
export class EffectsManager {
  private defsCache: Map<string, { id: string; node: SVGElement }>

  // Generate stable hash from effect parameters
  hashParams(effect: EffectParams): string

  // Get or create filter definition
  getOrCreateFilter(effect: EffectParams): string // Returns filter ID

  // Mount all cached defs to SVG
  mountDefs(svgElement: SVGSVGElement): void

  // Clear cache
  clear(): void
}
```

### 2. Effect Builders (src/editor/effects/builders/)

Create individual builder functions for each effect:

**`shadow.ts`**:
```typescript
export function makeShadow(params: {
  dx: number
  dy: number
  blur: number
  color: string
  alpha: number
}): { id: string; node: SVGFilterElement }
```

Uses `<feGaussianBlur>`, `<feOffset>`, `<feComponentTransfer>`, `<feMerge>`

**`lift.ts`**:
```typescript
export function makeLift(params: {
  blur: number
  alpha: number
}): { id: string; node: SVGFilterElement }
```

Ambient elevation shadow (no offset)

**`neon.ts`**:
```typescript
export function makeNeon(params: {
  stroke: number
  glow: number
  color: string
}): { id: string; node: SVGFilterElement }
```

Colored stroke + outer glow layers

**`echo.ts`**:
```typescript
export function makeEcho(params: {
  count: number
  dx: number
  dy: number
  blur: number
  color: string
  alpha: number
}): { id: string; node: SVGFilterElement }
```

Duplicate text N times with incremental offsets

**`glitch.ts`**:
```typescript
export function makeGlitch(params: {
  slices: number
  amplitude: number
  seed?: number
  colorA: string
  colorB: string
}): { id: string; node: SVGFilterElement }
```

RGB channel separation with horizontal slices

**`curve.ts`** (path-based, not filter):
```typescript
export function makeCurvePath(params: {
  radius: number
  viewBoxWidth: number
}): { id: string; node: SVGPathElement }
```

Circular arc for `<textPath>`

### 3. Stroke/Outline Utilities (src/editor/effects/stroke.ts)

```typescript
export interface StrokeConfig {
  width: number
  color: string
  paintOrder?: 'stroke fill' | 'fill stroke'
}

export function applyStroke(
  element: SVGElement,
  config: StrokeConfig
): void
```

For hollow text: `fill='none'`, `stroke` only
For outline: `paint-order='stroke fill'`

### 4. Background/Highlight (src/editor/effects/background.ts)

```typescript
export function createHighlightRect(params: {
  text: SVGTextElement
  fill: string
  padding: [number, number]
}): SVGRectElement
```

Measure text bbox, create auto-sized rect behind

### 5. Property Extensions (types.ts)

```typescript
// Add to Slot interface
stroke?: { width: number; color: string; paintOrder?: string }
highlight?: { fill: string; padding: [number, number] }
shadow?: { dx: number; dy: number; blur: number; color: string; alpha: number }
lift?: { blur: number; alpha: number }
neon?: { stroke: number; glow: number; color: string }
echo?: { count: number; dx: number; dy: number; blur: number; color: string; alpha: number }
glitch?: { slices: number; amplitude: number; seed?: number; colorA: string; colorB: string }
curve?: { radius: number }
imageMask?: { href: string }
```

### 6. Preset Bundles (src/editor/effects/presets.ts)

```typescript
export const EFFECT_PRESETS: Record<string, Partial<Slot>> = {
  none: {},
  shadow: { shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } },
  lift: { lift: { blur: 12, alpha: 0.2 } },
  hollow: { stroke: { width: 2, color: '#000000' }, fill: 'none' },
  outline: { stroke: { width: 3, color: '#000000', paintOrder: 'stroke fill' } },
  echo: { echo: { count: 3, dx: 2, dy: 2, blur: 0, color: '#000000', alpha: 0.4 } },
  glitch: { glitch: { slices: 5, amplitude: 3, colorA: '#FF00FF', colorB: '#00FFFF' } },
  neon: { neon: { stroke: 2, glow: 10, color: '#FF00FF' } },
  background: { highlight: { fill: '#000000', padding: [8, 4] } }
}
```

## Files to Create

**Create**:
- `src/editor/effects/EffectsManager.ts`
- `src/editor/effects/builders/shadow.ts`
- `src/editor/effects/builders/lift.ts`
- `src/editor/effects/builders/neon.ts`
- `src/editor/effects/builders/echo.ts`
- `src/editor/effects/builders/glitch.ts`
- `src/editor/effects/builders/curve.ts`
- `src/editor/effects/stroke.ts`
- `src/editor/effects/background.ts`
- `src/editor/effects/presets.ts`
- `src/editor/effects/__tests__/EffectsManager.test.ts`
- `src/editor/effects/__tests__/shadow.test.ts`
- `src/editor/effects/__tests__/neon.test.ts`
- `src/editor/effects/__tests__/glitch.test.ts`
- `src/editor/effects/__tests__/presets.test.ts`

**Modify**:
- `src/schema/types.ts` - Add effect properties to Slot

## Tests

**Coverage target**: >90%

Test cases:
1. **EffectsManager**: Hash generation, cache deduplication, mount/unmount
2. **Shadow builder**: SVG filter structure, param validation
3. **Neon builder**: Multi-layer glow, color blending
4. **Glitch builder**: Deterministic seed, slice count
5. **Stroke utilities**: paint-order, hollow vs outline
6. **Background**: bbox measurement, padding calculation
7. **Presets**: Apply bundles, revert to none

## Acceptance Criteria

- [ ] EffectsManager caches filters by parameter hash
- [ ] All 9 effect builders generate valid SVG
- [ ] Stroke utilities handle hollow and outline cases
- [ ] Background auto-sizes to text bbox with padding
- [ ] Presets apply correct property bundles
- [ ] All tests passing (>40 tests)
- [ ] TypeScript build clean
- [ ] No breaking changes to V1/V2 canvas

## Integration Notes

- Effects are **property-based**, not mode-based
- Null/undefined effect properties = effect disabled
- Filters are **cached** - same params reuse same filter ID
- Works with both V1 and V2 canvas
- Feature flag: `VITE_TEXT_EFFECTS=false` (default)

## Performance Considerations

- **Cache by hash**: Avoid regenerating identical filters
- **Mount once**: All defs added to SVG once, referenced by slots
- **GPU-friendly**: Use SVG filters (hardware accelerated)

## Out of Scope

- UI components (handled in `feature/effects-ui-panels`)
- Typography (handled in `feature/text-typography-system`)
- Canvas rendering integration (handled by V1/V2 canvas)
