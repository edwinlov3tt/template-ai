# Prompt for Claude/Codex — “Ad Template Builder UI (SVG → Template JSON)”

You are implementing a **web app UI** for an ad-template builder. It must look and behave like a lightweight Canva/Templated editor:

## 0) Tech + libraries

* **Front end:** Vite + React + TypeScript.
* **Canvas engine:** **Fabric.js v6** for canvas objects, on-canvas controls, SVG import/export, text editing, filters, clip paths, animations, and custom controls (supported by Fabric). ([Fabric.js][1])
* **Note on SVG round-tripping:** SVG↔Canvas is not always 1:1; avoid exotic SVG features; import/export accordingly. Show warnings when we detect unsupported features. ([Fabric.js][2])

## 1) Screen layout (three-pane editor + top bar)

Use a responsive **CSS grid** with fixed left/right rails and a flexible center.

1. **Top bar** (fixed height):

   * Left: File (dropdown), Resize (opens preset sizes), Undo, Redo, Zoom %, Canvas grid toggle.
   * Right: Preview, Export, “Validate” (runs schema + contrast checks), Save.

2. **Left rail: Tools (stacked nav)**

   * Buttons: **Templates**, **Text**, **Images**, **Shapes**, **Vectors**, **Uploads**.
   * Section body changes per tool:

     * **Templates:** list of template thumbnails.
     * **Text:** buttons “Add heading / subheading / body” + quick chip buttons (e.g., “SALE”, “BUY NOW”).
     * **Images / Uploads:** drop zone + searchable asset list.
     * **Shapes / Vectors:** basic shapes & icon list.

3. **Center: Canvas stage**

   * 100% height Fabric canvas with pixel grid overlay, rulers, snapping, and safe-area guides.
   * Empty state: “Upload an SVG to start.”
   * Drag-drop assets onto stage; selection shows Fabric handles & transform controls (scale/rotate/flip).
   * Context toolbar above selection: Replace (for images), Remove BG (disabled in this UI stub), Corner radius (for rects), Alignment, Lock/Unlock, Duplicate, Delete.

4. **Right rail: Layers + Properties**

   * **Layers panel** (top): tree list with re-order (drag), lock/visible toggles, rename, duplicate, delete.
   * **Properties panel** (below): context-sensitive inspector for the selected object:

     * **Text:** family, weight, size, letter-spacing, line-height, color, alignment, uppercase toggle, max lines.
     * **Image:** fit (cover/contain), opacity, overlay strength.
     * **Button/Chip:** label, padding, corner radius, fill/stroke, icon optional.
     * **Slot meta:** `name`, `type` (`image|text|button|shape`).

## 2) Resizing & presets (critical)

A Resize modal with presets:

* Social: 1080×1080, 1080×1350, 1080×1920, 1920×1080.
* Display (IAB): **300×250, 728×90, 160×600, 300×600, 970×250** (include these exact sizes). ([IAB][3])
  When the user switches size, **do not naïvely scale**—call the layout engine to re-flow positions.

## 3) Importer UI (SVG → Template JSON)

* “**Upload SVG**” flows through: SVGO (optimize) → parse (svgson) → detect elements with `data-slot="headline|subhead|cta|logo|bg|subject"`.
* Show an **Import Report** dialog listing warnings (unsupported filters/masks/clipPaths).
* After import, objects are placed on Fabric canvas and **Template JSON** is generated in memory.

## 4) Validation & accessibility (non-negotiable)

* “Validate” runs:

  * **Schema check** (Ajv) for Template JSON.
  * **Contrast check** for all text against its effective background.

    * **WCAG 2.x**: minimum **4.5:1** for normal text; **3:1** for large text; show pass/fail badges next to each text layer. ([W3C][4])
    * Optional **APCA** mode: display Lc value; target ≈ **Lc 60** for body text. ([APCA][5])
* Provide one-click auto-fixes: add chip behind text, invert text color, or increase overlay.

## 5) Side panels (admin-only toggles)

Add a tabbed sub-panel under Properties called **Template** with:

* **Tokens:** palette (brand/accent/neutral/surface) and typography scales.
* **Constraints (read-only in MVP):** list of global and per-ratio rules (coming from the layout engine).
* **Ratios:** current aspect ratio tag; switch size reuses the same underlying **viewBox** coordinates.

## 6) Keyboard & interaction details

* ⌘/Ctrl+S Save, ⌘/Ctrl+Z Undo, Shift drag = proportional scale, Arrow keys = nudge 1px (Shift = 10px).
* Multi-select (marquee), group/ungroup.
* Snap to guides, center lines, and safe-area insets.

## 7) Layer types we must support (MVP)

* **Text:** editable Fabric IText on canvas; ensure imported SVG text becomes editable where possible (Fabric supports on-canvas rich text). ([Fabric.js][1])
* **Image:** bitmap with fit: contain/cover; optional overlay color/alpha.
* **Shape:** rect/ellipse/line/polygon; corner radius for rect.
* **Button/Chip:** a group (rounded rect + centered text) with padding controls.

## 8) State & data contracts

Keep a single `EditorState`:

```ts
{
  canvasSize: { w: number, h: number },   // current preset
  viewBox: [0,0,1080,1080],               // base coordinate space
  selectedIds: string[],
  layers: Layer[],                         // z-ordered objects
  templateJson: TemplateJSON,              // kept in sync
  validation: { schemaOk: boolean, issues: Issue[] },
  contrast: Record<layerId, { ratio?: number, lc?: number, pass: boolean }>
}
```

## 9) Layout engine hook

Expose `applyConstraints(templateJson, sizePreset): FrameMap` and re-position Fabric objects. Use a **Cassowary solver** (**kiwi.js**) to satisfy equalities/inequalities and preferences (built for UI layout). ([GitHub][6])

## 10) Empty states & errors

* No layers: show drop target “Upload an SVG to start.”
* Unsupported SVG features: warning toast + link to Import Report.
* Unsolvable constraints: non-blocking alert listing the offending rules; allow manual overrides.

## 11) Acceptance criteria (visual & behavior)

* Three-pane layout mirrors the screenshots: left tools list, central canvas, right layers/properties.
* Resize → reflow across **300×250 / 728×90 / 160×600 / 1080×1080 / 1080×1920** with no overlaps.
* Layers panel supports re-order, rename, lock, hide, duplicate, delete.
* Text objects show live contrast badges; **4.5:1** rule enforced; auto-fix works. ([W3C][4])
* Importing a tagged SVG results in editable objects on the Fabric canvas; unsupported features reported. ([Fabric.js][2])

## 12) References (for the implementer)

* Fabric.js feature set (text editing, filters, clip paths, controls). ([Fabric.js][1])
* Fabric.js SVG caveats (import/export not always 1:1). ([Fabric.js][2])
* IAB / Google ad sizes to seed presets (300×250, 728×90, 160×600, 970×250, 300×600). ([IAB][3])
* WCAG contrast thresholds; APCA quick guide. ([W3C][4])
* Cassowary solver (kiwi.js) background. ([GitHub][6])

---

## Why this prompt works

* It pins down **layout regions**, **controls**, and **behaviors** instead of saying “make an editor”.
* It anchors to real-world **ad sizes** and **accessibility rules**, so Claude builds the right presets and badges (with sources).
* It tells Claude **exactly which Fabric features** to use, and where SVG caveats will pop up.
* It specifies the **reflow contract** (call the solver on resize) so you don’t get a “pretty but dumb” scaler.

[1]: https://fabricjs.com/?utm_source=chatgpt.com "Fabric.js Javascript Library"
[2]: https://fabricjs.com/docs/core-concepts/?utm_source=chatgpt.com "Core concepts | Docs and Guides"
[3]: https://www.iab.com/wp-content/uploads/2019/04/IABNewAdPortfolio_LW_FixedSizeSpec.pdf?utm_source=chatgpt.com "Fixed Size Ad Specifications"
[4]: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html?utm_source=chatgpt.com "Understanding Success Criterion 1.4.3: Contrast (Minimum)"
[5]: https://git.apcacontrast.com/documentation/APCAeasyIntro.html?utm_source=chatgpt.com "The Easy Intro to the APCA Contrast Method"
[6]: https://github.com/IjzerenHein/kiwi.js/?utm_source=chatgpt.com "IjzerenHein/kiwi.js: Fast TypeScript implementation of the ..."