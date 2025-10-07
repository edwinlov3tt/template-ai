/**
 * Color Math Utilities
 *
 * Wrappers around culori and chroma-js for color conversions, interpolations,
 * gamut mapping, and contrast calculations.
 */

import { parse, formatHex, formatCss, clampChroma, oklch, rgb } from 'culori';
import chroma from 'chroma-js';

/**
 * Parse a color string into a normalized color object
 *
 * Accepts: hex (#fff, #ffffff), rgb(), hsl(), oklch(), named colors
 * Returns: culori color object or null if invalid
 */
export function parseColor(input: string): ReturnType<typeof parse> {
  try {
    const result = parse(input);
    // culori returns undefined for invalid colors
    return result;
  } catch {
    return undefined;
  }
}

/**
 * Convert any color to hex format
 *
 * @param color - Color string (hex, rgb, hsl, oklch, named)
 * @returns Hex color string (e.g., "#ffffff") or fallback color
 */
export function toHex(color: string): string {
  const parsed = parseColor(color);
  if (!parsed) return '#000000';

  try {
    return formatHex(parsed);
  } catch {
    return '#000000';
  }
}

/**
 * Convert any color to OKLCH format
 *
 * OKLCH is perceptually uniform and ideal for color manipulation.
 *
 * @param color - Color string
 * @returns OKLCH CSS string (e.g., "oklch(0.5 0.1 180)")
 */
export function toOklch(color: string): string {
  const parsed = parseColor(color);
  if (!parsed) return 'oklch(0 0 0)';

  try {
    const oklchColor = oklch(parsed);
    if (!oklchColor) return 'oklch(0 0 0)';

    return formatCss(oklchColor);
  } catch {
    return 'oklch(0 0 0)';
  }
}

/**
 * Clamp a color to the sRGB gamut
 *
 * Out-of-gamut colors (e.g., from OKLCH) are mapped to the nearest
 * displayable sRGB color.
 *
 * @param color - Color string (may be out of gamut)
 * @returns Hex color clamped to sRGB
 */
export function clampToSrgb(color: string): string {
  const parsed = parseColor(color);
  if (!parsed) return '#000000';

  try {
    // Convert to RGB and clamp chroma if out of gamut
    const clamped = clampChroma(parsed, 'rgb');
    return formatHex(clamped);
  } catch {
    return '#000000';
  }
}

/**
 * Interpolate between two colors
 *
 * Uses OKLCH color space for perceptually uniform interpolation.
 *
 * @param c1 - Start color
 * @param c2 - End color
 * @param t - Interpolation factor (0.0 to 1.0)
 * @returns Interpolated color as hex
 */
export function interpolate(c1: string, c2: string, t: number): string {
  try {
    const scale = chroma.scale([c1, c2]).mode('oklch');
    const interpolated = scale(t);
    return interpolated.hex();
  } catch {
    return c1;
  }
}

/**
 * Calculate WCAG 2.1 contrast ratio between foreground and background
 *
 * @param fg - Foreground color
 * @param bg - Background color
 * @returns Contrast ratio (1.0 to 21.0)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function contrastRatio(fg: string, bg: string): number {
  try {
    const fgChroma = chroma(fg);
    const bgChroma = chroma(bg);
    return chroma.contrast(fgChroma, bgChroma);
  } catch {
    return 1.0;
  }
}

/**
 * Check if a color meets WCAG AA contrast requirements
 *
 * @param fg - Foreground color
 * @param bg - Background color
 * @param largeText - True for large text (3:1 minimum), false for normal text (4.5:1 minimum)
 * @returns True if contrast is sufficient
 */
export function meetsWcagAA(fg: string, bg: string, largeText = false): boolean {
  const ratio = contrastRatio(fg, bg);
  return largeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Check if a color meets WCAG AAA contrast requirements
 *
 * @param fg - Foreground color
 * @param bg - Background color
 * @param largeText - True for large text (4.5:1 minimum), false for normal text (7:1 minimum)
 * @returns True if contrast is sufficient
 */
export function meetsWcagAAA(fg: string, bg: string, largeText = false): boolean {
  const ratio = contrastRatio(fg, bg);
  return largeText ? ratio >= 4.5 : ratio >= 7.0;
}

/**
 * Get luminance of a color (0.0 = black, 1.0 = white)
 *
 * @param color - Color string
 * @returns Luminance value
 */
export function getLuminance(color: string): number {
  try {
    const parsed = parseColor(color);
    if (!parsed) return 0;

    const rgbColor = rgb(parsed);
    if (!rgbColor) return 0;

    // WCAG luminance formula
    const { r, g, b } = rgbColor;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const val = c ?? 0;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  } catch {
    return 0;
  }
}
