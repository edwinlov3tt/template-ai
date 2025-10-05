# Task: Property System & Validator

## Context
- Normalize/clamp visual properties; return structured errors (no throws).

## Requirements
- Create: `src/editor/core/PropertyValidator.ts`
- Create tests: `src/editor/core/__tests__/PropertyValidator.test.ts`
- Validate/normalize:
  - Color (hex/rgb/hsl → hex), opacity [0..1]
  - Stroke (width, join, cap)
  - Text: fontFamily, fontWeight, fontSize (clamped), line-height, letter-spacing, textAlign
  - Corner radius rx/ry clamped to [0, min(w,h)/2]
- Provide helpers to map validation errors to inline UI warnings.

## Guardrails
- Pure functions; no DOM. Do not import React.

## Tests
- Color normalization matrix (rgb/hsl/hex).
- Font size clamping and message correctness.
- Corner radius clamping correctness.
