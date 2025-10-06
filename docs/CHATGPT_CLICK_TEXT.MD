Got you. Given your setup, this “tab works, click doesn’t” pattern almost always comes from one of three things in canvas editors:

1. you’re calling `preventDefault()` on the text’s initial pointer/mouse event (kills focus/IME so the hidden textarea/contenteditable never activates),
2. a transparent overlay (selection frame, chip, glasspane) is intercepting the click,
3. Fabric IText (or your SVG text editor) isn’t actually attached/armed for inline editing on click (config/event order mismatch).

Here’s a focused, do-this-now checklist that lines up with your project’s architecture and fixes the bug without whack-a-mole.

# 1) Stop killing focus on text

In your “slot pointer down” handler (SVG stage) you currently stop propagation and (likely) call `preventDefault()` defensively. That’s fine for shapes/drag, but for text it blocks the browser from focusing the editing control.

**Fix (SVG editor path):**

```ts
// SvgStage.tsx (or wherever you handle slot mousedown)
function handleSlotPointerDown(e: React.PointerEvent, slot: Slot) {
  const isText = slot.type === 'text';
  // Always stop bubbling so background click doesn’t clear selection
  e.stopPropagation();

  // ❌ DO NOT preventDefault on text — it blocks focus/IME
  if (!isText) e.preventDefault();

  onSelectionChange([slot.name]);         // select it
  onRequestPageFocus?.(page.id);          // keep your existing page focus

  // Optional: if you want single-click-to-edit
  if (isText) {
    queueMicrotask(() => beginInlineTextEditing(slot.name));
  }
}
```

If you use a contenteditable overlay for text: never call `preventDefault()` on its `pointerdown`/`mousedown`. That one line is the entire bug in many editors.

**Fix (Fabric path, if text is Fabric IText):**

```ts
// fabric.IText wants the down/up pair unmolested
canvas.on('mouse:down', (opt) => {
  const t = opt.target as fabric.IText | undefined;
  if (t && t.type === 'i-text') {
    // Let Fabric handle it. No preventDefault here.
    // If you want single-click edit instead of double-click:
    if (!t.isEditing) {
      t.enterEditing();
      t.hiddenTextarea?.focus();
      canvas.requestRenderAll();
    }
  }
});
```

# 2) Ensure nothing sits on top of text

Selection frames, chips, and guide layers often end up as an always-on DOM/SVG overlay. If any part of that overlay has `pointer-events:auto`, it will eat the click.

**Fixes:**

* Make non-interactive overlay bits `pointer-events:none;`
* Only the actual resize/rotate handles should be clickable.
* If you render a global glasspane for gestures, disable it when a text object is active.

Quick CSS sanity check:

```css
/* Selection box & labels should not block clicks to text beneath */
.native-selection-overlay { pointer-events: none; }
.native-selection-overlay .handle { pointer-events: auto; } /* just the handles */
```

# 3) Arm the text editor correctly

Make sure your text objects are truly editable and that your selection logic doesn’t immediately de-select them on the bubbling background click.

**Fabric IText config:**

```ts
const itext = new fabric.IText(content, {
  editable: true,            // default true, but be explicit
  selectable: true,
  evented: true,
  perPixelTargetFind: false, // optional, avoids miss-clicks on thin glyphs
});
```

**Background click guard (SVG path):**

* Keep your “only clear selection on real background” rule (`e.target === e.currentTarget`).
* After a text click, do not fire a second background onClick that clears selection.
* If you rely on a “suppress background” flag, set it only for the same tick and reset after `pointerup`.

Minimal pattern:

```ts
// background onClick
function onBackgroundClick(e: React.MouseEvent<SVGSVGElement>) {
  if (e.target !== e.currentTarget) return; // child element: ignore
  onSelectionChange([]); // clear
}
```

# 4) Single-click vs double-click

If you want single-click to enter text editing (my recommendation here), do it explicitly (don’t rely on the engine’s dblclick heuristic):

* SVG path: on first click after selection, call your `beginInlineTextEditing(slotName)` that swaps in the contenteditable overlay aligned to the text’s bbox.
* Fabric path: call `enterEditing()` on the active `IText` in the mouse down/up handler (see snippet above).

# 5) Z-index sanity

Make sure your selection overlay is after the slots (so it draws on top) but not intercepting events except handles. If you’re using a separate DOM overlay for chips/toolbar, position it via computed screen rects, but keep it `pointer-events:none;` unless the pointer is over the chip itself.

# 6) Quick smoke tests (do these in order)

* Click text → cursor appears and you can type (no selection flash/clear).
* Background click (empty SVG only) → exits editing and clears selection.
* Shift+click text while editing → exits editing and multi-selects (optional).
* Tab while editing → moves focus to the next text slot (you said this works already).
* Zoom/pan doesn’t change the above behavior.

# 7) If you still can’t click-edit

Add a one-time log on the event path to see who’s eating the click:

```ts
document.addEventListener('pointerdown', (e) => {
  console.log('DOWN on', (e.target as Element).closest('[data-slot]')?.getAttribute('data-slot') ?? e.target);
}, { capture: true });
```

If you never see the text node (or its ancestor `[data-slot]`), something above it is intercepting.

---

## TL;DR exact patches I’d try first

1. In your slot pointerdown handler: keep `stopPropagation()`, **remove** `preventDefault()` **for text**, and immediately call your `beginInlineTextEditing(...)` (or Fabric’s `enterEditing()`).
2. Make non-interactive overlay layers `pointer-events:none`; only handles/buttons should be clickable.
3. Keep the background onClick guard `e.target === e.currentTarget` so it never clears selection after a text click.

If you paste a small excerpt of your `handleSlotPointerDown` and your overlay’s CSS, I’ll mark the precise lines to change.
