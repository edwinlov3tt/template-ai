# Export Bug Fix - Blank PNG/JPEG Exports

## Problem

PNG and JPEG exports were producing blank/white images with no content visible.

## Root Causes Identified

### 1. **Incorrect SVG Selection**
- **Issue**: The export code used `document.querySelector('svg[viewBox]')` to find the canvas SVG
- **Problem**: This selector is too generic and could select:
  - The wrong SVG if multiple pages exist
  - UI icon SVGs instead of the canvas
  - The first SVG regardless of which page is active
- **Impact**: Export grabbed the wrong SVG element or an empty one

### 2. **Dimension Mismatch Between SVG and Canvas**
- **Issue**: Canvg rendering used `scaleWidth` and `scaleHeight` options incorrectly
- **Problem**:
  - The SVG has its own `width`, `height`, and `viewBox` attributes
  - Canvg's scale options conflicted with these attributes
  - The multiplier was applied inconsistently
- **Impact**: Content rendered at wrong scale or not at all

### 3. **No Multi-Page Support**
- **Issue**: When template has multiple pages, all pages rendered but wrong one exported
- **Problem**: No way to specify which page to export
- **Impact**: First page always exported, even if different page was active

## Fixes Applied

### Fix 1: Added Unique SVG Identifier
**Files Modified:**
- `/src/editor/svg/SvgStage.tsx` (line 245-246)
- `/src/editor/svg-v2/SvgStageV2.tsx` (line 270-271)

**Changes:**
```tsx
// Added data attributes to identify canvas SVG
<svg
  data-canvas-svg="true"
  data-page-id={page?.id}
  viewBox={...}
  width={...}
  height={...}
>
```

**Why This Works:**
- `data-canvas-svg="true"` uniquely identifies the main canvas (not UI SVGs)
- `data-page-id` allows selecting specific page in multi-page templates
- Provides reliable selector for export

### Fix 2: Improved SVG Dimension Handling
**File Modified:**
- `/src/export/pngExport.ts` (line 83-127)

**Changes:**
```typescript
// Clone SVG and set correct dimensions
const svgClone = svgElement.cloneNode(true) as SVGSVGElement
svgClone.setAttribute('width', String(options.width * options.multiplier))
svgClone.setAttribute('height', String(options.height * options.multiplier))
if (viewBox) {
  svgClone.setAttribute('viewBox', viewBox)
}

// Pass multiplied dimensions, set multiplier to 1
return exportSvgToPng(svgString, options.width * options.multiplier, options.height * options.multiplier, {
  ...options,
  multiplier: 1 // Already applied
})
```

**Why This Works:**
- Dimensions set directly on SVG element (not via Canvg options)
- ViewBox preserved for proper aspect ratio
- Multiplier applied once, consistently
- Canvg receives properly sized SVG to render

### Fix 3: Current Page Selection
**Files Modified:**
- `/src/components/ExportModal.tsx` (line 11, 14, 27-31)
- `/src/App.tsx` (line 418)

**Changes:**
```typescript
// ExportModal receives currentPageId prop
interface ExportModalProps {
  currentPageId?: string | null
  // ...
}

// Build selector for current page
const selector = currentPageId
  ? `svg[data-canvas-svg="true"][data-page-id="${currentPageId}"]`
  : 'svg[data-canvas-svg="true"]'

const svgElement = document.querySelector(selector) as SVGSVGElement
```

**Why This Works:**
- Exports exactly the page user is viewing
- Falls back to first canvas SVG if no page ID
- Handles both single and multi-page templates

### Fix 4: Enhanced Canvg Options
**File Modified:**
- `/src/export/pngExport.ts` (line 54-59)

**Changes:**
```typescript
const v = await Canvg.from(ctx, svgString, {
  ignoreMouse: true,      // Don't process mouse events
  ignoreAnimation: true,  // Render static snapshot
  ignoreClear: true       // Don't clear canvas before render
})
```

**Why This Works:**
- Removes unnecessary options that conflicted with SVG attributes
- Lets Canvg use SVG's native dimensions
- Focuses on accurate rendering only

### Fix 5: Debug Logging
**File Modified:**
- `/src/export/pngExport.ts` (lines 35-37, 65-66, 87-96, 112)

**Changes:**
```typescript
console.log('[exportSvgToPng] Starting export with:', { width, height, format, quality, multiplier })
console.log('[exportToPng] viewBox:', svgElement.getAttribute('viewBox'))
console.log('[ExportModal] Found SVG element:', svgElement)
```

**Why This Helps:**
- Easy troubleshooting when export fails
- Verifies correct SVG selected
- Shows dimensions being used
- Can be removed in production

## How to Test

### Test 1: Basic Export (Single Page)
1. Open app with a template
2. Ensure template has visible content (text, images, shapes)
3. Click "Export" button in top toolbar
4. Select PNG format
5. Choose 1x resolution
6. Click "Export"
7. **Expected**: PNG file downloads with visible content

### Test 2: High Resolution Export
1. Click "Export"
2. Select PNG format
3. Choose 4x resolution
4. Click "Export"
5. **Expected**:
   - PNG file is 4x larger (e.g., 1080×1080 → 4320×4320)
   - Content is sharp and clear at high zoom
   - File size significantly larger

### Test 3: JPEG Quality
1. Click "Export"
2. Select JPEG format
3. Set quality to 50%
4. Click "Export"
5. Download file (note file size)
6. Repeat with quality at 100%
7. **Expected**:
   - 50% quality: smaller file, slight compression artifacts
   - 100% quality: larger file, no visible compression
   - No transparency (white background)

### Test 4: SVG Export
1. Click "Export"
2. Select SVG format
3. Click "Export"
4. Open exported SVG in:
   - Browser (drag and drop)
   - Illustrator/Figma/Inkscape
5. **Expected**:
   - SVG displays correctly
   - Can zoom infinitely without pixelation
   - Editable in vector software

### Test 5: Multi-Page Export
1. Create template with 2+ pages
2. Add different content to each page
3. Switch to Page 2
4. Click "Export"
5. **Expected**: Export contains Page 2 content, NOT Page 1

### Test 6: Check Console Logs
1. Open browser DevTools Console
2. Click "Export" and complete export
3. **Expected logs**:
   ```
   [ExportModal] Found SVG element: <svg data-canvas-svg="true" data-page-id="...">
   [exportToPng] viewBox: 0 0 1080 1080
   [exportSvgToPng] Starting export with: { width: 1080, height: 1080, ... }
   [exportSvgToPng] Canvg instance created, rendering...
   [exportSvgToPng] Render complete
   [exportSvgToPng] DataURL generated, length: [large number]
   ```

## Verification Checklist

- [ ] PNG exports show visible content (not blank)
- [ ] JPEG exports show visible content with white background
- [ ] SVG exports contain all elements
- [ ] Resolution multipliers work (1x, 2x, 3x, 4x)
- [ ] JPEG quality slider affects file size
- [ ] Multi-page templates export current page
- [ ] Console logs show correct SVG selection
- [ ] No errors in console during export
- [ ] Exported files have correct dimensions in filename
- [ ] Images render in exported files (if template has images)

## Known Limitations

### 1. External Images with CORS ✅ FIXED
- **Issue**: External image URLs caused "Tainted canvas" security errors
- **Root Cause**: Canvas cannot export when containing cross-origin images without CORS headers
- **Solution Implemented**:
  1. Automatic conversion of external images to data URIs before export
  2. CORS-enabled image loading with `crossOrigin='anonymous'`
  3. Clear error messages explaining CORS issues
- **Fallback**: SVG export still works even with CORS-restricted images
- **How It Works**:
  - Before Canvg rendering, scan SVG for external image URLs
  - Load each image with CORS, convert to base64 data URI
  - Replace external URLs with data URIs in SVG string
  - Render to canvas (now safe from tainting)
- **Limitations**:
  - Images must be accessible (not 404)
  - If CORS fails, image conversion skipped with warning
  - Large images increase export time

### 2. Custom Web Fonts
- **Issue**: Web fonts may not embed in SVG or render in Canvg
- **Workaround**: Use system fonts or embed font data
- **Future Fix**: Automatically convert text to paths option

### 3. Complex SVG Features
- **Issue**: Some SVG filters/effects may not render in Canvg
- **Affected**: Advanced blur, lighting effects, complex gradients
- **Workaround**: Test export, simplify if needed
- **Future Fix**: Migrate to native Canvas API rendering

### 4. Performance with Large Resolutions
- **Issue**: 4x multiplier on large canvas (e.g., 1920×1080) creates 7680×4320 image
- **Impact**: Slow export, high memory usage, large file size
- **Workaround**: Use lower multiplier or smaller base size
- **Future Fix**: Add progress indicator, optimize rendering

## Technical Details

### Canvg Rendering Pipeline
```
1. Clone SVG element (avoid modifying original)
2. Set width/height attributes to final dimensions
3. Preserve viewBox for aspect ratio
4. Serialize to string with xmlns attributes
5. Create HTML canvas at target size
6. Fill background color
7. Render SVG to canvas via Canvg
8. Export canvas to PNG/JPEG data URL
9. Trigger download
```

### SVG Selection Strategy
```
Priority 1: svg[data-canvas-svg="true"][data-page-id="{currentPageId}"]
           (Specific page in multi-page template)

Priority 2: svg[data-canvas-svg="true"]
           (First canvas SVG, fallback for single page)

Priority 3: Error - "No SVG canvas found"
           (No canvas SVG exists, log available SVGs)
```

### Dimension Calculation
```
Base Size: From canvasSize (e.g., 1080×1080)
Multiplier: User selected (1x, 2x, 3x, 4x)

Final Dimensions:
  width = baseWidth × multiplier
  height = baseHeight × multiplier

Example:
  Base: 1080×1080
  Multiplier: 2x
  Final: 2160×2160
  Filename: template-2160x2160.png
```

## Cleanup TODO

Before production release:
- [ ] Remove or reduce debug console.log statements
- [ ] Add user-facing error messages (not just console errors)
- [ ] Consider progress indicator for large exports
- [ ] Add export analytics/telemetry
- [ ] Document export limitations in user help docs

## Files Changed Summary

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `/src/editor/svg/SvgStage.tsx` | 245-246 | Add data-canvas-svg identifier |
| `/src/editor/svg-v2/SvgStageV2.tsx` | 270-271 | Add data-canvas-svg identifier |
| `/src/export/pngExport.ts` | 8, 40-46, 62-68 | Import imageUtils, convert external images, add CORS handling |
| `/src/export/imageUtils.ts` | NEW FILE | Image CORS utilities (convert URLs to data URIs) |
| `/src/components/ExportModal.tsx` | 11, 14, 27-36, 70-83 | Multi-page support, better selector, CORS error messages |
| `/src/App.tsx` | 418 | Pass currentPageId to ExportModal |

Total: **6 files** (1 new), ~120 lines of code including CORS handling

## Related Documentation

- [EXPORT_FEATURE.md](./EXPORT_FEATURE.md) - Full export feature documentation
- [CANVAS_ARCHITECTURE.md](./CANVAS_ARCHITECTURE.md) - Canvas system overview
- Canvg Docs: https://github.com/canvg/canvg
