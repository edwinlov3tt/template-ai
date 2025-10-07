# Task: Image Palette Worker (Phase 3, image color extraction)

## Context
- Purpose: Extract dominant + palette colors from images using Web Worker, populate Photo Colors section
- Read:
  - docs/refactor/IMAGE_PALETTE_SPEC.md
  - docs/refactor/COLOR_SYSTEM_OVERVIEW.md

## Requirements
- Install dependencies: `npm install color-thief`
- Create: `src/workers/paletteWorker.ts` — Web Worker for color extraction
- Create: `src/hooks/useImagePalette.ts` — React hook for palette management
- Create: `src/components/color/PhotoColorsModal.tsx` — Expanded photo colors view
- Create: `src/components/color/ChangeAllDialog.tsx` — Batch color replacement
- Create: `src/editor/color/imageHash.ts` — Image hashing utilities
- Create: `src/editor/color/paletteCache.ts` — LocalStorage cache manager
- Create tests: `src/workers/__tests__/paletteWorker.test.ts`

## API (public)
### Worker Message Protocol
```typescript
// Main → Worker
type ExtractPaletteMessage = {
  type: 'extract-palette';
  id: string;
  imageUrl: string;
  options?: { colorCount?: number; quality?: number };
};

// Worker → Main
type PaletteResultMessage = {
  type: 'palette-result';
  id: string;
  imageUrl: string;
  palette: string[];  // hex colors
  dominant: string;
  error?: string;
};
```

### Store Actions
- `setImagePalette(imageUrl: string, palette: string[]): void`
- `extractAllImagePalettes(): void`

### Hook API
```typescript
const { palettes, extractPalette } = useImagePalette();
// palettes: Record<string, string[]>
// extractPalette(imageUrl: string): void
```

## Behavior
- Worker receives ImageBitmap or URL
- Extracts 6 colors using color-thief
- Returns hex color array
- Caches per image URL in localStorage (7 day TTL)
- Main thread triggers extraction on image load
- Photo Colors section shows thumbnails + extracted swatches
- "Change all" button replaces all matching fills

## UI Updates
- Update PhotoColors.tsx to display extracted palettes
- Add ChangeAllDialog for batch color replacement
- Expand modal shows all image palettes with "Change all" button

## Caching
### In-Memory
- Store in editorStore.imagePalettes (session only)

### LocalStorage (Optional)
- Key: `image-palette:${imageHash}`
- Value: JSON.stringify(palette)
- TTL: 7 days
- Reduces redundant extraction

## Guardrails
- MUST run extraction in Worker (never main thread)
- Use ImageBitmap when possible (faster than Image)
- Cache aggressively (avoid redundant work)
- Error boundaries (palette failures don't crash UI)
- CORS-aware (handle cross-origin images)

## Tests
- Worker message passing
- Palette extraction (mock images)
- Cache hit avoids re-extraction
- "Change all" updates multiple slots
- Hash calculation (deterministic)

## Performance
- Extraction completes in < 500ms for 1MB image
- Worker doesn't block main thread
- Cache reduces redundant work

## References
- color-thief — https://lokeshdhakar.com/projects/color-thief/
- Web Workers — https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- ImageBitmap — https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
- SubtleCrypto — https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
