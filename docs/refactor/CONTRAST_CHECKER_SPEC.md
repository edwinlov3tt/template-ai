# Contrast Checker — Spec

**Goal:** Ensure accessibility with WCAG 2.x and optional APCA contrast checks, provide pass/fail indicators, and offer one-click auto-fixes.

## WCAG 2.x Contrast Ratio

### Standards
- **AA Normal Text:** ≥ 4.5:1 (12-18pt)
- **AA Large Text:** ≥ 3.0:1 (18pt+ or 14pt+ bold)
- **AAA Normal Text:** ≥ 7.0:1 (enhanced)
- **AAA Large Text:** ≥ 4.5:1 (enhanced)

**Formula:**
```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 is lighter color's relative luminance
      L2 is darker color's relative luminance
```

**Relative Luminance:**
```typescript
function relativeLuminance(rgb: {r: number, g: number, b: number}): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(hexToRgb(fg));
  const l2 = relativeLuminance(hexToRgb(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

**References:**
- WCAG 2.1 SC 1.4.3 — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WCAG 2.1 SC 1.4.6 — https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html

## APCA Contrast (Optional/Advanced)

**APCA** (Accessible Perceptual Contrast Algorithm) is a more modern approach:
- Target: **Lc ≈ 60** for body text
- Target: **Lc ≈ 75** for small text
- Target: **Lc ≈ 45** for large headings

**Implementation:**
- Use `apca-w3` npm package or implement formula from spec
- Display Lc value alongside WCAG ratio

**References:**
- APCA Intro — https://git.apcacontrast.com/documentation/APCAeasyIntro.html
- apca-w3 package — https://www.npmjs.com/package/apca-w3

**Phase 2 Feature** — can skip for MVP

## Implementation

### Contrast Utilities

Create `src/editor/color/contrastChecker.ts`:

**Public API:**
```typescript
export interface ContrastResult {
  ratio: number;               // WCAG contrast ratio
  level: 'AAA' | 'AA' | 'fail';
  apcaLc?: number;             // optional APCA Lc value
}

export function checkContrast(
  foreground: string,
  background: string,
  fontSize: number,
  fontWeight: number
): ContrastResult;

export function suggestFixes(
  foreground: string,
  background: string
): {
  lightenFg: string;           // lightened foreground
  darkenFg: string;            // darkened foreground
  lightenBg: string;           // lightened background
  darkenBg: string;            // darkened background
  invertFg: string;            // inverted foreground
};
```

### Auto-Fix Strategies

1. **Adjust Foreground**
   - Lighten or darken text color until contrast passes
   - Preserve hue, adjust lightness in OKLCH space

2. **Adjust Background**
   - Lighten or darken background until contrast passes
   - Less common but offered as option

3. **Invert Text**
   - Switch to white text if background is dark
   - Switch to black text if background is light

4. **Add Text Chip/Background**
   - Add semi-transparent background behind text
   - Adjust opacity until contrast passes

5. **Boost Overlay**
   - Increase overlay alpha on images
   - Darken background image

### UI Components

Create `src/components/color/ContrastChip.tsx`:

**Visual (inline with text color picker):**
- Small badge: "AA ✓" (green) or "Fail ✗" (red)
- Shows contrast ratio: "4.5:1"
- Click → opens contrast details popover

**Popover:**
- Foreground color swatch
- Background color swatch
- Contrast ratio: "4.5:1"
- WCAG level: "AA Pass" (or "Fail")
- Optional APCA Lc: "Lc 60"
- Auto-fix buttons:
  - "Lighten text"
  - "Darken text"
  - "Adjust background"
  - "Invert colors"

**Component:**
```tsx
export function ContrastChip({
  foreground,
  background,
  fontSize,
  fontWeight
}: {
  foreground: string;
  background: string;
  fontSize: number;
  fontWeight: number;
}) {
  const result = checkContrast(foreground, background, fontSize, fontWeight);

  return (
    <Popover>
      <PopoverTrigger>
        <Badge color={result.level !== 'fail' ? 'green' : 'red'}>
          {result.level === 'fail' ? 'Fail ✗' : `${result.level} ✓`}
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <ContrastDetails result={result} fg={foreground} bg={background} />
      </PopoverContent>
    </Popover>
  );
}
```

### Store Integration

Update `src/state/editorStore.ts`:

**New State:**
```typescript
interface EditorState {
  // ... existing
  contrastChecksEnabled: boolean;  // feature flag
}
```

**New Actions:**
```typescript
toggleContrastChecks(): void
applyContrastFix(slotId: string, fix: 'lightenFg' | 'darkenFg' | 'lightenBg' | 'darkenBg' | 'invertFg'): void
```

## Auto-Check Triggers

Automatically check contrast when:
1. Text color changes
2. Background color changes (page or slot)
3. Font size/weight changes
4. Slot moved over different background

**Implementation:**
```typescript
useEffect(() => {
  if (!contrastChecksEnabled) return;
  if (slot.type !== 'text' && slot.type !== 'button') return;

  const fg = slot.textColor || slot.fill;
  const bg = getEffectiveBackground(slot); // complex: may be page bg, slot bg, or image

  const result = checkContrast(fg, bg, slot.fontSize, slot.fontWeight);
  setContrastResult(result);
}, [slot.textColor, slot.fill, slot.fontSize, slot.fontWeight, contrastChecksEnabled]);
```

## Background Detection

**Challenge:** Text may sit on:
- Page background color
- Slot background (shape fill)
- Image slot underneath (complex)

**Strategy:**
1. If slot has background fill → use that
2. Else if text over image → use average color of image region
3. Else → use page background color

**Simplified MVP:**
- Check against page background only
- Phase 2: detect overlapping slots

## Testing

### Unit Tests
- `contrastChecker.test.ts`
  - Known color pairs match expected ratios (e.g., #000 on #FFF = 21:1)
  - Large text threshold applies correctly
  - Fixes produce passing ratios

### Integration Tests
- Contrast chip appears on text slots
- Auto-fix updates text color
- Warnings persist across page changes

### Visual Tests
- Chip badge matches WCAG level
- Popover displays correct details

## Performance

- Memoize contrast calculations (same fg+bg → cached result)
- Debounce checks during drag/slider changes (100ms)
- Skip checks on non-text slots

## Feature Flag

Add to `.env`:
```env
VITE_CONTRAST_CHECKS=true
```

Gate all contrast checking behind this flag for safe rollout.

## Files to Create

```
src/editor/color/
  contrastChecker.ts            - WCAG/APCA contrast calculations
  contrastFixes.ts              - Auto-fix suggestions

src/components/color/
  ContrastChip.tsx              - Badge + popover
  ContrastDetails.tsx           - Popover content
  ContrastFixButtons.tsx        - Auto-fix action buttons
```

## Dependencies

Optional (for APCA):
```bash
npm install apca-w3
```

## Guardrails

1. **WCAG standards first** — APCA is optional/advanced
2. **Never force fixes** — always user-initiated
3. **Preserve hue** — fixes adjust lightness, not hue
4. **Background detection** — simplified for MVP, enhanced later
5. **Feature-flagged** — can disable without code changes

## References

- **WCAG 2.1 Contrast** — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- **WCAG Contrast Formula** — https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
- **APCA** — https://git.apcacontrast.com/documentation/APCAeasyIntro.html
- **apca-w3** — https://www.npmjs.com/package/apca-w3
- **Color.js** (reference) — https://colorjs.io/docs/contrast.html
