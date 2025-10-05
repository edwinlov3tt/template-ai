# Canva SVG Import Guide

## What Changed

Template AI now supports importing SVGs from Canva and other design tools, even without `data-slot` attributes.

### Key Improvements:

1. **✅ Fixed SVGO Browser Error** - Removed SVGO optimization from browser (it required Node.js modules)
2. **✅ Auto-Detection** - Automatically detects text, shapes, and images from any SVG
3. **✅ Large File Warnings** - Warns about files >1MB and recommends best practices
4. **✅ SVG2 Compliance** - Detects deprecated `xlink:href` usage

## For Designers: Best Practices

### ✅ Recommended: Use Placeholder Rectangles

**Why?** Smaller files, faster loading, easier to edit, no browser compatibility issues.

1. In Canva, use **rectangles** for photo placeholders
2. Add text as **editable text** (not outlined paths)
3. Keep filters/masks minimal
4. Export as SVG

**Template AI will:**
- Auto-detect all elements
- Let you assign slot names
- Swap placeholders with real images later

### ⚠️ Acceptable: Embedded Images (with caveats)

If your SVG has embedded base64 images:
- Expect **larger file sizes** (10MB+ possible)
- May have **rendering issues** with masks/clips
- **Slower** import and preview

**Recommendations:**
- Export from Canva **without** embedded photos when possible
- Use placeholders for photos, real images for logos/icons only

## Technical Details

### Auto-Detection Rules

When no `data-slot` attributes found:

| Element Type | Detection Criteria | Slot Name |
|--------------|-------------------|-----------|
| Text         | `<text>` width >10px, height >5px | `text-1`, `text-2`, ... |
| Shape        | `<rect>` width >20px, height >20px | `shape-1`, `shape-2`, ... |
| Image        | `<image>` with href/xlink:href | `image-1`, `image-2`, ... |

### Warnings You Might See

| Warning | Meaning | Action |
|---------|---------|--------|
| "Large file detected (20MB)" | File has embedded images | Export without images or use placeholders |
| "SVG uses deprecated xlink:href" | Old SVG format | Update to `href` (SVG2 standard) |
| "SVG contains <mask> elements" | Complex rendering | May not display perfectly in canvas |
| "Auto-detected X elements" | No data-slot attributes | Elements detected automatically |

## Adding data-slot Attributes (Optional)

For **precise control**, add `data-slot` attributes in your SVG code:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect data-slot="bg" x="0" y="0" width="1080" height="1080" fill="#0e1a33"/>
  <rect data-slot="logo" x="40" y="40" width="160" height="60" fill="#1fb6ff" />
  <text data-slot="headline" x="40" y="180" fill="#ffffff" font-size="56">Modern Home For Sale</text>
  <text data-slot="subhead" x="40" y="240" fill="#cbd5e1" font-size="24">A lovely 2BR with tons of light.</text>
  <rect data-slot="cta" x="40" y="980" width="200" height="60" rx="12" fill="#f97316" />
</svg>
```

**Standard Slot Names:**
- `bg` - Background
- `subject` / `product` - Main image
- `logo` - Brand logo
- `headline` - Primary heading
- `subhead` - Secondary heading
- `body` - Body text
- `cta` - Call-to-action button
- `gallery-1`, `gallery-2` - Additional images

## Accessibility

Template AI enforces **WCAG 2.1** contrast requirements:

- **4.5:1** minimum for body text
- **3.0:1** minimum for large text (18pt+)

The validator will warn if your colors don't meet these standards.

## Troubleshooting

### "Module 'url' externalized for browser"
**Fixed!** This error no longer occurs. SVGO is disabled in browser mode.

### "useEffect is not defined"
**Fixed!** This was a missing import in FabricCanvas.

### "Schema validation errors"
Template AI now creates valid templates even without data-slot attributes.

### Very slow import (30+ seconds)
Your SVG likely has large embedded images. Export without embedded photos for faster imports.

## Example Workflow

1. **Design in Canva** with placeholder rectangles for photos
2. **Export as SVG**
3. **Upload to Template AI**
   - Auto-detection finds all elements
   - Warnings appear for large files or complex features
4. **Assign slot names** (or use auto-generated names)
5. **Validate** contrast and accessibility
6. **Export** final template as JSON

---

**Questions?** Check BUG_FIXES.md for technical details or IMPLEMENTATION_REVIEW.md for feature status.
