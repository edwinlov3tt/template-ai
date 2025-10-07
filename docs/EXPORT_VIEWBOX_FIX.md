# Export ViewBox Fix - Technical Analysis

## Problem Summary

PNG/JPEG exports were producing distorted or incorrectly cropped images when exporting canvases at different aspect ratios.

## Root Cause

### Architecture Issue
The template system uses a **fixed baseViewBox** coordinate system:
```typescript
template.canvas.baseViewBox = [0, 0, 1080, 1080]  // Fixed at template creation
```

But canvases can have different dimensions:
- **1:1**: 1080×1080
- **16:9**: 1920×1080
- **4:5**: 1080×1350

### The Distortion Bug
Previous export code:
```typescript
// Set viewBox to baseViewBox (wrong!)
svgClone.setAttribute('viewBox', baseViewBox)  // e.g., "0 0 1080 1080"

// Set dimensions to canvas size
svgClone.setAttribute('width', '1920')    // 16:9 width
svgClone.setAttribute('height', '1080')   // 16:9 height

// DISTORTION: Stretch viewBox to fit dimensions
svgClone.setAttribute('preserveAspectRatio', 'none')
```

**Result**: The 1080×1080 viewBox content gets stretched to fit 1920×1080, **distorting everything**.

## The Fix

### 1. Match ViewBox to Canvas Dimensions
```typescript
// Export viewBox should match the CURRENT canvas size, not baseViewBox
const exportViewBoxWidth = options.width   // e.g., 1920 for 16:9
const exportViewBoxHeight = options.height // e.g., 1080 for 16:9

svgClone.setAttribute('viewBox', `0 0 ${exportViewBoxWidth} ${exportViewBoxHeight}`)
```

### 2. Remove Distortion
```typescript
// REMOVE this line (causes distortion):
// svgClone.setAttribute('preserveAspectRatio', 'none')

// Use default behavior instead:
svgClone.removeAttribute('preserveAspectRatio')
```

### 3. Apply Resolution Multiplier Correctly
```typescript
const exportRenderWidth = options.width * options.multiplier
const exportRenderHeight = options.height * options.multiplier

svgClone.setAttribute('width', String(exportRenderWidth))
svgClone.setAttribute('height', String(exportRenderHeight))
```

## How It Works Now

### Example: Exporting 16:9 at 2x Resolution

**Input:**
- Canvas: 1920×1080 (16:9)
- Multiplier: 2x
- Content: Positioned in coordinate space

**Export SVG:**
```xml
<svg
  width="3840"           <!-- 1920 * 2 -->
  height="2160"          <!-- 1080 * 2 -->
  viewBox="0 0 1920 1080"  <!-- Matches canvas, NOT baseViewBox -->
>
  <!-- Content renders correctly without distortion -->
</svg>
```

**Result:**
- ViewBox coordinates match canvas dimensions
- Content positioned correctly in 1920×1080 space
- Canvas renders at 3840×2160 (2x resolution)
- No distortion ✅

## Potential Issue: Content Positioning

### Concern
If content frames are stored in `baseViewBox` coordinates (1080×1080), but we export with a different viewBox (1920×1080), positions won't match.

### Analysis
Looking at the codebase:
```typescript
// frames are stored per ratio
page.frames[currentRatio][slotName] = { x, y, width, height }
```

Each ratio (1:1, 16:9, etc.) has its own frame positions. This suggests:
1. **Either**: Frames are scaled/repositioned for each ratio
2. **Or**: Frames are in canvas coordinate space, not baseViewBox space

### Testing Required
1. Create template at 1:1 (1080×1080)
2. Add content (image, text) in center
3. Switch to 16:9 (1920×1080)
4. Export PNG
5. **Verify**: Content is positioned correctly

If content is mispositioned, we need to:
- Scale frame positions from baseViewBox to current canvas dimensions
- OR: Ensure frames are always in canvas coordinate space

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `/src/export/pngExport.ts` | Lines 133-156 | Fix viewBox and preserveAspectRatio |

## Console Logs for Debugging

The fix includes detailed console logs:
```
[exportToPng] Original SVG: { viewBox, width, height }
[exportToPng] Export config: { viewBox, renderDimensions, multiplier }
[exportSvgToPng] Starting export with: { width, height, format, quality, multiplier }
```

Watch for:
- Original viewBox vs export viewBox (should be different if aspect ratio changed)
- Render dimensions should be width×height×multiplier
- Check exported image matches expectations

## Testing Checklist

- [ ] Export 1:1 canvas (1080×1080) → Should work perfectly (viewBox matches baseViewBox)
- [ ] Export 16:9 canvas (1920×1080) → Check for distortion and content positioning
- [ ] Export 4:5 canvas (1080×1350) → Check for distortion and content positioning
- [ ] Export at 2x multiplier → Should be 2x larger, no distortion
- [ ] Export at 4x multiplier → Should be 4x larger, content crisp
- [ ] Export with image in center → Should stay centered
- [ ] Export with text in corner → Should stay in corner
- [ ] Compare PNG vs SVG export → Should match visually

## Rollback Plan

If this fix causes positioning issues:

1. **Revert to preserving baseViewBox** but fix preserveAspectRatio:
   ```typescript
   svgClone.setAttribute('viewBox', originalViewBox)
   svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet')
   ```
   - This will letterbox content for different ratios
   - Better than distortion, but not ideal

2. **Implement frame coordinate transformation**:
   - Scale frame positions from baseViewBox to canvas dimensions
   - More complex but handles all cases

## Related Documentation

- [EXPORT_FEATURE.md](./EXPORT_FEATURE.md) - Full export feature overview
- [EXPORT_FIX.md](./EXPORT_FIX.md) - CORS and selection bug fixes
- [CANVAS_ARCHITECTURE.md](./CANVAS_ARCHITECTURE.md) - Canvas coordinate systems

## Next Steps

1. Test all canvas ratios
2. If positioning is correct → Update documentation, remove debug logs
3. If positioning is wrong → Implement coordinate transformation
4. Consider updating SvgStage to use dynamic viewBox matching canvas dimensions (architectural change)
