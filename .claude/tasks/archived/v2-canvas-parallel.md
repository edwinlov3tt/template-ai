# Task: Parallel V2 Canvas (feature-flagged)

## Context
- Mount new stage and overlay behind `VITE_USE_V2_CANVAS`; V1 remains untouched.

## Requirements
- Create: `src/editor/svg-v2/SvgStageV2.tsx`, `src/editor/svg-v2/SelectionOverlayV2.tsx`
- Use `CoordinateSystem`, `InteractionStateMachine`, and `PropertyValidator`.
- Handles:
  - Passive wheel listeners by default; non-passive when intercepting zoom.
  - Constant-size transform handles (scale by zoom).
  - Multi-select bbox and z-order respect.
- Exports unchanged (keep existing export pipeline).

## Guardrails
- No global styles leakage; localize classNames.
- Feature-flag gating only (no conditional imports that break tree-shaking).

## Tests
- Smoke: select, drag, resize, multi-select, export.
- No console errors/warnings in test run.
