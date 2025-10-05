# Font Loading System

Template AI automatically loads fonts from Google Fonts when you import SVGs or work with templates.

## How It Works

### 1. Automatic Detection
When you upload an SVG (from Canva or any design tool), the importer:
- Extracts all `font-family` attributes from text elements
- Detects `font-weight` values (normal, bold, 100-900)
- Auto-loads fonts from Google Fonts API

### 2. Dynamic Loading
Fonts are loaded on-demand:
```typescript
// Automatically called on SVG import
await preloadTemplateFonts(template)
```

### 3. Smart Caching
- Web-safe fonts (Arial, Helvetica, etc.) are **not loaded** from Google Fonts
- Already-loaded fonts are **reused** across templates
- Font weights are consolidated (e.g., 400, 700 loaded together)

## Supported Fonts

### Automatically Loaded
- **1,500+ Google Fonts** including:
  - Poppins, Montserrat, Roboto, Open Sans
  - Playfair Display, Lora, Merriweather
  - Raleway, Lato, Nunito, Source Sans Pro
  - And many more...

### Web-Safe Fonts (No Loading Required)
These fonts use system defaults and load instantly:
- Inter (default)
- Arial, Helvetica
- Times New Roman, Georgia
- Courier New, Verdana
- System UI fonts (Segoe UI, Roboto, etc.)

## Usage Examples

### In Canva
1. Design with any Google Font (e.g., "Poppins")
2. Export as SVG
3. Upload to Template AI
4. ✓ Poppins loads automatically

### In Code
```typescript
import { loadFont, preloadTemplateFonts } from './utils/fontLoader'

// Load a single font
await loadFont('Poppins', 600)

// Load all fonts from a template
await preloadTemplateFonts(template)
```

## Performance Optimizations

### 1. Preconnect Links
The `index.html` includes:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
This speeds up font loading by establishing connections early.

### 2. Font Display: Swap
Fonts use `display=swap` to prevent invisible text:
- Text renders immediately with fallback font
- Swaps to custom font when loaded
- No layout shift

### 3. Consolidated Requests
Multiple weights of the same font load in **one request**:
```
https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap
```

## Troubleshooting

### Font Not Loading?
**Check console for errors:**
```javascript
[FontLoader] Failed to load Poppins (600): NetworkError
```

**Solutions:**
- Check internet connection
- Font name must exactly match Google Fonts (case-sensitive)
- Try using web-safe font alternative

### Font Looks Different
**Cause:** Font weight mismatch
- Canva might use weight 500, but Google Fonts only has 400/700
- Font loader rounds to nearest available weight

**Solution:**
- In Canva, use standard weights: 300, 400, 600, 700
- Check [Google Fonts](https://fonts.google.com/) for available weights

### Slow Loading
**Cause:** Large SVG with many unique fonts

**Solutions:**
- Limit designs to 2-3 font families
- Use web-safe fonts when possible
- Inter (default) loads instantly

## Console Logs

When fonts load, you'll see:
```
[FontLoader] Preloading 3 fonts for template
[FontLoader] Loaded: Poppins (400)
[FontLoader] Loaded: Poppins (700)
[FontLoader] Skipping web-safe font: Inter
✓ Loaded 2 font(s) from Google Fonts: Poppins
```

## API Reference

### `fontLoader.loadFont(family, weight)`
Load a single font by name and weight.

**Parameters:**
- `family` (string): Font family name (e.g., "Poppins")
- `weight` (number): Font weight 100-900 (default: 400)

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const loaded = await fontLoader.loadFont('Montserrat', 600)
if (loaded) {
  console.log('Font ready!')
}
```

### `fontLoader.loadFonts(fonts)`
Load multiple fonts at once.

**Parameters:**
- `fonts` (Array): `[{ family: string, weight?: number }]`

**Example:**
```typescript
await fontLoader.loadFonts([
  { family: 'Poppins', weight: 400 },
  { family: 'Poppins', weight: 700 },
  { family: 'Playfair Display', weight: 400 }
])
```

### `preloadTemplateFonts(template)`
Extract and load all fonts from a template.

**Parameters:**
- `template` (Template): Template object with slots

**Example:**
```typescript
import { preloadTemplateFonts } from './utils/fontLoader'

const { template } = await importSvgToTemplate(svgText)
await preloadTemplateFonts(template)
```

### `fontLoader.getLoadedFonts()`
Get list of currently loaded font families.

**Returns:** `string[]`

**Example:**
```typescript
const fonts = fontLoader.getLoadedFonts()
// ['poppins', 'montserrat', 'playfair display']
```

## Font Weight Mapping

| CSS Name | Numeric Value |
|----------|--------------|
| thin | 100 |
| extralight | 200 |
| light | 300 |
| normal, regular | 400 |
| medium | 500 |
| semibold | 600 |
| bold | 700 |
| extrabold | 800 |
| black | 900 |

## Best Practices

### For Designers
1. **Stick to popular Google Fonts** (Poppins, Montserrat, Roboto)
2. **Limit to 2-3 font families** per template
3. **Use standard weights** (400, 600, 700)
4. **Test in Template AI** before finalizing designs

### For Developers
1. **Preload fonts early** in component lifecycle
2. **Handle loading failures** gracefully with fallbacks
3. **Monitor console** for font loading logs
4. **Use web-safe fonts** for critical text

## Privacy & Performance

### Google Fonts vs Bunny Fonts
To switch to privacy-friendly Bunny Fonts (GDPR-compliant):

1. Edit `src/utils/fontLoader.ts`
2. Replace:
   ```typescript
   https://fonts.googleapis.com/css2?
   ```
   with:
   ```typescript
   https://fonts.bunny.net/css2?
   ```

Same API, no Google tracking.

## Related Files
- `src/utils/fontLoader.ts` - Font loading logic
- `src/importer/importSvg.ts` - Auto-detection on import
- `src/App.tsx` - Template font preloading
- `index.html` - Google Fonts preconnect

---

**Questions?** Check BUG_FIXES.md or CANVA_IMPORT_GUIDE.md for more info.
