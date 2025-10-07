# Task: Contrast Accessibility Gates (Phase 4, accessibility checks)

## Context
- Purpose: Ensure WCAG 2.x contrast compliance, provide pass/fail indicators, offer auto-fixes
- Read:
  - docs/refactor/CONTRAST_CHECKER_SPEC.md
  - docs/refactor/COLOR_SYSTEM_OVERVIEW.md

## Requirements
- Create: `src/editor/color/contrastChecker.ts` — WCAG contrast calculations
- Create: `src/editor/color/contrastFixes.ts` — Auto-fix suggestions
- Create: `src/components/color/ContrastChip.tsx` — Badge + popover
- Create: `src/components/color/ContrastDetails.tsx` — Popover content
- Create: `src/components/color/ContrastFixButtons.tsx` — Auto-fix buttons
- Create tests: `src/editor/color/__tests__/contrastChecker.test.ts`
- Optional: Install `npm install apca-w3` for APCA support (Phase 2)

## API (public)
### Contrast Checker
```typescript
interface ContrastResult {
  ratio: number;               // WCAG contrast ratio
  level: 'AAA' | 'AA' | 'fail';
  apcaLc?: number;             // optional APCA Lc
}

function checkContrast(
  foreground: string,
  background: string,
  fontSize: number,
  fontWeight: number
): ContrastResult;

function suggestFixes(
  foreground: string,
  background: string
): {
  lightenFg: string;
  darkenFg: string;
  lightenBg: string;
  darkenBg: string;
  invertFg: string;
};
```

### Store Actions
- `toggleContrastChecks(): void`
- `applyContrastFix(slotId: string, fix: 'lightenFg' | ...): void`

## Behavior
- Auto-check contrast when text color/background changes
- Badge: "AA ✓" (green) or "Fail ✗" (red)
- Click badge → opens popover with details
- Popover shows ratio, level, and auto-fix buttons
- Auto-fixes adjust lightness in OKLCH (preserve hue)
- Feature-flagged: VITE_CONTRAST_CHECKS=true

## WCAG Standards
- **AA Normal:** ≥ 4.5:1 (12-18pt)
- **AA Large:** ≥ 3.0:1 (18pt+ or 14pt+ bold)
- **AAA Normal:** ≥ 7.0:1
- **AAA Large:** ≥ 4.5:1

## Auto-Fix Strategies
1. Lighten/darken foreground
2. Lighten/darken background
3. Invert colors (white ↔ black)
4. Add text chip/background (Phase 2)
5. Boost image overlay (Phase 2)

## UI Component
- ContrastChip appears inline with text color picker
- Small badge showing pass/fail + ratio
- Popover with:
  - Foreground swatch
  - Background swatch
  - Contrast ratio
  - WCAG level
  - Auto-fix buttons

## Guardrails
- WCAG standards first (APCA optional)
- Never force fixes (user-initiated only)
- Preserve hue (adjust lightness only)
- Background detection simplified for MVP (page bg only)
- Feature-flagged for safe rollout

## Tests
- Known color pairs match expected ratios (#000 on #FFF = 21:1)
- Large text threshold applies correctly
- Fixes produce passing ratios
- Chip badge matches WCAG level
- Popover displays correct details

## Performance
- Memoize contrast calculations (cache same fg+bg)
- Debounce checks during drag/slider (100ms)
- Skip checks on non-text slots

## References
- WCAG 2.1 Contrast — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- WCAG Formula — https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
- APCA (optional) — https://git.apcacontrast.com/documentation/APCAeasyIntro.html
