# SVG Effects Engine

Reusable SVG filter system for text effects with parameter caching and hash-based deduplication.

## Features

- ✅ **9 Effect Types**: Shadow, Lift, Neon, Echo, Glitch, Curve, Stroke, Outline, Highlight
- ✅ **Smart Caching**: Hash-based deduplication prevents duplicate filters
- ✅ **GPU Accelerated**: Uses native SVG filters for hardware acceleration
- ✅ **Type Safe**: Full TypeScript support with parameter validation
- ✅ **Preset System**: Pre-configured effect bundles for quick application
- ✅ **76 Tests**: Comprehensive test coverage (>95%)

## Quick Start

```typescript
import { effectsManager, makeShadow, EFFECT_PRESETS } from '@/editor/effects'

// 1. Create effect filter
const shadowFilter = makeShadow({
  dx: 0,
  dy: 4,
  blur: 8,
  color: '#000000',
  alpha: 0.3
})

// 2. Register with manager
const filterId = effectsManager.getOrCreateFilter(
  { type: 'shadow', params: shadowFilter },
  makeShadow
)

// 3. Mount to SVG
const svg = document.querySelector('svg')
effectsManager.mountDefs(svg)

// 4. Apply to element
textElement.style.filter = `url(#${filterId})`
```

## Effect Types

### Shadow
Drop shadow with offset, blur, color, and opacity control.

```typescript
makeShadow({
  dx: 0,        // Horizontal offset (px)
  dy: 4,        // Vertical offset (px)
  blur: 8,      // Blur radius (px)
  color: '#000000',
  alpha: 0.3    // Opacity (0-1)
})
```

### Lift
Ambient elevation shadow (no offset) for floating appearance.

```typescript
makeLift({
  blur: 12,     // Blur radius (px)
  alpha: 0.2    // Opacity (0-1)
})
```

### Neon
Colored glow effect with multiple blur layers.

```typescript
makeNeon({
  stroke: 2,    // Stroke width (px)
  glow: 10,     // Glow intensity (px)
  color: '#FF00FF'
})
```

### Echo
Duplicate text N times with incremental offsets.

```typescript
makeEcho({
  count: 3,     // Number of echoes
  dx: 2,        // Horizontal offset per echo
  dy: 2,        // Vertical offset per echo
  blur: 0,      // Blur amount (px)
  color: '#000000',
  alpha: 0.4    // Base opacity
})
```

### Glitch
RGB channel separation with horizontal slices.

```typescript
makeGlitch({
  slices: 5,    // Number of glitch slices
  amplitude: 3, // Displacement amount (px)
  seed: 12345,  // Random seed (deterministic)
  colorA: '#FF00FF',
  colorB: '#00FFFF'
})
```

### Curve
Circular arc path for text-on-path.

```typescript
makeCurvePath({
  radius: 100,      // Curve radius (px)
  viewBoxWidth: 800 // ViewBox width for centering
})
```

## Utilities

### Stroke Effects

```typescript
import { applyStroke, applyHollowStroke, applyOutlineStroke } from '@/editor/effects'

// Outlined text (stroke behind fill)
applyOutlineStroke(textElement, {
  width: 3,
  color: '#000000'
})

// Hollow text (no fill, stroke only)
applyHollowStroke(textElement, {
  width: 2,
  color: '#FFFFFF'
})
```

### Background Highlight

```typescript
import { createHighlightRect } from '@/editor/effects'

const rect = createHighlightRect({
  text: textElement,
  fill: '#000000',
  padding: [8, 4],  // [horizontal, vertical]
  rx: 4             // Border radius (optional)
})

// Insert before text in DOM
textElement.parentElement.insertBefore(rect, textElement)
```

## Presets

Pre-configured effect bundles for quick application:

```typescript
import { EFFECT_PRESETS, applyPreset } from '@/editor/effects'

// Available presets
const presets = [
  'none',       // Clear all effects
  'shadow',     // Drop shadow
  'lift',       // Elevation
  'hollow',     // Hollow text
  'outline',    // Outlined text
  'echo',       // Trail effect
  'glitch',     // RGB glitch
  'neon',       // Neon glow
  'background'  // Highlight
]

// Apply preset to slot
const slot = applyPreset(baseSlot, 'shadow')

// Clear all effects
const clean = applyPreset(slot, 'none')
```

## Cache Management

The EffectsManager automatically caches filters by parameter hash:

```typescript
import { effectsManager } from '@/editor/effects'

// Same parameters = same filter ID (cached)
const id1 = effectsManager.getOrCreateFilter(effect, builder)
const id2 = effectsManager.getOrCreateFilter(effect, builder)
// id1 === id2 ✅

// Check cache
effectsManager.has(effect)        // true
effectsManager.size()              // 1

// Remove specific filter
effectsManager.remove(effect)

// Clear all cached filters
effectsManager.clear()
```

## Type Extensions

Effects are added to the `Slot` interface:

```typescript
interface Slot {
  // Effect properties
  shadow?: { dx: number; dy: number; blur: number; color: string; alpha: number }
  lift?: { blur: number; alpha: number }
  neon?: { stroke: number; glow: number; color: string }
  echo?: { count: number; dx: number; dy: number; blur: number; color: string; alpha: number }
  glitch?: { slices: number; amplitude: number; seed?: number; colorA: string; colorB: string }
  curve?: { radius: number }
  highlight?: { fill: string; padding: [number, number]; rx?: number }
  strokeConfig?: { width: number; color: string; paintOrder?: 'stroke fill' | 'fill stroke' }
}
```

## Performance

- **Cached filters**: Same parameters reuse same filter definition
- **GPU accelerated**: SVG filters use hardware acceleration
- **Minimal DOM**: One `<defs>` element, multiple references
- **Hash-based**: O(1) lookup for cached filters

## Testing

```bash
# Run all effects tests
npm test -- src/editor/effects/__tests__/

# Run specific test
npm test -- src/editor/effects/__tests__/shadow.test.ts
```

Coverage: **76 tests passing** (>95% coverage)

## Architecture

```
src/editor/effects/
├── EffectsManager.ts          # Core caching engine
├── builders/                  # Effect builders
│   ├── shadow.ts
│   ├── lift.ts
│   ├── neon.ts
│   ├── echo.ts
│   ├── glitch.ts
│   └── curve.ts
├── stroke.ts                  # Stroke utilities
├── background.ts              # Highlight utilities
├── presets.ts                 # Preset bundles
├── index.ts                   # Public API
└── __tests__/                 # Test suite
```

## Integration

Effects work with both V1 and V2 canvas implementations. Use feature flag for gradual rollout:

```typescript
// .env
VITE_TEXT_EFFECTS=true  // Enable effects system
```

## Out of Scope

- ❌ UI components (handled in `feature/effects-ui-panels`)
- ❌ Typography system (handled in `feature/text-typography-system`)
- ❌ Canvas rendering (V1/V2 canvas handles this)

## Resources

- [MDN: SVG Filters](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Filter_effects)
- [MDN: feGaussianBlur](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur)
- [MDN: feOffset](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset)
- [SVG Filter Playground](https://yoksel.github.io/svg-filters/)
