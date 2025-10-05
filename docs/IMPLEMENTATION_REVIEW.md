# Implementation Review: Template AI

## Summary
Reviewing implementation against `context-ui.md` requirements and identifying bugs/conflicts.

---

## ✅ COMPLETED FEATURES

### Core Architecture
- [x] Vite + React + TypeScript
- [x] Fabric.js v6 integration
- [x] CSS Grid three-pane layout
- [x] Fixed left rail (240px) + flexible center + fixed right rail (280px)

### UI Components
- [x] **TopBar**: File, Resize, Undo/Redo, Zoom, Grid toggle, Preview, Export, Validate, Save
- [x] **LeftRail**: Tool navigation (Templates, Text, Images, Shapes, Vectors, Uploads)
- [x] **RightRail**: Layers panel + Properties panel (tabbed)
- [x] **CanvasStage**: Center stage with grid overlay and safe-area guides
- [x] **ResizeModal**: Social media + IAB presets (300×250, 728×90, 160×600, etc.)
- [x] **ExportModal**: PNG/JPEG export with quality and resolution options

### Data & Validation
- [x] Template JSON schema (Ajv draft 2020-12)
- [x] Schema validation with error reporting
- [x] TypeScript types from schema
- [x] SVG import pipeline (SVGO + svgson)
- [x] Slot extraction with data-slot attributes

### Layout & Constraints
- [x] Constraint DSL parser (`cta.bottom = canvas.bottom - 32`)
- [x] kiwi.js Cassowary solver integration
- [x] Layout engine with constraint solving
- [x] Ratio-specific constraint support

### Accessibility
- [x] WCAG 2.1 contrast ratio calculator
- [x] 4.5:1 AA / 7:1 AAA validation
- [x] Contrast badges in layers panel (green/amber/red)
- [x] Auto-fix suggestions (invert text, add chip, increase overlay)
- [x] ContrastFixModal with one-click fixes

### History & Versioning
- [x] Template versioning system
- [x] Undo/redo with 50-version history
- [x] History state management
- [x] Version descriptions and timestamps
- [x] Undo/Redo buttons with disabled states

### Export
- [x] PNG/JPEG export with Fabric.js
- [x] Resolution multiplier (1x, 2x, 3x, 4x)
- [x] Quality control for JPEG
- [x] Download trigger

---

## ❌ MISSING FEATURES (Critical)

### 1. **Fabric Canvas Integration Issues**
**Problem**: Canvas renders static objects but lacks interactivity
- [ ] No selection handles/transform controls
- [ ] Text is Textbox but not using IText for inline editing
- [ ] Objects are not linked to template slots (no bidirectional sync)
- [ ] Canvas doesn't update when template changes via contrast fixes
- [ ] No object selection → properties panel sync

**Fix Required**: Refactor FabricCanvas to:
1. Create Fabric objects with unique IDs matching slot names
2. Use IText instead of Textbox for inline editing
3. Listen to object:modified events → update template state
4. Sync template changes → update Fabric objects
5. Wire selection events → update selectedLayer in App.tsx

### 2. **Context Toolbar Above Selection**
**Problem**: Missing entirely
- [ ] No toolbar for Replace, Remove BG, Alignment, Lock, Duplicate, Delete
- [ ] Should appear above selected object(s)

**Fix Required**: Create `ContextToolbar.tsx` component
- Position absolute above selection bounding box
- Show/hide based on canvas selection
- Implement: Align left/center/right, Lock/Unlock, Duplicate, Delete

### 3. **Drag & Drop Assets**
**Problem**: No drag-drop functionality
- [ ] Cannot drag from left panel → canvas
- [ ] No drop zone for file uploads

**Fix Required**:
- Add drag handlers to LeftRail asset buttons
- Add drop zone to CanvasStage
- Handle file drop for SVG uploads

### 4. **Snap to Guides & Rulers**
**Problem**: Not implemented
- [ ] No snapping behavior
- [ ] No ruler UI elements
- [ ] Safe-area guides are static visual only

**Fix Required**:
- Add Fabric.js snapToGrid or custom snap logic
- Implement ruler components (top/left)
- Make safe-area guides interactive

### 5. **Layer Reordering**
**Problem**: Layers panel shows order but can't drag to reorder
- [ ] No drag handles on layer items
- [ ] Z-index changes don't propagate to template

**Fix Required**:
- Add drag-and-drop to LayerItem components
- Update template.slots z-index on reorder
- Re-render Fabric canvas with new order

### 6. **Import Report Dialog**
**Problem**: Warnings only logged to console
- [ ] No UI dialog showing import warnings
- [ ] Users don't see unsupported SVG features

**Fix Required**: Create `ImportReportModal.tsx`
- Show after SVG import
- List warnings (unsupported filters, masks, clipPaths)
- Link to documentation

### 7. **Keyboard Shortcuts**
**Problem**: Not implemented
- [ ] No Cmd/Ctrl+S save
- [ ] No Cmd/Ctrl+Z undo (only button)
- [ ] No arrow key nudging
- [ ] No Shift+drag proportional scale

**Fix Required**:
- Add useEffect with keydown listener in App.tsx
- Handle: Cmd+Z undo, Cmd+Shift+Z redo, Cmd+S save
- Add Fabric.js keyboard controls for arrow keys, Shift+drag

### 8. **Multi-Select & Grouping**
**Problem**: Not implemented
- [ ] No marquee selection
- [ ] No group/ungroup commands

**Fix Required**:
- Enable Fabric.js selection: true (already set)
- Add Group/Ungroup buttons to context toolbar
- Handle multi-selection → properties panel

### 9. **APCA Contrast Mode**
**Problem**: Only WCAG implemented, no APCA
- [ ] No APCA Lc calculation
- [ ] No mode toggle

**Fix Required** (Optional):
- Add APCA calculator to contrastUtils.ts
- Add mode toggle in accessibility settings
- Show Lc values instead of ratio when in APCA mode

### 10. **Template Tokens Panel**
**Problem**: No visible tokens UI
- [ ] Palette not editable in UI
- [ ] Typography scales hidden
- [ ] Constraints are read-only but not displayed

**Fix Required**: Add "Template" tab to RightRail Properties panel
- Show/edit palette colors
- Show/edit typography settings
- Display constraints (read-only for MVP)

---

## 🐛 IDENTIFIED BUGS

### Bug 1: Canvas Not Re-rendering on Template Updates
**Location**: `FabricCanvas.tsx`
**Issue**: When contrast auto-fix changes template.slots, canvas doesn't update
**Cause**: useEffect dependency on `template` but template object reference doesn't change (shallow update)
**Fix**:
```tsx
useEffect(() => {
  // ...
}, [template, width, height]) // Change to deep dependency or use JSON.stringify
```

### Bug 2: Slot Fill Color Type Mismatch
**Location**: `contrastChecker.ts` + schema
**Issue**: Using `(slot as any).fill` because Slot interface doesn't include fill
**Cause**: Slot type has `[key: string]: unknown` but fill is not typed
**Fix**: Add optional properties to Slot interface:
```ts
export interface Slot {
  // ... existing
  fill?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  // ...
}
```

### Bug 3: Export Uses Wrong Fabric Objects
**Location**: `pngExport.ts:62-72`
**Issue**: Creates new Fabric objects instead of using existing canvas
**Cause**: Offscreen canvas created from scratch, doesn't match live editor
**Fix**: Export from actual Fabric canvas:
```ts
const dataUrl = canvasRef.current.toDataURL({
  format, quality, multiplier
})
```

### Bug 4: History Not Initialized on First Load
**Location**: `App.tsx`
**Issue**: History is null until first SVG upload
**Cause**: initializeHistory only called in handleUpload
**Fix**: Initialize empty history on mount or handle null gracefully

### Bug 5: Layer Visibility/Lock Not Persisted
**Location**: `RightRail.tsx:174-177`
**Issue**: Visibility and lock state stored in local component state, not in template
**Cause**: useState in LayerItem, not connected to template.slots
**Fix**: Add `visible` and `locked` to Slot interface and persist to template

### Bug 6: Zoom Doesn't Affect Canvas Size
**Location**: `CanvasStage.tsx:43`
**Issue**: CSS transform scales container, but canvas internal size unchanged
**Cause**: Fabric canvas dimensions not adjusted for zoom
**Fix**: Either:
1. Keep CSS transform (current - correct for zoom)
2. OR adjust Fabric canvas.setZoom() for real zoom

### Bug 7: Grid Overlay Doesn't Move with Zoom
**Location**: `CanvasStage.tsx:25-36`
**Issue**: Grid is fixed to viewport, not canvas
**Cause**: Grid is sibling to canvas, not child
**Fix**: Make grid background of canvas wrapper that scales with transform

### Bug 8: Safe-Area Guides Fixed at 32px
**Location**: `CanvasStage.tsx:55`
**Issue**: Inset is hardcoded, doesn't respect template.accessibility.safeArea
**Cause**: Not reading from template
**Fix**: Calculate from template.accessibility.safeArea percentage

---

## 🔧 PERFORMANCE ISSUES

### Issue 1: Canvas Re-renders Entire Scene on Every Template Change
**Location**: `FabricCanvas.tsx:23-158`
**Problem**: Clears and rebuilds all objects on any template update
**Impact**: Laggy editing experience
**Fix**: Implement object diffing/patching instead of clear + rebuild

### Issue 2: No Memoization in RightRail
**Location**: `RightRail.tsx:137-147`
**Problem**: Recalculates contrast for all layers on every render
**Impact**: Wasteful computation
**Fix**: Already uses useMemo ✅ (no issue)

---

## 📋 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Fix Critical Bugs (1-2 hours)
1. Fix Slot interface to include fill, fontSize, etc.
2. Fix canvas re-render on template updates
3. Fix export to use live canvas
4. Add history initialization

### Phase 2: Core Interactivity (2-3 hours)
1. Wire Fabric selection → selectedLayer state
2. Implement object:modified → template updates
3. Add IText for inline editing
4. Create ContextToolbar component

### Phase 3: Keyboard & UX (1-2 hours)
1. Add keyboard shortcuts (Cmd+Z, Cmd+S, arrows)
2. Implement drag-drop assets
3. Add layer reordering

### Phase 4: Advanced Features (2-3 hours)
1. Import Report Dialog
2. Multi-select & grouping
3. Snap to guides
4. Template tokens panel

### Phase 5: Polish (1 hour)
1. Fix grid overlay zoom
2. Dynamic safe-area guides
3. APCA mode (optional)

---

## 🎯 NEXT STEPS

1. **Immediate**: Fix Slot type interface to remove `as any` casts
2. **High Priority**: Wire Fabric selection to React state for proper interactivity
3. **Medium Priority**: Add missing UI components (ContextToolbar, ImportReportModal)
4. **Low Priority**: APCA, advanced grouping, templates panel

Would you like me to start with Phase 1 (critical bugs) or focus on a specific area?
