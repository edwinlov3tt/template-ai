love this brief — it fits perfectly with the refactor scaffolding you already set up. Here’s a tight game plan you can hand to Claude (and your team) to stand up a **robust font & text-effects system** + a reusable **Position** function that works for any slot (text, shapes, images).

---

# 1) How I’d implement this (high level)

## A. Treat **Fonts/Effects/Position** as property domains on top of your V2 core

* **Property System (registry + validator).** Add text + effect descriptors (fontFamily, fontWeight, textTransform, letterSpacing, lineHeight, shadow, stroke, highlight, etc.). All UI writes go through `setProperty()` → validator → command history.
* **Coordinate System.** Keep using viewBox units; Position fields (x,y,w,h,rotate,lockRatio) are first-class properties on the slot frame.
* **Command pattern + merge.** Sliders/color pickers merge changes so history doesn’t explode during drags.
* **Reusable SVG Effects engine.** Build filters in `<defs>` once per unique parameter set (shadow, neon, glitch…), then reference with `filter="url(#fx-...)"`. For outline/“hollow”, prefer SVG stroke + `paint-order`.
* **Font loading.** Keep your Google Fonts on-demand loader; extend it with: style preview, weight availability, and per-font caching.
* **UI surfaces.**

  * Inline **Properties bar** (your top mini-toolbar) for the quick stuff.
  * Right-rail **Side Panel** for full effects, spacing, casing, background, curve, etc.
  * A single **“Effects” flyout** mirrors Canva’s preset grid and expands into fine controls.

> Result: one consistent property pipeline that any slot type can use (text today, chips/shapes/images tomorrow) with undo/redo, validation, and multi-select support.

---

# 2) Branching plan (parallelizable, like your last refactor)

Spin up 4 feature branches; they can run largely in parallel:

1. `refactor/property-text-typography`

   * Extend property registry with typography props and case transforms.
   * Wire Google Fonts loader → font picker (family/weight/style/variants).
   * Add letterSpacing/lineHeight/autoFit + anchor box behavior.

2. `feature/svg-effects-engine`

   * Build `<defs>` generator for filters (shadow/lift/glow/neon/echo/glitch) and tokens for color/opacity.
   * Add stroke/outline/hollow using `stroke`, `stroke-width`, `paint-order: stroke fill`.
   * Implement “Background/Highlight” as an auto chip `<rect>` behind text with padding.

3. `feature/position-controls`

   * Z-order (forward/backward/to-front/to-back), alignment to page/grid, distribute, and numeric inputs for X/Y/W/H/ratio lock/rotate.
   * Reuse for any slot type.

4. `feature/ui-properties-and-effects-panels`

   * Properties bar + Side Panel UX (presets up top, “Show more” advanced section).
   * Multiselect: show “Mixed” indicators; applying a value updates all.

(When you kick these off with Claude Code, give it the acceptance criteria and the data contracts below; no ambiguity = fewer reworks.)

---

# 3) Data model: properties to add (safe defaults)

**On `Slot` (text, shape, image all benefit):**

```ts
// visual
opacity?: number;      // 0..1
rotation?: number;     // -180..180
flipH?: boolean;
flipV?: boolean;

// z/index remains 'z'
```

**On `TextSlot`:**

```ts
fontFamily?: string;            // e.g., 'Poppins'
fontWeight?: number | 'normal' | 'bold';
fontStyle?: 'normal' | 'italic';
fontSize?: number;              // in viewBox units (px in user space)
textTransform?: 'none' | 'uppercase' | 'title' | 'sentence';
letterSpacing?: number;         // em or px (choose px in user units for simplicity)
lineHeight?: number;            // unitless multiplier, e.g. 1.2
textAlign?: 'left' | 'center' | 'right';
anchorBox?: 'auto' | 'fixed';   // auto = text grows/shrinks; fixed = wraps/autoFit
autoFit?: boolean;              // scale text to box
textColor?: string;             // hex
// Effects (linked object ids to <defs>, or inline props):
stroke?: { width: number; color: string } | null;
highlight?: { fill: string; padding: [number, number] } | null; // "background"
shadow?: { dx:number; dy:number; blur:number; color:string; alpha:number } | null;
lift?: { blur:number; alpha:number } | null;  // subtle ambient elevation
neon?: { stroke:number; glow:number; color:string } | null;
echo?: { count:number; dx:number; dy:number; blur:number; color:string; alpha:number } | null;
glitch?: { slices:number; amplitude:number; seed?:number; colorA:string; colorB:string } | null;
curve?: { radius:number } | null;             // textPath radius; null = straight
imageMask?: { href:string } | null;           // optional image mask
```

Everything is optional; defaults render plain text.

---

# 4) Rendering approach (SVG-first, robust & fast)

* **Plain style**: `<text fill={textColor} font-family font-weight font-style font-size letter-spacing>`; `dy` / `<tspan>` for line-height.
* **Outline/Hollow**: set `stroke`/`stroke-width`, `fill='none'` for hollow; or `paint-order="stroke fill"` for outline around filled text.
* **Shadow/Lift**: `<filter>` with `feGaussianBlur` + `feOffset` + `feMerge`, then `filter="url(#fx-...)"` on the text group.
* **Neon**: combine colored stroke + outer blur layers in the filter.
* **Echo**: duplicate the text node N times with incremental offsets (SVG group under the main text), or compose in the filter if perf permits.
* **Glitch**: render 2–3 clones with clip-path “slices” + small horizontal offsets and color shifts.
* **Background/Highlight**: an auto-sized `<rect>` behind text (measure `getBBox()` after layout, then add padding).
* **Curve**: create a `<path>` circle/arc in `<defs>` and assign a `<textPath>`; update its radius when the property changes.
* **Image Mask**: generate a `<mask>` in `<defs>`; place the text as the mask content and apply to an `<image>` behind it when enabled.

> Implementation detail: cache `<defs>` nodes by a **stable hash of parameters** so identical shadows/neons share the same filter id. That keeps the DOM light and reuses GPU work.

---

# 5) “Position” function (generic for all slots)

### Commands

* **Forward/Backward**: increment/decrement `z` (clamp).
* **To Front/Back**: set `z` min/max among siblings.
* **Align to Page**: compute delta against canvas bbox; set x/y so the union box of selection touches `top/left/middle/center/bottom/right`.
* **Distribute** (nice-to-have after align): even spacing along X or Y.
* **Advanced**: numeric inputs for **W/H** (honor lock), **X/Y**, **Rotate** (°).

### Multi-select

* Calculate a **union bbox** for selection; align/distribute relative to that or the page.
* Resizing the union scales each member around the union center (respect individual aspect locks).

### Bounds & snapping

* Respect canvas safe area, show snap lines, and clamp if the user drags outside.

---

# 6) UI design: combine the two side-panel styles + your top properties bar

## A. Properties bar (top, inline)

Quick actions you touch constantly:

* **Font family** (combobox with live preview), **size** (scrubbable input), **color** swatch
* **B / I / U / S** toggles
* **Alignment** (left/center/right)
* **Aa** casing cycle (None → Upper → Title → Sentence)
* **Letter/Line** spacing popover (two sliders)
* **Effects** button (opens right-rail Effects panel)
* **Autofit** toggle (for text boxes)

Behavior:

* For multi-select, show “Mixed” when values differ; setting a new value applies to all.
* Inputs step with arrow keys (Shift = 10×).
* Keep it compact; everything else lives in the side panel.

## B. Right rail: “Text” panel (merged design)

Stacked sections; each is collapsible. Preset tiles at the top for the Canva-style experience.

1. **Presets** (grid)

   * None, Shadow, Lift, Hollow, Splice, Outline, Echo, Glitch, Neon, Background, Highlight
   * Selecting a preset **writes a set of effect properties** (not a separate mode). “Show more” reveals the rest.

2. **Typography**

   * Family + available weights (from the fonts loader), style (normal/italic)
   * Size, Letter spacing, Line spacing
   * Casing (Uppercase, Title, Sentence), Alignment
   * Text color

3. **Effects (fine controls)**

   * **Text Stroke**: width, color, join/cap (if supported), paint order
   * **Text Shadow**: color, blur, offsetX, offsetY, transparency
   * **Box Shadow** (for chip/buttons): color, blur, spread, offsets
   * **Background/Highlight**: color, opacity, padding (x/y)
   * **Neon**: stroke size, glow radius, color
   * **Echo**: count, offset, blur, color
   * **Glitch**: slices, amplitude, dual-color toggle
   * **Image Mask**: pick image (asset chooser), scale/offset

4. **Shape**

   * Curve: radius (0 = none). Live hint text “Drag to curve” when active.

5. **Position**

   * X, Y, Width, Height, Lock ratio, Rotate (°), Opacity
   * Buttons: Align Left/Center/Right/Top/Middle/Bottom, Distribute X/Y
   * Z-order: Forward/Back, To Front/Back

> Visual language: use small preset “cards” like your screenshots; sliders with numeric inputs; little “reset” icons per control to revert to default; group color + transparency with a single control (swatch + %).

---

# 7) Google Fonts integration (practical details)

* **Picker** shows only **loaded + available weights** for the selected family; disable weights that the family doesn’t support.
* On family change: pre-request the most common weights you’ll need (e.g., 400/600/700) in one CSS2 URL; keep `display=swap`.
* Cache per-family in memory; store the loaded list in a small map so switching layers is instant.
* If a chosen weight is missing in the family, **snap to nearest** and show a subtle “rounded to 600” hint.

---

# 8) Text layout behavior (anchor box & autofit)

* **anchorBox = 'auto'** → the `<text>` expands naturally; changing font size reflows vertically (lineHeight).
* **anchorBox = 'fixed'** → we treat the frame as a box:

  * If `autoFit=true`: compute a fontSize scale so the content fits the box (binary search a size that matches `getBBox()` to the box with some padding).
  * Else: wrap by measuring words and creating `<tspan>` rows that don’t exceed box width; overflow shows a small badge “+1 line hidden” (optional).

---

# 9) Exact tasks you can paste to Claude (per branch)

### `refactor/property-text-typography`

* Implement property descriptors + validator for: `fontFamily`, `fontWeight`, `fontStyle`, `fontSize`, `textTransform`, `letterSpacing`, `lineHeight`, `textAlign`, `textColor`, `opacity`.
* Add coercion (min/max, step) and “Mixed” helpers for multiselect.
* Hook into Google Fonts loader; add a `useFontAvailability(family)` hook that returns supported weights.

### `feature/svg-effects-engine`

* Create `effects/defs.ts` with builders: `makeShadow()`, `makeNeon()`, `makeGlitch()`, etc., that return `{ id, node }`.
* Maintain a `DefsManager` that mounts unique nodes in `<defs>` (hash of params → id).
* Map preset buttons → property bundles.

### `feature/position-controls`

* Build operations: `bringToFront`, `sendToBack`, `stepForward`, `stepBackward`, `align('left'|'center'|...)`, `distribute('x'|'y')`.
* Implement numeric inputs bound to frame props; support lockRatio and rotate.
* Make them work with multi-select via union bbox and per-item deltas.

### `feature/ui-properties-and-effects-panels`

* Properties bar: font family/size/color, B/I/U/S, alignment, Aa, spacing popover, Effects button, Autofit toggle.
* Side panel: preset grid + sections described above.
* Mixed-state UI, reset buttons, and command merging.

---

# 10) Edge cases & guardrails

* **Performance:** cache filter nodes; don’t regenerate on every keystroke; merge history entries during slider drags.
* **SVG stroke vs. true “outside stroke”:** SVG doesn’t have “outside only” strokes; for that look, enlarge text clone behind as a hack or accept centered stroke with `paint-order`.
* **Neon legibility:** clamp glow radius to avoid muddy text; offer a “contrast badge” so neon doesn’t fail AA unnoticed.
* **Glitch export:** keep it deterministic (seed) so exports match previews.
* **Multiselect with mixed properties:** show “Mixed”; when user edits, apply to all; keep other props untouched.
* **Text curve and autofit together:** disable autofit while curved, or define a sensible order (curve first, then size).
