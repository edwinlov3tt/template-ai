# Image Palette Extraction — Spec

**Goal:** Auto-extract dominant and palette colors from images using a Web Worker, display in Photo Colors section, enable "Change all" batch operations.

## Architecture

### Web Worker Pipeline

Create `src/workers/paletteWorker.ts`:

**Responsibilities:**
- Receives image data from main thread
- Extracts dominant + palette colors using color-thief or node-vibrant
- Returns hex color array
- Caches results per image URL/hash

**Message Protocol:**
```typescript
// Main → Worker
type ExtractPaletteMessage = {
  type: 'extract-palette';
  id: string;              // request ID for response matching
  imageUrl: string;
  imageBitmap?: ImageBitmap;  // alternative to URL
  options?: {
    colorCount?: number;   // default 6
    quality?: number;      // default 10
  };
};

// Worker → Main
type PaletteResultMessage = {
  type: 'palette-result';
  id: string;
  imageUrl: string;
  palette: string[];       // hex colors
  dominant: string;        // most prominent color
  error?: string;
};
```

**Implementation:**
```typescript
import ColorThief from 'color-thief';
// or
import Vibrant from 'node-vibrant';

self.onmessage = async (e: MessageEvent<ExtractPaletteMessage>) => {
  const { type, id, imageUrl, imageBitmap, options } = e.data;

  if (type === 'extract-palette') {
    try {
      // Load image in worker context
      const img = imageBitmap || await loadImage(imageUrl);

      // Extract palette
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, options?.colorCount || 6);
      const dominant = colorThief.getColor(img);

      // Convert RGB arrays to hex
      const paletteHex = palette.map(rgbToHex);
      const dominantHex = rgbToHex(dominant);

      self.postMessage({
        type: 'palette-result',
        id,
        imageUrl,
        palette: paletteHex,
        dominant: dominantHex
      });
    } catch (error) {
      self.postMessage({
        type: 'palette-result',
        id,
        imageUrl,
        palette: [],
        dominant: '#000000',
        error: error.message
      });
    }
  }
};
```

## Main Thread Integration

Create `src/hooks/useImagePalette.ts`:

**Public API:**
```typescript
export function useImagePalette() {
  const [palettes, setPalettes] = useState<Record<string, string[]>>({});
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/paletteWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<PaletteResultMessage>) => {
      if (e.data.type === 'palette-result') {
        setPalettes(prev => ({
          ...prev,
          [e.data.imageUrl]: e.data.palette
        }));
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const extractPalette = useCallback((imageUrl: string) => {
    if (palettes[imageUrl]) return; // already cached

    workerRef.current?.postMessage({
      type: 'extract-palette',
      id: crypto.randomUUID(),
      imageUrl,
      options: { colorCount: 6, quality: 10 }
    });
  }, [palettes]);

  return { palettes, extractPalette };
}
```

## Store Integration

Update `src/state/editorStore.ts`:

**New State:**
```typescript
interface EditorState {
  // ... existing
  imagePalettes: Record<string, string[]>;  // imageUrl → hex colors
}
```

**New Actions:**
```typescript
setImagePalette(imageUrl: string, palette: string[]): void
extractAllImagePalettes(): void  // scans all image slots, triggers extraction
```

**Auto-extraction:**
- On template load → call `extractAllImagePalettes()`
- On image slot added → call `extractPalette(imageUrl)`
- On image URL changed → call `extractPalette(newUrl)`

## UI Component

Update `src/components/color/PhotoColors.tsx`:

**Layout (from screenshots):**
- Each row: 1 thumbnail + 5 color swatches
- Thumbnail: 32px × 32px, shows image preview
- Swatches: 32px × 32px circles
- Gap: 8px
- Max 3 rows in collapsed view
- "See all" button expands to modal

**Expanded Modal:**
- Back button + "Photo colors" title
- Full grid: all images × their palettes
- "Change all" button at bottom
- Click swatch → selects it
- Click "Change all" → opens remap dialog

### Change All Dialog

Create `src/components/color/ChangeAllDialog.tsx`:

**UI:**
- Shows selected "from" color swatch
- Arrow icon (→)
- "To" color swatch (initially same as "from")
- Color picker to choose new color
- "Change all" button (primary)
- "Cancel" button

**Behavior:**
- Find all slots with fill matching "from" color
- Update each to "to" color
- Add to history as single action: "Changed all {fromColor} to {toColor}"

## Caching Strategy

### In-Memory Cache
- Store in editorStore.imagePalettes
- Key: image URL or hash
- Value: hex color array
- Persists during session only

### LocalStorage Cache (Optional)
- Key: `image-palette:${imageHash}`
- Value: JSON.stringify(palette)
- TTL: 7 days
- Reduces redundant extraction

### Hash Calculation
```typescript
async function hashImage(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Dependencies

Install:
```bash
npm install color-thief
# or
npm install node-vibrant
```

**Comparison:**
- **color-thief** — Simpler API, smaller bundle, good for basic palettes
  https://lokeshdhakar.com/projects/color-thief/
- **node-vibrant** — More sophisticated, better color selection, larger bundle
  https://github.com/Vibrant-Colors/node-vibrant

**Recommendation:** Start with color-thief, upgrade to vibrant if quality issues.

## Testing

### Unit Tests
- Worker message passing
- Palette extraction (mock images)
- Hash calculation (deterministic)

### Integration Tests
- Image load → palette appears
- "Change all" updates multiple slots
- Cache hit avoids re-extraction

### Performance Tests
- Extraction completes in < 500ms for 1MB image
- Worker doesn't block main thread
- Cache reduces redundant work

## Error Handling

- Image load failure → show placeholder palette (grays)
- Worker timeout → retry once, then fallback
- Unsupported image format → skip palette
- CORS issues → display warning tooltip

## Files to Create

```
src/workers/
  paletteWorker.ts              - Web Worker for color extraction

src/hooks/
  useImagePalette.ts            - React hook for palette management

src/components/color/
  PhotoColors.tsx               - Photo colors section
  PhotoColorsModal.tsx          - Expanded view
  ChangeAllDialog.tsx           - Batch color replacement

src/editor/color/
  imageHash.ts                  - Image hashing utilities
  paletteCache.ts               - LocalStorage cache manager
```

## Guardrails

1. **Worker-only extraction** — never run color-thief on main thread
2. **ImageBitmap when possible** — faster than Image element
3. **Cache aggressively** — avoid redundant extractions
4. **Error boundaries** — palette failures don't crash UI
5. **CORS-aware** — handle cross-origin images gracefully

## References

- **color-thief** — https://lokeshdhakar.com/projects/color-thief/
- **node-vibrant** — https://github.com/Vibrant-Colors/node-vibrant
- **Web Workers** — https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- **ImageBitmap** — https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
- **SubtleCrypto** — https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
