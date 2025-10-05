# Canvas Architecture Improvement Plan

## Executive Summary

The current canvas architecture is fragile: event handling is scattered across components, coordinate transformations are duplicated, state flows through multiple layers, and one change can break seemingly unrelated features. This document proposes a **complete architectural overhaul** to create a robust, extensible foundation that can support:

- Complex property editing (fill, stroke, opacity, fonts, rotation, flips)
- Multi-element selection and manipulation
- Reliable DOM overlays (chips, panels) that track SVG elements
- Future features without breaking existing functionality
- Clean separation of concerns

**Core Philosophy:** Separate data flow, event handling, coordinate math, and rendering into distinct, testable layers with clear contracts.

---

## Current Problems - Deep Analysis

### 1. Scattered Event Handling (Critical Severity)

**The Problem:**
Event handlers are duplicated across 4+ layers, each with slightly different logic:

```
SlotRenderer.tsx (onMouseDown, onClick)
  ↓
SvgStage.tsx (handleSlotPointerDown, handleBackgroundClick)
  ↓
CanvasStage.tsx (onClick for page switching)
  ↓
NativeSelectionOverlay.tsx (drag handlers)
  ↓
LayerActionsChipOverlay.tsx (chip positioning)
```

**Why It's Fragile:**
- Event propagation depends on `stopPropagation()` calls in exact order
- Adding a new clickable element requires modifying 3+ files
- Debugging requires tracing through nested callbacks
- `suppressBackgroundClickRef` is a band-aid for broken event flow
- No single source of truth for "what interaction is happening"

**Real Example:**
The selection flashing bug occurred because:
1. Slot click → `onSelectionChange([slot])`
2. Event bubbles to canvas container
3. Container `onClick` → `setCurrentPage(page.id)`
4. `setCurrentPage` clears selection (originally)
5. Selection appears then disappears

**Fix attempt:** Guard in `setCurrentPage`, but doesn't address root cause (events shouldn't bubble in the first place).

### 2. Coordinate System Chaos (High Severity)

**The Problem:**
Three coordinate systems with conversions scattered everywhere:

1. **Screen pixels** (mouse events)
2. **ViewBox units** (slot positions)
3. **Zoom-scaled pixels** (CSS transform)

**Current Conversion Points:**
- `NativeSelectionOverlay.screenToSVG()` - called on every mouse move
- `LayerActionsChipOverlay.tsx` - manual DOM rect calculations
- Handle sizes: `12 / scale` - duplicated in multiple places
- `getScreenCTM()` - called repeatedly, expensive

**Why It's Fragile:**
- Adding rotation/flip changes transform matrices
- Each conversion can introduce rounding errors
- No caching - recalculate on every frame
- Chip overlay broke because it used different math than selection overlay
- Future features (skew, perspective) will compound complexity

**Real Example - Chip Overlay Bug:**
```tsx
// LayerActionsChipOverlay tried to position using:
const rect = svgElement.getBoundingClientRect()
// But selection overlay used:
const ctm = svgElement.getScreenCTM()
// Different coordinate origins caused misalignment
```

### 3. State Management Spaghetti (High Severity)

**The Problem:**
Selection state flows through 5 different mechanisms:

```typescript
// 1. editorStore (Zustand)
selectedSlots: string[]

// 2. App.tsx local state
const [selectedSlots, setSelectedSlots] = useState<string[]>([])

// 3. Props drilling through CanvasStage → SvgStage
onSelectionChange: (slotNames: string[]) => void

// 4. Refs for suppression
suppressBackgroundClickRef.current = true

// 5. Drag state in NativeSelectionOverlay
const [dragState, setDragState] = useState<...>()
```

**Why It's Fragile:**
- Selection can be out of sync between store and local state
- No single source of truth
- Changes propagate through callbacks, causing re-renders
- Adding undo/redo requires tracking all state changes
- Multi-element selection will need coordinated state updates

**Missing Invariants:**
- ❌ Selection should always match currentPage
- ❌ Locked slots should never be in selection
- ❌ Deleted slots should be removed from selection
- ❌ Selection should persist during property changes

### 4. Property Editing Non-Existent (Critical Gap)

**Current State:**
- Can move and resize
- **Cannot** change fill color
- **Cannot** change stroke
- **Cannot** change opacity
- **Cannot** change fonts
- **Cannot** rotate (infrastructure exists, no UI)
- **Cannot** flip horizontally/vertically
- **Cannot** change text content
- **Cannot** change image source

**Why This Matters:**
Without property editing, the entire architecture is untested for the real use case. Current design assumes:
- Slots are static except position/size
- No property panel needed
- No undo/redo for properties
- No property constraints (e.g., min font size)

**Future Explosion:**
When we add property editing, we'll need:
- Property panel component (where does it go?)
- Property change events (how do they flow?)
- Property validation (who validates?)
- Property undo/redo (separate stack?)
- Property preview (live or on commit?)
- Property conflicts (multi-select with different values?)

### 5. Multi-Element Selection Completely Broken (Critical Gap)

**Current Implementation:**
```tsx
// NativeSelectionOverlay.tsx:53-54
const selectedSlot = selectedSlots[0] // ❌ Ignores [1], [2], etc.
const frame = selectedSlot ? frames[selectedSlot] : null
```

**Designed for Single Selection Only:**
- Bounding box calculation: Single slot only
- Drag operation: Moves one slot
- Resize handles: Single slot only
- Property display: Single slot only

**What Breaks with Multi-Select:**
- ❌ No union bounding box
- ❌ Can't drag multiple slots together
- ❌ Can't resize group (preserve aspect ratios?)
- ❌ No group rotation
- ❌ Property conflicts (different fills?) not handled
- ❌ Shift+click adds to selection, but no visual feedback
- ❌ No "treat as group" option

**Real User Flow:**
1. User shift+clicks 3 slots
2. `selectedSlots = ['slot1', 'slot2', 'slot3']` ✅
3. Overlay only shows handles for `slot1` ❌
4. Dragging only moves `slot1` ❌
5. User confused, thinks app is broken

### 6. The "Chip Overlay" Problem (The Canary)

**What Happened:**
LayerActionsChipOverlay (the floating action chip) was impossible to position correctly:

- Used DOM positioning over SVG elements
- Needed to track zoom, pan, scroll
- Different coordinate math than selection overlay
- Broke when canvas resized
- Broke when page scrolled
- Broke when zoomed
- Broke with rotation

**Why It's a Canary:**
This is what happens when we bolt features onto a weak foundation. Every future overlay will have the same problem:
- Property panel
- Context menus
- Tooltips
- Snapping guides (already has issues)
- Measurement displays
- Alignment tools

**Root Cause:**
Mixing DOM and SVG without a unified coordinate system.

### 7. Undo/Redo Partially Implemented (High Risk)

**Current State:**
```tsx
// editorStore.ts has history
history: {
  past: Template[]
  future: Template[]
}
```

**But:**
- ✅ Tracks template changes
- ❌ No granular operation tracking
- ❌ No selection state in history
- ❌ No scroll position restore
- ❌ No zoom level restore
- ❌ Can't undo property changes (no property editing yet)
- ❌ Huge memory usage (full template copies)

**Future Problem:**
When we add:
- Property editing → 100s of history entries
- Multi-element operations → Combinatorial state
- Full template snapshots → Memory explosion
- No way to "undo" just a color change

### 8. Performance - Not Measured, Likely Bad

**Unoptimized Patterns:**
```tsx
// SvgStage.tsx - Re-renders all slots on selection change
{sortedSlots.map(slot => <SlotRenderer ... />)}

// NativeSelectionOverlay.tsx - CTM on every mouse move
const screenToSVG = (x, y) => {
  const ctm = svgElement.getScreenCTM() // Expensive!
}

// No memoization, no virtualization, no batching
```

**Not Tested:**
- 100+ slots on canvas
- Rapid property changes (color picker drag)
- Multi-element drag with 20 selected
- Zoom/pan performance
- Undo/redo with large history

### 9. No Testing Infrastructure

**Current State:**
- Zero unit tests
- Zero integration tests
- Zero E2E tests
- Manual QA only

**Why It's Fragile:**
- Can't verify bug fixes stay fixed
- Can't prevent regressions
- Can't refactor safely
- Can't verify edge cases

**Needed:**
- Unit tests for coordinate math
- Integration tests for interactions
- Visual regression tests for rendering
- Performance benchmarks

---

## Proposed Architecture - The Foundation

### Core Principle: Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  React Components (CanvasStage, SvgStage, Overlays)    │
│  - Only render data                                      │
│  - No business logic                                     │
│  - Subscribe to state                                    │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│                  INTERACTION LAYER                       │
│  InteractionManager (singleton service)                 │
│  - Event routing                                         │
│  - Interaction state machine                            │
│  - Gesture recognition                                   │
│  - Tool management                                       │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│                   COORDINATION LAYER                     │
│  EditorController (coordinates all operations)          │
│  - Command pattern for operations                       │
│  - Validation and constraints                           │
│  - Undo/redo management                                  │
│  - Batch updates                                         │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│                      STATE LAYER                         │
│  EditorStore (single source of truth)                   │
│  - Immutable state                                       │
│  - Derived selectors                                     │
│  - State subscriptions                                   │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│                     UTILITY LAYER                        │
│  CoordinateSystem, Geometry, Validators                │
│  - Pure functions                                        │
│  - Fully tested                                          │
│  - Zero side effects                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Component Design

### 1. Coordinate System Service (Foundation)

**Purpose:** Single source of truth for all coordinate conversions.

```typescript
// src/editor/core/CoordinateSystem.ts

export interface Viewport {
  zoom: number          // 0.1 to 10.0
  pan: { x: number; y: number }
  rotation: number      // Canvas rotation (future)
}

export interface Transform {
  translate: { x: number; y: number }
  scale: { x: number; y: number }
  rotate: number
  skew?: { x: number; y: number }
}

export class CoordinateSystem {
  private svgElement: SVGSVGElement
  private viewBox: [number, number, number, number]
  private viewport: Viewport

  // Cache CTM to avoid recalculation
  private cachedCTM: DOMMatrix | null = null
  private ctmDirty = true

  constructor(svgElement: SVGSVGElement, viewBox: [number, number, number, number]) {
    this.svgElement = svgElement
    this.viewBox = viewBox
    this.viewport = { zoom: 1, pan: { x: 0, y: 0 }, rotation: 0 }
  }

  // Primary conversion - screen to SVG viewBox
  screenToSVG(screenX: number, screenY: number): { x: number; y: number } {
    const ctm = this.getCTM()
    const point = this.svgElement.createSVGPoint()
    point.x = screenX
    point.y = screenY
    const svgPoint = point.matrixTransform(ctm.inverse())
    return { x: svgPoint.x, y: svgPoint.y }
  }

  // Reverse conversion - SVG viewBox to screen
  svgToScreen(svgX: number, svgY: number): { x: number; y: number } {
    const ctm = this.getCTM()
    const point = this.svgElement.createSVGPoint()
    point.x = svgX
    point.y = svgY
    const screenPoint = point.matrixTransform(ctm)
    return { x: screenPoint.x, y: screenPoint.y }
  }

  // Convert screen distance to SVG distance (for handle sizes)
  screenDistanceToSVG(screenDistance: number): number {
    const ctm = this.getCTM()
    return screenDistance / ctm.a // a is x-scale
  }

  // Convert SVG bounding box to screen bounding box
  svgRectToScreen(rect: { x: number; y: number; width: number; height: number }): DOMRect {
    const topLeft = this.svgToScreen(rect.x, rect.y)
    const bottomRight = this.svgToScreen(rect.x + rect.width, rect.y + rect.height)
    return new DOMRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    )
  }

  // Apply element transform (position + rotation + flip)
  createTransformMatrix(frame: {
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    flipH?: boolean
    flipV?: boolean
  }): DOMMatrix {
    const matrix = new DOMMatrix()

    // Translate to position
    matrix.translateSelf(frame.x, frame.y)

    // Rotate around center
    if (frame.rotation) {
      const cx = frame.width / 2
      const cy = frame.height / 2
      matrix.translateSelf(cx, cy)
      matrix.rotateSelf(frame.rotation)
      matrix.translateSelf(-cx, -cy)
    }

    // Flip
    if (frame.flipH || frame.flipV) {
      const sx = frame.flipH ? -1 : 1
      const sy = frame.flipV ? -1 : 1
      const cx = frame.width / 2
      const cy = frame.height / 2
      matrix.translateSelf(cx, cy)
      matrix.scaleSelf(sx, sy)
      matrix.translateSelf(-cx, -cy)
    }

    return matrix
  }

  // Update viewport (zoom/pan) and invalidate cache
  setViewport(viewport: Partial<Viewport>) {
    this.viewport = { ...this.viewport, ...viewport }
    this.invalidateCTM()
  }

  // Internal: Get cached or fresh CTM
  private getCTM(): DOMMatrix {
    if (!this.ctmDirty && this.cachedCTM) {
      return this.cachedCTM
    }

    this.cachedCTM = this.svgElement.getScreenCTM()
    this.ctmDirty = false
    return this.cachedCTM!
  }

  private invalidateCTM() {
    this.ctmDirty = true
  }

  // Cleanup
  dispose() {
    this.cachedCTM = null
  }
}
```

**Benefits:**
- ✅ Single source of truth for coordinates
- ✅ Cached CTM for performance
- ✅ Supports rotation and flips
- ✅ Easy to test (pure math)
- ✅ Extensible for future transforms

**Usage:**
```typescript
// All components use this service
const coords = useCoordinateSystem()
const svgPos = coords.screenToSVG(event.clientX, event.clientY)
```

### 2. Interaction State Machine

**Purpose:** Model all possible interaction states explicitly.

```typescript
// src/editor/core/InteractionStateMachine.ts

export type InteractionState =
  | { type: 'idle' }
  | { type: 'hovering'; target: string; handle?: string }
  | { type: 'selecting'; startPos: { x: number; y: number } }
  | { type: 'dragging'; slots: string[]; startFrames: Record<string, Frame> }
  | { type: 'resizing'; slot: string; handle: string; startFrame: Frame }
  | { type: 'rotating'; slots: string[]; pivot: { x: number; y: number } }
  | { type: 'editingText'; slot: string }
  | { type: 'panning' }

export type InteractionEvent =
  | { type: 'pointerDown'; target: string; position: { x: number; y: number }; modifiers: KeyModifiers }
  | { type: 'pointerMove'; position: { x: number; y: number } }
  | { type: 'pointerUp'; position: { x: number; y: number } }
  | { type: 'hover'; target: string | null; handle?: string }
  | { type: 'keyDown'; key: string; modifiers: KeyModifiers }
  | { type: 'escape' }

export interface KeyModifiers {
  shift: boolean
  ctrl: boolean
  alt: boolean
  meta: boolean
}

export class InteractionStateMachine {
  private state: InteractionState = { type: 'idle' }
  private listeners: Array<(state: InteractionState) => void> = []

  // Process event and transition state
  transition(event: InteractionEvent): InteractionState {
    const nextState = this.computeNextState(this.state, event)

    if (nextState !== this.state) {
      console.log('[InteractionSM] Transition:', this.state.type, '→', nextState.type)
      this.state = nextState
      this.notifyListeners()
    }

    return this.state
  }

  private computeNextState(current: InteractionState, event: InteractionEvent): InteractionState {
    // State transition logic
    switch (current.type) {
      case 'idle':
        if (event.type === 'pointerDown') {
          // Start drag after threshold check
          return { type: 'selecting', startPos: event.position }
        }
        if (event.type === 'hover') {
          return event.target ? { type: 'hovering', target: event.target, handle: event.handle } : current
        }
        break

      case 'selecting':
        if (event.type === 'pointerMove') {
          const distance = this.calculateDistance(current.startPos, event.position)
          if (distance > 3) {
            // Threshold exceeded - start drag
            return { type: 'dragging', slots: [], startFrames: {} } // Fill in from context
          }
        }
        if (event.type === 'pointerUp') {
          return { type: 'idle' }
        }
        break

      case 'dragging':
        if (event.type === 'pointerUp') {
          return { type: 'idle' }
        }
        if (event.type === 'escape') {
          return { type: 'idle' }
        }
        break

      // ... more states
    }

    return current
  }

  getState(): InteractionState {
    return this.state
  }

  subscribe(listener: (state: InteractionState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.state))
  }

  private calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
  }
}
```

**Benefits:**
- ✅ Explicit states prevent invalid combinations
- ✅ Easy to debug (log all transitions)
- ✅ Easy to test (pure state machine)
- ✅ Prevents race conditions
- ✅ Self-documenting (all interactions visible)

### 3. Command Pattern for Operations

**Purpose:** Every modification is a command that can be undone/redone.

```typescript
// src/editor/core/Command.ts

export interface Command {
  execute(): void
  undo(): void
  merge(other: Command): Command | null // For batching similar commands
}

export class MoveSlotCommand implements Command {
  constructor(
    private store: EditorStore,
    private pageId: string,
    private slotName: string,
    private fromPosition: { x: number; y: number },
    private toPosition: { x: number; y: number }
  ) {}

  execute() {
    this.store.updateSlotFrame(this.pageId, this.slotName, this.toPosition)
  }

  undo() {
    this.store.updateSlotFrame(this.pageId, this.slotName, this.fromPosition)
  }

  merge(other: Command): Command | null {
    // Merge consecutive moves of same slot
    if (other instanceof MoveSlotCommand &&
        other.slotName === this.slotName &&
        other.pageId === this.pageId) {
      return new MoveSlotCommand(
        this.store,
        this.pageId,
        this.slotName,
        this.fromPosition,
        other.toPosition
      )
    }
    return null
  }
}

export class SetPropertyCommand implements Command {
  constructor(
    private store: EditorStore,
    private pageId: string,
    private slotName: string,
    private property: string,
    private fromValue: any,
    private toValue: any
  ) {}

  execute() {
    this.store.updateSlotProperty(this.pageId, this.slotName, this.property, this.toValue)
  }

  undo() {
    this.store.updateSlotProperty(this.pageId, this.slotName, this.property, this.fromValue)
  }

  merge(other: Command): Command | null {
    // Merge rapid property changes (e.g., color picker drag)
    if (other instanceof SetPropertyCommand &&
        other.slotName === this.slotName &&
        other.property === this.property) {
      return new SetPropertyCommand(
        this.store,
        this.pageId,
        this.slotName,
        this.property,
        this.fromValue,
        other.toValue
      )
    }
    return null
  }
}

export class CompositeCommand implements Command {
  constructor(private commands: Command[]) {}

  execute() {
    this.commands.forEach(cmd => cmd.execute())
  }

  undo() {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }

  merge(other: Command): Command | null {
    return null // Don't merge composite commands
  }
}

// Command history manager
export class CommandHistory {
  private past: Command[] = []
  private future: Command[] = []
  private maxHistory = 50

  execute(command: Command) {
    // Try to merge with last command
    if (this.past.length > 0) {
      const last = this.past[this.past.length - 1]
      const merged = last.merge(command)
      if (merged) {
        this.past[this.past.length - 1] = merged
        merged.execute()
        return
      }
    }

    // Execute new command
    command.execute()
    this.past.push(command)
    this.future = [] // Clear redo stack

    // Limit history size
    if (this.past.length > this.maxHistory) {
      this.past.shift()
    }
  }

  undo() {
    const command = this.past.pop()
    if (command) {
      command.undo()
      this.future.push(command)
    }
  }

  redo() {
    const command = this.future.pop()
    if (command) {
      command.execute()
      this.past.push(command)
    }
  }

  canUndo(): boolean {
    return this.past.length > 0
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  clear() {
    this.past = []
    this.future = []
  }
}
```

**Benefits:**
- ✅ Every operation is undoable
- ✅ Command merging prevents history explosion
- ✅ Composite commands for multi-element ops
- ✅ Memory efficient (only deltas, not full snapshots)
- ✅ Easy to log/debug operations

### 4. Unified Property System

**Purpose:** All slot properties flow through a single validation pipeline.

```typescript
// src/editor/core/PropertySystem.ts

export interface PropertyDescriptor {
  name: string
  type: 'number' | 'string' | 'color' | 'boolean' | 'enum' | 'font'
  defaultValue: any
  validation?: (value: any) => boolean
  constraints?: {
    min?: number
    max?: number
    options?: string[]
    step?: number
  }
  applicableSlotTypes: SlotType[]
}

export const PROPERTY_REGISTRY: Record<string, PropertyDescriptor> = {
  fill: {
    name: 'fill',
    type: 'color',
    defaultValue: '#000000',
    validation: (v) => /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(v),
    applicableSlotTypes: ['shape', 'text', 'button']
  },

  opacity: {
    name: 'opacity',
    type: 'number',
    defaultValue: 1,
    constraints: { min: 0, max: 1, step: 0.01 },
    applicableSlotTypes: ['image', 'shape', 'text', 'button']
  },

  fontSize: {
    name: 'fontSize',
    type: 'number',
    defaultValue: 16,
    constraints: { min: 8, max: 144, step: 1 },
    applicableSlotTypes: ['text', 'button']
  },

  fontFamily: {
    name: 'fontFamily',
    type: 'font',
    defaultValue: 'Inter',
    applicableSlotTypes: ['text', 'button']
  },

  rotation: {
    name: 'rotation',
    type: 'number',
    defaultValue: 0,
    constraints: { min: -180, max: 180, step: 1 },
    applicableSlotTypes: ['image', 'shape', 'text', 'button']
  },

  flipH: {
    name: 'flipH',
    type: 'boolean',
    defaultValue: false,
    applicableSlotTypes: ['image', 'shape']
  },

  flipV: {
    name: 'flipV',
    type: 'boolean',
    defaultValue: false,
    applicableSlotTypes: ['image', 'shape']
  }

  // ... more properties
}

export class PropertyValidator {
  static validate(property: string, value: any, slotType: SlotType): { valid: boolean; error?: string } {
    const descriptor = PROPERTY_REGISTRY[property]

    if (!descriptor) {
      return { valid: false, error: `Unknown property: ${property}` }
    }

    if (!descriptor.applicableSlotTypes.includes(slotType)) {
      return { valid: false, error: `Property ${property} not applicable to ${slotType}` }
    }

    if (descriptor.validation && !descriptor.validation(value)) {
      return { valid: false, error: `Invalid value for ${property}` }
    }

    if (descriptor.constraints) {
      const { min, max, options } = descriptor.constraints

      if (min !== undefined && value < min) {
        return { valid: false, error: `Value must be >= ${min}` }
      }

      if (max !== undefined && value > max) {
        return { valid: false, error: `Value must be <= ${max}` }
      }

      if (options && !options.includes(value)) {
        return { valid: false, error: `Value must be one of: ${options.join(', ')}` }
      }
    }

    return { valid: true }
  }

  static coerce(property: string, value: any): any {
    const descriptor = PROPERTY_REGISTRY[property]
    if (!descriptor) return value

    switch (descriptor.type) {
      case 'number':
        const num = Number(value)
        if (isNaN(num)) return descriptor.defaultValue

        const { min, max, step } = descriptor.constraints || {}
        let result = num

        if (step) {
          result = Math.round(result / step) * step
        }
        if (min !== undefined) {
          result = Math.max(result, min)
        }
        if (max !== undefined) {
          result = Math.min(result, max)
        }

        return result

      case 'color':
        // Normalize color format
        if (value.startsWith('#')) return value.toUpperCase()
        return descriptor.defaultValue

      case 'boolean':
        return Boolean(value)

      default:
        return value
    }
  }
}
```

**Benefits:**
- ✅ Centralized property definitions
- ✅ Automatic validation
- ✅ Type-safe property access
- ✅ Easy to add new properties
- ✅ Self-documenting (registry shows all properties)

### 5. Multi-Element Selection System

**Purpose:** Proper support for multiple selected elements.

```typescript
// src/editor/core/SelectionManager.ts

export interface SelectionBounds {
  x: number
  y: number
  width: number
  height: number
  rotation: number // Combined rotation (0 if mixed)
  mixed: {
    rotation: boolean
    // ... other mixed properties
  }
}

export class SelectionManager {
  constructor(private store: EditorStore) {}

  // Get unified bounding box for all selected slots
  getBounds(pageId: string, ratioId: string, selectedSlots: string[]): SelectionBounds | null {
    if (selectedSlots.length === 0) return null

    const frames = selectedSlots
      .map(name => this.store.getSlotFrame(pageId, ratioId, name))
      .filter(Boolean) as Frame[]

    if (frames.length === 0) return null

    // Single selection - return frame as-is
    if (frames.length === 1) {
      const frame = frames[0]
      return {
        ...frame,
        rotation: frame.rotation || 0,
        mixed: { rotation: false }
      }
    }

    // Multi-selection - calculate union bounding box
    return this.calculateUnionBounds(frames)
  }

  private calculateUnionBounds(frames: Frame[]): SelectionBounds {
    // Get rotated corners for each frame
    const allCorners: { x: number; y: number }[] = []

    for (const frame of frames) {
      const corners = this.getRotatedCorners(frame)
      allCorners.push(...corners)
    }

    // Find axis-aligned bounding box
    const xs = allCorners.map(c => c.x)
    const ys = allCorners.map(c => c.y)

    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    // Check if all rotations are the same
    const rotations = frames.map(f => f.rotation || 0)
    const firstRotation = rotations[0]
    const mixedRotation = !rotations.every(r => r === firstRotation)

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: mixedRotation ? 0 : firstRotation,
      mixed: { rotation: mixedRotation }
    }
  }

  private getRotatedCorners(frame: Frame): { x: number; y: number }[] {
    const { x, y, width, height, rotation = 0 } = frame

    if (rotation === 0) {
      return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
      ]
    }

    // Rotate corners around center
    const cx = x + width / 2
    const cy = y + height / 2
    const rad = (rotation * Math.PI) / 180

    const corners = [
      { x: -width / 2, y: -height / 2 },
      { x: width / 2, y: -height / 2 },
      { x: width / 2, y: height / 2 },
      { x: -width / 2, y: height / 2 }
    ]

    return corners.map(({ x: dx, y: dy }) => ({
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    }))
  }

  // Move all selected slots by delta
  moveSelection(
    pageId: string,
    ratioId: string,
    selectedSlots: string[],
    delta: { x: number; y: number }
  ): CompositeCommand {
    const commands = selectedSlots.map(slotName => {
      const frame = this.store.getSlotFrame(pageId, ratioId, slotName)
      if (!frame) return null

      return new MoveSlotCommand(
        this.store,
        pageId,
        slotName,
        { x: frame.x, y: frame.y },
        { x: frame.x + delta.x, y: frame.y + delta.y }
      )
    }).filter(Boolean) as Command[]

    return new CompositeCommand(commands)
  }

  // Scale all selected slots proportionally
  scaleSelection(
    pageId: string,
    ratioId: string,
    selectedSlots: string[],
    scale: { x: number; y: number },
    pivot: { x: number; y: number }
  ): CompositeCommand {
    // Calculate new positions and sizes relative to pivot
    const commands = selectedSlots.map(slotName => {
      const frame = this.store.getSlotFrame(pageId, ratioId, slotName)
      if (!frame) return null

      const newX = pivot.x + (frame.x - pivot.x) * scale.x
      const newY = pivot.y + (frame.y - pivot.y) * scale.y
      const newWidth = frame.width * scale.x
      const newHeight = frame.height * scale.y

      return new SetFrameCommand(
        this.store,
        pageId,
        slotName,
        frame,
        { x: newX, y: newY, width: newWidth, height: newHeight }
      )
    }).filter(Boolean) as Command[]

    return new CompositeCommand(commands)
  }
}
```

**Benefits:**
- ✅ Proper multi-element selection
- ✅ Union bounding box calculation
- ✅ Group move/resize operations
- ✅ Handles mixed properties
- ✅ Command-based for undo/redo

### 6. DOM Overlay Positioning System

**Purpose:** Solve the chip overlay problem permanently.

```typescript
// src/editor/core/OverlayPositioner.ts

export interface OverlayPosition {
  top: number
  left: number
  width?: number
  height?: number
}

export class OverlayPositioner {
  constructor(
    private coordinateSystem: CoordinateSystem,
    private containerElement: HTMLElement
  ) {}

  // Position DOM overlay over SVG element
  positionOverlay(
    svgBounds: { x: number; y: number; width: number; height: number },
    anchor: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center',
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ): OverlayPosition {
    // Convert SVG bounds to screen coordinates
    const screenRect = this.coordinateSystem.svgRectToScreen(svgBounds)

    // Get container offset (for absolute positioning)
    const containerRect = this.containerElement.getBoundingClientRect()

    // Calculate anchor point
    let anchorX: number
    let anchorY: number

    switch (anchor) {
      case 'top-left':
        anchorX = screenRect.left
        anchorY = screenRect.top
        break
      case 'top-center':
        anchorX = screenRect.left + screenRect.width / 2
        anchorY = screenRect.top
        break
      case 'top-right':
        anchorX = screenRect.right
        anchorY = screenRect.top
        break
      case 'bottom-left':
        anchorX = screenRect.left
        anchorY = screenRect.bottom
        break
      case 'bottom-center':
        anchorX = screenRect.left + screenRect.width / 2
        anchorY = screenRect.bottom
        break
      case 'bottom-right':
        anchorX = screenRect.right
        anchorY = screenRect.bottom
        break
      case 'center':
        anchorX = screenRect.left + screenRect.width / 2
        anchorY = screenRect.top + screenRect.height / 2
        break
    }

    // Apply offset and convert to container-relative coordinates
    return {
      left: anchorX - containerRect.left + offset.x,
      top: anchorY - containerRect.top + offset.y
    }
  }

  // Keep overlay visible within viewport
  clampToViewport(position: OverlayPosition, overlaySize: { width: number; height: number }): OverlayPosition {
    const containerRect = this.containerElement.getBoundingClientRect()

    let { left, top } = position

    // Clamp to viewport
    if (left < 0) left = 0
    if (top < 0) top = 0
    if (left + overlaySize.width > containerRect.width) {
      left = containerRect.width - overlaySize.width
    }
    if (top + overlaySize.height > containerRect.height) {
      top = containerRect.height - overlaySize.height
    }

    return { ...position, left, top }
  }
}
```

**Usage:**
```tsx
// LayerActionsChipOverlay.tsx
const positioner = useOverlayPositioner()

const position = positioner.positionOverlay(
  frame,
  'top-center',
  { x: 0, y: -40 } // 40px above element
)

return (
  <div style={{ position: 'absolute', ...position }}>
    {/* Chip content */}
  </div>
)
```

**Benefits:**
- ✅ Unified positioning logic
- ✅ Uses CoordinateSystem (same math as selection)
- ✅ Viewport clamping
- ✅ Multiple anchor points
- ✅ Easy to test

---

## Edge Cases Handled

### 1. Locked Slots
- ❌ **Current:** Can select but pointerEvents: none
- ✅ **New:**
  - Show lock icon in overlay
  - Can't drag/resize
  - Can't change properties
  - Can include in multi-select for alignment operations
  - Shift+Alt+Click to unlock

### 2. Hidden Slots
- ❌ **Current:** Not implemented
- ✅ **New:**
  - `slot.visible = false` removes from canvas
  - Still in layers panel
  - Can toggle visibility
  - Excluded from selection

### 3. Grouped Slots
- ❌ **Current:** Not implemented
- ✅ **New:**
  - Treat group as single unit
  - Preserve relative positions during group move
  - Ungroup to edit individually
  - Nested groups supported

### 4. Rotation Edge Cases
- ❌ **Current:** Rotation exists but handle positioning broken
- ✅ **New:**
  - Rotate handle always visible
  - Rotation center configurable (center, custom point)
  - Snap to 15° increments (hold Shift)
  - Display rotation angle during drag
  - Multi-select rotation around group center

### 5. Aspect Ratio Locking
- ❌ **Current:** Not implemented
- ✅ **New:**
  - Hold Shift during resize to lock aspect ratio
  - Lock icon in property panel
  - Applies to images by default
  - Multi-select preserves individual aspect ratios

### 6. Minimum/Maximum Sizes
- ❌ **Current:** No constraints
- ✅ **New:**
  - Min width/height: 10px
  - Max width/height: Canvas bounds
  - Visual feedback when hitting limit
  - Resize handle changes color at limit

### 7. Canvas Bounds
- ❌ **Current:** Can drag slots outside canvas
- ✅ **New:**
  - Snap to canvas edges (configurable)
  - Warning when partially outside
  - Trim option for images
  - "Bring to front" moves inside bounds

### 8. Overlapping Slots
- ✅ **Current:** Z-index works
- ✅ **New:**
  - Click selects top-most slot
  - Ctrl+Click to select through stack
  - "Send to back / Bring to front" commands
  - Z-index shown in layers panel

### 9. Very Small Slots
- ❌ **Current:** Handles overlap
- ✅ **New:**
  - Handles scale up for tiny slots
  - Min handle spacing enforced
  - Corner handles prioritized
  - Edge handles hidden if space < 20px

### 10. Very Large Slots
- ❌ **Current:** Handles off-screen
- ✅ **New:**
  - Handles clamp to viewport
  - Scroll to keep handles visible during drag
  - Mini-map for navigation (future)

### 11. Undo/Redo During Drag
- ❌ **Current:** Would break drag state
- ✅ **New:**
  - Undo/Redo disabled during drag
  - Visual indicator (grayed out)
  - Escape cancels drag first

### 12. Property Conflicts in Multi-Select
- ❌ **Current:** Not handled
- ✅ **New:**
  - Show "Mixed" for different values
  - Setting property applies to all
  - Individual values in tooltip
  - Relative adjustments (e.g., +10px to all)

### 13. Copy/Paste Edge Cases
- ❌ **Current:** Not implemented
- ✅ **New:**
  - Paste offset (10px right, 10px down)
  - Paste to different page
  - Paste to different ratio (scale proportionally)
  - Duplicate in place (Ctrl+D)

### 14. Font Loading
- ❌ **Current:** Not handled
- ✅ **New:**
  - Load fonts on demand
  - Fallback to system font while loading
  - Cache loaded fonts
  - Warning for missing fonts

### 15. Image Loading
- ❌ **Current:** Broken images show error
- ✅ **New:**
  - Loading placeholder
  - Retry on error
  - Replace image option
  - Image optimization (resize, compress)

---

## Migration Strategy - Don't Break Anything

### Phase 0: Preparation (Week 1)
**Goal:** Set up infrastructure without touching existing code.

**Tasks:**
1. Create new `src/editor/core/` directory
2. Implement `CoordinateSystem` with tests
3. Implement `InteractionStateMachine` with tests
4. Implement `Command` pattern with tests
5. Implement `PropertyValidator` with tests
6. Add comprehensive test suite
7. Document new architecture

**Success Criteria:**
- ✅ All new code has >90% test coverage
- ✅ Existing app still works (no changes to current code)
- ✅ CI passes all tests

**Risk:** None (no changes to existing code)

### Phase 1: Parallel Implementation (Week 2-3)
**Goal:** Build new components alongside old ones.

**Tasks:**
1. Create `SvgStageV2.tsx` (new implementation)
2. Create `SelectionOverlayV2.tsx` (new implementation)
3. Create `PropertyPanel.tsx` (new component)
4. Implement `EditorController` service
5. Add feature flag: `USE_V2_CANVAS`

**Code:**
```tsx
// App.tsx
const useV2 = import.meta.env.VITE_USE_V2_CANVAS === 'true'

return (
  <div>
    {useV2 ? (
      <CanvasStageV2 {...props} />
    ) : (
      <CanvasStage {...props} />
    )}
  </div>
)
```

**Success Criteria:**
- ✅ V1 still default (no regressions)
- ✅ V2 can be enabled via env var
- ✅ V2 basic interactions work (click, drag, select)

**Risk:** Low (V1 untouched)

### Phase 2: Feature Parity (Week 4-5)
**Goal:** V2 matches all V1 features.

**Checklist:**
- [ ] Click to select
- [ ] Drag to move
- [ ] Resize with handles
- [ ] Multi-select (Shift+Click)
- [ ] Background click deselects
- [ ] Keyboard shortcuts (Delete, Escape)
- [ ] Undo/Redo
- [ ] Page switching
- [ ] Zoom/Pan
- [ ] Locked slots
- [ ] Z-ordering

**Success Criteria:**
- ✅ All V1 features work in V2
- ✅ Side-by-side comparison shows no differences
- ✅ Performance benchmarks show V2 >= V1

**Risk:** Medium (complexity of feature parity)

### Phase 3: V2 Becomes Default (Week 6)
**Goal:** Ship V2 to users.

**Tasks:**
1. Enable V2 by default
2. Keep V1 as fallback (env var)
3. Monitor error rates
4. Collect user feedback
5. Fix bugs in V2
6. Keep V1 as safety net

**Success Criteria:**
- ✅ <1% bug reports related to canvas
- ✅ No performance regressions
- ✅ Users don't notice the change

**Risk:** Medium (user-facing change)

### Phase 4: Add New Features to V2 Only (Week 7+)
**Goal:** Extend V2 with features V1 can't support.

**New Features:**
1. Property editing (fill, stroke, opacity)
2. Font selection
3. Rotation with handle
4. Horizontal/Vertical flip
5. Multi-element property editing
6. Proper undo/redo for properties
7. Command merging for performance

**Success Criteria:**
- ✅ Users can edit all properties
- ✅ Property changes are undoable
- ✅ Multi-select property editing works
- ✅ No regressions in existing features

**Risk:** Low (V1 still available as fallback)

### Phase 5: Remove V1 (Week 10+)
**Goal:** Clean up codebase.

**Tasks:**
1. Remove V1 components
2. Remove feature flag
3. Rename V2 → V1
4. Update documentation
5. Archive old code in git history

**Success Criteria:**
- ✅ Smaller bundle size
- ✅ Simpler codebase
- ✅ No references to old implementation

**Risk:** Low (V2 proven in production)

---

## Testing Strategy

### Unit Tests (Jest/Vitest)

**CoordinateSystem:**
```typescript
describe('CoordinateSystem', () => {
  it('converts screen to SVG coordinates', () => {
    const coords = new CoordinateSystem(mockSVG, [0, 0, 1000, 1000])
    const result = coords.screenToSVG(500, 500)
    expect(result).toEqual({ x: 500, y: 500 })
  })

  it('handles zoom correctly', () => {
    const coords = new CoordinateSystem(mockSVG, [0, 0, 1000, 1000])
    coords.setViewport({ zoom: 2 })
    // Test that distances are scaled
  })

  it('handles rotation', () => {
    // Test rotated coordinate conversion
  })
})
```

**InteractionStateMachine:**
```typescript
describe('InteractionStateMachine', () => {
  it('transitions from idle to dragging', () => {
    const sm = new InteractionStateMachine()
    sm.transition({ type: 'pointerDown', target: 'slot1', position: { x: 0, y: 0 } })
    sm.transition({ type: 'pointerMove', position: { x: 10, y: 10 } })
    expect(sm.getState().type).toBe('dragging')
  })

  it('respects drag threshold', () => {
    // Test that small movements don't trigger drag
  })
})
```

**PropertyValidator:**
```typescript
describe('PropertyValidator', () => {
  it('validates color properties', () => {
    const result = PropertyValidator.validate('fill', '#FF0000', 'shape')
    expect(result.valid).toBe(true)
  })

  it('rejects invalid colors', () => {
    const result = PropertyValidator.validate('fill', 'not-a-color', 'shape')
    expect(result.valid).toBe(false)
  })

  it('enforces min/max constraints', () => {
    const result = PropertyValidator.validate('opacity', 2, 'image')
    expect(result.valid).toBe(false)
  })
})
```

### Integration Tests (Testing Library)

**Selection Flow:**
```typescript
test('clicking a slot selects it', async () => {
  render(<CanvasStageV2 {...props} />)

  const slot = screen.getByTestId('slot-headline')
  await userEvent.click(slot)

  expect(screen.getByTestId('selection-overlay')).toBeInTheDocument()
})

test('clicking background deselects', async () => {
  render(<CanvasStageV2 {...props} />)

  const slot = screen.getByTestId('slot-headline')
  await userEvent.click(slot)

  const background = screen.getByTestId('svg-background')
  await userEvent.click(background)

  expect(screen.queryByTestId('selection-overlay')).not.toBeInTheDocument()
})
```

**Multi-Select:**
```typescript
test('shift+click adds to selection', async () => {
  render(<CanvasStageV2 {...props} />)

  await userEvent.click(screen.getByTestId('slot-headline'))
  await userEvent.keyboard('{Shift>}')
  await userEvent.click(screen.getByTestId('slot-subhead'))
  await userEvent.keyboard('{/Shift}')

  expect(screen.getByText('2 items selected')).toBeInTheDocument()
})
```

### E2E Tests (Playwright)

**Property Editing:**
```typescript
test('editing fill color updates slot', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-slot-name="headline"]')
  await page.click('[data-testid="property-panel-fill"]')
  await page.fill('input[type="color"]', '#FF0000')

  const fill = await page.getAttribute('[data-slot-name="headline"] rect', 'fill')
  expect(fill).toBe('#FF0000')
})
```

**Undo/Redo:**
```typescript
test('undo reverts property change', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-slot-name="headline"]')
  await page.fill('[data-property="fill"]', '#FF0000')
  await page.keyboard.press('Control+Z')

  const fill = await page.getAttribute('[data-slot-name="headline"] rect', 'fill')
  expect(fill).not.toBe('#FF0000')
})
```

### Visual Regression Tests

**Percy or Chromatic:**
```typescript
test('canvas renders correctly', async () => {
  const { container } = render(<CanvasStageV2 {...props} />)
  await percySnapshot('canvas-default')
})

test('selection overlay renders correctly', async () => {
  const { container } = render(<CanvasStageV2 {...props} selectedSlots={['headline']} />)
  await percySnapshot('canvas-with-selection')
})
```

---

## Performance Benchmarks

### Metrics to Track

1. **Time to Interactive (TTI):** < 2 seconds
2. **First Contentful Paint (FCP):** < 1 second
3. **Frame Rate During Drag:** 60 FPS
4. **Memory Usage:** < 100 MB for 50 slots
5. **Bundle Size:** < 500 KB (gzipped)

### Benchmarking Code

```typescript
// src/editor/benchmark/canvasBenchmark.ts

export function benchmarkDragPerformance() {
  const start = performance.now()
  let frameCount = 0

  // Simulate 100 drag events
  for (let i = 0; i < 100; i++) {
    // Trigger drag update
    frameCount++
  }

  const end = performance.now()
  const fps = (frameCount / (end - start)) * 1000

  console.log(`Drag FPS: ${fps.toFixed(2)}`)
  return fps
}

export function benchmarkSelectionChange() {
  const start = performance.now()

  // Select 50 slots
  for (let i = 0; i < 50; i++) {
    store.setSelection([`slot-${i}`])
  }

  const end = performance.now()
  console.log(`50 selection changes: ${end - start}ms`)
  return end - start
}
```

---

## Documentation Requirements

### For Developers

1. **Architecture Guide** (this document)
2. **API Reference** (JSDoc for all public APIs)
3. **Testing Guide** (how to write tests)
4. **Migration Guide** (V1 → V2 migration)
5. **Debugging Guide** (common issues and solutions)

### For Users

1. **Keyboard Shortcuts** (quick reference)
2. **Property Reference** (what each property does)
3. **Tutorial** (basic canvas operations)
4. **FAQ** (common questions)

---

## Success Metrics

### Code Quality
- [ ] Test coverage > 90%
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All functions documented

### Performance
- [ ] 60 FPS during all interactions
- [ ] < 100ms response to user input
- [ ] < 500 KB bundle size
- [ ] < 100 MB memory usage

### Reliability
- [ ] Zero selection flashing bugs
- [ ] Zero coordinate calculation errors
- [ ] Zero event propagation bugs
- [ ] Zero overlay positioning bugs

### User Experience
- [ ] All properties editable
- [ ] Multi-select fully functional
- [ ] Undo/redo for everything
- [ ] Keyboard shortcuts work
- [ ] Touch gestures work (future)

---

## Risks and Mitigations

### Risk 1: Scope Creep
**Mitigation:** Strict phase boundaries, feature freeze between phases

### Risk 2: V2 Not Ready for Production
**Mitigation:** Keep V1 as fallback, feature flag for easy rollback

### Risk 3: Breaking Changes in Dependencies
**Mitigation:** Pin versions, test before upgrading

### Risk 4: Performance Regressions
**Mitigation:** Benchmark before/after, automated performance tests

### Risk 5: User Confusion During Transition
**Mitigation:** No visible changes until feature parity, then seamless swap

---

## Open Questions

1. **Touch Support:** When to add? Phase 5?
2. **Collaboration:** Multi-user editing - different architecture?
3. **Animation:** Slot animations - separate system?
4. **3D Transforms:** Perspective, 3D rotation - future consideration?
5. **Responsive Templates:** Different layouts per breakpoint - separate feature?

---

## Conclusion

The current canvas architecture is fragile because it evolved organically without a clear architectural vision. Every feature was bolted on, leading to scattered event handling, duplicated coordinate math, and tangled state management.

This proposal provides a **complete architectural rewrite** with:

✅ **Clear separation of concerns** (presentation, interaction, state, utilities)
✅ **Explicit state machine** (no more hidden state in refs)
✅ **Command pattern** (proper undo/redo, no history explosion)
✅ **Unified coordinate system** (solves overlay positioning forever)
✅ **Property system** (extensible, validated, type-safe)
✅ **Multi-element support** (designed in from the start)
✅ **Comprehensive testing** (unit, integration, E2E, visual)
✅ **Phased migration** (V1 stays as fallback, zero risk)

**The key insight:** Don't fix bugs in the current system. Build the system that can't have those bugs in the first place.

---

## Next Steps

1. Review this document with team
2. Prioritize phases
3. Assign owners to each phase
4. Set up test infrastructure
5. Begin Phase 0 implementation

**Timeline:** 10 weeks to complete migration, 2 weeks per phase with buffer.

**Question for team:** Should we proceed with this architectural overhaul, or continue patching the current system?
