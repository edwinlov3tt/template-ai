# Custom Font Hosting Guide

This note captures a roadmap for adding self-hosted fonts alongside the existing Google Fonts loader. Use it as the starting point when we wire up custom font delivery.

## Goals
- Reduce dependency on Google Fonts for frequent hits or rate limits.
- Allow teams to upload licensed fonts (e.g. corporate branding) and serve them from our own storage.
- Keep the `fontLoader` API surface stable so the editor keeps working even if a font comes from multiple backends.

## High-Level Approach
1. **Provide a manifest** that maps font families and weights to one or more file URLs we control.
2. **Extend the loader** to look up custom entries before falling back to Google Fonts.
3. **Register fonts via the FontFace API**, mirroring how browsers handle local font files.
4. **Cache results** so repeated loads avoid duplicate network fetches.
5. **Expose a hook in the UI** (import dialogue or settings) to upload font files and update the manifest.

## Hosting Options
- **Static asset bucket** (S3, GCS, Azure Blob) fronted by a CDN. Store `.woff2` first, fall back to `.woff` / `.ttf` only if needed.
- **Company CMS or API** that returns signed URLs per font. Ensure CORS allows `GET` from the editor origin and `Content-Type` matches the font MIME type.
- **Local development folder**: point Vite to serve `/public/fonts/...` for quick iteration.

## Manifest Shape
Example JSON delivered at build time or via an API request:

```json
{
  "families": {
    "Acme Sans": {
      "normal": {
        "400": ["https://cdn.example.com/fonts/acme-sans-regular.woff2"],
        "700": ["https://cdn.example.com/fonts/acme-sans-bold.woff2"]
      },
      "italic": {
        "400": ["https://cdn.example.com/fonts/acme-sans-italic.woff2"]
      }
    },
    "Brand Serif": {
      "normal": {
        "400": ["/fonts/brand-serif-regular.woff2", "/fonts/brand-serif-regular.woff"]
      }
    }
  }
}
```

Notes:
- Order URLs by preference; the loader should try each until one succeeds.
- Split by style (`normal`, `italic`) so we can register FontFace instances correctly.
- Keep weights numeric strings (100–900) to align with our existing normalization.

## Loader Extensions
Implementation sketch when we are ready to build it:

1. **Manifest ingestion**
   - Expose `loadCustomFonts(manifest: CustomFontManifest)`.
   - Store manifest inside `fontLoader` or a sibling module (`customFontRegistry`).

2. **Lookup path**
   - On `loadFont(family, weight)`, normalize the family.
   - If that family exists in the manifest for the requested style/weight, skip Google Fonts and fetch the custom asset instead.

3. **Loading via FontFace**
   ```ts
   const face = new FontFace(family, `url(${url}) format('woff2')`, {
     style: fontStyle,
     weight: fontWeight
   })
   await face.load()
   document.fonts.add(face)
   ```
   - Wrap in try/catch so we fall back to the next URL or back to Google if every custom URL fails.
   - Mark the font as loaded in the same `loadedFonts` map to keep caching consistent.

4. **Preloading on template import**
   - When `preloadTemplateFonts` gathers fonts, it should call the custom loader first to warm up any branded assets.

5. **Persistence for uploads**
   - If we add UI for uploads, push metadata to the backend and rebuild the manifest response. Until then, the manifest can live in source control or as a JSON config in `public/`.

## Operational Considerations
- **CORS**: Ensure `Access-Control-Allow-Origin` covers the editor domain. Fonts require proper CORS headers.
- **Caching**: Serve fonts with long-lived `Cache-Control` but version filenames (`font-v2.woff2`) to bust caches when updating files.
- **Fallbacks**: Provide a system font fallback for each custom family so text still renders while the custom file is loading.
- **Licensing**: Verify redistribution rights before bundling any commercial fonts.
- **Monitoring**: Track CDN hits and loader errors (e.g. via console logging hooks) to catch 404s early.

## Future Enhancements
- Add a CLI (`npm run fonts:sync`) that uploads new files to the CDN and regenerates the manifest automatically.
- Support variable fonts by allowing the manifest to list a `variationAxes` block for `FontFace` descriptors.
- Introduce user-level font libraries stored with their account so multiple workspaces can maintain separate brand kits.

Use this document as the scaffold when we carve out the actual implementation. When development starts, copy the manifest interface and loader changes into the repository and link back here for traceability.
