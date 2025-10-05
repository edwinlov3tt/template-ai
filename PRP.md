heck yes — a hybrid “Import SVG → clean → map to smart template JSON → live-edit in builder” is exactly the move. Below is a PRP you can paste into Claude Code / Codex. It mirrors your example PRP structure and targets a **Templated.io-style builder** you own (SVG importer + Fabric.js editor + constraints + validation).

---

# PRP — SVG Importer + In-House Template Builder (Templated.io-style)

## Purpose

Ship an MVP that:

1. **Imports** SVGs from Canva/Illustrator, optimizes & parses them,
2. **Maps** elements to a strict **Template JSON** (slots + constraints + tokens),
3. **Validates** via JSON Schema (Ajv),
4. **Edits** in a lightweight builder (Fabric.js canvas) with **live reflow** across aspect ratios using a **Cassowary constraint solver (kiwi.js)**,
5. **Enforces** accessibility (WCAG/APCA contrast),
6. **Exports** clean templates without vendor lock-in.

Core tools we’ll rely on:

* **SVGO** to sanitize/optimize the uploaded SVGs. ([GitHub][1])
* **svgson** to parse SVG → JSON AST for slot detection. ([npm][2])
* **Fabric.js** for a canvas editor with SVG import/export & object manipulation. ([Fabric.js][3])
* **kiwi.js** (Cassowary) to reflow layouts responsively via constraints. ([GitHub][4])
* **Ajv** to enforce schema correctness at upload + save. ([ajv.js.org][5])
* **SVG `viewBox`** as our base coordinate system for crisp, ratio-agnostic designs. ([MDN Web Docs][6])
* **WCAG contrast AA/AAA** and **APCA (Lc)** thresholds for legibility. ([W3C][7])

---

## Goal

A Vite/React app that lets admins:

* **Upload SVG →** auto optimize, parse, and map to slots (`logo`, `headline`, `subhead`, `cta`, `bg`, `subject`)
* **Fix & modernize** templates inside our builder (no round-trip to Canva)
* **Preview/rescale** across size packs (1:1, 4:5, 9:16, 16:9, 300×250, 728×90, etc.) with **constraint-based layout**
* **Save** as versioned Template JSON (passes Ajv + contrast checks)

### Success Criteria

* [ ] SVG import produces valid Template JSON with slots + default constraints
* [ ] Live reflow works per aspect ratio without overlaps/clipping
* [ ] WCAG/APCA checks pass or auto-fixes apply (chip/invert/overlay boost)
* [ ] Templates round-trip (load/edit/save) without schema violations
* [ ] Batch export preview renders match layout rules

---

## Why

* **Speed:** Designers keep working in familiar tools; engineers own the logic.
* **Quality:** Programmatic constraints & contrast guarantees legibility. (WCAG AA 4.5:1 for normal text; AAA 7:1; APCA targets by Lc, e.g., ~60 for body). ([W3C][7])
* **Scalability:** `viewBox` + constraints = one source → many sizes cleanly. ([MDN Web Docs][6])

---

## What (Deliverables)

### UX Flow (Admin)

1. **Upload SVG** → auto-optimize (SVGO) → parse (svgson) → detect `data-slot` labels → emit **Template JSON**. ([GitHub][1])
2. **Builder** opens with Fabric.js: shows layers, snapping, alignment, z-order; side panels for **Slots / Constraints / Ratios / Tokens**. ([Fabric.js][3])
3. Toggle **size presets**; kiwi.js re-solves constraints; show **contrast badge** per text element. ([GitHub][4])
4. **Ajv validation** on each save; errors highlighted inline with auto-fix suggestions. ([ajv.js.org][5])
5. **Save/Version** template; export preview images.

---

## Documentation & References (must load in context)

* SVGO README / docs. ([GitHub][1])
* svgson package page. ([npm][2])
* Fabric.js docs (intro + API). ([Fabric.js][8])
* Fabric.js site (features / SVG <-> Canvas). ([Fabric.js][3])
* kiwi.js (Cassowary solver). ([GitHub][4])
* Ajv docs. ([ajv.js.org][5])
* MDN: SVG `viewBox`. ([MDN Web Docs][6])
* WCAG contrast guidance (W3C, WebAIM quick refs). ([W3C][7])
* APCA overview docs. ([APCA][9])

---

## Codebase Tree (desired)

```bash
.
├── apps/web/                  # Vite + React + Fabric.js editor
│   ├── src/
│   │   ├── editor/            # Canvas, inspectors, rulers, layers
│   │   ├── importer/          # SVGO + svgson pipeline
│   │   ├── layout/            # kiwi.js wrapper + constraint DSL
│   │   ├── access/            # WCAG/APCA checks & auto-fixes
│   │   ├── schema/            # JSON Schema + Ajv bindings
│   │   ├── templates/         # Example Template JSONs
│   │   └── utils/
│   └── index.html
├── packages/template-schema/  # Versioned schema + TS types
├── packages/constraint-core/  # Constraint engine wrapper (kiwi.js)
├── packages/contrast/         # WCAG/APCA utilities
├── scripts/                   # CLI import & validate
├── tests/                     # Vitest/Playwright
└── README.md
```

---

## Data Models

### Template JSON (renderer-ready)

```json
{
  "id": "clean-promo-01",
  "version": 1,
  "canvas": { "baseViewBox": [0,0,1080,1080], "ratios": ["1:1","4:5","9:16","16:9","300x250","728x90"] },
  "tokens": {
    "palette": { "brand": "#1FB6FF", "accent": "#FF7849", "neutral": "#111", "surface": "#FFF" },
    "typography": {
      "heading": { "family": "Inter", "weight": 700, "minSize": 28, "maxSize": 64 },
      "subhead": { "family": "Inter", "weight": 500, "minSize": 16, "maxSize": 28 },
      "cta": { "family": "Inter", "weight": 700, "minSize": 14, "maxSize": 20, "upper": true }
    }
  },
  "slots": [
    { "name": "logo", "type": "image", "fit": "contain", "z": 30 },
    { "name": "headline", "type": "text", "style": "heading", "z": 20, "maxLines": 3 },
    { "name": "subhead", "type": "text", "style": "subhead", "z": 20, "maxLines": 3 },
    { "name": "cta", "type": "button", "z": 40, "chip": { "fill": "neutral", "radius": 12, "padding": [12,16] } },
    { "name": "bg", "type": "image", "fit": "cover", "z": 0, "overlay": { "fill": "#000", "alpha": 0.25 } },
    { "name": "subject", "type": "image", "fit": "contain", "removeBg": true, "z": 25, "avoidTextOverlap": true }
  ],
  "constraints": {
    "global": [
      { "eq": "cta.bottom = canvas.bottom - 32" },
      { "ineq": "headline.top >= logo.bottom + 12" },
      { "ineq": "subhead.top >= headline.bottom + 8" },
      { "ineq": "cta.left >= canvas.left + 32" },
      { "eq": "logo.left = canvas.left + 24" },
      { "eq": "logo.top = canvas.top + 24" },
      { "avoidOverlap": ["headline","subhead","cta"], "with": "subject" }
    ],
    "byRatio": {
      "728x90": [
        { "switch": "stackHorizontal", "targets": ["logo","headline","cta"] },
        { "ineq": "headline.fontSize <= 36" }
      ],
      "9:16": [
        { "switch": "stackVertical", "targets": ["logo","headline","subhead","cta"] },
        { "ineq": "subject.height <= canvas.height * 0.45" }
      ]
    }
  },
  "accessibility": {
    "contrastPolicy": { "mode": "WCAG", "min": 4.5 },
    "fallbacks": ["autoChip","invertText","increaseOverlay"]
  }
}
```

**Notes**

* `baseViewBox` anchors all geometry; we map to any output size cleanly. ([MDN Web Docs][6])
* `constraints` resolved by kiwi.js (Cassowary). ([GitHub][4])
* `contrastPolicy` aligns with WCAG; APCA mode optional. ([W3C][7])

---

## Known Gotchas & Library Quirks

* **SVGs from design tools** include editor cruft; always run SVGO before parsing. ([GitHub][1])
* **Complex filters/masks** may not round-trip perfectly in Fabric; prefer simple shapes, paths, images. (Fabric focuses on canvas objects & text; it supports SVG import/export but some SVG features are limited.) ([Fabric.js][3])
* **Constraint loops**: bad rules can make systems unsolvable; provide “relax” priority and show which constraint failed (kiwi.js supports strengths). ([GitHub][4])
* **Contrast**: WCAG 2.x AA = 4.5:1; AAA = 7:1; APCA uses perceptual Lc (e.g., ~60 target for body). Provide auto-fixes. ([W3C][7])

---

## Implementation Blueprint

### Task 1: Schema & Validation

* Create **JSON Schema** (draft 2020-12) for Template JSON; compile with **Ajv**; expose `validateTemplate(json)` helper. ([ajv.js.org][5])

### Task 2: SVG Import Pipeline

* Node/Browser worker:

  1. **SVGO** optimize buffer/string
  2. **svgson** parse to AST
  3. Extract elements with `data-slot="..."`
  4. Seed slots/frames + default constraints
  5. Return **Template JSON** + import report (warnings)
     (SVGO & svgson docs). ([GitHub][1])

### Task 3: Builder (Vite + React + Fabric.js)

* Fabric canvas → load Template JSON; draw layers; side panels for **Slots / Constraints / Ratios / Tokens**.
* Selection handles, snapping, alignment, z-order, layer list.
* Live **contrast badge**; click to apply auto-fix (chip/invert/overlay). (Fabric docs). ([Fabric.js][8])

### Task 4: Constraint Engine

* Wrap **kiwi.js** with a tiny DSL (or use an existing wrapper) to parse strings like `cta.bottom = canvas.bottom - 32`. ([GitHub][4])
* Re-solve on ratio change; expose layout frames back to Fabric objects.

### Task 5: Accessibility & Auto-Fixes

* Implement **WCAG** check: compute text vs. background contrast; enforce thresholds;
* Optional **APCA** mode: compute Lc; target Lc ~60 for body text. ([W3C][7])

### Task 6: Presets & Exports

* Ratio presets (1:1, 4:5, 9:16, 16:9, 300×250, 728×90, 160×600, etc.).
* Export preview PNGs from canvas for QA; persist Template JSON.

### Task 7: Tests & Tooling

* **Unit**: importer maps slots; Ajv rejects bad templates; solver positions elements correctly.
* **E2E (Playwright)**: upload → edit → resize → save flow; contrast gate.
* **Lint/Typecheck**: ESLint + TS + Vitest.

---

## Tasks (checklist)

```yaml
Task A: Package setup
  - Vite + React + TypeScript
  - Install: svgo, svgson, fabric, @lume/kiwi or kiwi.js, ajv

Task B: JSON Schema
  - Define schema; add Ajv validator + TS types

Task C: Importer
  - SVGO optimize -> svgson parse -> slot map -> Template JSON
  - Import warnings (unsupported filters, missing data-slot)

Task D: Constraint Core
  - kiwi.js wrapper + string constraint parser
  - Reflow API: applyConstraints(template, ratio) -> frames

Task E: Fabric Editor
  - Canvas + layers panel + inspectors
  - Load/save Template JSON; live ratio switcher

Task F: Accessibility
  - WCAG/APCA calculators + auto-fix actions
  - Per-slot legibility badges

Task G: Presets & Exports
  - Size presets; PNG preview export
  - Versioning & history

Task H: Tests & CI
  - Vitest/Playwright; schema tests; importer & layout tests
```

---

## Per-Task Pseudocode (snippets)

**Importer (SVGO + svgson)**

```ts
import { optimize } from 'svgo';
import { parse } from 'svgson';

export async function importSvg(svgText: string) {
  const { data: clean } = optimize(svgText, { multipass: true }); // SVGO
  const ast = await parse(clean); // svgson AST

  // walk AST -> find nodes with data-slot attr
  const slots = extractSlots(ast); // logo/headline/bg/subject/cta...
  const template = buildTemplateJSON(ast, slots); // seed constraints/tokens
  return { template, report: {/* warnings */} };
}
```

([GitHub][1])

**Constraint Reflow (kiwi.js)**

```ts
import { Solver, Variable, Strength } from 'kiwi.js';

export function solveLayout(template, ratio) {
  const s = new Solver();
  // create variables for each frame: x,y,w,h
  // add required constraints + byRatio overrides
  // s.addConstraint(...)
  s.updateVariables();
  return framesFromSolver();
}
```

([GitHub][4])

**Contrast Gate**

```ts
const contrast = wcagContrast(textColor, backdropColor);
if (contrast < min) {
  // try fixes in order:
  applyChip(); // solid background behind text
  // or invertText(); or increaseOverlay();
}
```

([W3C][7])

**Fabric Load/Save**

```ts
import { fabric } from 'fabric';
const canvas = new fabric.Canvas('c');
loadFromTemplateJSON(template, canvas); // add objects, bind inspectors
```

([Fabric.js][8])

---

## Validation Loop

**Level 1: Schema + Lint**

```bash
pnpm lint && pnpm typecheck
node scripts/validate-template.mjs path/to/template.json  # Ajv
```

**Level 2: Unit**

* Importer maps `data-slot` → slots correctly (svgson AST paths). ([npm][2])
* SVGO reduces file size & removes editor metadata. ([GitHub][1])
* Constraint solver honors min sizes & safe areas. ([GitHub][4])

**Level 3: E2E**

* Upload → live resize → save → reload → contrast badges OK.

---

## Final Checklist

* [ ] Importer yields valid Template JSON (Ajv ✅)
* [ ] Live reflow across presets (no overlaps)
* [ ] WCAG/APCA checks pass; auto-fixes available
* [ ] Fabric editor parity: layers panel, resize, alignment, object props
* [ ] Preview exports match layout rules

---

## Anti-Patterns to Avoid

* ❌ Relying on naïve scale transforms instead of **constraint reflow** (breaks legibility in ultra-wide/tall).
* ❌ Skipping **SVGO**; raw SVGs from editors often contain bloats/filters that hurt parsing. ([GitHub][1])
* ❌ Treating contrast as optional — enforce WCAG/APCA in editor and at save. ([W3C][7])


[1]: https://raw.githubusercontent.com/svg/svgo/main/README.md?utm_source=chatgpt.com "https://raw.githubusercontent.com/svg/svgo/main/RE..."
[2]: https://www.npmjs.com/package/svgson?utm_source=chatgpt.com "svgson"
[3]: https://fabricjs.com/?utm_source=chatgpt.com "Fabric.js Javascript Library"
[4]: https://github.com/IjzerenHein/kiwi.js/?utm_source=chatgpt.com "IjzerenHein/kiwi.js: Fast TypeScript implementation of the ..."
[5]: https://ajv.js.org/?utm_source=chatgpt.com "Ajv JSON schema validator"
[6]: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox?utm_source=chatgpt.com "viewBox - SVG | MDN - Mozilla"
[7]: https://www.w3.org/TR/WCAG20-TECHS/G18.html?utm_source=chatgpt.com "G18: Ensuring that a contrast ratio of at least 4.5:1 exists ..."
[8]: https://fabricjs.com/docs/?utm_source=chatgpt.com "Introduction to Fabric.js | Docs and Guides"
[9]: https://git.apcacontrast.com/documentation/APCAeasyIntro.html?utm_source=chatgpt.com "The Easy Intro to the APCA Contrast Method"
