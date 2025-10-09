# Normalized Ratio Workflow - Implementation Guide

## Problem Statement

**Current Issue:** When mixing different ad sizes (e.g., 1080×1080 Instagram post + 728×90 banner), the banner becomes literally 90 pixels tall in the editor—completely unusable for design work.

**Root Cause:** Pages render at their exact pixel dimensions. A 728×90 banner is displayed at 728×90 pixels, making it microscopic compared to a 1080×1080 square.

## Solution: Normalized Coordinate System

All pages edit in a **normalized coordinate space** with a consistent baseline size, then export scales back to real pixel dimensions.

---

## Core Concept

### 1. Normalized Canvas Size

**Standard Height:** `NORMALIZED_HEIGHT = 1000 units`

**Width Calculation:** `normalizedWidth = NORMALIZED_HEIGHT × aspectRatio`

### 2. Transformation Examples

| Ad Size | Real Pixels | Aspect Ratio | Normalized (Editor) | Scale Factor (Export) |
|---------|-------------|--------------|---------------------|----------------------|
| Instagram Square | 1080×1080 | 1:1 | 1000×1000 | 1.08x |
| Instagram Story | 1080×1920 | 9:16 | 563×1000 | 1.92x (height) |
| Leaderboard | 728×90 | 8.09:1 | **8089×1000** ✅ | 0.09x (height) |
| Med Rectangle | 300×250 | 1.2:1 | 1200×1000 | 0.25x (height) |
| YouTube Thumb | 1920×1080 | 16:9 | 1778×1000 | 1.08x (height) |

**Key Insight:** The 728×90 banner becomes 1000px tall (workable!) instead of 90px (microscopic).

---

## Implementation Architecture

### Phase 1: Data Model Changes

#### A. Update Frame Storage

**Before (Pixel Coordinates):**
```typescript
page.frames = {
  "728x90": {
    "headline": { x: 50, y: 20, width: 628, height: 50 }
  }
}
```

**After (Normalized Coordinates):**
```typescript
page.frames = {
  "728x90": {
    "headline": {
      x: 450,      // Normalized to 1000-unit space
      y: 222,
      width: 5656,
      height: 556
    }
  }
}
```

#### B. Add Normalization Metadata

```typescript
export interface Page {
  id: string
  name: string
  slots: Slot[]
  frames: Record<string, Record<string, Frame>>
  backgroundColor?: string
  preferredRatio?: string
  coordinateSystem?: 'normalized' | 'pixel'  // NEW: Track which system
  normalizedHeight?: number                   // NEW: Store normalization height
}
```

#### C. Constants File

```typescript
// src/editor/normalization.ts

export const NORMALIZED_HEIGHT = 1000

/**
 * Get normalized dimensions for a ratio ID
 */
export function getNormalizedDimensions(ratioId: string): { w: number; h: number } {
  const aspectRatio = parseAspectRatio(ratioId)
  return {
    w: Math.round(NORMALIZED_HEIGHT * aspectRatio),
    h: NORMALIZED_HEIGHT
  }
}

/**
 * Parse aspect ratio from ratio ID
 * Examples: "728x90" → 8.09, "16:9" → 1.778, "1:1" → 1
 */
export function parseAspectRatio(ratioId: string): number {
  // Pixel format: "728x90"
  const pixelMatch = ratioId.match(/^(\d+)x(\d+)$/)
  if (pixelMatch) {
    return parseInt(pixelMatch[1]) / parseInt(pixelMatch[2])
  }

  // Aspect format: "16:9"
  const aspectMatch = ratioId.match(/^(\d+):(\d+)$/)
  if (aspectMatch) {
    return parseInt(aspectMatch[1]) / parseInt(aspectMatch[2])
  }

  return 1 // Fallback to square
}

/**
 * Get export (pixel) dimensions for a ratio ID
 */
export function getExportDimensions(ratioId: string): { w: number; h: number } {
  // Pixel format: return as-is
  const pixelMatch = ratioId.match(/^(\d+)x(\d+)$/)
  if (pixelMatch) {
    return {
      w: parseInt(pixelMatch[1]),
      h: parseInt(pixelMatch[2])
    }
  }

  // Aspect format: calculate standard dimensions
  const aspectMatch = ratioId.match(/^(\d+):(\d+)$/)
  if (aspectMatch) {
    const w = parseInt(aspectMatch[1])
    const h = parseInt(aspectMatch[2])

    if (w === h) {
      return { w: 1080, h: 1080 }
    } else if (w > h) {
      const baseWidth = 1920
      return { w: baseWidth, h: Math.round((baseWidth * h) / w) }
    } else {
      const baseWidth = 1080
      return { w: baseWidth, h: Math.round((baseWidth * h) / w) }
    }
  }

  return { w: 1080, h: 1080 }
}

/**
 * Calculate scale factor from normalized to export pixels
 */
export function getExportScale(ratioId: string): { scaleX: number; scaleY: number } {
  const normalized = getNormalizedDimensions(ratioId)
  const exported = getExportDimensions(ratioId)

  return {
    scaleX: exported.w / normalized.w,
    scaleY: exported.h / normalized.h
  }
}
```

---

### Phase 2: Canvas Rendering Updates

#### A. Update `getPageDimensions()` in CanvasStage.tsx

**Before:**
```typescript
function getPageDimensions(page: Page, template: Template): { id: string; w: number; h: number } {
  const preferredRatio = page.preferredRatio || template.canvas?.ratios?.[0] || '1080x1080'
  // Returns real pixel dimensions
  return ratioToDimensions(preferredRatio)
}
```

**After:**
```typescript
function getPageDimensions(page: Page, template: Template): { id: string; w: number; h: number } {
  const preferredRatio = page.preferredRatio || template.canvas?.ratios?.[0] || '1080x1080'

  // Always return NORMALIZED dimensions for editing
  const normalized = getNormalizedDimensions(preferredRatio)

  return {
    id: preferredRatio,
    w: normalized.w,
    h: normalized.h
  }
}
```

#### B. Update SvgStage to Use Normalized ViewBox

**src/editor/svg/SvgStage.tsx:**
```typescript
// Use normalized dimensions for viewBox
const normalizedDims = getNormalizedDimensions(ratioId)
const viewBox: [number, number, number, number] = [0, 0, normalizedDims.w, normalizedDims.h]
```

---

### Phase 3: Export Scaling

#### A. Update ExportModal to Scale on Export

**src/components/ExportModal.tsx:**

```typescript
const exportSingleSize = async (size: { id: string; w: number; h: number }, filename?: string) => {
  const selector = currentPageId
    ? `svg[data-canvas-svg="true"][data-page-id="${currentPageId}"]`
    : 'svg[data-canvas-svg="true"]'

  const svgElement = document.querySelector(selector) as SVGSVGElement
  if (!svgElement) {
    throw new Error('No SVG canvas found')
  }

  // Get export dimensions (real pixels)
  const exportDims = getExportDimensions(size.id)
  const exportFilename = filename || `template-${exportDims.w}x${exportDims.h}`

  if (format === 'svg') {
    // Clone SVG and update viewBox to export dimensions
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement

    // Scale content from normalized space to export space
    const scale = getExportScale(size.id)
    const contentGroup = svgClone.querySelector('g[data-content]')
    if (contentGroup) {
      contentGroup.setAttribute('transform', `scale(${scale.scaleX}, ${scale.scaleY})`)
    }

    svgClone.setAttribute('viewBox', `0 0 ${exportDims.w} ${exportDims.h}`)
    svgClone.setAttribute('width', String(exportDims.w))
    svgClone.setAttribute('height', String(exportDims.h))

    const svgString = exportSVG(svgClone)
    downloadSVG(svgString, `${exportFilename}.svg`)
  } else {
    // PNG/JPEG: Export at real pixel dimensions
    await exportAndDownload(
      svgElement,
      {
        width: exportDims.w,
        height: exportDims.h,
        format,
        quality: quality / 100,
        multiplier: scale
      },
      `${exportFilename}.${format}`
    )
  }
}
```

---

### Phase 4: Migration Strategy

#### A. Detect Legacy Templates

```typescript
// src/utils/normalizationMigration.ts

export function needsNormalization(page: Page): boolean {
  // If coordinateSystem is set, it's already been migrated
  if (page.coordinateSystem === 'normalized') return false

  // If no coordinateSystem flag, it's legacy (pixel-based)
  return true
}

export function migratePageToNormalized(page: Page, template: Template): Page {
  if (!needsNormalization(page)) return page

  const preferredRatio = page.preferredRatio || Object.keys(page.frames)[0] || '1080x1080'
  const exportDims = getExportDimensions(preferredRatio)
  const normalizedDims = getNormalizedDimensions(preferredRatio)

  // Calculate scale from pixel space to normalized space
  const scaleX = normalizedDims.w / exportDims.w
  const scaleY = normalizedDims.h / exportDims.h

  // Scale all frames
  const migratedFrames: Record<string, Record<string, Frame>> = {}

  Object.keys(page.frames).forEach(ratioId => {
    const ratioFrames = page.frames[ratioId]
    migratedFrames[ratioId] = {}

    Object.keys(ratioFrames).forEach(slotName => {
      const frame = ratioFrames[slotName]
      migratedFrames[ratioId][slotName] = {
        x: frame.x * scaleX,
        y: frame.y * scaleY,
        width: frame.width * scaleX,
        height: frame.height * scaleY,
        rotation: frame.rotation
      }
    })
  })

  return {
    ...page,
    frames: migratedFrames,
    coordinateSystem: 'normalized',
    normalizedHeight: NORMALIZED_HEIGHT
  }
}
```

#### B. Auto-Migrate on Load

**src/state/editorStore.ts:**
```typescript
setTemplate: (template) => {
  if (!template) {
    set({ template: null })
    return
  }

  // Auto-migrate legacy templates to normalized coordinates
  const migratedTemplate = {
    ...template,
    pages: template.pages.map(page => migratePageToNormalized(page, template))
  }

  set({ template: migratedTemplate })
}
```

---

### Phase 5: UI Enhancements

#### A. On-Canvas Size Indicator

Add a subtle badge showing real pixel dimensions:

```typescript
// In CanvasStage.tsx, for each page:
<div style={{
  position: 'absolute',
  top: 8,
  right: 8,
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontFamily: 'monospace'
}}>
  {exportDims.w}×{exportDims.h}px
</div>
```

#### B. Normalized Safe Area Guides

Update safe area to use percentage instead of fixed pixels:

```typescript
// Before: Hard-coded 32px padding
<rect x={32} y={32} width={pageDimensions.w - 64} height={pageDimensions.h - 64} />

// After: 3% padding (scales with page size)
const padding = pageDimensions.w * 0.03
<rect
  x={padding}
  y={padding}
  width={pageDimensions.w - padding * 2}
  height={pageDimensions.h - padding * 2}
/>
```

---

## Benefits

1. **✅ Usable Editing:** All ad sizes are workable—no more microscopic 90px banners
2. **✅ Consistent UX:** Similar editing experience across all ratios
3. **✅ Accurate Export:** Still exports at exact pixel dimensions (728×90, 300×250, etc.)
4. **✅ Simpler Math:** All coordinate calculations use same normalized space
5. **✅ Better Zoom:** Pages of similar visual size reduce excessive scrolling
6. **✅ Backward Compatible:** Auto-migration handles legacy templates

## Drawbacks & Mitigations

| Issue | Mitigation |
|-------|-----------|
| Can't preview exact pixel density | Add optional "1:1 Pixel Preview" toggle |
| Breaking change to templates | Auto-migration on load + version flag |
| Export complexity increases | Encapsulate in `getExportScale()` helper |
| Font sizes feel different | Use relative font sizing (% of height) |

---

## Implementation Checklist

### Phase 1: Foundation (2-3 files)
- [ ] Create `src/editor/normalization.ts` with helper functions
- [ ] Update `Page` interface in `src/schema/types.ts`
- [ ] Create `src/utils/normalizationMigration.ts`

### Phase 2: Rendering (2-3 files)
- [ ] Update `getPageDimensions()` in `src/components/CanvasStage.tsx`
- [ ] Update `SvgStage.tsx` viewBox to use normalized dimensions
- [ ] Update `SvgStageV2.tsx` viewBox to use normalized dimensions
- [ ] Fix safe area guides to use percentage-based padding

### Phase 3: Export (1-2 files)
- [ ] Update `ExportModal.tsx` to scale normalized → pixel on export
- [ ] Update `pngExport.ts` to handle normalized coordinates
- [ ] Update `svgExport.ts` to handle normalized coordinates

### Phase 4: State Management (1 file)
- [ ] Update `editorStore.ts` to auto-migrate on `setTemplate()`
- [ ] Update `addSlot()` to use normalized coordinates
- [ ] Update `onSlotModified()` to store normalized coordinates

### Phase 5: Polish (2-3 files)
- [ ] Add on-canvas pixel size indicator
- [ ] Update zoom calculations for normalized pages
- [ ] Add optional "Pixel Preview" toggle (future)

---

## Open Questions

1. **Font Sizing:** Should fonts scale with normalized height, or stay absolute?
   - **Recommendation:** Keep fonts absolute (12pt = 12pt) for WYSIWYG accuracy

2. **Snap Grid:** Should grid be normalized or pixel-based?
   - **Recommendation:** Normalized (e.g., 1% of height = 10 units)

3. **History/Undo:** Do undo snapshots need coordinate system awareness?
   - **Recommendation:** Store `coordinateSystem` flag with each history entry

4. **Template JSON Schema:** Update required properties?
   - **Recommendation:** Add optional `coordinateSystem`, `normalizedHeight` fields

---

## Testing Strategy

### Unit Tests
```typescript
describe('Normalization', () => {
  it('converts 728x90 to 8089x1000', () => {
    expect(getNormalizedDimensions('728x90')).toEqual({ w: 8089, h: 1000 })
  })

  it('calculates correct export scale', () => {
    const scale = getExportScale('728x90')
    expect(scale.scaleX).toBeCloseTo(0.09)
    expect(scale.scaleY).toBeCloseTo(0.09)
  })

  it('migrates pixel frames to normalized', () => {
    const legacyPage = {
      frames: { '728x90': { headline: { x: 50, y: 20, width: 628, height: 50 } } }
    }
    const migrated = migratePageToNormalized(legacyPage, template)
    expect(migrated.frames['728x90'].headline.y).toBeGreaterThan(200)
  })
})
```

### Integration Tests
- Load legacy 728×90 template → should auto-migrate
- Edit normalized 728×90 page → frame coordinates should be ~1000 units
- Export normalized page → output should be 728×90 pixels

### Visual QA
- [ ] 728×90 banner is now ~1000px tall and editable
- [ ] 1080×1080 stays ~1000×1000 (minimal change)
- [ ] Safe area guides scale proportionally
- [ ] Export produces correct pixel dimensions

---

## Rollout Plan

### Step 1: Feature Flag (Week 1)
```typescript
const USE_NORMALIZED_COORDS = import.meta.env.VITE_NORMALIZED_COORDS === 'true'
```
Test internally with flag enabled

### Step 2: Migration Testing (Week 2)
- Load all existing templates
- Verify auto-migration works
- Check export accuracy

### Step 3: Gradual Rollout (Week 3)
- Enable for new templates only
- Migrate existing templates on save

### Step 4: Full Migration (Week 4)
- Auto-migrate all templates on load
- Remove feature flag
- Document breaking changes

---

## Conclusion

The normalized-ratio approach is the **correct architectural decision**. It solves the fundamental UX problem (microscopic banners), simplifies coordinate math, and maintains export accuracy.

**Recommendation: Proceed with implementation.** The benefits far outweigh the migration effort.
