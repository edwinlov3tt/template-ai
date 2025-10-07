heck yes—we can ship this. Here’s a concrete, branch-by-branch plan to build a Canva-style “ultra” color panel with presets, gradients, image-derived swatches, recent colors, and a pro picker—wired to your V2 SVG canvas so fills never glitch.

---

# Phase 0 — decisions & libs

* **Color math:** `culori` (modern CSS Color 4 spaces, OKLCH/OKLab, gamut mapping) + `chroma-js` for nice interpolations & scales. ([culorijs.org][1])
* **Picker UI:** `react-colorful` (tiny, fast, accessible; drop-in HEX/HSL/RGB inputs). If you want enterprise UX, KendoReact ColorPicker also has palette/gradient UIs. ([omgovich.github.io][2])
* **Image palette extraction:** `color-thief` or `node-vibrant` (browser & worker compatible). We’ll run this in a Web Worker to keep the UI thread clean. ([lokeshdhakar.com][3])
* **Gradients:** use native SVG `<linearGradient>` / `<radialGradient>` in `<defs>` with `<stop>` children. (Clean, portable, and reliable). ([MDN Web Docs][4])
* **Pointer handling:** Pointer Events with **`setPointerCapture`** for drag of gradient handles; screen↔SVG math via **`getScreenCTM()`**. ([MDN Web Docs][5])
* **Accessibility gates:** WCAG 2.x contrast (AA 4.5:1 normal, 3:1 large) + optional APCA target (≈ Lc 60). ([W3C][6])

---

# Phase 1 — data model (solid + gradients)

Add a normalized “paint” type to your Property System:

```ts
type SolidPaint = { kind: 'solid'; color: string; opacity?: number };     // color in hex or oklch(...)
type GradientStop = { offset: number; color: string; opacity?: number };  // 0..1
type LinearGradientPaint = {
  kind: 'linear-gradient';
  angle: number;                // degrees
  stops: GradientStop[];        // sorted by offset
};
type RadialGradientPaint = {
  kind: 'radial-gradient';
  cx: number; cy: number; r: number; // in viewBox units (0..1 of bbox is fine too)
  fx?: number; fy?: number;          // focal point
  stops: GradientStop[];
};
type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;
```

* Store **document swatches** as `Paint[]`.
* Slots of type **shape** accept `fill: Paint` and `stroke: SolidPaint`. (Text stays solid only.)
* When rendering, map `Paint → SVG`:

  * Solid → `fill="#rrggbb"` + separate `fill-opacity`.
  * Gradient → ensure/patch a `<defs>` gradient (id stable per slot), update `<stop offset/stop-color/stop-opacity>`. ([MDN Web Docs][4])

---

# Phase 2 — the Color Panel UI (exact sections from your screenshots)

Right rail “Color” drawer (or floating) with these groups:

1. **Search box** – accepts names (“blue”) or hex (“#00c4cc”).
2. **Document colors** – the swatches used in this file (click → apply; “+” → add current).
3. **Brand Kit / Palettes** – (optional) external set.
4. **Photo colors** – per-image extracted swatches (auto when image loads). Use `color-thief`/`vibrant` to get dominant + palette; cache per asset. ([lokeshdhakar.com][3])
5. **Default solid colors** – static grid (like Canva).
6. **Default gradient colors** – curated gradients.
7. **Picker** – tabs: **Solid | Gradient**

   * **Solid tab:** `react-colorful` + hex/HSL/OKLCH inputs; eyedropper (native `EyeDropper` when available). ([omgovich.github.io][2])
   * **Gradient tab:** style chips (**Linear/Radial**), stop list, angle slider (linear), center/radius handles (radial), per-stop color pickers, add/remove stops.

Performance/UX details

* Debounce input → validate with `culori` (gamut-map to sRGB if needed). ([culorijs.org][1])
* Keep a **Recently used** LRU (10 items) for fast reuse.
* Merge tiny stop moves into one history action.

---

# Phase 3 — gradient editor (on-canvas handles)

For the selected shape:

* Draw a non-printing overlay showing:

  * **Linear:** a line along gradient vector with draggable end handles; rotate by dragging endpoints; add a stop by clicking on the line; reposition stops by dragging.
  * **Radial:** draggable center (`cx,cy`) and radius (`r`); optional focal (`fx,fy`) handle.
* Implement interactions with **Pointer Events + `setPointerCapture`** so drags don’t break when leaving the handle, and convert deltas using **`getScreenCTM().inverse()`**. ([MDN Web Docs][7])
* Persist back to the `Paint` and update `<defs>` immediately.

If you want a jump-start, there are OSS pickers that provide multi-stop gradients you can adapt (or mine for ideas): `react-gradient-color-picker`, `react-linear-gradient-picker`, WordPress’ `GradientPicker`. ([GitHub][8])

---

# Phase 4 — image color extraction (Photo colors)

* On image slot mount (or when `src` changes), offload extraction to a **Worker**:

  1. Load the image to an offscreen canvas (or `createImageBitmap`).
  2. Run `ColorThief.getPalette(img, N)` or `Vibrant.from(img).getPalette()`.
  3. Return swatches (hex) + a small preview row under “Photo colors”. ([lokeshdhakar.com][3])
* Keep per-image cache (keyed by image hash/URL).
* Add “Change all” CTA beneath Photo colors to remap all fills matching a chosen swatch (exactly like your screenshot).

---

# Phase 5 — accessibility & quality gates

* Every time a **text** paint changes, compute contrast against its effective background and show a pass/fail chip:

  * **WCAG 2.x AA:** ≥ 4.5:1 for normal text; ≥ 3:1 for large. ([W3C][6])
  * Optional **APCA** readout (target ≈ **Lc 60** for body). ([APCA][9])
* Provide one-click auto-fix suggestions (chip behind text, invert, or boost overlay).

---

# Phase 6 — rock-solid rendering (no glitches)

* All fills map to **native SVG** paints; gradients live in `<defs>` and are referenced via `fill="url(#grad-id)"`. This is robust across browsers and export pipelines. ([MDN Web Docs][10])
* Update only the changed **`<stop>`** attributes on drag for ultra-smooth feedback. ([MDN Web Docs][11])
* Keep transforms math in **viewBox space** using CTMs, not `clientX/Y`. (Never rely on `offsetX/Y`.) ([MDN Web Docs][12])

---

# Branch plan (plugging into your parallel-feature workflow)

1. `feature/color-core`

   * Types for `Paint`, gradient utils (sort stops, clamp offsets, OKLCH↔hex), `culori` gamut map. ([culorijs.org][1])
2. `feature/color-panel-ui`

   * Right-rail panel with sections, recent colors LRU, `react-colorful` solid tab. ([omgovich.github.io][2])
3. `feature/gradient-editor`

   * Gradient tab + on-canvas handles (Pointer Events + CTM). ([MDN Web Docs][7])
4. `infra/image-palette-worker`

   * Worker + `color-thief`/`vibrant` + caching. ([lokeshdhakar.com][3])
5. `qa/contrast-gates`

   * WCAG/APCA chips + autofixes. ([W3C][6])

Feature-flag each piece so V1 remains safe.

---

# API contracts

```ts
// apply to a slot
updateFill(slotId: string, paint: Paint): void

// swatch registries
addDocumentSwatch(paint: Paint): void
addRecentPaint(paint: Paint): void

// image palette (worker)
type PhotoPaletteMsg = { imageId: string, palette: string[] } // hex
```

---

# Testing checklist

* **Unit:**

  * `gradientToSvgDefs(paint)` emits valid `<linearGradient>/<radialGradient>/<stop>`; round-trip update modifies only stops. ([MDN Web Docs][4])
  * `culori` conversions are in-gamut; clamp to sRGB when needed. ([culorijs.org][1])
* **Interaction:**

  * Pointer drag keeps capture; deltas correct via CTM even when zoomed/rotated. ([MDN Web Docs][7])
* **Perf:**

  * Picker drag at 60fps; worker extraction doesn’t block main thread.
* **A11y:**

  * WCAG thresholds enforced; APCA label displays Lc. ([W3C][6])

---

# “Paste to Claude Code” starter tasks

**Task A — Solid picker panel**

* Install: `npm i culori chroma-js react-colorful`.
* Build `SolidColorPicker` using `HexColorPicker + HexColorInput`, show `OKLCH` fields using `culori.formatCss('oklch')`. ([omgovich.github.io][2])

**Task B — SVG gradient defs**

* Add `ensureGradientDef(svg, slotId, paint)` that creates/updates a gradient `<defs>` with stable `id`, and applies `fill="url(#id)"`. Use `<stop offset color opacity>`. ([MDN Web Docs][11])

**Task C — Gradient overlay**

* Draw vector handles; on drag: compute deltas in SVG space via `getScreenCTM().inverse()`, update `angle/cx/cy/r` live. ([MDN Web Docs][12])

**Task D — Photo colors**

* Add worker using `color-thief` or `node-vibrant`; on image load, post image bitmap, receive `palette[]`, render swatches. ([lokeshdhakar.com][3])

**Task E — Contrast chip**

* Compute WCAG ratio on every text color change; show pass/fail + APCA Lc (optional). Targets: AA 4.5:1 (normal), 3:1 (large); APCA ≈ Lc 60. ([W3C][6])

---

## Why this won’t be glitchy

* We’re not simulating gradients—**we use SVG’s native gradient engine** (portable and battle-tested). ([MDN Web Docs][10])
* Drags use **Pointer Capture** + **CTM** conversions, so transforms remain correct at any zoom/viewport. ([MDN Web Docs][7])
* Color math lives in **culori/chroma** to avoid edge-case conversions and out-of-gamut surprises. ([culorijs.org][1])
* Image palettes come from proven libs used widely in the wild. ([lokeshdhakar.com][3])

If you want, I can draft the minimal TSX for:

* `<ColorPanel>` with sections and `react-colorful`
* `ensureGradientDef()` (SVG defs)
* `GradientOverlay` handles (pointer events + CTM)

…so Claude Code can wire it into your V2 stage immediately.

[1]: https://culorijs.org/api/?utm_source=chatgpt.com "API Reference"
[2]: https://omgovich.github.io/react-colorful/?utm_source=chatgpt.com "react-colorful"
[3]: https://lokeshdhakar.com/projects/color-thief/?utm_source=chatgpt.com "Color Thief"
[4]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/linearGradient?utm_source=chatgpt.com "<linearGradient> - SVG - MDN - Mozilla"
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events?utm_source=chatgpt.com "Pointer events - Web APIs | MDN - Mozilla"
[6]: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html?utm_source=chatgpt.com "Understanding Success Criterion 1.4.3: Contrast (Minimum)"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture?utm_source=chatgpt.com "Element: setPointerCapture() method - Web APIs - MDN"
[8]: https://github.com/hxf31891/react-gradient-color-picker?utm_source=chatgpt.com "An easy to use color/gradient picker for React.js"
[9]: https://git.apcacontrast.com/documentation/APCAeasyIntro.html?utm_source=chatgpt.com "The Easy Intro to the APCA Contrast Method"
[10]: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Gradients?utm_source=chatgpt.com "Gradients in SVG - MDN - Mozilla"
[11]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/stop?utm_source=chatgpt.com "<stop> - SVG | MDN - Mozilla"
[12]: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM?utm_source=chatgpt.com "SVGGraphicsElement: getScreenCTM() method - Web APIs"