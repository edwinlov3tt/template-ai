# Color Panel UI — Spec

**Goal:** Build a Canva-style color panel with search, swatches, presets, photo colors, and an advanced picker (solid + gradient tabs).

## Component Structure

Create `src/components/color/ColorPanel.tsx` as the main right rail panel.

## UI Sections (from screenshots)

### 1. Search Box
- Text input: "Try 'blue' or '#00c4cc'"
- Icon: magnifying glass
- Accepts:
  - Color names ("blue", "red", "navy")
  - Hex codes ("#00c4cc", "#fff")
  - RGB/HSL/OKLCH values
- On Enter: apply color to selected slot

### 2. Document Colors
- Header: "Document colors" with palette icon
- Swatches: row of circular color chips (used in current template)
- Plus button: adds current color to document swatches
- Edit button: opens swatch manager
- Empty state: "No colors yet" with add button

**Behavior:**
- Auto-populated from all fills in template.pages[*].slots[*].fill
- Deduplicated (same color appears once)
- Click swatch → apply to selected slot
- Right-click → remove from document colors

### 3. Brand Kit (Optional)
- Header: "Site Nimbus Brand Kit - Blue Gra..." with Edit link
- Shows brand palette name
- Swatches: curated brand colors
- Click Edit → opens brand kit modal

**Phase 2 feature** — can skip for MVP

### 4. Photo Colors
- Header: "Photo colors" with "See all" link
- Shows 3 rows × 6 columns of extracted colors
- First column: image thumbnail (small)
- Remaining columns: extracted color swatches
- Click "See all" → expands to full modal with all image palettes
- Click swatch → apply color
- Auto-updates when images added/changed

**Expanded view:**
- Back button + "Photo colors" title
- Full screen grid of all image palettes
- "Change all" button at bottom → remap all fills matching selected swatch

### 5. Default Solid Colors
- Header: "Default solid colors" with "See all" link
- Shows 4 rows × 7 columns color grid (28 colors)
- Organized by hue (reds, oranges, yellows, greens, cyans, blues, purples, grays)
- Click "See all" → expands to full color picker modal

**Expanded view:**
- Back button + "Default solid colors" title
- Full grid: 14 hues × 7 lightness steps = 98 colors
- "Change all" button at bottom

### 6. Default Gradient Colors
- Header: "Default gradient colors" with "See all" link
- Shows 3 rows × 7 columns gradient swatches
- Curated gradients (warm, cool, rainbow, grayscale)
- Click swatch → apply gradient
- Click "See all" → expanded gradient gallery

## Advanced Picker (Solid Tab)

Opened via "See all" on Default solid colors, or standalone picker mode.

**Layout:**
- Tab bar: "Solid color" | "Gradient" (tabs with underline)
- 2D color picker: saturation (X) × lightness (Y) square
  - Drag circle handle to select
  - Background shows current hue
- Hue slider: horizontal rainbow bar (0-360°)
  - Drag circle handle to select hue
- Hex input: text field with "#FFFFFF" format
  - Real-time validation
  - Updates as picker changes
- Eyedropper button: launches native EyeDropper API (if available)
  - Icon: eyedropper SVG
  - Falls back to disabled state on unsupported browsers

**Component:**
Use **react-colorful** for the picker widget:
```tsx
import { HexColorPicker, HexColorInput } from 'react-colorful'
```

**References:**
- react-colorful — https://omgovich.github.io/react-colorful/
- EyeDropper API — https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper

## Recently Used Colors

- Section above picker: "Recently used" (if any exist)
- Shows last 10 colors in LRU order
- Click swatch → apply color
- Stored in editorStore as `recentPaints: Paint[]`

## State Management

Update `src/state/editorStore.ts`:

**New State:**
```typescript
interface EditorState {
  // ... existing
  documentSwatches: Paint[];  // colors used in template
  recentPaints: Paint[];      // LRU cache (max 10)
  colorPanelOpen: boolean;    // panel visibility
  activePanelSection: 'main' | 'solid-picker' | 'photo-colors' | 'default-colors';
}
```

**New Actions:**
```typescript
addDocumentSwatch(paint: Paint): void
removeDocumentSwatch(index: number): void
addRecentPaint(paint: Paint): void          // adds to front, removes from end if > 10
updateSlotFill(slotId: string, paint: Paint): void
toggleColorPanel(): void
setActivePanelSection(section: string): void
```

## Component Files

```
src/components/color/
  ColorPanel.tsx                  - Main panel wrapper
  SearchBox.tsx                   - Search input
  DocumentColors.tsx              - Document swatches section
  BrandKit.tsx                    - Brand palette section (optional)
  PhotoColors.tsx                 - Image-extracted colors section
  DefaultSolidColors.tsx          - Static color grid
  DefaultGradientColors.tsx       - Curated gradients
  SolidColorPicker.tsx            - Advanced solid picker
  RecentlyUsed.tsx                - Recent colors LRU
  ColorSwatch.tsx                 - Reusable swatch component
  ExpandedColorModal.tsx          - Full-screen color picker
  ExpandedPhotoModal.tsx          - Full-screen photo colors
```

## Default Color Palettes

Create `src/editor/color/defaultPalettes.ts`:

```typescript
export const DEFAULT_SOLID_COLORS: string[] = [
  // Grays
  '#000000', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#f4f4f5', '#ffffff',

  // Reds
  '#7f1d1d', '#991b1b', '#dc2626', '#f87171', '#fca5a5', '#fecaca', '#fee2e2',

  // ... more hues
];

export const DEFAULT_GRADIENTS: LinearGradientPaint[] = [
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#667eea' },
      { offset: 1, color: '#764ba2' }
    ]
  },
  // ... more gradients
];
```

## Interaction Flows

### Apply Color to Slot
1. User clicks swatch/color in any section
2. `updateSlotFill(selectedSlotId, paint)` called
3. Paint added to `recentPaints` via `addRecentPaint(paint)`
4. If solid and not in document swatches, prompt to add
5. SVG updated via `ensureGradientDef()` or direct `fill` attribute

### Eyedropper Flow
1. User clicks eyedropper button
2. Check `if ('EyeDropper' in window)`
3. Open eyedropper: `const eyeDropper = new EyeDropper(); const { sRGBHex } = await eyeDropper.open()`
4. Apply color: `updateSlotFill(selectedSlotId, { kind: 'solid', color: sRGBHex })`
5. Fallback: show "Not supported" tooltip

### Search Flow
1. User types in search box
2. Debounce 300ms
3. Parse input with `parseColor(input)`
4. If valid: show preview swatch
5. On Enter: apply color

## Styling

**Dark theme** (matching screenshots):
- Background: `#1a1a1a`
- Text: `#e5e7eb`
- Borders: `#3a3a3a`
- Hover: `#2a2a2a`
- Active: `#3a3a3a`

**Swatches:**
- Size: 32px × 32px circles
- Border: 2px solid transparent
- Hover: border becomes `#ffffff` with 50% opacity
- Active: border becomes `#3b82f6`
- Gap: 8px

## Accessibility

- All swatches have `aria-label` with color value
- Keyboard navigation: Tab through swatches, Enter to apply
- Search box has `role="searchbox"` and `aria-label="Search colors"`
- Focus visible: 2px outline on swatches

## Performance

- Debounce search input (300ms)
- Virtualize large color grids (use `react-window` for 98+ colors)
- Memoize swatch components with `React.memo`

## Testing

### Unit Tests
- Search parses hex, names, rgb, oklch
- LRU cache maintains max 10 items
- Document swatches deduplicate correctly

### Integration Tests
- Clicking swatch updates slot fill
- Eyedropper applies color when available
- Recently used persists across sessions (localStorage)

### Visual Tests
- Color grid matches design mocks
- Swatches render correct colors
- Dark theme applied consistently

## References

- **Canva UI** — See screenshots/ for exact layout
- **react-colorful** — https://omgovich.github.io/react-colorful/
- **EyeDropper API** — https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
- **Ant Design ColorPicker** — https://ant.design/components/color-picker (alternative reference)
