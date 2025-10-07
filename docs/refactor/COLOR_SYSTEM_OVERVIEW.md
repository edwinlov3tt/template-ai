# Ultra Color System — Overview & Strategy

**Goal:** Build a Canva-grade color system with solid colors, gradients, image-derived palettes, contrast checking, and zero rendering glitches.

## Architecture Pillars

### 1. Paint Abstraction
All fills use a unified `Paint` type:
- `SolidPaint` — hex/oklch color + opacity
- `LinearGradientPaint` — angle + gradient stops
- `RadialGradientPaint` — center/radius/focal + stops

### 2. Native SVG Rendering
- Gradients live in `<defs>` as native `<linearGradient>` / `<radialGradient>`
- No canvas fallbacks or CSS gradient hacks
- Portable across browsers and export formats

### 3. Color Math Foundation
- **culori** for OKLCH/OKLab, gamut mapping, CSS Color 4 support
- **chroma-js** for interpolations, scales, and color harmonies
- All conversions stay in-gamut (sRGB clamp when needed)

### 4. Image Palette Extraction
- **color-thief** or **node-vibrant** in a Web Worker
- Auto-extracts dominant + palette swatches on image load
- Cached per image URL/hash

### 5. Accessibility Gates
- **WCAG 2.x AA** contrast ratio (≥ 4.5:1 normal, ≥ 3:1 large)
- Optional **APCA** readout (target Lc ≈ 60 for body text)
- One-click auto-fixes (chip, invert, overlay boost)

## UI Components (from screenshots)

### Main Color Panel
Right rail drawer with collapsible sections:

1. **Search Box** — accepts color names ("blue") or hex ("#00c4cc")
2. **Document Colors** — swatches used in current template
   - Plus button to add current color
   - Edit button to manage palette
3. **Brand Kit** — external palettes (optional)
4. **Photo Colors** — auto-extracted from images
   - Shows image thumbnails + extracted swatches
   - "Change all" button to remap fills
   - Expandable to full modal
5. **Default Solid Colors** — static comprehensive grid
   - "See all" expands to full color picker modal
   - "Change all" button for batch operations
6. **Default Gradient Colors** — curated gradient presets
   - "See all" expands to gradient gallery

### Advanced Picker (Modal or Inline)
Two tabs: **Solid | Gradient**

#### Solid Tab
- 2D color picker (saturation/lightness square)
- Hue slider (horizontal rainbow)
- Hex input field
- Eyedropper button (native `EyeDropper` API when available)
- OKLCH/HSL toggle (optional)

#### Gradient Tab
- **Gradient colors** — recent gradients with "+" to add
- **Style** — chips for Linear / Radial / Conic (phase 2)
- **Color picker** — same 2D picker for selected stop
- **Gradient bar** — shows current gradient with draggable stops
   - Click on bar to add stop
   - Drag stop to reposition
   - Click stop to select (shows in picker)
- **Opacity slider** — for selected stop
- **Delete button** — removes selected stop
- **Angle slider** (linear only)
- **Position controls** (radial: cx, cy, r, fx, fy)

## Feature Flags

Add to `.env`:
```env
VITE_COLOR_SYSTEM_V2=true
VITE_GRADIENT_SUPPORT=true
VITE_IMAGE_PALETTE=true
VITE_CONTRAST_CHECKS=true
```

Safe rollout strategy: enable flags per-feature.

## Branch Strategy

Ship in parallel using Feature Branch workflow:

1. **feature/color-core** — Paint types, color math, gradient SVG system
2. **feature/color-panel-ui** — Main panel UI with all sections
3. **feature/gradient-editor** — Gradient tab + on-canvas handles
4. **infra/image-palette-worker** — Worker-based palette extraction
5. **feature/contrast-gates** — WCAG/APCA checks + auto-fixes

Each branch merges to `develop` after review + tests pass.

## Dependencies

Install via npm:
```bash
npm install culori chroma-js react-colorful color-thief
```

- **culori** — Modern CSS Color 4 spaces, OKLCH/OKLab, gamut mapping
  https://culorijs.org/api/
- **chroma-js** — Color interpolations and scales
  https://gka.github.io/chroma.js/
- **react-colorful** — Tiny, fast, accessible picker components
  https://omgovich.github.io/react-colorful/
- **color-thief** — Browser-compatible palette extraction
  https://lokeshdhakar.com/projects/color-thief/

## Non-Negotiables

1. **No CSS gradients** — use native SVG `<linearGradient>` / `<radialGradient>` only
2. **Pointer Events + setPointerCapture** — for all on-canvas gradient handles
3. **Worker-based extraction** — never block main thread for image palette
4. **Gamut-safe conversions** — clamp to sRGB when needed
5. **Instant rollback** — feature flags allow toggling off without code changes

## Testing Strategy

### Unit Tests
- Paint type conversions (solid ↔ gradient)
- Color math (culori/chroma round-trips)
- Gradient SVG def generation
- Stop sorting, offset clamping

### Integration Tests
- Picker → Paint → SVG → render pipeline
- Worker message passing (palette extraction)
- Contrast ratio calculations

### Visual Tests
- Gradient rendering matches design mocks
- Color picker matches browser's native picker
- Gradient stops draggable without glitches

### Performance Tests
- Picker drag at 60fps
- Worker extraction doesn't block UI
- Large gradient updates (10+ stops) remain smooth

## Implementation Order

### Phase 0 — Foundation (feature/color-core)
- Paint types and validators
- Color math utilities (culori/chroma wrappers)
- Gradient SVG def management
- Tests for color conversions

### Phase 1 — UI Shell (feature/color-panel-ui)
- Right rail panel structure
- Search box
- Document colors section
- Default solid/gradient sections
- Solid color picker tab
- Recently used colors (LRU)

### Phase 2 — Gradients (feature/gradient-editor)
- Gradient tab UI (style chips, stop editor)
- Gradient color picker
- On-canvas gradient handles (linear/radial)
- Pointer Events + CTM math

### Phase 3 — Image Palettes (infra/image-palette-worker)
- Web Worker setup
- color-thief integration
- Per-image caching
- Photo colors section UI
- "Change all" button

### Phase 4 — Accessibility (feature/contrast-gates)
- WCAG contrast checker
- Optional APCA support
- Pass/fail chips
- Auto-fix suggestions

## References

- **Canva color UI** — See screenshots/ for exact UI requirements
- **SVG Gradients** — https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
- **Pointer Events** — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- **EyeDropper API** — https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
- **WCAG Contrast** — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- **APCA Contrast** — https://git.apcacontrast.com/documentation/APCAeasyIntro.html
