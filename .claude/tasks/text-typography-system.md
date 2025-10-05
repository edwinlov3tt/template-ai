# Task: Text Typography System

**Branch**: `feature/text-typography-system`
**Wave**: 1 (Independent)
**Dependencies**: None

## Objective

Extend the PropertyValidator and create a comprehensive typography system with Google Fonts integration, text transformations, and auto-fit behavior.

## Requirements

### 1. Property Descriptors (PropertyValidator.ts)

Add typography property descriptors to PropertyValidator:

```typescript
// Add to PropertyValidator.ts
fontFamily?: string
fontWeight?: number | 'normal' | 'bold' | 'medium' | 'semibold'
fontStyle?: 'normal' | 'italic'
fontSize?: number              // viewBox units
textTransform?: 'none' | 'uppercase' | 'title' | 'sentence'
letterSpacing?: number         // viewBox units
lineHeight?: number            // unitless multiplier (1.2, 1.5, etc.)
textAlign?: 'left' | 'center' | 'right' | 'justify'
anchorBox?: 'auto' | 'fixed'   // auto = text grows, fixed = wraps
autoFit?: boolean              // scale fontSize to fit box
textColor?: string             // hex
```

### 2. Validation Functions

Implement validators:
- `validateFontFamily(family: string)` - Allow any string, normalize
- `validateFontWeight(weight: number | string)` - Map strings to numbers (100-900), clamp
- `validateFontStyle(style: string)` - Enum check
- `validateFontSize(size: number, constraints?: {min, max})` - Clamp to viewBox-relative range
- `validateTextTransform(transform: string)` - Enum check
- `validateLetterSpacing(spacing: number)` - Allow negative to positive range
- `validateLineHeight(height: number)` - Clamp to 0.5-3.0
- `validateTextAlign(align: string)` - Enum check

### 3. Text Transform Utilities

Create `src/editor/text/textTransforms.ts`:

```typescript
export function applyTextTransform(
  text: string,
  transform: 'none' | 'uppercase' | 'title' | 'sentence'
): string
```

- `uppercase`: ALL CAPS
- `title`: Title Case For Each Word
- `sentence`: Sentence case for first word only.

### 4. Font Picker Hook (hooks/useFontPicker.ts)

Extend the existing `fontLoader.ts`:

```typescript
export function useFontAvailability(family: string): {
  availableWeights: number[]
  loading: boolean
  error: string | null
}
```

Query Google Fonts API for available weights per family.

### 5. Anchor Box & Auto-Fit Logic

Create `src/editor/text/textLayout.ts`:

```typescript
export function calculateAutoFitSize(
  text: string,
  fontFamily: string,
  fontWeight: number,
  boxWidth: number,
  boxHeight: number,
  padding?: number
): number // Optimal fontSize

export function wrapTextToBox(
  text: string,
  fontFamily: string,
  fontSize: number,
  boxWidth: number,
  lineHeight: number
): string[] // Array of lines
```

Use canvas measureText or SVG getBBox for calculations.

### 6. Mixed-State Helper

For multi-select support:

```typescript
export function getMixedState<T>(values: T[]): T | 'Mixed'
```

Returns 'Mixed' if array has different values, otherwise returns the single value.

## Files to Create/Modify

**Create**:
- `src/editor/text/textTransforms.ts`
- `src/editor/text/textLayout.ts`
- `src/hooks/useFontAvailability.ts`
- `src/editor/text/__tests__/textTransforms.test.ts`
- `src/editor/text/__tests__/textLayout.test.ts`
- `src/editor/core/__tests__/PropertyValidator.typography.test.ts`

**Modify**:
- `src/editor/core/PropertyValidator.ts` - Add typography validators
- `src/schema/types.ts` - Extend Slot interface with typography props
- `src/utils/fontLoader.ts` - Add weight availability query

## Tests

**Coverage target**: >90%

Test cases:
1. **Font weight validation**: strings → numbers, out of range → clamp
2. **Font size validation**: min/max constraints, viewBox units
3. **Letter spacing**: negative, zero, positive ranges
4. **Line height**: clamp to 0.5-3.0
5. **Text transforms**: uppercase, title case, sentence case, edge cases (punctuation, numbers)
6. **Auto-fit**: calculate fontSize for various box sizes
7. **Text wrapping**: multi-line, overflow detection
8. **Mixed state**: arrays with same values, different values

## Acceptance Criteria

- [ ] All typography properties have validators in PropertyValidator
- [ ] Text transform function handles all 4 cases correctly
- [ ] Auto-fit calculates fontSize to fit text in box
- [ ] Text wrapping splits into lines without overflow
- [ ] Font availability hook queries Google Fonts API
- [ ] Mixed-state helper returns 'Mixed' for different values
- [ ] All tests passing (>35 tests)
- [ ] TypeScript build clean
- [ ] No breaking changes to existing V1/V2 canvas

## Integration Notes

- Typography properties are **optional** - defaults render plain text
- Works with both V1 and V2 canvas (property-based)
- Feature flag: `VITE_ADVANCED_TYPOGRAPHY=false` (default)

## Out of Scope

- UI components (handled in `feature/effects-ui-panels`)
- SVG rendering (handled in V1/V2 canvas)
- Effects (handled in `feature/svg-effects-engine`)
