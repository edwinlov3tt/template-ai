# Task: Position & Transform Controls

**Branch**: `feature/position-transform-controls`
**Wave**: 1 (Independent)
**Dependencies**: None

## Objective

Build a generic positioning and transformation system that works for **all slot types** (text, images, shapes, buttons) with support for z-order, alignment, distribution, and numeric inputs.

## Requirements

### 1. Transform Operations (src/editor/transforms/operations.ts)

```typescript
export interface TransformContext {
  slots: Slot[]
  frames: Record<string, Frame>
  canvasBounds: { x: number; y: number; width: number; height: number }
}

export interface Frame {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

// Z-order operations
export function bringToFront(slotName: string, context: TransformContext): Slot[]
export function sendToBack(slotName: string, context: TransformContext): Slot[]
export function bringForward(slotName: string, context: TransformContext): Slot[]
export function sendBackward(slotName: string, context: TransformContext): Slot[]

// Alignment operations
export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export function alignToPage(
  slotNames: string[],
  mode: AlignMode,
  context: TransformContext
): Record<string, Partial<Frame>>

// Distribution operations
export type DistributeMode = 'horizontal' | 'vertical'
export function distribute(
  slotNames: string[],
  mode: DistributeMode,
  context: TransformContext
): Record<string, Partial<Frame>>
```

### 2. Bounding Box Utilities (src/editor/transforms/bbox.ts)

```typescript
export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

// Calculate union bbox for multi-select
export function getUnionBBox(frames: Frame[]): BBox

// Calculate bbox after rotation
export function getRotatedBBox(frame: Frame): BBox

// Check if point is inside bbox
export function containsPoint(bbox: BBox, point: { x: number; y: number }): boolean

// Get corners of bbox (for rotation)
export function getBBoxCorners(bbox: BBox): Array<{ x: number; y: number }>
```

### 3. Aspect Ratio Lock (src/editor/transforms/aspectRatio.ts)

```typescript
export function lockAspectRatio(
  frame: Frame,
  newWidth?: number,
  newHeight?: number
): Frame

export function getAspectRatio(frame: Frame): number
```

### 4. Numeric Transform Inputs (src/editor/transforms/numeric.ts)

```typescript
export interface NumericTransform {
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
}

export function applyNumericTransform(
  frame: Frame,
  transform: NumericTransform,
  lockRatio: boolean
): Frame

// Constrain to canvas bounds
export function constrainToCanvas(
  frame: Frame,
  canvasBounds: { x: number; y: number; width: number; height: number }
): Frame
```

### 5. Multi-Select Transform (src/editor/transforms/multiSelect.ts)

```typescript
// Transform all selected slots relative to union bbox
export function transformGroup(
  slotNames: string[],
  deltaX: number,
  deltaY: number,
  scaleX: number,
  scaleY: number,
  context: TransformContext
): Record<string, Frame>

// Resize group while preserving individual aspect ratios
export function resizeGroup(
  slotNames: string[],
  newWidth: number,
  newHeight: number,
  context: TransformContext
): Record<string, Frame>
```

### 6. Property Extensions (types.ts)

```typescript
// Add to Slot interface
rotation?: number      // degrees (-180 to 180)
flipH?: boolean        // horizontal flip
flipV?: boolean        // vertical flip
locked?: boolean       // prevent transforms

// Frame already has x, y, width, height
```

### 7. Command Pattern Integration

```typescript
// src/editor/commands/TransformCommand.ts
export interface TransformCommand {
  type: 'transform'
  slotName: string
  before: Frame
  after: Frame
}

export function createTransformCommand(
  slotName: string,
  before: Frame,
  after: Frame
): TransformCommand
```

## Files to Create

**Create**:
- `src/editor/transforms/operations.ts`
- `src/editor/transforms/bbox.ts`
- `src/editor/transforms/aspectRatio.ts`
- `src/editor/transforms/numeric.ts`
- `src/editor/transforms/multiSelect.ts`
- `src/editor/commands/TransformCommand.ts`
- `src/editor/transforms/__tests__/operations.test.ts`
- `src/editor/transforms/__tests__/bbox.test.ts`
- `src/editor/transforms/__tests__/aspectRatio.test.ts`
- `src/editor/transforms/__tests__/multiSelect.test.ts`

**Modify**:
- `src/schema/types.ts` - Add rotation, flipH, flipV to Slot

## Tests

**Coverage target**: >90%

Test cases:
1. **Z-order**: bringToFront with existing slots, edge cases (already front)
2. **Alignment**: align 3 slots to left, center, right, top, middle, bottom
3. **Distribution**: distribute horizontal, vertical with 2/3/5 slots
4. **Union bbox**: 1 slot, 2 slots, 3 slots with different sizes
5. **Rotated bbox**: 0°, 45°, 90°, 180°, arbitrary angles
6. **Aspect ratio lock**: resize width, resize height, both
7. **Numeric transforms**: set x/y, set width/height with lock
8. **Multi-select transform**: move group, resize group, preserve ratios
9. **Canvas bounds**: clamp to canvas, handle edge cases

## Acceptance Criteria

- [ ] Z-order operations correctly reorder slot z-index
- [ ] Alignment works for single and multi-select
- [ ] Distribution evenly spaces slots
- [ ] Union bbox calculated correctly for rotated slots
- [ ] Aspect ratio lock maintains proportions
- [ ] Numeric inputs update frame values
- [ ] Multi-select transforms preserve relative positions
- [ ] Canvas bounds clamping prevents off-canvas slots
- [ ] All tests passing (>25 tests)
- [ ] TypeScript build clean
- [ ] Generic - works for all slot types (text, image, shape, button)

## Integration Notes

- **Generic design**: Works for any slot type
- **Multi-select aware**: Union bbox for groups
- **Command pattern ready**: All operations can be wrapped in commands for undo/redo
- Works with both V1 and V2 canvas
- No feature flag needed (core functionality)

## Performance Considerations

- **Batch updates**: Apply transforms in single operation
- **Avoid layout thrashing**: Calculate all positions, then update DOM
- **Cache union bbox**: Don't recalculate on every operation

## Out of Scope

- UI components (handled in `feature/effects-ui-panels`)
- Drag/resize handles (handled by V2 canvas SelectionOverlayV2)
- Smart snapping (already exists in V2 canvas)
