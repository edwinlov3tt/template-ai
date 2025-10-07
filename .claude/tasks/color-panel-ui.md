# Task: Color Panel UI (Phase 1, main UI)

## Context
- Purpose: Build Canva-style color panel with search, swatches, presets, and solid color picker
- Read:
  - docs/refactor/COLOR_PANEL_SPEC.md
  - docs/refactor/COLOR_SYSTEM_OVERVIEW.md
  - screenshots/ for exact UI reference

## Requirements
- Install dependencies: `npm install react-colorful`
- Create: `src/components/color/ColorPanel.tsx` — Main panel wrapper
- Create: `src/components/color/SearchBox.tsx` — Search input
- Create: `src/components/color/DocumentColors.tsx` — Document swatches section
- Create: `src/components/color/PhotoColors.tsx` — Photo colors section (no extraction yet)
- Create: `src/components/color/DefaultSolidColors.tsx` — Static color grid
- Create: `src/components/color/DefaultGradientColors.tsx` — Curated gradients
- Create: `src/components/color/SolidColorPicker.tsx` — Advanced solid picker
- Create: `src/components/color/RecentlyUsed.tsx` — Recent colors LRU
- Create: `src/components/color/ColorSwatch.tsx` — Reusable swatch component
- Create: `src/editor/color/defaultPalettes.ts` — Default color/gradient arrays

## API (public)
### Store Actions
- `addDocumentSwatch(paint: Paint): void`
- `removeDocumentSwatch(index: number): void`
- `addRecentPaint(paint: Paint): void`
- `updateSlotFill(slotId: string, paint: Paint): void`
- `toggleColorPanel(): void`

### Default Palettes
- `DEFAULT_SOLID_COLORS: string[]` (98 colors)
- `DEFAULT_GRADIENTS: LinearGradientPaint[]` (21 gradients)

## Behavior
- Dark theme UI matching screenshots (#1a1a1a background)
- Search box debounced (300ms), parses hex/names/oklch
- Document colors auto-populated from template fills
- Solid picker uses react-colorful (HexColorPicker + HexColorInput)
- Recently used: max 10 items, LRU order
- Eyedropper button (native EyeDropper API, fallback disabled)
- All swatches: 32px circles, 8px gap, keyboard navigable

## UI Sections
1. Search Box — "Try 'blue' or '#00c4cc'"
2. Document Colors — Used in template + button
3. Photo Colors — Placeholder grid (extraction in next phase)
4. Default Solid Colors — 4 rows × 7 columns, "See all" expands
5. Default Gradient Colors — 3 rows × 7 columns
6. Solid Color Picker — 2D picker + hue slider + hex input + eyedropper

## Guardrails
- No React imports in color math utilities
- All colors clamped to sRGB before display
- Keyboard accessible (Tab, Enter)
- Focus visible on all interactive elements
- Virtualize large grids (use react-window for 98+ colors)

## Tests
- Search parses hex, names, rgb, oklch
- LRU cache maintains max 10 items
- Document swatches deduplicate
- Eyedropper applies color when available
- Clicking swatch updates slot fill

## References
- react-colorful — https://omgovich.github.io/react-colorful/
- EyeDropper API — https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
- Canva UI — See screenshots/ for exact layout
