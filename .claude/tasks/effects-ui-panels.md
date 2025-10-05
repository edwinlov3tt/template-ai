# Task: Effects UI Panels

**Branch**: `feature/effects-ui-panels`
**Wave**: 2 (Depends on Wave 1)
**Dependencies**:
- `feature/text-typography-system` (typography props)
- `feature/svg-effects-engine` (effect presets)
- `feature/position-transform-controls` (transform operations)

## Objective

Build a combined Canva/Templated.io UI with:
1. **Properties Toolbar** (top): Quick typography controls
2. **Effects Panel** (right rail): Preset grid + toggle list
3. **Position Panel** (right rail): Numeric inputs + alignment buttons
4. Multi-select "Mixed" state support
5. Command merging for smooth undo/redo

## Requirements

### 1. Properties Toolbar (Top Bar)

**Component**: `src/components/typography/TypographyToolbar.tsx`

Layout (horizontal, fixed top):
```
[Font ▼] [Size: 48] [Aa] [Color ●] [B] [I] [U] [≡ ▼] [Aa▼] [↕ ↔]
```

Controls:
- **Font Family** dropdown with live preview
- **Font Size** scrubbable number input
- **Text Color** swatch with color picker
- **Bold** (toggle fontWeight 700)
- **Italic** (toggle fontStyle italic)
- **Underline** (text-decoration)
- **Alignment** (left/center/right/justify)
- **Text Transform** cycle button (none → uppercase → title → sentence)
- **Spacing** popover (letterSpacing, lineHeight sliders)

**Mixed State**: Show "Mixed" when multi-select has different values

**Files**:
- `src/components/typography/TypographyToolbar.tsx`
- `src/components/typography/FontPicker.tsx`
- `src/components/typography/SpacingPopover.tsx`

### 2. Effects Panel (Right Rail)

**Component**: `src/components/effects/EffectsPanel.tsx`

#### Mode A: Preset Grid (Canva-style)

Visual preset tiles (3×3 grid):
```
[None] [Shadow] [Lift]
[Hollow] [Splice] [Outline]
[Echo] [Glitch] [Neon]
[Background]
```

Each tile shows "Ag" with effect preview applied.

Clicking a preset:
1. Applies preset property bundle from `EFFECT_PRESETS`
2. Expands "Show more" section with fine controls

#### Mode B: Toggle List (Templated.io-style)

```
Presets
  [None] [Shadow] [Hollow]  [Show more ▼]

Text Color    [●]
Text Stroke   [Toggle]
Text Highlight [Toggle]
Background    [Toggle]
Text Shadow   [Toggle]
Box Shadow    [Toggle]
Text Curve    [Toggle] Experimental
Image Mask    [Toggle] Experimental
```

Toggling ON opens fine controls below:

**Text Shadow** (when toggled):
- Offset slider (0-100)
- Direction slider (0-360°)
- Blur slider (0-50)
- Transparency slider (0-100%)
- Color swatch

**Text Stroke** (when toggled):
- Width slider (0-20)
- Color swatch
- Paint order (stroke fill / fill stroke)

**Background/Highlight** (when toggled):
- Fill color swatch
- Padding X/Y sliders

**Files**:
- `src/components/effects/EffectsPanel.tsx`
- `src/components/effects/PresetGrid.tsx`
- `src/components/effects/EffectToggle.tsx`
- `src/components/effects/ShadowControls.tsx`
- `src/components/effects/StrokeControls.tsx`
- `src/components/effects/HighlightControls.tsx`

### 3. Position Panel (Right Rail)

**Component**: `src/components/position/PositionPanel.tsx`

Layout:
```
Position & Size
  X: [100]  Y: [200]
  W: [400]  H: [300]  [🔒] Lock ratio
  Rotate: [0°]

Alignment
  [◀] [■] [▶]  Horizontal
  [▲] [■] [▼]  Vertical

Arrange
  [To Front] [Forward]
  [Backward] [To Back]

Distribute (only for 3+ selected)
  [Horizontal ↔] [Vertical ↕]
```

Numeric inputs:
- Arrow keys: ±1, Shift+Arrow: ±10
- Direct typing
- Updates frame on blur or Enter

Alignment buttons:
- Use `alignToPage()` from transform operations
- Gray out when no selection

Z-order buttons:
- Use `bringToFront()`, `sendToBack()`, etc.
- Disable when at min/max z

**Files**:
- `src/components/position/PositionPanel.tsx`
- `src/components/position/AlignmentButtons.tsx`
- `src/components/position/ArrangeButtons.tsx`

### 4. Mixed State UI

**Component**: `src/components/controls/MixedIndicator.tsx`

When multi-select has different values:
```typescript
function getMixedState<T>(values: T[]): T | 'Mixed' {
  if (values.length === 0) return undefined
  const first = values[0]
  if (values.every(v => v === first)) return first
  return 'Mixed'
}
```

Display in inputs:
- Text input: placeholder="Mixed"
- Number input: placeholder="—"
- Toggle: indeterminate state (dash)
- Color: show "Mixed" badge

Behavior:
- User edits **any control** → applies to **all selected slots**
- Mixed state cleared

### 5. Command Merging

**Component**: `src/editor/commands/CommandMerger.ts`

Problem: Slider drags generate 100s of commands
Solution: Merge sequential commands of same type

```typescript
export class CommandMerger {
  private pendingCommand: Command | null = null
  private mergeTimer: NodeJS.Timeout | null = null

  // Start command (on slider dragStart)
  start(command: Command): void

  // Update command (on slider drag)
  update(command: Command): void

  // Commit command (on slider dragEnd)
  commit(): Command | null
}
```

Usage:
- `onDragStart`: merger.start(initialCommand)
- `onDrag`: merger.update(newCommand)
- `onDragEnd`: merger.commit() → add to history

**Files**:
- `src/editor/commands/CommandMerger.ts`
- `src/editor/commands/__tests__/CommandMerger.test.ts`

### 6. Integration with Editor Store

Modify `src/state/editorStore.ts`:

```typescript
// Add to store
interface EditorStore {
  // ... existing ...

  // Typography state
  currentFontFamily: string
  currentFontWeight: number
  currentFontSize: number

  // Effects state
  effectsPreset: string | null

  // Update slot properties
  updateSlotProperty: (slotName: string, property: string, value: any) => void
  updateSlotProperties: (slotName: string, properties: Partial<Slot>) => void

  // Batch update for multi-select
  updateMultipleSlots: (slotNames: string[], properties: Partial<Slot>) => void
}
```

## Files to Create

**Create**:
- `src/components/typography/TypographyToolbar.tsx`
- `src/components/typography/FontPicker.tsx`
- `src/components/typography/SpacingPopover.tsx`
- `src/components/effects/EffectsPanel.tsx`
- `src/components/effects/PresetGrid.tsx`
- `src/components/effects/EffectToggle.tsx`
- `src/components/effects/ShadowControls.tsx`
- `src/components/effects/StrokeControls.tsx`
- `src/components/effects/HighlightControls.tsx`
- `src/components/position/PositionPanel.tsx`
- `src/components/position/AlignmentButtons.tsx`
- `src/components/position/ArrangeButtons.tsx`
- `src/components/controls/MixedIndicator.tsx`
- `src/editor/commands/CommandMerger.ts`
- `src/components/typography/__tests__/TypographyToolbar.test.tsx`
- `src/components/effects/__tests__/EffectsPanel.test.tsx`
- `src/components/position/__tests__/PositionPanel.test.tsx`
- `src/editor/commands/__tests__/CommandMerger.test.ts`

**Modify**:
- `src/state/editorStore.ts` - Add typography/effects state
- `src/components/RightRail.tsx` - Add Effects and Position panels
- `src/App.tsx` - Mount TypographyToolbar

## Tests

**Coverage target**: >90%

Test cases:
1. **Typography Toolbar**: Font picker, size input, color swatch, B/I/U toggles
2. **Effects Panel**: Preset clicks apply bundles, toggle controls expand
3. **Position Panel**: Numeric inputs update frames, alignment buttons
4. **Mixed State**: Multi-select shows "Mixed", edit applies to all
5. **Command Merger**: Slider drags merge into single command
6. **Integration**: Store updates propagate to UI, UI updates call store actions

## Acceptance Criteria

- [ ] Typography Toolbar shows all quick controls
- [ ] Font picker loads Google Fonts with weight selector
- [ ] Effects Panel has both preset grid and toggle list modes
- [ ] Position Panel has numeric inputs, alignment, z-order controls
- [ ] Mixed state indicator shows when multi-select has different values
- [ ] Command merger reduces history noise during slider drags
- [ ] All UI components work with multi-select
- [ ] All tests passing (>30 tests)
- [ ] TypeScript build clean
- [ ] Works with both V1 and V2 canvas

## Design Notes

**Visual Language**:
- Preset tiles: 80×80px, white background, rounded corners, hover state
- Toggles: Match Ant Design switch component
- Sliders: Colored track when value > 0, gray when 0
- Color swatches: Circle with border, click opens picker
- Numeric inputs: Scrubbable (drag to change), arrow key support

**Layout**:
- Typography Toolbar: Fixed top, z-index 40, white background
- Right Rail: Collapsible sections, scroll overflow
- Effects Panel: 320px wide, modal-like for mobile

**Responsiveness**:
- Desktop: All panels visible
- Tablet: Right rail collapses to icon
- Mobile: Full-screen modals

## Integration Notes

- Feature flag: `VITE_TEXT_EFFECTS=true` enables effects panel
- Feature flag: `VITE_ADVANCED_TYPOGRAPHY=true` enables full typography toolbar
- Defaults: Both `false` for gradual rollout
- V1 canvas: Uses these panels with property updates
- V2 canvas: Uses these panels + enhanced interaction

## Out of Scope

- Canvas rendering (handled by V1/V2 canvas)
- Smart snapping (already in V2 canvas)
- Keyboard shortcuts (future enhancement)
