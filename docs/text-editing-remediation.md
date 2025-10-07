# Text Editing Remediation Guide

## Problem Overview
- **Symptoms**
  - Double-clicking text slots fails to enter inline editing.
  - Backspace/Delete used to remove the entire slot even while editing (improved by the `!editingSlot` guard, but the workflow remains fragile).
  - Users rely on keyboard shortcuts (Tab/Enter) to edit, which is not discoverable.
- **Impact**
  - Editing is inconsistent across selection states.
  - Overlay interactions compete with slot event handlers, producing race conditions and missed double-clicks.
  - Repeated failures erode confidence in the editor and encourage destructive key patterns (Delete removing slots).

## Current Architecture
- `src/editor/svg/SlotRenderer.tsx` renders slot content and owns the first click. It still uses a per-component `lastClickTimeRef` with `stopPropagation`, so the overlay never sees the initial click for double-click detection.
- `src/editor/svg/NativeSelectionOverlay.tsx` (and `SvgStageV2`) render the selection handles and now try to detect double-clicks. Because the first click is intercepted by `SlotRenderer`, the overlay’s timer starts late, so the second click rarely qualifies as a double click.
- Editing state lives in the Zustand store (`useEditorStore.ts`). `editingSlot` toggles rendering of `InlineTextEditor`.
- Keyboard shortcuts (Tab/Enter for edit, Delete for slot removal) originate from `App.tsx` and `SvgStage`.

## Root Cause Summary
1. **Split Double-Click Detection** – Both the slot component and the overlay try to detect double clicks independently. Their timers are unsynchronised and neither has the full click history.
2. **Aggressive Event Suppression** – `stopPropagation`/`preventDefault` are applied in several layers, preventing native `onDoubleClick` events from firing and starving later handlers of the first click event.
3. **Selection Lifecycle Coupling** – The overlay renders only after selection changes, so the second click often happens before the overlay is mounted, resetting state and losing the double-click window.
4. **Global Keybinds Acting on Stale Context** – Keyboard handlers in `App.tsx` can’t easily differentiate between "slot selected" and "slot editing", so Delete (and potentially other commands) act on the wrong target without explicit guards.

## Remediation Plan

### Phase 1 – Stabilise Double-Click Editing (Required)
1. **Centralise Detection**
   - Remove manual timers from `SlotRenderer` and `NativeSelectionOverlay`.
   - Add a single `onDoubleClick` handler in `SvgStage`/`SvgStageV2` that:
     ```tsx
     const handleSlotDoubleClick = useCallback((slotName: string) => {
       const slot = getSlot(slotName)
       if (!slot || slot.locked) return
       if (slot.type === 'text' || slot.type === 'button') {
         startEditing(slotName)
       }
     }, [startEditing, getSlot])
     ```
   - Wire it through `SlotRenderer` and the overlay via props (e.g. `onDoubleClick`). React synthesises double-click events regardless of intermediate `stopPropagation` if the handler is attached to the target.

2. **Relax Pointer Guards**
   - Allow the second click to bubble by moving `stopPropagation` to only block background deselection.
   - Keep drag suppression by starting drags on `onMouseDown` but leaving `onClick`/`onDoubleClick` untouched.

3. **Synchronise Selection Updates**
   - When the first click selects a slot, schedule `setSelection` synchronously before double-click detection runs. If using Zustand, call `startEditing` synchronously when the second click arrives by reading the latest store value (`getState()`), not via stale props.

4. **Regression Tests / Manual Steps**
   - Double-click text slot: Inline editor opens, selection overlay hides, Delete only removes characters.
   - Double-click locked slot: no edit.
   - Shift+double-click on multi-select: ensure correct behaviour (either edit only if single slot selected or ignore).

### Phase 2 – Harden Editing Lifecycle (Recommended)
1. **Create a Text Editing Controller**
   - Colocate all editing transitions inside `useEditorStore`: `enterEdit(slotName)`, `commitEdit`, `cancelEdit`, `isEditing(slotName)`.
   - Background click, selection changes, and page navigation should funnel through these actions; if editing is active, queue selection changes until edit commits/cancels.

2. **Overlay/Stage Contract**
   - When `editingSlot` is non-null, the overlay should disable drag handles and ignore pointer events (`pointerEvents="none"`) to avoid accidental drags while editing.

3. **Keyboard Handling Refactor**
   - Split slot-level keybinds (Delete for slot removal, Cmd+D to duplicate) from editor-level ones. Attach slot-level handlers inside `SvgStage` so they can read the immediate store state.
   - Keep editor-level shortcuts (Undo/Redo, Save) in `App.tsx`.

4. **Feedback Signals**
   - Display an inline chip or toolbar that confirms the editor is in text-edit mode; this reduces confusion when double-click succeeds.

### Phase 3 – "Nuclear" Optional Enhancements
1. **Dedicated Text Editing Worker / Manager**
   - Instead of a Web Worker (which can’t interact with DOM), implement a `<TextEditingManager>` component that:
     - Listens for global pointer/key events while editing.
     - Overrides conflicting shortcuts (e.g. Delete, Cmd+A) when the editor is active.
     - Broadcasts lifecycle events (`editing:start`, `editing:commit`) via Zustand or an event emitter.
   - This separates text editing concerns from the canvas/overlay logic and makes it easier to add features like inline spellcheck or formatting.

2. **Accessibility Enhancements**
   - Integrate ARIA live regions to announce when editing starts/stops.
   - Provide keyboard-only shortcuts (`Enter` to edit, `Esc` to cancel, `Cmd+Enter` to save) already exist but should be documented in a tooltip.

## Implementation Checklist
- [ ] Remove duplicate double-click timers in `SlotRenderer` & `NativeSelectionOverlay`.
- [ ] Add `onDoubleClick` wiring from `SvgStage` down to slots.
- [ ] Adjust `stopPropagation` usage so double-click events fire.
- [ ] Ensure `startEditing` reads from the latest store state (e.g. `useEditorStore.getState()`).
- [ ] Update Delete/Delete behaviour tests after refactor.
- [ ] Manual QA: double-click, Tab, Delete, Shift-select flows.

## Resources
- React Docs: [Double Click Events](https://react.dev/reference/react-dom/components/common#ondoubleclick)
- MDN: [`contentEditable` best practices](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)
- Pointer Events Level 3: [Pointer event ordering](https://www.w3.org/TR/pointerevents3/#chorded-button-interactions)
- Zustand Patterns: [Selectors and getState](https://docs.pmnd.rs/zustand/guides/usage-with-react#reading-the-current-state-outside-of-react)

## Next Steps
1. Implement Phase 1 changes as a focused PR with QA notes.
2. If issues persist, instrument the click lifecycle (log `pointerdown`, `click`, `dblclick` timestamps) to confirm firing order.
3. Plan Phase 2 refactor, ensuring new editing controller passes regression tests.

By consolidating double-click detection and gating editing logic through a single controller, you eliminate the race between the slot renderer and the overlay while keeping room to add more advanced behaviours later.
