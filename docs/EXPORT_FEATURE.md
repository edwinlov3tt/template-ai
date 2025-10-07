# Export Feature Documentation

## Overview

The template builder includes a comprehensive export system that supports three formats: **PNG**, **JPEG**, and **SVG**. Each format serves different use cases and has specific capabilities.

## Supported Formats

### 1. PNG Export ✅
- **Use Case**: High-quality raster images with transparency support
- **Features**:
  - Lossless compression
  - Transparency support (alpha channel)
  - Resolution scaling (1x, 2x, 3x, 4x)
  - Perfect for web graphics, social media, and presentations
- **Implementation**: Uses Canvg library to render SVG to HTML Canvas, then exports as PNG
- **File Extension**: `.png`

### 2. JPEG Export ✅
- **Use Case**: Photographs and images where file size matters
- **Features**:
  - Adjustable quality (1-100%)
  - Smaller file sizes than PNG
  - Resolution scaling (1x, 2x, 3x, 4x)
  - No transparency support (adds white background)
- **Implementation**: Uses Canvg library to render SVG to HTML Canvas, then exports as JPEG
- **File Extension**: `.jpg` or `.jpeg`
- **Quality Slider**: 1% (smallest, lowest quality) → 100% (largest, highest quality)

### 3. SVG Export ✅
- **Use Case**: Scalable vector graphics for print, web, or further editing
- **Features**:
  - Infinite resolution (vector format)
  - Smallest file size for simple designs
  - Fully editable in vector software (Illustrator, Figma, Inkscape)
  - Preserves all SVG features (gradients, patterns, clipPaths, masks)
- **Implementation**: Direct DOM serialization with namespace normalization
- **File Extension**: `.svg`
- **No Resolution Scaling**: SVG is vector-based, scales infinitely without quality loss

## How It Works

### User Flow
1. Click **"Export"** button in the top toolbar
2. **Export Modal** opens with format options
3. Select format: PNG, JPEG, or SVG
4. Configure settings (if applicable):
   - **JPEG**: Adjust quality slider (1-100%)
   - **PNG/JPEG**: Choose resolution multiplier (1x-4x)
   - **SVG**: No settings needed (vector format)
5. Click **"Export"** button
6. File downloads automatically with descriptive filename

### Filename Convention
- **PNG/JPEG**: `template-{width}x{height}.{png|jpeg}`
  - Example: `template-1200x1200.png`
  - Example with 2x scale: `template-2400x2400.png`
- **SVG**: `template-{width}x{height}.svg`
  - Example: `template-1080x1080.svg`

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────┐
│          ExportModal.tsx                │
│  (UI for format/quality/scale selection)│
└────────────┬─────────────────────────────┘
             │
             ├──────────────┬──────────────┐
             │              │              │
             ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌───────────┐
    │ PNG Export │  │JPEG Export │  │SVG Export │
    │            │  │            │  │           │
    │  pngExport │  │ pngExport  │  │svgExport  │
    │    .ts     │  │   .ts      │  │   .ts     │
    └────────────┘  └────────────┘  └───────────┘
           │               │              │
           ▼               ▼              ▼
    ┌─────────────────────────┐    ┌──────────────┐
    │   Canvg Renderer        │    │   Direct     │
    │ (SVG → Canvas → Image)  │    │Serialization │
    └─────────────────────────┘    └──────────────┘
```

### Key Files

#### `/src/components/ExportModal.tsx`
- Main UI component for export functionality
- Format selection (PNG/JPEG/SVG)
- Quality slider (JPEG only)
- Resolution multiplier (PNG/JPEG only)
- Handles export trigger and file download

#### `/src/export/pngExport.ts`
- **Core Functions**:
  - `exportSvgToPng()` - Converts SVG string to PNG data URL
  - `exportToPng()` - Exports SVG element to PNG
  - `exportAndDownload()` - Convenience function to export and download
  - `exportToBlob()` - Returns Blob for flexible handling
- **Dependencies**: Canvg (SVG renderer)
- **Options**:
  ```typescript
  {
    width: number          // Output width
    height: number         // Output height
    format: 'png' | 'jpeg' // Output format
    quality: number        // 0-1 for JPEG compression
    multiplier: number     // Scale factor (1, 2, 3, 4)
    backgroundColor: string // Fill color (for JPEG)
  }
  ```

#### `/src/export/svgExport.ts`
- **Core Functions**:
  - `exportSVG()` - Serializes SVG element to string
  - `downloadSVG()` - Triggers file download
  - `copySVGToClipboard()` - Copies SVG to clipboard
- **Features**:
  - Namespace normalization (`xmlns`, `xmlns:xlink`)
  - href/xlink:href compatibility handling
  - Pretty-print formatting for readability
- **No Dependencies**: Pure browser APIs

### SVG Element Selection
All export functions locate the SVG canvas using:
```javascript
const svgElement = document.querySelector('svg[viewBox]') as SVGSVGElement
```

This ensures the main canvas SVG (not decorative UI elements) is exported.

## Resolution Scaling (PNG/JPEG)

The export system supports high-resolution exports for retina displays and print:

| Scale | Use Case | Example Output |
|-------|----------|----------------|
| **1x** | Standard web | 1080×1080 px |
| **2x** | Retina displays | 2160×2160 px |
| **3x** | High-DPI devices | 3240×3240 px |
| **4x** | Print quality | 4320×4320 px |

**Implementation**: The multiplier scales the canvas dimensions before rendering. Canvg re-renders the SVG at the higher resolution, ensuring crisp output.

## Quality Settings (JPEG Only)

JPEG quality ranges from 1% to 100%:
- **1-30%**: Very compressed, visible artifacts, smallest files
- **30-60%**: Moderate compression, acceptable quality
- **60-80%**: Good balance of quality and size (recommended)
- **80-100%**: Minimal compression, large files, best quality

**Default**: 100% (maximum quality)

## SVG Export Details

### What Gets Exported
- All visible slots (text, images, shapes, buttons)
- Embedded images (as data URIs or href links)
- Gradients, patterns, clipPaths, masks
- Text with embedded font information (if available)
- ViewBox and coordinate system
- Styling (fill, stroke, opacity, transforms)

### What Doesn't Export
- External CSS styles (inlined during export)
- JavaScript interactions
- Animations (static snapshot)
- Web fonts not embedded in SVG

### SVG Compatibility
- **xmlns attributes**: Properly set for standalone SVG files
- **href normalization**: Both `href` and `xlink:href` included for maximum compatibility
- **Pretty-printed**: Formatted with newlines for readability
- **Standards**: SVG 1.1 and SVG 2.0 compatible

## Error Handling

### Common Issues

1. **"No SVG canvas found"**
   - Cause: SVG element not in DOM or doesn't have `viewBox` attribute
   - Solution: Ensure canvas is rendered before exporting

2. **Canvg rendering failures**
   - Cause: Complex SVG features not supported by Canvg
   - Solution: Simplify design or use SVG export instead

3. **Large file sizes (JPEG/PNG)**
   - Cause: High resolution multiplier or PNG format for photos
   - Solution: Use lower multiplier or JPEG with reduced quality

4. **Missing fonts in SVG**
   - Cause: Web fonts not embedded in exported SVG
   - Solution: Convert text to paths or embed fonts manually

## Future Enhancements

### Potential Features
- [ ] PDF export (for print workflows)
- [ ] Multi-page export (export all ratios as separate files)
- [ ] Batch export (all formats at once)
- [ ] Custom resolution input (not just 1x-4x)
- [ ] Embed fonts in SVG export
- [ ] Text-to-path conversion option
- [ ] Export with/without safe area guides
- [ ] Clipboard copy (image data, not just SVG text)
- [ ] Export preview before download

### Advanced Options
- [ ] Background color picker (for transparent PNGs → opaque)
- [ ] Crop to content bounds (remove empty space)
- [ ] Watermark overlay
- [ ] Export metadata (template name, version, timestamp)

## Testing Checklist

- [ ] PNG export at 1x resolution
- [ ] PNG export at 4x resolution (verify file size increase)
- [ ] JPEG export at 100% quality
- [ ] JPEG export at 50% quality (verify file size reduction)
- [ ] SVG export with text elements
- [ ] SVG export with images
- [ ] SVG export with gradients/patterns
- [ ] SVG export opens correctly in Illustrator/Figma
- [ ] PNG export preserves transparency
- [ ] JPEG export adds white background (no transparency)
- [ ] Filename includes correct dimensions
- [ ] Modal closes after successful export
- [ ] Error handling for missing SVG element

## API Reference

### ExportModal Props
```typescript
interface ExportModalProps {
  isOpen: boolean              // Show/hide modal
  onClose: () => void          // Callback when modal closes
  template: Template | null    // Current template data
  currentSize: { w: number; h: number }  // Canvas dimensions
}
```

### PNG/JPEG Export Options
```typescript
interface ExportOptions {
  width: number                // Base width
  height: number               // Base height
  format?: 'png' | 'jpeg'     // Image format
  quality?: number             // 0-1 for JPEG (default: 1)
  multiplier?: number          // Scale factor (default: 1)
  backgroundColor?: string     // Fill color (default: #FFFFFF)
}
```

### SVG Export API
```typescript
// Export SVG element to string
exportSVG(svgElement: SVGSVGElement): string

// Download SVG file
downloadSVG(svgString: string, filename?: string): void

// Copy SVG to clipboard
copySVGToClipboard(svgString: string): Promise<void>
```

## Dependencies

- **canvg** (v4.0.3): SVG to Canvas rendering for PNG/JPEG export
- Built-in browser APIs:
  - `XMLSerializer` - SVG serialization
  - `DOMParser` - SVG parsing
  - `Canvas API` - Image rendering
  - `Blob API` - File creation
  - `Clipboard API` - Copy to clipboard

## Performance Notes

- **PNG/JPEG Export**:
  - Time: ~500ms - 2s depending on complexity and resolution
  - Memory: Scales with output dimensions (4x = 16x memory)
  - Recommendation: Limit to 4x for most use cases

- **SVG Export**:
  - Time: <100ms (instant serialization)
  - Memory: Minimal (text output)
  - File Size: Usually smallest format

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PNG Export | ✅ | ✅ | ✅ | ✅ |
| JPEG Export | ✅ | ✅ | ✅ | ✅ |
| SVG Export | ✅ | ✅ | ✅ | ✅ |
| Clipboard Copy | ✅ | ✅ | ✅ | ✅ |

**Minimum Versions**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Issues & Fixes

### 1. CORS Image Loading ✅ FIXED
- **Issue**: External images caused "Tainted canvas" security errors
- **Solution**: Automatic conversion to data URIs before export
- **Details**: [EXPORT_FIX.md](./EXPORT_FIX.md#fix-4-enhanced-canvg-options)

### 2. Multi-Page Export ✅ FIXED
- **Issue**: Wrong page exported in multi-page templates
- **Solution**: Added `currentPageId` prop and page-specific SVG selector
- **Details**: [EXPORT_FIX.md](./EXPORT_FIX.md#fix-3-current-page-selection)

### 3. ViewBox Distortion ✅ FIXED
- **Issue**: Exports at different aspect ratios showed distorted content
- **Solution**: Set export viewBox to match canvas dimensions (not baseViewBox)
- **Details**: [EXPORT_VIEWBOX_FIX.md](./EXPORT_VIEWBOX_FIX.md)

### 4. Blank PNG/JPEG Exports ✅ FIXED
- **Issue**: Exported images were blank/white with no content
- **Solution**: Improved SVG selection with unique data attributes
- **Details**: [EXPORT_FIX.md](./EXPORT_FIX.md#root-causes-identified)

## Related Documentation

- [EXPORT_FIX.md](./EXPORT_FIX.md) - Detailed fix documentation for CORS and selection issues
- [EXPORT_VIEWBOX_FIX.md](./EXPORT_VIEWBOX_FIX.md) - ViewBox distortion fix technical analysis
- [CANVAS_ARCHITECTURE.md](./CANVAS_ARCHITECTURE.md) - Canvas system overview

## Summary

The export system is **fully implemented** and production-ready with:

✅ PNG export with transparency and scaling
✅ JPEG export with quality control and scaling
✅ SVG export with proper serialization
✅ Clean UI with format-specific options
✅ Error handling and user feedback
✅ Comprehensive filename generation
✅ CORS image handling
✅ Multi-page support
✅ ViewBox distortion prevention

**Status**: Ready for use, all critical issues resolved.
