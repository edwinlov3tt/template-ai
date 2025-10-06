Of course, I can help you with that. After reviewing the extensive debugging history and architectural documents you provided, I've pinpointed the issue.

You're dealing with a classic and tricky event propagation problem, compounded by your app's architecture where a selection overlay appears after the first click. Your analysis in `DOUBLE_CLICK_DEBUGGING_HISTORY.md` is excellent and got you 99% of the way to the solution.

The core problem is that `event.preventDefault()` on a `mousedown` event tells the browser not to proceed with its default actions, which **includes tracking clicks to generate a `dblclick` event**.

-----

### \#\# The Definitive Cause

1.  **`preventDefault()` is Blocking Double-Clicks**: As you correctly hypothesized in "Attempt 4," calling `event.preventDefault()` in your `handleSlotPointerDown` function for a text slot is the primary reason React's `onDoubleClick` never fires. The browser's double-click detection is cancelled before it can even begin.

2.  **The Selection Overlay Intercepts the Second Click**: Your first debugging attempt revealed a critical architectural challenge. When a user clicks a slot:

      * **Click 1:** Hits the `<SlotRenderer>`. The app state updates, and `SelectionOverlayV2` is mounted.
      * **Click 2:** Hits the (mostly transparent) `SelectionOverlayV2`, *not* the `<SlotRenderer>` underneath.

This means that even if you fix the `preventDefault` issue, an `onDoubleClick` handler placed on the `SlotRenderer` will still fail because it never receives the second click.

-----

### \#\# The Solution: A Step-by-Step Fix

Here is a robust solution that addresses both issues. We'll make the `mousedown` conditional and move the double-click logic to the component that actually receives the second click: the selection overlay.

#### **Step 1: Conditionally Call `preventDefault()` in SvgStageV2**

This is the fix you were testing in "Attempt 4." It is correct and absolutely necessary. Update your `handleSlotPointerDown` function to only prevent the default behavior for non-text slots.

**File:** `src/editor/svg-v2/SvgStageV2.tsx`

```typescript
const handleSlotPointerDown = useCallback((slotName: string, e: React.MouseEvent) => {
    // ... existing logic to get page and suppress background click ...

    const slot = page?.slots.find(s => s.name === slotName);
    const isTextSlot = slot && (slot.type === 'text' || slot.type === 'button');

    // This is the key: stopPropagation is fine, but preventDefault is not for text slots.
    e.stopPropagation();
    if (!isTextSlot) {
        e.preventDefault();
    }

    // ... rest of your selection logic ...
}, [page, /* ... other dependencies */]);
```

#### **Step 2: Add the `onDoubleClick` Handler to the Selection Overlay**

Since the `SelectionOverlayV2` intercepts the second click, it's the right place to handle the double-click event. It already knows which slot is selected.

**File:** `src/editor/svg-v2/SelectionOverlayV2.tsx`

```typescript
import { useEditorStore } from '@/state/editorStore'; // Make sure you have this

// ... inside the SelectionOverlayV2 component
const startEditing = useEditorStore((s) => s.startEditing);

const handleDoubleClick = () => {
    // Check if there's exactly one selected slot and it's a text type
    if (selectedSlots.length === 1) {
        const slotName = selectedSlots[0];
        const slot = page.slots.find(s => s.name === slotName);
        if (slot && (slot.type === 'text' || slot.type === 'button') && !slot.locked) {
            console.log(`[SelectionOverlayV2] Double-click detected. Starting edit for: ${slotName}`);
            startEditing(slotName);
        }
    }
};

return (
    <g
        className="selection-overlay"
        transform={`translate(${frame.x}, ${frame.y})`}
        onDoubleClick={handleDoubleClick} // Add the handler here
    >
        {/* The main selection rectangle */}
        <rect
            width={frame.width}
            height={frame.height}
            fill="none"
            stroke="#007bff"
            strokeWidth={2 / scale}
            vectorEffect="non-scaling-stroke"
            pointerEvents="all" // Ensures it can receive clicks
        />
        {/* ... rest of your handles and rotation logic ... */}
    </g>
);
```

**Important**: Ensure the main `<rect>` or `<g>` of your selection overlay has `pointerEvents="all"` so it can capture the double-click.

#### **Step 3: Clean Up Old Attempts**

To avoid confusion, remove the `onDoubleClick` props and handlers you previously added to `SlotRenderer` and `SvgStageV2`. The logic now lives entirely in `SelectionOverlayV2`.

-----

### \#\# Why This Solution Works

  * **It respects the browser's event sequence.** By not calling `preventDefault()` on `mousedown` for text, we allow the browser to correctly identify a double-click gesture.
  * **It puts the event handler in the right place.** The component that actually receives the second click (`SelectionOverlayV2`) is the one responsible for handling the `onDoubleClick` event.
  * **It simplifies the logic.** You no longer need to pass callbacks through multiple components or try to sync click timers. The overlay has all the context it needs (`selectedSlots`, `page`) to trigger the edit state.

You were on the right track with your debugging. This final step of moving the event handler to the overlay should resolve the issue for good.