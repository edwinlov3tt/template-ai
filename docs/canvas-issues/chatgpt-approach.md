You’re running into three overlapping problems: (1) stacking/overflow makes controls disappear or feel tiny, (2) zoom/coordinate math isn’t normalized across different page sizes, and (3) UI elements (dropdowns, Add Page) are stuck inside clipped containers. Below is a concrete fix that keeps your current SVG-first renderer and swaps in a more robust multi-artboard layout, plus the exact libraries/APIs to lean on.

# What’s actually breaking (root causes)

1. **Controls hidden / too small**

* The selection handles and on-canvas toolbars are being rendered *inside the SVG clipping stack*, so changing `overflow` or the `viewBox` can hide them or scale them down unexpectedly (your own notes call this out).  
* Your current stage does a single transform for zoom on the stack container; tiny banners (e.g., 728×90) end up with micro targets and mis-sized handles. 

2. **Multi-size pages on one screen**

* Frames live in a “normalized” space, but each page still rides the same zoom transform. That creates inconsistent handle sizing and edge clipping across pages. 
* Toolbars and dropdowns are children of wrappers that also clip/scale, so they get cropped. 

3. **Interaction fragility**

* Some pointer flows don’t use pointer capture everywhere (a must for reliable drag/resize/rotate). Your spec explicitly requires it. 

# The fix (battle-tested approach)

## A) Split “canvas content” from “control chrome”

**Goal:** controls are always visible, correctly sized, and not clipped.

* **Dedicated Control Layer:** Render page-level toolbars, the W×H chip, and context menus in a DOM layer *outside* the clipped SVG. Use absolute positioning over the page or a grid row reserved for controls. (This comes straight from your “Proposed Fixes”.) 
* **Portal the dropdowns:** Mount the Add-Page dropdown and any popovers into `document.body` using a React portal so ancestor `overflow` doesn’t crop them. 
* **Keep selection handles out of the clip:** Your `SelectionOverlayV2` already sizes handles using the current CTM; render it *outside* the clipped `<g>` so it can bleed past the canvas edge without being cut. 

**Why this works:** SVG’s `viewBox` gives you a stable, unit-based coordinate system for content, independent of the CSS pixels used to paint the chrome (toolbars, chips, menus). That’s the canonical way to be responsive and size-agnostic. ([MDN Web Docs][1])

---

## B) Normalize interaction & sizing across pages

**Goal:** multiple page sizes/artboards on one screen—but consistent interactions, no microscopic controls, clean exports.

* **Single base coordinate space per page** via `viewBox` and store all slot frames there (you already do this). Switching output size changes the viewport, not the math.  ([MDN Web Docs][1])
* **Per-page centering & padding:** Keep a computed left offset per page so narrow banners auto-center under the zoom transform; reserve padding for handle bleed so they never crop. 
* **Handle scaling policy:** Clamp handle size by *screen* pixels (not content units). Your overlay already divides by CTM; add a min/max clamp so 728×90 isn’t unusable at certain zooms. 
* **Safe-area by ratio:** Store per-ratio safe insets (not a flat 5% heuristic) so different formats behave predictably. 

**Standards it leans on:** SVG `viewBox` for invariant units; `getScreenCTM()` for px↔user-space conversions; your `CoordinateSystem` caches the inverse CTM for performance.  ([MDN Web Docs][2])

---

## C) Make dragging/resize rock-solid with Pointer Events

**Goal:** no more “drag dies if the cursor leaves the canvas.”

* On `pointerdown`, call `setPointerCapture(pointerId)` on the element that received the event; release on up/cancel. (Spec + MDN.)  ([MDN Web Docs][3])
* Keep wheel listeners **passive** unless you’re preventing default for zoom (your spec already says this, and your V2 stage toggles passive/non-passive correctly). 

---

## D) Multi-size export that actually matches what you see

**Goal:** every page (whatever its size) exports perfectly to PNG/SVG.

* **SVG is source of truth; Canvg for raster.** Serialize each page’s `<svg>` (with viewBox) for SVG export; for PNG/WebP, render that SVG string to a hidden `<canvas>` via **Canvg** and save the blob. This is a reliable, well-documented path.  ([GitHub][4])

---

## E) Libraries to install (lightweight, proven)

* **react-moveable** for drag/resize/rotate/snap (works directly on SVG nodes and supports groupable/snappable). ([npm][5])
* **Canvg** for high-fidelity SVG→Canvas raster export. ([GitHub][4])
* **A portal/overlay lib** (e.g., Radix UI/`@floating-ui` or just `createPortal`) so dropdowns pop out of clipping parents. (Your own “Popover Portal” step explicitly recommends a portal.) 

> You don’t need a monolithic canvas framework here. Your current SVG-first editor and V2 components (`SvgStageV2`, `SelectionOverlayV2`) already align with this plan. 

# Step-by-step change list (copy/paste to issues)

1. **Control layer & portals**

   * Move `PageControls` out of the SVG and render via a portal overlay (fixed/absolute). Keep min target sizes (≥ 44px) so icons and the Add Page button are touch-friendly. 

2. **CanvasMask wrapper**

   * Wrap each page’s SVG in a `CanvasMask` component with `overflow:hidden` for content clip and *extra padding* for handle bleed (e.g., 16–24 px). 

3. **Normalize handle sizing**

   * In `SelectionOverlayV2`, clamp handle radius based on the CTM-derived `scale` (e.g., `clamp(8, 18, 12/scale)`), so tiny banners aren’t impossible to edit. 

4. **Pointer capture everywhere**

   * In your interaction layer, ensure `setPointerCapture` on down and release on up/cancel for drags/resizes/rotation. (MDN + spec.) ([MDN Web Docs][3])

5. **Per-page centering math**

   * Store computed left offsets after zoom/pan changes and re-center each wrapper; narrow pages won’t hug the left edge anymore. 

6. **Safe-area by ratio**

   * Move safe-area heuristics into template tokens per ratio, not a global 5% rule. 

7. **Exports**

   * `exportSVG(pageId)`: serialize the page’s `<svg>` with `viewBox`.
   * `exportPNG(pageId, w, h)`: feed that SVG string to Canvg and `toBlob()` (your PRP already includes working code).  ([GitHub][4])

# Do we need a full canvas refactor?

Not a ground-up rewrite—your V2 building blocks already match this approach:

* **CoordinateSystem service** (cache inverse CTM, invalidate on zoom/pan) is exactly what you need to keep interactions stable at any zoom. 
* **Interaction State Machine** is spec’d, including pointer capture and thresholds. Wire it fully and retire any ad-hoc listeners.  
* **Kiwi/Cassowary layout solver** keeps content from overlapping when you switch sizes—this is the right way to support “multiple sizes on one canvas page” without naive scaling. 

In other words: finish the V2 pieces you already drafted (controls out of clip, portals, handle sizing, pointer capture) and you’ll unlock multi-artboard editing that feels Canva-level.

# Quick acceptance checklist

* Selection handles never clip; they stay readable at any zoom.
* Dropdowns/menus always render above content via portals.
* Switching 1080×1080 ↔ 728×90 reflows via constraints with no overlaps. 
* PNG/SVG exports match on-screen composition. ([GitHub][4])

---

## References you can hand to the devs

* SVG `viewBox` for size-agnostic layouts (MDN). ([MDN Web Docs][1])
* Pointer Events + `setPointerCapture` (MDN/spec). ([MDN Web Docs][6])
* `getScreenCTM`/coordinate systems for accurate px↔user-space math (MDN). ([MDN Web Docs][2])
* **react-moveable** for SVG drag/resize/rotate/snap. ([npm][5])
* **Canvg** for reliable SVG→Canvas raster export. ([GitHub][4])

And your own design/tech docs that match this plan:

* Multi-canvas issues + proposed fixes.  
* CoordinateSystem spec (cache inverse CTM, `screenToUser`, pointer events). 
* Interaction state machine spec (pointer capture, passive wheel). 
* Layout solver (Kiwi.js) spec. 
* SVG-first editor PRP + export code.  

---

### TL;DR

* Keep editing in **SVG with a stable `viewBox`**.
* **Move controls and menus out of the clipping stack** (portal them).
* **Normalize handle sizes** using CTM, with min/max clamps.
* **Use pointer capture** on every drag/resize interaction.
* **Render to PNG via Canvg**, export SVG directly.

That will fix the hidden controls, tiny elements, fussy Add Page button, and the “wonky” multi-page experience—without a risky ground-up rewrite.

[1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox?utm_source=chatgpt.com "viewBox - SVG | MDN - Mozilla"
[2]: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Basic_transformations?utm_source=chatgpt.com "Basic transformations - SVG | MDN - Mozilla"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture?utm_source=chatgpt.com "Element: setPointerCapture() method - Web APIs - MDN"
[4]: https://github.com/canvg/canvg?utm_source=chatgpt.com "canvg/canvg: JavaScript SVG parser and renderer on ..."
[5]: https://www.npmjs.com/package/react-moveable?utm_source=chatgpt.com "react-moveable"
[6]: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events?utm_source=chatgpt.com "Pointer events - Web APIs | MDN - Mozilla"
