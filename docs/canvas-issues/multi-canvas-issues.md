# Multi-Canvas UX: Current State, Limitations, and Proposed Fixes

## Overview
The editor now supports pages with heterogeneous aspect ratios (e.g. 1080×1080, 728×90, 1080×1920). We normalized the internal coordinate system (long edge ≈ 2000 units, short edge clamped ≥ 320) so canvases remain workable. However, several layout and interaction issues remain when multiple canvases live inside the same scrollable stage.

## User-Facing Pain Points

1. **Toolbar Overlap**
   - Page-level controls (name, reorder, lock/delete, add-page dropdown) live inside the page wrapper. On shorter canvases (e.g. 728×90) the dropdown or popovers can extend beyond the canvas and get clipped by ancestors with `overflow: hidden` and/or lower stacking contexts.

2. **Slot Bleed / Clipping**
   - While the normalized SVGs clip their content, outer containers sometimes expose overflow or crop selection handles. Scaling a slot beyond the visible canvas can still show overhang or hide handles depending on which container controls `overflow`.

3. **Inconsistent Handle Scaling**
   - `SelectionOverlayV2` sizes its grab handles relative to the stage CTM. When canvases are normalized but the viewBox changes per page, handle size varies unpredictably at low zoom levels.

4. **Safe-Area Guides**
   - Current safe-area inset is a flat 5% of the smaller edge. This is helpful but still arbitrary; templates designed with precise bleed requirements need per-ratio configuration.

5. **Control Layout**
   - Controls are anchored via absolute padding above each canvas. As canvas widths diverge, controls no longer align or center relative to the page.

6. **Scroll + Centering**
   - The vertical stack uses a single zoom transform; per-page widths and margins are computed manually. There is no auto-centering after structural changes, so narrow banners hug the left edge until the transform is recalculated.

## Current Architecture

### Rendering
- **Stack container**: `CanvasStage` (React) renders a list of `page-wrapper` divs inside a zoom-transformed container (`#canvas-scaler`). Each wrapper contains:
  - `PageControls` (top toolbar)
  - `.canvas-container` with `SvgStageV2` (if feature flag enabled)
  - overlays (safe area, gradient handles, selection overlay)
- **Normalization**: `getPageDimensions()` returns normalized width/height per page based on preferred ratio using helpers in `src/editor/utils/normalization.ts`.
- **Selection overlay**: `SelectionOverlayV2` computes bounding boxes from normalized frames and renders handles in SVG coordinate space. Handle size is scaled by CTM.

### Data layer
- Zustand store (`src/state/editorStore.ts`) stores frames in normalized coordinates. Each `Page` now tracks `preferredRatio`, `coordinateSystem`, and `normalizedHeight`. Slots are inserted and duplicated using normalized dimensions.

### Tech stack / libraries
- React 18 + TypeScript (strict mode)
- Zustand state management
- SVG rendering with custom components (`SvgStage` / `SvgStageV2`)
- Layout helpers in `src/editor/utils/*`
- UI: Ant Design icons, lucide-react icons, custom CSS-in-JS inline styles
- Build: Vite + TypeScript project references
- Testing: legacy Jest/Vitest suites (many are currently failing)

### Limitations / Known constraints
- **CSS-only layout**: We rely on inline styles; no layout framework (e.g. Flexbox with CSS modules) is orchestrating stacking contexts globally.
- **Zoom container**: A single transform handles zoom for all pages; individual pages cannot opt out or apply different scaling.
- **Overflow handling**: Stage wrappers and canvases rely on nested `overflow` toggles. Tweaking one level (e.g. to show a dropdown) often breaks clipping for content.
- **Selection overlay**: Because it draws inside the SVG, clipping or viewBox adjustments can hide handles if we change overflow behavior incorrectly.
- **Safe area**: Hard-coded heuristics; no template-specific configuration.
- **Popovers**: The add-page dropdown is an inline element; without using portals or fixed positioning, it remains at the mercy of parent overflow.

## Proposed Fixes / Enhancements

### 1. Dedicated Control Layer
- Move `PageControls` outside the clipping hierarchy. For each page, render controls in an overlay container positioned via absolute coordinates over the canvas, or use CSS grid to reserve a control row above the canvas.
- Use `position: sticky` or `transform` adjustments so the toolbar stays visible and can expand beyond the canvas width without clipping.

### 2. Canvas Mask Component
- Wrap `SvgStageV2` inside a `CanvasMask` component that:
  - Creates an inner wrapper with `overflow: hidden` for clipping slot content.
  - Adds padding for selection handles so they don’t get cropped (e.g. extra 16px and translate the SVG accordingly).
- This isolates clipping behavior and prevents parent containers from toggling overflow ad hoc.

### 3. Popover Portal
- Render the add-page dropdown using a React portal (`createPortal`) into a top-level container (`document.body`). This sidesteps local overflow issues entirely.

### 4. Handle Sizing Strategy
- Normalize handle sizes against the normalized canvas dimensions rather than relying solely on CTM. Example: `handleSize = clamp(10, 24, normalizedWidth / 80)`.

### 5. Safe-Area Configuration
- Store optional safe-area metadata per ratio (e.g. from template tokens). Remove the fixed 5% heuristic or make it minimum fallback.

### 6. Centering & Scroll
- Maintain computed offsets (top + left) per page after zoom changes. When canvases differ in width, recalc left offset so each wrapper remains centered under the zoom transform.

### 7. Testing / Validation
- Add visual regression tests (Playwright/Screenshot) for key ratios at different zoom levels.
- Fix legacy Jest/Vitest suites to ensure normalization changes don’t regress hidden features.

## Next Steps Before Further Code Changes
1. Refactor `PageControls` to render via portal overlay, decoupling toolbar from canvas overflow.
2. Introduce `CanvasMask` wrapper with predictable clip/overflow behavior and selection-handle padding.
3. Update dropdown to use portal (ensures visibility regardless of ancestor overflow).
4. Revisit safe-area config (optional). Finish by validating slot scaling and handle placement across ratios.

