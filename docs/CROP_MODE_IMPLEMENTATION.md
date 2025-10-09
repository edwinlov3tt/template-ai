# Crop Mode Implementation Plan

## Overview

Crop mode is a specialized embed mode that allows users to define a specific region of a template to crop/export. Unlike full edit mode, crop mode focuses on a single slot or region with a visual crop overlay and constrained editing.

## Use Cases

1. **Ad Cropping**: User wants to crop an existing ad to focus on a specific element
2. **Hero Image Extraction**: Extract just the hero/subject from a larger template
3. **Region Focus**: Zoom in on a specific area and export just that region
4. **Quick Edits**: Make small adjustments to position/size within a defined area

## Architecture

### Message Protocol Extension

Already defined in `src/embed/messageProtocol.ts`:

```typescript
interface OpenMessage {
  payload: {
    mode: 'crop' | 'full'
    template?: Template
    focusSlot?: string      // Slot to focus on
    cropRect?: {            // Initial crop region
      x: number
      y: number
      width: number
      height: number
    }
  }
}

interface CompleteMessage {
  payload: {
    template: Template
    exports: { ... }
    metadata: {
      cropRect?: {          // Final crop region
        x: number
        y: number
        width: number
        height: number
      }
    }
  }
}
```

### Component Structure

```
Embed.tsx (mode === 'crop')
  └── CanvasStage
      ├── SvgStage (existing canvas)
      └── CropOverlay (new component)
          ├── Crop region rectangle
          ├── Resize handles (8 corners/edges)
          ├── Drag handle (move entire region)
          └── Dimmed overlay outside crop region
```

## Implementation Phases

### Phase 1: CropOverlay Component (2-3 hours)

**File**: `src/components/CropOverlay.tsx`

**Features**:
- Semi-transparent overlay covering entire canvas
- Transparent rectangle showing crop region
- Visual handles for resize (8 positions: corners + edges)
- Drag handle or draggable region to move crop box
- Keyboard support (arrow keys to nudge, Shift for larger steps)

**Props**:
```typescript
interface CropOverlayProps {
  svgElement: SVGSVGElement | null
  cropRect: { x: number; y: number; width: number; height: number }
  onCropChange: (rect: { x: number; y: number; width: number; height: number }) => void
  zoom: number
  viewBox: [number, number, number, number]
  minCropSize?: { width: number; height: number }
}
```

**Rendering Strategy**:
- Render as SVG overlay on top of canvas (inside same SVG root)
- Use `pointer-events: none` on dimmed area, `pointer-events: auto` on handles
- Z-index higher than slots but lower than selection overlay

**Visual Design**:
- Dark overlay: `fill="rgba(0, 0, 0, 0.5)"`
- Crop region: Transparent cutout (use SVG mask or clip-path)
- Handles: White squares with shadow, 12px × 12px (scaled by zoom)
- Guideline grid (rule of thirds) inside crop region
- Border: Dashed white line, 2px stroke

### Phase 2: Embed.tsx Integration (1 hour)

**Changes to `src/pages/Embed.tsx`**:

1. Add crop state:
```typescript
const [cropRect, setCropRect] = useState<{
  x: number
  y: number
  width: number
  height: number
} | null>(null)
```

2. Initialize crop region in `handleOpen`:
```typescript
if (requestedMode === 'crop') {
  if (cropRect) {
    // Use provided crop rect
    setCropRect(cropRect)
  } else if (focusSlot && templateData) {
    // Auto-generate crop rect from focused slot
    const page = templateData.pages[0]
    const slot = page.slots.find(s => s.name === focusSlot)
    const frame = page.frames[canvasSize.id]?.[focusSlot]
    if (frame) {
      // Add 10% padding around slot
      const padding = Math.max(frame.width, frame.height) * 0.1
      setCropRect({
        x: frame.x - padding,
        y: frame.y - padding,
        width: frame.width + padding * 2,
        height: frame.height + padding * 2
      })
    }
  } else {
    // Default: center 50% of canvas
    setCropRect({
      x: canvasSize.w * 0.25,
      y: canvasSize.h * 0.25,
      width: canvasSize.w * 0.5,
      height: canvasSize.h * 0.5
    })
  }
}
```

3. Conditional rendering:
```typescript
{mode === 'crop' && cropRect && (
  <CropOverlay
    svgElement={svgElementRef.current}
    cropRect={cropRect}
    onCropChange={setCropRect}
    zoom={zoom}
    viewBox={template.canvas.baseViewBox}
    minCropSize={{ width: 100, height: 100 }}
  />
)}
```

4. Update export to include crop region:
```typescript
// In handleComplete:
metadata: {
  dimensions: canvasSize,
  modified: new Date().toISOString(),
  cropRect: mode === 'crop' ? cropRect : undefined
}
```

### Phase 3: Cropped Export (2 hours)

**Goal**: Export only the cropped region, not the full canvas

**Implementation**:

1. Create new export function in `src/export/blobExport.ts`:
```typescript
export async function exportCroppedRegion(
  svgElement: SVGSVGElement,
  cropRect: { x: number; y: number; width: number; height: number },
  options: BlobExportOptions
): Promise<ExportResult> {
  // Clone SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

  // Adjust viewBox to crop region
  clonedSvg.setAttribute('viewBox',
    `${cropRect.x} ${cropRect.y} ${cropRect.width} ${cropRect.height}`
  )

  // Export with adjusted viewBox
  return exportForEmbed(clonedSvg, {
    ...options,
    width: Math.round(cropRect.width),
    height: Math.round(cropRect.height)
  })
}
```

2. Update `Embed.tsx` handleComplete:
```typescript
if (mode === 'crop' && cropRect) {
  // Export cropped region
  const pngExport = await exportCroppedRegion(svgElement, cropRect, {
    format: 'png',
    width: canvasSize.w,
    height: canvasSize.h,
    quality: 1,
    multiplier: 1
  })
} else {
  // Export full canvas (existing code)
}
```

### Phase 4: Constrained Editing (1-2 hours)

**Goal**: Prevent slots from being moved outside crop region

**Implementation**:

1. Add prop to `CanvasStage`:
```typescript
interface CanvasStageProps {
  // ... existing props
  constraintRect?: { x: number; y: number; width: number; height: number }
}
```

2. Pass to SvgStage and down to drag handlers

3. In drag logic, clamp position:
```typescript
const clampToCropRect = (frame: Frame, cropRect: CropRect): Frame => {
  return {
    x: Math.max(cropRect.x, Math.min(cropRect.x + cropRect.width - frame.width, frame.x)),
    y: Math.max(cropRect.y, Math.min(cropRect.y + cropRect.height - frame.height, frame.y)),
    width: frame.width,
    height: frame.height
  }
}
```

4. Apply constraint in `NativeSelectionOverlay` drag handlers

### Phase 5: Polish & UX (1 hour)

**Features**:
- Show crop dimensions in toolbar (e.g., "Crop: 1200 × 800")
- Reset crop button to restore to default/slot bounds
- Keyboard shortcuts:
  - `R` - Reset crop to focused slot
  - `F` - Fit crop to all visible slots
  - Arrow keys - Nudge crop region (Shift for 10px steps)
- Visual feedback:
  - Highlight focused slot when crop mode opens
  - Smooth transition when crop region changes
  - Show crop aspect ratio (if locked)

**Toolbar Updates**:
```typescript
<div style={{ fontSize: '12px', color: '#6b7280', marginLeft: '12px' }}>
  {cropRect && (
    <>
      {Math.round(cropRect.width)} × {Math.round(cropRect.height)}
      <button onClick={resetCrop} style={{ marginLeft: '8px' }}>
        Reset
      </button>
    </>
  )}
</div>
```

## Edge Cases & Considerations

### Coordinate Systems
- Crop rect coordinates are in viewBox units (same as slot frames)
- Export dimensions need to be in pixels (use getExportDimensions)
- Handle rotation: crop rect ignores slot rotation, uses bounding box

### Multi-Page Templates
- Crop mode only works on single page (first page or specified page)
- Ignore multi-page navigation in crop mode
- Show warning if template has multiple pages

### Aspect Ratio Lock
- Optional: Lock crop aspect ratio for specific export sizes
- Add toggle in toolbar: "Lock Ratio (1:1)"
- Resize handles maintain aspect when locked

### Min/Max Crop Size
- Minimum: 100×100 viewBox units (prevent tiny crops)
- Maximum: Canvas bounds (can't crop outside canvas)
- Prevent negative dimensions

### Visual Conflicts
- Crop overlay should not interfere with slot selection
- Allow selecting slots within crop region
- Dim/disable slots outside crop region (optional)

### Export Quality
- Maintain original resolution when exporting crop
- If crop is 500×500 in viewBox but export size is 2000×2000px, scale appropriately
- Thumbnail should show cropped region, not full canvas

## Testing Checklist

- [ ] Crop overlay renders correctly at all zoom levels
- [ ] Resize handles work from all 8 positions
- [ ] Dragging crop region doesn't go outside canvas bounds
- [ ] Keyboard nudging works (arrow keys)
- [ ] Export includes only cropped region
- [ ] Export dimensions match crop rect aspect ratio
- [ ] focusSlot parameter auto-generates crop rect
- [ ] Provided cropRect parameter is respected
- [ ] Metadata includes final crop coordinates
- [ ] Constrained editing keeps slots within crop bounds (if enabled)
- [ ] Reset button restores to initial crop rect
- [ ] Multi-page templates show warning in crop mode

## Example Parent Integration

```javascript
// Open editor in crop mode focused on "headline" slot
iframe.contentWindow.postMessage({
  type: 'editor:open',
  payload: {
    mode: 'crop',
    template: myTemplate,
    ratio: '16:9',
    focusSlot: 'headline'  // Auto-crop around this slot
  }
}, 'http://localhost:5173')

// Or provide explicit crop rect
iframe.contentWindow.postMessage({
  type: 'editor:open',
  payload: {
    mode: 'crop',
    template: myTemplate,
    ratio: '1:1',
    cropRect: {
      x: 200,
      y: 200,
      width: 1600,
      height: 1600
    }
  }
}, 'http://localhost:5173')

// Receive cropped result
window.addEventListener('message', (event) => {
  if (event.data.type === 'editor:complete') {
    const { exports, metadata } = event.data.payload

    // exports.png contains ONLY the cropped region
    // metadata.cropRect contains final crop coordinates
    console.log('Cropped image:', exports.png)
    console.log('Crop region:', metadata.cropRect)
  }
})
```

## Future Enhancements

### Smart Crop Suggestions
- Detect faces/subjects in images and suggest crop regions
- Auto-crop to content bounds (remove whitespace)
- Suggest crops for common aspect ratios (1:1, 4:5, 16:9)

### Crop Presets
- Predefined crop regions (e.g., "Top Half", "Center Square")
- Save custom crop presets per template
- Batch crop: apply same crop to multiple templates

### Advanced Features
- Free-form crop (non-rectangular using mask)
- Rotation handle on crop region
- Crop history (undo/redo crop changes)
- Crop to slot bounds (auto-fit to selected slot)

### Performance
- Debounce crop rect updates during drag
- Only re-render export preview when crop changes significantly
- Cache cropped canvas for faster export

## Files to Create/Modify

**New Files**:
- `src/components/CropOverlay.tsx` (250 lines)
- `src/export/croppedExport.ts` (100 lines)
- `docs/CROP_MODE_IMPLEMENTATION.md` (this file)

**Modified Files**:
- `src/pages/Embed.tsx` (+150 lines)
- `src/export/blobExport.ts` (+50 lines)
- `src/components/CanvasStage.tsx` (+30 lines)
- `src/editor/svg-v2/NativeSelectionOverlay.tsx` (+40 lines)

**Estimated Total**: ~470 new lines, ~120 modified lines, ~8-10 hours work

## Priority

**Phase 1 & 2** (Core crop UI): HIGH - Required for basic crop functionality
**Phase 3** (Cropped export): HIGH - Otherwise just visual, no actual crop
**Phase 4** (Constrained editing): MEDIUM - Nice to have, not critical
**Phase 5** (Polish): LOW - Can be added incrementally

## Notes

- Crop mode is completely independent of full mode (no shared UI)
- Parent app controls which mode to use via `editor:open` message
- Both modes share same template structure and export utilities
- Crop coordinates are stored in metadata, not in template JSON
- Template is NOT modified by crop mode, only the export region changes
