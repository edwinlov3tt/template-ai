# Task: Interaction State Machine (Pointer Events)

## Context
- Deterministic pointer handling across mouse/touch/stylus with capture; no history entries for selection-only changes.
- Read:
  - docs/refactor/INTERACTION_SM_SPEC.md
  - docs/refactor/REFACTOR_CONTEXT.md
  - SLOT_INTERACTION_GUIDE.md (if present in repo)

## Requirements
- Create: `src/editor/core/InteractionStateMachine.ts`
- Create tests: `src/editor/core/__tests__/InteractionStateMachine.test.ts`
- States: `idle → selecting → dragging|resizing|rotating → idle`
- On pointerdown: call `setPointerCapture(pointerId)` on the **target element**.
- On pointerup/cancel: cleanup once (release occurs automatically on `pointerup`).
- Expose callbacks for side effects (cursor, overlays) — no DOM work in the SM.
- Wheel/touch listeners: default **passive**; only use non-passive if calling `preventDefault()` for zoom.

## Guardrails
- No global document listeners from this module.
- Multi-touch safe; ignore secondary pointers while dragging unless gesture mode is implemented.

## Tests
- Transition coverage: all legal edges + invalid transition ignored.
- Capture/release: ensures no lost moves when pointer leaves element.
- Multi-select: union bbox is computed once per change.

## References
- MDN: setPointerCapture — https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
- MDN: Pointer events — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- Chrome: passive listeners guidance — https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners
- MDN: wheel event — https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
