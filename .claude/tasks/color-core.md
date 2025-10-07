# Task: Color Core System (Phase 0, foundation only)

## Context
- Purpose: Build Paint type system, color math utilities, and SVG gradient management
- Read:
  - docs/refactor/COLOR_CORE_SPEC.md
  - docs/refactor/COLOR_SYSTEM_OVERVIEW.md

## Requirements
- Install dependencies: `npm install culori chroma-js`
- Create: `src/editor/color/types.ts` — Paint type definitions
- Create: `src/editor/color/colorMath.ts` — Color conversions (culori/chroma wrappers)
- Create: `src/editor/color/gradientDefs.ts` — SVG gradient def management
- Create: `src/editor/color/validators.ts` — Paint validators
- Create: `src/editor/color/migrations.ts` — Legacy fill → Paint migration
- Create tests: `src/editor/color/__tests__/*.test.ts`

## API (public)
### Paint Types
- `SolidPaint`, `LinearGradientPaint`, `RadialGradientPaint`, `Paint`

### Color Math
- `parseColor(input: string): Color | null`
- `toHex(color: string): string`
- `toOklch(color: string): string`
- `clampToSrgb(color: string): string`
- `interpolate(c1: string, c2: string, t: number): string`
- `contrastRatio(fg: string, bg: string): number`

### Gradient SVG
- `ensureGradientDef(svg: SVGSVGElement, slotId: string, paint: Paint): string`
- `removeGradientDef(svg: SVGSVGElement, slotId: string): void`

### Validators
- `validatePaint(paint: unknown): paint is Paint`
- `sortStops(stops: GradientStop[]): GradientStop[]`

## Behavior
- Use culori for OKLCH/OKLab conversions and gamut mapping
- Use chroma-js for interpolations and color harmonies
- Gradients → native SVG `<linearGradient>` / `<radialGradient>` only
- Update only changed `<stop>` attributes (not full DOM replace)
- Stable gradient IDs: `grad-{slotId}`

## Guardrails
- Never remove viewBox from SVG
- No canvas fallbacks or CSS gradients
- Gamut-safe: always clamp out-of-sRGB colors
- Deterministic output: same input → same SVG structure

## Tests
- Round-trip color conversions (hex → oklch → hex)
- Gamut clamping (out-of-sRGB colors)
- Interpolation produces valid colors
- Contrast ratio matches WCAG formula
- Gradient defs create valid SVG elements
- Legacy fill migration works

## References
- culori — https://culorijs.org/api/
- chroma-js — https://gka.github.io/chroma.js/
- SVG Gradients — https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
- WCAG Contrast — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
