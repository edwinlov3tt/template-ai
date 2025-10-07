love this direction. here’s a **paste-ready PRP** for Claude Code to build a **React + SVG editor** (Templated-style), designed to plug into your current codebase (importer, template JSON, constraints, contrast checks). It reuses your viewBox/frames and replaces Fabric with **native SVG DOM** for editing, while using Canvas only for raster export.

I’m annotating important decisions with sources so Claude has guardrails.

---

# PRP — React SVG Editor (Templated-style) that fits our current code

## Purpose

Deliver a lightweight, high-fidelity editor that:

1. **Edits directly in SVG** (so clipPaths, masks, gradients, and paint servers behave natively),
2. Reuses our existing **Template JSON** (slots, frames, tokens, constraints),
3. Uses **viewBox** as the base coordinate system for size-agnostic layouts,
4. Normalizes SVG2 **`href`** (fallback `xlink:href` for older exports),
5. Exports **SVG** (editable in Canva) and **PNG/WebP** via **Canvas rasterization**.

References: MDN viewBox, SVG2 `xlink:href` deprecation, SVGO, Canvg for raster, Lottie (optional animations). ([MDN Web Docs][1])

---

## Goals & Success Criteria

* **Accurate rendering** of clipPath/mask/gradient/pattern without custom emulation (native SVG handles it).
* **Round-trip**: Import → Edit → Save Template JSON → Export SVG; opening the exported SVG in Canva keeps geometry & text editable (when authored as `<text>`).
* **Resizing**: switch presets (1:1, 4:5, 9:16, 300×250, 728×90…) without naïve scaling—use viewBox + our constraint solver for reflow. ([MDN Web Docs][1])
* **Fast**: No canvas frameworks in the interactive loop; minimal re-render via React + small state store (Zustand). ([Zustand][2])
* **Exports**: SVG (source of truth) and PNG/WebP via Canvg render onto Canvas. ([Canvg][3])

---

## Tech Choices (lean)

* **React + TypeScript** (Vite app already in place).
* **State**: **Zustand** (tiny, fast store for editor state & selections). ([Zustand][2])
* **Transforms/handles**: **react-moveable** for drag/resize/rotate/snap on SVG elements. It’s tiny and battle-tested. ([npm][4])
* **SVG rasterization**: **Canvg** to render the current SVG to a Canvas for PNG/WebP export and thumbnails. ([Canvg][3])
* **Optimization**: **SVGO** on import (strip cruft, keep IDs, keep viewBox). ([SVGO][5])
* **(Optional)** animations: support **Lottie** blocks via `lottie-web` / `@lottiefiles/*` if/when needed. ([GitHub][6])

---

## How it integrates with your current code

* **Importer stays**: we keep your SVGO → svgson normalization, `href`/`xlink:href` fixup, frame extraction, and warnings. (SVG2 prefers `href`; include `xlink:href` only as backward fallback). ([MDN Web Docs][7])
* **Template JSON stays**: same schema (tokens, slots, constraints, accessibility).
* **Constraint solver stays**: same kiwi.js step; only the **renderer** changes (SVG instead of Fabric).
* **Contrast checks stay**: same functions, but sample colors from SVG backgrounds (via computed style/paint).
* **Export pipeline**: add a **SVG→Canvas** step with Canvg for raster exports (PNG/WebP). ([Canvg][3])

---

## High-level architecture

```
apps/web/src/
  editor/
    svg-stage/            # <SvgStage> renders <svg> + layers
    handles/              # moveable adapters for SVG nodes
    panels/               # Layers, Properties, Constraints, Tokens
    selection/
    keyboard/
  state/                  # zustand store (EditorState)
  layout/                 # applyConstraints(template, size) → frames
  importer/               # (existing) SVGO, href normalization, frames
  export/                 # exportSVG(), exportPNG() via Canvg
  schema/                 # Ajv (existing)
```

**Core idea**: SVG is the live editing surface; each slot becomes an actual SVG element (`<image>`, `<rect>`, `<text>`, `<g>` with clip/mask, etc.). We position elements via **viewBox-space** frames and a `<g transform>` when needed. The canvas for raster export is **not** used during editing.

---

## Data contracts (unchanged where possible)

```ts
type Frame = { x:number; y:number; width:number; height:number; rotation?:number };

type SlotBase = {
  id: string; name?: string; type: 'image'|'text'|'shape'|'button'|'group';
  z?: number; frame: Frame; visible?: boolean; locked?: boolean;
};

type ImageSlot = SlotBase & { type:'image'; src?: string; fit?: 'cover'|'contain' };
type TextSlot  = SlotBase & { type:'text'; content?: string; styleKey?: string };
type ShapeSlot = SlotBase & { type:'shape'; shape: 'rect'|'ellipse'|'path'; fill?: string; stroke?: string; rx?: number };
type ButtonSlot= SlotBase & { type:'button'; label?: string; chip?: { fill:string; radius:number; padding:[number,number] } };

type TemplateJSON = {
  id: string;
  canvas: { baseViewBox:[number,number,number,number]; ratios: string[] };
  tokens: { palette: Record<string,string>; typography: Record<string, any> };
  slots: Array<ImageSlot|TextSlot|ShapeSlot|ButtonSlot>;
  constraints: { global?: any[]; byRatio?: Record<string, any[]> };
  accessibility?: { contrastPolicy?: any };
};
```

---

## Rendering pipeline (SVG-first)

1. **Create `<svg>`** with `viewBox` = `template.canvas.baseViewBox`. Everything edits in **user-space** coordinates; switching sizes only changes the outer **viewport** while preserving layout math. ([MDN Web Docs][1])

2. **Sort slots by `z`** (default 0). Render backgrounds first, overlays last.

3. **Element mapping**

   * `image` → `<image href="...">` (write both `href` and `xlink:href` for safety when importing older SVGs). If we receive `xlink:href` only, mirror it to `href`. ([MDN Web Docs][7])
   * `text` → `<text>` (editable content); measure with `getBBox()` to update frame when content changes.
   * `shape`(rect) → `<rect x y width height rx ry fill stroke>`
   * `button` → `<g>` containing `<rect>` (chip) + `<text>` centered.
   * For clipPath/mask/pattern from imported templates, **preserve defs** and reference them (`fill="url(#gradX)"`, `clip-path="url(#clipY)"`). Native SVG supports this cleanly.

4. **Transforms**
   Each slot gets a positioned `<g transform="translate(x,y) rotate(θ) ....">` containing its inner node(s). Rotation centers around the frame center unless overridden.

5. **Selection & handles**
   Wrap selected node with **react-moveable** controls (drag/resize/rotate/snap to guides). Emit deltas in **viewBox space**; update frames in the store. ([npm][4])

6. **Constraints pass**
   On size change or user action, run `applyConstraints(template, sizePreset)` → new frames; patch SVG transforms/attrs. (This is your existing kiwi.js step; unchanged.)

7. **Contrast badges**
   For each text slot, sample its effective backdrop (fill/overlay) and compute contrast; display pass/fail.

---

## Component map (React)

* `<EditorShell>`: layout (top bar, left tools, center stage, right panels).
* `<SvgStage>`: renders `<svg>` + `<defs>` + layers; registers keyboard/mouse.
* `<LayerNode>`: renders a slot into SVG.
* `<SelectionOverlay>`: one instance; manages **react-moveable** target(s) over selected SVG nodes. ([npm][4])
* Panels: `<LayersPanel>`, `<PropertiesPanel>`, `<ConstraintsPanel>`, `<TokensPanel>`.
* Modals: `<ResizeModal>` (presets), `<ImportReport>`, `<ExportModal>`.

---

## Zustand store (lean sketch)

```ts
type EditorState = {
  viewBox: [number,number,number,number];
  canvasSize: { w:number; h:number };        // CSS pixels for viewport
  template: TemplateJSON;
  selected: string[];
  setFrame: (id:string, f:Partial<Frame>) => void;
  setSlotProps: (id:string, props:any) => void;
  reorder: (ids: string[]) => void;          // update z-order
  applyConstraints: (ratio: string) => void; // calls kiwi solver
};
```

Zustand is small and fast—ideal for frequent drag/resize updates without heavy context renders. ([Zustand][2])

---

## Interactions (with moveable)

* **Drag/Resize/Rotate**: attach `Moveable` to the SVG node (or its wrapper `<g>`). Convert DOM deltas (px) to **viewBox units** using the current SVG CTM (inverse) so that frames stay resolution-independent. Moveable supports all the transforms we need. ([npm][4])
* **Snap**: implement snapping to safe-area guides and other element edges via `Moveable`’s snappable options.
* **Keyboard**: arrows nudge in 1 unit (Shift=10); Delete removes; ⌘/Ctrl+G group; ⌘/Ctrl+Z undo.

---

## Resizing & Presets (critical)

* Presets: Social (1080×1080, 1080×1350, 1080×1920, 1920×1080), IAB display (300×250, 728×90, 160×600, 970×250, 300×600). Use **viewBox** as the invariant and only change the SVG viewport/CSS size; then run constraints for adaptive rearrangement. ([MDN Web Docs][1])

---

## Import & normalization (reusing your code)

* **SVGO**: multipass; **do not** remove `viewBox`; keep IDs used by clipPaths/masks/patterns. ([SVGO][8])
* Normalize `xlink:href` → `href` for `<image>`, `<use>`, etc. Keep `xlink:href` as fallback for old exports. ([MDN Web Docs][7])
* If an `<image>` has **data: URI**, allow it for MVP; later, externalize to storage and rewrite `href` for performance.
* If imported text is outlined (paths), create a **shape slot** not a text slot; skip font-size constraints for that template.

---

## Export

* **SVG**: serialize current `<svg>` DOM to string; ensure `viewBox` present and `href` set (duplicate as `xlink:href` if you need max compatibility). ([MDN Web Docs][7])
* **PNG/WebP**: use **Canvg** to render the SVG string to a `<canvas>` and `toBlob()` for download. (Canvg is built to parse SVG into Canvas accurately.) ([Canvg][3])
* (If you ever render via another stage like Konva, Konva recommends Canvg as well for SVG→Canvas accuracy.) ([Konva][9])

---

## Accessibility & QA gates

* **Contrast**: enforce WCAG AA (4.5:1 normal, 3:1 large) on text; provide auto-fix chip/overlay/invert actions.
* **Schema**: validate Template JSON with Ajv before save.
* **SVG sanity**: verify each visual layer has visible paint (fill/stroke or image href) and a non-zero bbox (use `getBBox()` for paths). MDN reference for path `d` and viewBox semantics. ([MDN Web Docs][10])

---

## Tasks (granular)

### A) Editor shell

* Scaffold 3-pane layout (TopBar, LeftNav, RightPanel) in React.
* Add Resize modal with size presets and current ratio tag.

### B) SVG stage

* Implement `<SvgStage>` with `viewBox` from template; render `<defs>` from import (gradients, clipPaths, masks).
* Render each slot into a `<g transform>` with inner primitive node(s).

### C) Selection & transforms

* Install **react-moveable**; build `<SelectionOverlay>` that targets the actual SVG elements.
* Implement px→viewBox conversion (use `SVGSVGElement.getScreenCTM()` and invert).
* Wire drag/resize/rotate to update frames in Zustand. ([npm][4])

### D) Constraints & resizing

* Keep your kiwi.js `applyConstraints` logic.
* On preset change: update outer viewport, call constraints, rerender frames.

### E) Importer bridge (reuse)

* Keep SVGO run; do not remove viewBox; keep IDs. ([SVGO][8])
* Normalize image `href`/`xlink:href`. ([MDN Web Docs][7])
* Build frames from explicit `x/y/width/height` or measured `getBBox()`.

### F) Export

* `exportSVG()`: serialize `<svg>` (including defs).
* `exportPNG()`: render via **Canvg** then `canvas.toBlob`. ([Canvg][3])

### G) Panels

* **LayersPanel** (reorder/lock/visibility/rename).
* **PropertiesPanel** (text styles, fills, strokes, chip radius/padding; image fit).
* **ConstraintsPanel** (read-only list now; editable later).
* **TokensPanel** (brand palette & typography scales).

### H) Tests

* Unit: import creates visible paint for each slot; bbox > 0; href normalization works.
* E2E: upload → edit → resize preset → export SVG → export PNG.

---

## Edge cases & decisions (explicit)

* **`xlink:href`** is deprecated in SVG2; prefer `href`, but include both for old exports. ([MDN Web Docs][7])
* **Gradients/patterns/masks**: native SVG supports these; no custom Fabric/Konva emulation needed.
* **Huge data URIs**: allow but warn; roadmap to externalize and rewrite `href`.
* **Outlined text**: becomes shapes; font constraints disabled; editors should prefer editable `<text>` for maximum flexibility.
* **Animations**: keep out of MVP; when needed, host Lottie blocks as separate layers (not SVG SMIL). ([GitHub][6])

---

## Acceptance criteria (what “done” looks like)

* The same SVG from Canva that caused Fabric issues **renders correctly** in the editor (clipPath/mask/gradient OK).
* Drag/resize/rotate feels **snappy**; z-order obeyed.
* Switching from **1080×1080 → 728×90** reflows via constraints (no overlaps).
* **Export SVG** opens in Canva with geometry intact; **Export PNG/WebP** matches the on-screen composition (Canvg). ([Canvg][3])

---

## Implementation hints for Claude

**Px↔viewBox conversion snippet**

```ts
function pxDeltaToViewBox(svgEl: SVGSVGElement, dxPx: number, dyPx: number) {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return {dx:0, dy:0};
  const inv = ctm.inverse();
  // convert (dx,dy) in screen to user-space (~viewBox)
  const p1 = svgEl.createSVGPoint(); p1.x = 0;   p1.y = 0;
  const p2 = svgEl.createSVGPoint(); p2.x = dxPx; p2.y = dyPx;
  const u1 = p1.matrixTransform(inv);
  const u2 = p2.matrixTransform(inv);
  return { dx: u2.x - u1.x, dy: u2.y - u1.y };
}
```

**Export PNG via Canvg**

```ts
import { Canvg } from 'canvg';

export async function exportPNG(svgString: string, w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const v = await Canvg.fromString(ctx, svgString);
  await v.render();                              // draw SVG onto canvas
  return new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
}
```

(Why Canvg: dedicated SVG→Canvas renderer, widely used.) ([Canvg][3])

**`href` normalization when ingesting SVG**

```ts
function normalizeHref(el: Element) {
  const xl = el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || el.getAttribute('xlink:href');
  const href = el.getAttribute('href');
  if (xl && !href) el.setAttribute('href', xl);  // SVG2 prefers href
}
```

(Per MDN: use `href` in SVG2; `xlink:href` is deprecated.) ([MDN Web Docs][7])

---

## References for implementer

* **SVG viewBox** basics (coordinate system for responsive layouts). ([MDN Web Docs][1])
* **SVG2 & `xlink:href`** deprecation; prefer `href`. ([MDN Web Docs][7])
* **SVGO** docs & plugins (keep `viewBox`, keep IDs). ([SVGO][5])
* **Canvg** (SVG→Canvas raster). ([Canvg][3])
* **react-moveable** docs & features. ([npm][4])
* **Zustand** docs (tiny store). ([Zustand][2])

---

### Why this will feel like Templated

* **Pure SVG editing** → perfect fidelity for masks/clip/gradients without fighting a canvas engine.
* **Lightweight**: React + SVG + tiny libs (Zustand, Moveable).
* **Smooth**: handles are GPU-friendly and only mutate the SVG nodes you touch.
* **Pluggable**: your importer, schema, constraints, and contrast logic drop straight in.

If you want next, I can draft the **SvgStage + SelectionOverlay** components in TSX so you can slot them into your current Vite app and start dragging boxes in under a page of code.

[1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox?utm_source=chatgpt.com "viewBox - SVG | MDN - Mozilla"
[2]: https://zustand.docs.pmnd.rs/?utm_source=chatgpt.com "Zustand: Introduction"
[3]: https://canvg.js.org/?utm_source=chatgpt.com "canvg | canvg"
[4]: https://www.npmjs.com/package/react-moveable?utm_source=chatgpt.com "react-moveable"
[5]: https://svgo.dev/docs/introduction/?utm_source=chatgpt.com "Introduction | SVGO"
[6]: https://github.com/airbnb/lottie-web?utm_source=chatgpt.com "GitHub - airbnb/lottie-web: Render After Effects animations ..."
[7]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/xlink%3Ahref?utm_source=chatgpt.com "xlink:href - SVG - MDN"
[8]: https://svgo.dev/docs/plugins/?utm_source=chatgpt.com "Plugins"
[9]: https://konvajs.org/docs/sandbox/SVG_On_Canvas.html?utm_source=chatgpt.com "How to draw SVG image on canvas with Konva"
[10]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d?utm_source=chatgpt.com "d - SVG | MDN - Mozilla"