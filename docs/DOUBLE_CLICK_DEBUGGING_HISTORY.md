# Double-Click Text Editing - Complete Debugging History

## Problem Statement

**User Issue:** Double-clicking text slots does not enter edit mode. Users cannot edit text inline despite having an InlineTextEditor component implemented.

**Expected Behavior:**
1. User double-clicks a text slot
2. InlineTextEditor appears with contentEditable div
3. User can type and edit text
4. Clicking outside or pressing CMD+Enter saves changes

**Actual Behavior:**
1. User double-clicks text
2. Nothing happens - no edit mode
3. Only Tab/Enter keyboard shortcuts work (not discoverable)

---

## Architecture Overview

### Component Hierarchy (V2 Canvas)
```
CanvasStage
  └── SvgStageV2 (V2 canvas system)
      ├── SlotRenderer (renders each slot)
      │   └── InlineTextEditor (when editingSlot === slot.name)
      └── SelectionOverlayV2 (selection handles, drag/resize)
```

### Key Files
- **`src/editor/svg-v2/SvgStageV2.tsx`** - Main canvas component, handles slot clicks
- **`src/editor/svg/SlotRenderer.tsx`** - Renders individual slots (shared between V1 and V2)
- **`src/editor/svg-v2/SelectionOverlayV2.tsx`** - Selection handles and drag operations
- **`src/components/typography/InlineTextEditor.tsx`** - contentEditable editor
- **`src/state/editorStore.ts`** - Zustand store with `editingSlot` state

### State Flow
```
editorStore.editingSlot: string | null
  ↓ (when null)
SlotRenderer renders static <text> element
  ↓ (when set to slot name)
SlotRenderer renders <InlineTextEditor>
```

---

## Attempts to Fix (Chronological)

### Attempt 1: Manual Double-Click Detection in SlotRenderer
**Date:** Initial implementation
**Approach:** Track click timestamps in `SlotRenderer.tsx` using `useRef`

```typescript
const lastClickTimeRef = React.useRef<number>(0)

const textInteractiveProps = {
  onMouseDown: (e: React.MouseEvent<SVGGElement>) => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTimeRef.current
    lastClickTimeRef.current = now

    if (timeSinceLastClick < 300 && !slot.locked) {
      startEditing(slot.name)
      return
    }
    onPointerDown?.(e)
  }
}
```

**Result:** ❌ **Failed**
- The second click never reached SlotRenderer because SelectionOverlayV2 mounted after first click
- Overlay's transparent drag rectangle intercepted the second click
- Double-click window missed

**Log Evidence:**
```
[SvgStageV2] handleSlotPointerDown called for: text-1
[SvgStageV2] Recorded click time: 1759713577034
// SelectionOverlayV2 mounts here
// Second click goes to overlay, not SlotRenderer
```

---

### Attempt 2: Shared Timestamp in editorStore
**Date:** Mid-session
**Approach:** Share click timestamp between SlotRenderer and SelectionOverlayV2 via Zustand

**Changes:**
1. Added to `editorStore.ts`:
```typescript
lastClickTime: number
setLastClickTime: (time: number) => void
```

2. SvgStageV2 records timestamp:
```typescript
const now = Date.now()
setLastClickTime(now)
```

3. SelectionOverlayV2 checks timestamp:
```typescript
const lastClickTime = useEditorStore(state => state.lastClickTime)
const now = Date.now()
const timeSinceLastClick = now - lastClickTime

if (timeSinceLastClick < 300) {
  startEditing(selectedSlots[0])
}
```

**Result:** ❌ **Failed**
- User's clicks were too slow (2+ seconds apart instead of <300ms)
- Manual timer detection is unreliable
- Doesn't account for OS-level double-click speed settings

**Log Evidence:**
```
localhost-1759713648645.log:
First click:  1759713608498
Second click: 1759713610577
Time diff:    2079ms (missed 300ms window)
```

---

### Attempt 3: Native React onDoubleClick (Phase 1 from Remediation Doc)
**Date:** Latest attempt
**Approach:** Use React's synthetic `onDoubleClick` event instead of manual timers

**Rationale:**
- React's `onDoubleClick` fires regardless of `stopPropagation()` on intermediate handlers
- Browser handles timing based on OS settings
- Recommended by ChatGPT's remediation document

**Implementation:**

1. **SlotRenderer.tsx** - Added native onDoubleClick:
```typescript
const textInteractiveProps = {
  ...interactiveProps,
  onDoubleClick: (e: React.MouseEvent<SVGGElement>) => {
    console.log('[SlotRenderer] *** onDoubleClick EVENT FIRED')
    if (!slot.locked) {
      e.stopPropagation()
      e.preventDefault()
      onDoubleClick?.(slot.name)
    }
  }
}
```

2. **SvgStageV2.tsx** - Created handler:
```typescript
const handleSlotDoubleClick = useCallback((slotName: string) => {
  console.log('[SvgStageV2] *** handleSlotDoubleClick CALLED')
  const slot = page?.slots.find(s => s.name === slotName)
  if (slot && (slot.type === 'text' || slot.type === 'button') && !slot.locked) {
    startEditing(slotName)
  }
}, [page, startEditing])

// Wire to SlotRenderer
<SlotRenderer
  onDoubleClick={handleSlotDoubleClick}
/>
```

3. **SelectionOverlayV2.tsx** - Removed competing manual detection:
```typescript
const handleMouseDown = useCallback((handle: DragHandle, e: React.MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
  // Removed double-click detection code
  beginDrag(handle, e.clientX, e.clientY)
}, [beginDrag])
```

**Result:** ❌ **Still Failed**
- Console shows NO `onDoubleClick` event firing
- Logs missing:
  - `[SlotRenderer] *** onDoubleClick EVENT FIRED`
  - `[SvgStageV2] *** handleSlotDoubleClick CALLED`

---

### Attempt 4: Remove preventDefault on Text Slots
**Date:** Most recent (current)
**Discovery:** `event.preventDefault()` on `mousedown` **blocks double-click events**

**Analysis:**
When `preventDefault()` is called on `mousedown`, the browser cancels the default behavior, which includes the double-click event sequence.

**Fix Applied:**
```typescript
// SvgStageV2.tsx handleSlotPointerDown
const slot = page?.slots.find(s => s.name === slotName)
const isTextSlot = slot && (slot.type === 'text' || slot.type === 'button')

event.stopPropagation()

// DON'T preventDefault for text slots - it blocks double-click events!
if (!isTextSlot) {
  event.preventDefault()
}
```

**Status:** ⏳ **Awaiting Test Results**

---

## Root Causes Identified

### 1. Event Propagation Conflicts
**Issue:** Multiple layers trying to handle the same clicks
- SlotRenderer handles first click
- SelectionOverlayV2 mounts and handles second click
- No shared state between them

**Effect:** Manual double-click detection split across two components that never see both clicks

### 2. preventDefault() Blocking Double-Click
**Issue:** `event.preventDefault()` on `mousedown` cancels browser's double-click sequence

**MDN Reference:**
> "Calling `preventDefault()` during any stage of event flow cancels the event, meaning any default action normally taken by the implementation as a result of the event will not occur."

**Effect:** React's `onDoubleClick` never fires because browser's native double-click detection is canceled

### 3. Event Handler Ordering
**Issue:** Event flow in SVG is complex
```
User Double-Clicks Text
  ↓
mousedown (first) → SlotRenderer.onMouseDown
  → preventDefault() called ← BLOCKS DOUBLE-CLICK
  ↓
mouseup (first)
  ↓
click (first)
  ↓
mousedown (second) → Should trigger dblclick, but prevented
  ↓
NO DOUBLE-CLICK EVENT FIRES
```

---

## Secondary Issues Fixed

### Issue: Delete Key Deleting Entire Slot While Editing
**Fix:** Added `!editingSlot` guard in App.tsx:
```typescript
if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSlots.length > 0 && !editingSlot) {
  handleRemoveSlot(selectedSlots[0])
}
```

### Issue: Newlines Not Persisting
**Fix:** Convert `<br>` tags to `\n` in InlineTextEditor.tsx:
```typescript
const handleSave = () => {
  const innerHTML = editorRef.current.innerHTML
  const finalContent = innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
  onSave(finalContent)
}
```

### Issue: Render Loop (30+ re-renders)
**Fix:** Used `useCallback` to memoize click-outside handler:
```typescript
const handleClickOutside = useCallback((e: MouseEvent) => {
  // ...
}, [onSave])
```

---

## Current Status

### What Works ✅
- Tab/Enter keyboard shortcuts enter edit mode
- Delete key only works when NOT editing (doesn't delete slot while typing)
- InlineTextEditor component renders correctly when triggered
- Newlines are preserved
- No render loops

### What Doesn't Work ❌
- **Double-clicking text slots does not enter edit mode**
- No console logs showing `onDoubleClick` event firing
- Appears that React's synthetic event is not being triggered at all

---

## Testing Performed

### Console Log Instrumentation
Added extensive logging at every step:

1. **SlotRenderer.tsx:50** - `onDoubleClick` event handler
2. **SvgStageV2.tsx:176** - `handleSlotDoubleClick` callback
3. **SvgStageV2.tsx:193** - `handleSlotPointerDown` (mousedown)
4. **InlineTextEditor.tsx:29** - Component mount

### Test Logs Reviewed
- `localhost-1759713648645.log` - Shows manual timer failing (2079ms gap)
- `localhost-1759714450087.log` - No double-click events
- `localhost-1759714718623.log` - SelectionOverlayV2 competing with SlotRenderer
- `localhost-1759715452826.log` - After native onDoubleClick implementation

### Observations
- `handleSlotPointerDown` fires on every click ✅
- `onDoubleClick` never fires ❌
- InlineTextEditor only mounts via Tab/Enter ✅

---

## Hypotheses for Why It's Still Not Working

### Hypothesis 1: preventDefault Still Being Called Somewhere
**Check:**
- Other event handlers in the chain calling preventDefault?
- Parent elements capturing and preventing?

### Hypothesis 2: stopPropagation Blocking Event Bubbling
**Check:**
- Does `stopPropagation()` on mousedown prevent dblclick from bubbling?
- Test: Remove stopPropagation temporarily

### Hypothesis 3: SVG Double-Click Events Behave Differently
**Research Needed:**
- Does SVG `<g>` element support onDoubleClick?
- Do we need to use native DOM listeners instead of React synthetic events?
- Try: `addEventListener('dblclick', ...)` directly on SVG element

### Hypothesis 4: Drag Threshold Interfering
**Check:**
- Window mousemove/mouseup listeners might be capturing events
- Drag candidate logic might be preventing double-click detection

### Hypothesis 5: React Event Delegation Issue
**Theory:**
- React attaches events to root, not individual elements
- SVG might not be properly delegating events
- Try: Use `onDoubleClickCapture` instead

---

## Recommended Next Steps

### Immediate Tests (Debug Mode)

1. **Test native DOM listener:**
```typescript
useEffect(() => {
  const element = document.querySelector(`[data-slot-name="${slot.name}"]`)
  const handler = (e) => {
    console.log('NATIVE dblclick event!', slot.name)
    startEditing(slot.name)
  }
  element?.addEventListener('dblclick', handler)
  return () => element?.removeEventListener('dblclick', handler)
}, [])
```

2. **Remove ALL event.preventDefault() calls temporarily:**
```typescript
// Comment out all preventDefault in handleSlotPointerDown
// event.preventDefault() // TESTING: Disabled
```

3. **Test with onClickCapture:**
```typescript
const textInteractiveProps = {
  onDoubleClickCapture: (e) => {
    console.log('CAPTURE PHASE double click')
    onDoubleClick?.(slot.name)
  }
}
```

### Alternative Approaches

#### Option A: Click-Wait-Click Pattern
Instead of true double-click, detect two clicks on same slot within timeframe:
```typescript
const [lastClickSlot, setLastClickSlot] = useState(null)
const [lastClickTime, setLastClickTime] = useState(0)

const handleClick = (slotName) => {
  const now = Date.now()
  if (slotName === lastClickSlot && now - lastClickTime < 500) {
    startEditing(slotName)
  }
  setLastClickSlot(slotName)
  setLastClickTime(now)
}
```

#### Option B: Enter Edit Mode on First Click
Simplify UX - single click on selected text enters edit mode:
```typescript
const handleClick = (slotName) => {
  if (selectedSlots.includes(slotName)) {
    // Already selected, enter edit mode
    startEditing(slotName)
  } else {
    // Select it
    onSelectionChange([slotName])
  }
}
```

#### Option C: Dedicated Edit Button
Add a small "Edit" button to the selection overlay for text slots:
```typescript
{slot.type === 'text' && (
  <foreignObject ...>
    <button onClick={() => startEditing(slot.name)}>
      Edit
    </button>
  </foreignObject>
)}
```

---

## Files Modified (Full List)

### Core Changes
- `src/editor/svg-v2/SvgStageV2.tsx` - Added handleSlotDoubleClick, conditional preventDefault
- `src/editor/svg/SlotRenderer.tsx` - Added onDoubleClick handler
- `src/editor/svg-v2/SelectionOverlayV2.tsx` - Removed manual double-click detection
- `src/components/typography/InlineTextEditor.tsx` - Fixed newlines, render loop
- `src/state/editorStore.ts` - Removed lastClickTime (unused)
- `src/App.tsx` - Added !editingSlot guard for Delete key

### Documentation
- `docs/text-editing-remediation.md` - ChatGPT's remediation plan (Phase 1 implemented)

---

## References

### Browser APIs
- [MDN: dblclick event](https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event)
- [MDN: preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
- [MDN: stopPropagation](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation)

### React Documentation
- [React: onDoubleClick](https://react.dev/reference/react-dom/components/common#ondoubleclick)
- [React: Event Pooling](https://legacy.reactjs.org/docs/events.html#event-pooling)

### Related Issues
- [Fabric.js double-click on objects](https://github.com/fabricjs/fabric.js/issues/4396)
- [SVG elements and React events](https://github.com/facebook/react/issues/9809)

---

## Debug Commands

### View Recent Logs
```bash
tail -100 localhost-*.log | grep -E "Double|onDoubleClick|handleSlot"
```

### Check Event Listeners
In browser console:
```javascript
// Get all event listeners on text element
const el = document.querySelector('[data-slot-name="text-1"]')
getEventListeners(el)
```

### Test Native Double-Click
In browser console:
```javascript
// Manually dispatch dblclick event
const el = document.querySelector('[data-slot-name="text-1"]')
el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
```

---

## Contact / Handoff Notes

**Current Branch:** `feature/effects-ui-panels`

**Uncommitted Changes:** Yes - all fixes above

**To Test:**
1. Run `pnpm dev`
2. Open browser to `http://localhost:5173`
3. Double-click any text element
4. Check console for logs

**Expected Console Output (if working):**
```
[SlotRenderer] *** onDoubleClick EVENT FIRED for: text-1
[SvgStageV2] *** handleSlotDoubleClick CALLED for: text-1
[SvgStageV2] Double-click detected - Starting edit mode for: text-1
[editorStore] startEditing called for: text-1
[InlineTextEditor] Mounted for slot: text-1
```

**Actual Console Output (not working):**
```
[SvgStageV2] handleSlotPointerDown called for: text-1
// No onDoubleClick logs
```

**Key Question for Next Developer:**
Why is React's `onDoubleClick` synthetic event not firing on SVG `<g>` elements despite being properly wired up?

---

## Additional Context

The V2 canvas system uses native SVG coordinate systems (no Fabric.js). All positioning is done via SVG viewBox and native transforms. This means we're dealing with pure SVG elements, not canvas or DOM overlays, which may affect how events propagate.

The InlineTextEditor component works perfectly when triggered via Tab/Enter, proving the edit mode logic is sound. The ONLY issue is the double-click trigger mechanism.
