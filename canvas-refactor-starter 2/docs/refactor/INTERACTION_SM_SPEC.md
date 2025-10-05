# InteractionStateMachine — Spec

**Goal:** Deterministic interactions across mouse/touch/stylus using Pointer Events.

## States
`idle → selecting → dragging | resizing | rotating → idle`

## Rules
- On pointerdown: call `setPointerCapture(pointerId)` (https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture).
- On pointerup/cancel: ensure cleanup runs once.
- No history entries for selection-only changes.
- Multi-select union bbox provided to overlays.

## Event listeners
- Mark `wheel` listeners **passive** unless calling `preventDefault()`
  (Chrome guidance: https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners; wheel event: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event).

## Tests
- Transition table coverage
- Capture / release correctness across multi-touch
