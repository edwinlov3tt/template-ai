# Canvas Architecture & Interaction System

## Overview

The canvas system is a multi-layered architecture for rendering and editing template slots using native SVG. It handles coordinate transformations, event routing, selection, and drag/resize operations.

## Component Hierarchy

```
CanvasStage (DOM container)
└── Zoom/Pan wrapper
    └── Multi-page wrapper
        └── Per-page:
            ├── PageControls
            └── Canvas container (onClick → setCurrentPage)
                ├── SvgStage (SVG root)
                │   ├── <defs> (markers, clipPaths, gradients)
                │   ├── Clipped content group
                │   │   └── SlotRenderer (for each slot)
                │   └── NativeSelectionOverlay (handles, guides)
                ├── Safe Area Guides (overlay SVG)
                └── LayerActionsChipOverlay (DOM, positioned outside)
```

## Coordinate Systems

### 1. Screen Coordinates (pixels)
- Mouse events: `event.clientX`, `event.clientY`
- Used by: CanvasStage zoom/pan gestures

### 2. ViewBox Coordinates (template units)
- SVG viewBox: `[x, y, width, height]` from `template.canvas.baseViewBox`
- All slot positions (x, y, width, height) are in viewBox units
- Conversion: `NativeSelectionOverlay.screenToSVG()` uses `getScreenCTM().inverse()`

### 3. Zoom-Scaled Coordinates
- Applied by: `#canvas-scaler` div with `scale(zoom / 100)`
- Affects: Handle sizes (divided by scale to maintain constant screen size)

## Event Flow & Interactions

### Selection Flow

**Click to Select:**
```
User clicks slot
  ↓
SlotRenderer.onMouseDown fires
  ↓
SvgStage.handleSlotPointerDown
  ↓
onRequestPageFocus(page.id) called [LINE 108]
  ↓
onSelectionChange([slotName]) called [LINE 115]
  ↓
CanvasStage.onSelectionChange updates App state
  ↓
NativeSelectionOverlay renders with selected slot
```

**Critical Path:**
1. `SlotRenderer` wraps each slot in `<g>` with `onMouseDown` (SlotRenderer.tsx:27)
2. `handleSlotPointerDown` calls `event.stopPropagation()` to prevent background click (SvgStage.tsx:101)
3. Selection state flows: SvgStage → CanvasStage → App → editorStore
4. `suppressBackgroundClickRef` prevents background deselection on slot click (SvgStage.tsx:105)

### Background Click Flow

```
User clicks SVG background
  ↓
SvgStage handleBackgroundClick
  ↓
Check: e.target === e.currentTarget?
  ↓
Yes: onSelectionChange([]) - clear selection
No: Event was on child element, ignore
```

### Drag Initiation Flow

**New Pattern (with drag threshold):**
```
User mousedown on slot
  ↓
handleSlotPointerDown creates dragCandidate (SvgStage.tsx:118-122)
  ↓
Attaches window mousemove/mouseup listeners (SvgStage.tsx:160-161)
  ↓
On mousemove:
  - Check distance from start position
  - If > 3px threshold: setPendingAutoDrag (SvgStage.tsx:137-142)
  - If < 3px: ignore (still a click)
  ↓
On mouseup before threshold: cleanup, no drag (SvgStage.tsx:154-156)
  ↓
NativeSelectionOverlay consumes pendingAutoDrag
  ↓
Initiates drag operation with window event listeners
```

**Why the threshold?**
- Prevents accidental drags on simple clicks
- Matches native OS behavior
- Selection feels more stable

### Page Focus Mechanism

**Dual-trigger system:**

1. **Canvas container click** (CanvasStage.tsx:197-200):
   ```tsx
   onClick={(event) => {
     if (event.target === event.currentTarget) {
       setCurrentPage(page.id)
     }
   }}
   ```
   - Only fires when clicking the white space around the SVG
   - Does NOT fire when clicking slots (events are stopPropagation'd)

2. **Slot click** (SvgStage.tsx:107-109):
   ```tsx
   if (page?.id) {
     onRequestPageFocus?.(page.id)
   }
   ```
   - Fires when clicking any slot
   - Ensures page becomes active when interacting with its content

**Store behavior** (editorStore.ts:135-144):
```tsx
setCurrentPage: (pageId) => {
  const { currentPageId } = get()
  if (currentPageId === pageId) return // Don't clear selection if same page
  set({ currentPageId: pageId, selectedSlots: [] })
}
```

## State Management

### editorStore.ts

**Selection State:**
- `selectedSlots: string[]` - Array of slot names
- Single source of truth
- Cleared when switching pages

**Page State:**
- `currentPageId: string | null` - Active page
- Only one page active at a time
- Selection only visible on active page

**Frame State:**
- Stored per-page, per-ratio: `page.frames[ratioId][slotName]`
- Contains: `{ x, y, width, height, rotation? }`
- Updated via `onSlotModified` callback

## Known Bugs & Conflicts

### 1. ✅ FIXED: Selection Flashing on Click

**Symptom:** Clicking a slot shows selection briefly, then disappears

**Root Cause:**
- Canvas container `onClick` always called `setCurrentPage(page.id)`
- `setCurrentPage` cleared selection even when already on that page
- Event flow: slot click → selection → container click → clear selection

**Fix Applied:**
```tsx
// editorStore.ts:135-144
setCurrentPage: (pageId) => {
  if (currentPageId === pageId) return // Don't clear if same page
  set({ currentPageId: pageId, selectedSlots: [] })
}

// CanvasStage.tsx:197-200
onClick={(event) => {
  if (event.target === event.currentTarget) { // Only on whitespace
    setCurrentPage(page.id)
  }
}}

// SvgStage.tsx:105
suppressBackgroundClickRef.current = true // Prevent background click
```

### 2. Event Propagation Race Conditions

**Potential Issue:** Multiple event handlers in the chain

**Chain:**
```
SlotRenderer.onMouseDown
  → SvgStage.handleSlotPointerDown
    → CanvasStage.onSelectionChange
      → App setState
        → editorStore.setSelection
```

**Mitigation:**
- `event.stopPropagation()` on slot clicks (SvgStage.tsx:101)
- `event.preventDefault()` to prevent default browser behavior (SvgStage.tsx:102)
- `suppressBackgroundClickRef` to prevent background clicks after slot interaction

### 3. Drag vs Click Ambiguity

**Problem:** How to distinguish click from drag start?

**Solution Implemented:**
- Drag candidate pattern with threshold (SvgStage.tsx:117-161)
- Window listeners track mouse movement
- Only trigger drag if movement > 3px
- Cleanup on mouseup without drag

**Edge Cases:**
- Fast click-release before mousemove: ✅ Handled (cleanup in handleUp)
- Slow drag start: ✅ Handled (threshold triggers eventually)
- Multi-touch: ❌ Not tested

### 4. Coordinate Transform Complexity

**Challenges:**
1. Mouse events in screen pixels
2. Slots positioned in viewBox units
3. Zoom applied via CSS transform
4. Selection handles must stay constant screen size

**Current Solution:**
- `getScreenCTM()` for screen → SVG conversion
- Handle sizes divided by scale: `12 / scale` (NativeSelectionOverlay.tsx:80)
- ViewBox provides automatic coordinate mapping

**Potential Issues:**
- Multiple transforms (zoom + pan) can compound errors
- CTM calculation expensive on every drag
- Rotation adds another transform layer

### 5. Multi-Page Selection State

**Issue:** Selection shared across all pages in `App.tsx`

**Current Behavior:**
- Only render selection overlay when `currentPageId === page.id` (CanvasStage.tsx:217)
- Selection cleared when switching pages (editorStore.ts:143)

**Limitation:**
- Can't copy/paste between pages easily
- No multi-page operations

### 6. Z-Index and Event Targeting

**Slot Rendering Order:**
- Sorted by `slot.z` (SvgStage.tsx:196)
- Lower z rendered first (backgrounds)
- Higher z rendered last (overlays)

**Selection Overlay:**
- Rendered AFTER all slots (SvgStage.tsx:266-283)
- NOT clipped (can extend beyond canvas bounds)
- `pointer-events: none` on non-interactive parts

**Potential Conflict:**
- Overlay handles might block slot clicks
- Solution: Handles only rendered when selected

### 7. Locked Slots

**Implementation:**
- `slot.locked` property
- `pointerEvents: 'none'` when locked (SlotRenderer.tsx:33)
- Cursor: 'default' instead of 'move' (SlotRenderer.tsx:32)

**Edge Case:**
- Locked slots can still be selected via keyboard? ❌ Not implemented
- Locked slots not draggable ✅ Working

## Performance Considerations

### Render Optimization

**Unnecessary Re-renders:**
- Every slot re-renders on any selection change
- ViewBox calculations on every render
- CTM lookups on every mouse move during drag

**Potential Optimizations:**
- Memoize SlotRenderer with `React.memo`
- Cache CTM during drag operation
- Virtual scrolling for many slots
- Debounce drag frame updates

### Event Listener Management

**Current Approach:**
- Window listeners added/removed per drag
- Cleanup via refs (SvgStage.tsx:74-78)

**Risks:**
- Memory leaks if cleanup fails
- Multiple listeners stacking
- Cleanup on unmount critical

## Debugging Tips

### Selection Issues

1. Check console logs:
   - `[handleSlotPointerDown]` - slot click detected
   - `[setCurrentPage]` - page focus triggered
   - `[handleBackgroundClick]` - background clicked

2. Verify event propagation:
   - Is `stopPropagation()` called?
   - Is `suppressBackgroundClickRef` set?
   - Check event target vs currentTarget

3. State tracking:
   - `selectedSlots` in editorStore
   - `currentPageId` matches page
   - Selection only shown on active page

### Drag Issues

1. Check drag candidate:
   - `dragCandidateRef.current` set on mousedown
   - Movement threshold exceeded (3px)
   - `pendingAutoDrag` state updated

2. Verify cleanup:
   - `pendingDragCleanupRef` called on mouseup
   - Window listeners removed
   - Refs cleared

### Coordinate Issues

1. Verify transforms:
   - SVG viewBox matches template
   - Zoom scale applied correctly
   - CTM matrix valid

2. Check conversions:
   - `screenToSVG()` for mouse events
   - Handle sizes scaled by `1 / scale`
   - Frame positions in viewBox units

## Architecture Recommendations

### Short-term Improvements

1. **Remove debug logs** once stable
2. **Add error boundaries** around SvgStage
3. **Memoize SlotRenderer** for performance
4. **Add keyboard selection** (arrow keys, tab)
5. **Implement locked slot keyboard override** (shift+click?)

### Long-term Refactoring

1. **Separate event handling from rendering**
   - EventManager service for all mouse/keyboard
   - SvgStage only renders

2. **Unify coordinate systems**
   - Single source of truth for transforms
   - Coordinate conversion utilities
   - Avoid multiple CTM calls

3. **State machine for interactions**
   - Explicit states: idle, selecting, dragging, resizing
   - Clear transitions
   - Prevents edge cases

4. **Per-page selection state**
   - Allow multi-page operations
   - Copy/paste between pages
   - Preserve selection when switching

5. **Virtual canvas for large templates**
   - Only render visible slots
   - Cull off-screen elements
   - Paginate slot list

## Critical Code Locations

| Feature | File | Lines | Description |
|---------|------|-------|-------------|
| Slot click handling | SvgStage.tsx | 98-162 | Main interaction entry point |
| Page focus | CanvasStage.tsx | 197-200 | Container click handler |
| Page switching | editorStore.ts | 135-144 | Selection clearing logic |
| Drag threshold | SvgStage.tsx | 133-136 | 3px movement check |
| Event cleanup | SvgStage.tsx | 74-78, 121-126 | Prevent memory leaks |
| Selection rendering | CanvasStage.tsx | 217 | Conditional overlay |
| Coordinate conversion | NativeSelectionOverlay.tsx | 89-99 | Screen to SVG |
| Background click suppression | SvgStage.tsx | 85-88, 105 | Prevent deselection |

## Testing Checklist

- [ ] Click slot → stays selected
- [ ] Click background → deselects
- [ ] Click different slot → switches selection
- [ ] Shift+click → multi-select
- [ ] Drag slot → moves smoothly
- [ ] Click without drag → no movement
- [ ] Locked slot → can't drag, can select
- [ ] Switch pages → clears selection
- [ ] Click same page → keeps selection
- [ ] Keyboard shortcuts (Delete, Escape)
- [ ] Zoom in/out → handles stay same size
- [ ] Rotation → handles positioned correctly
- [ ] Multi-page → selection only on active
- [ ] Fast clicks → no double selection
- [ ] Drag then click → cleanup works
