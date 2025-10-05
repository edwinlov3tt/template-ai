# Property System & Validator — Spec

**Goal:** Safe, normalized updates for visual props.

## Validate / Normalize
- Colors (hex/rgb/hsl → hex), opacity [0..1]
- Stroke (width, join, cap), Fill
- Text: `fontFamily`, `fontWeight`, `fontSize` (clamped), letter/line spacing
- Corner radius `rx/ry` (clamped to `[0, min(w,h)/2]`)

## Errors
- Return structured errors (no throws) so UI can show inline warnings.
