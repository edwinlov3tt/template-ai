/**
 * Tests for color math utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseColor,
  toHex,
  toOklch,
  clampToSrgb,
  interpolate,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  getLuminance
} from '../colorMath';

describe('colorMath', () => {
  describe('parseColor', () => {
    it('parses hex colors', () => {
      const color = parseColor('#ff0000');
      expect(color).not.toBeNull();
      expect(color?.mode).toBe('rgb');
    });

    it('parses named colors', () => {
      const color = parseColor('red');
      expect(color).not.toBeNull();
    });

    it('parses rgb colors', () => {
      const color = parseColor('rgb(255, 0, 0)');
      expect(color).not.toBeNull();
    });

    it('parses oklch colors', () => {
      const color = parseColor('oklch(0.5 0.1 180)');
      expect(color).not.toBeNull();
    });

    it('returns null for invalid colors', () => {
      expect(parseColor('invalid@#$%')).toBeNull();
      expect(parseColor('')).toBeNull();
      expect(parseColor('xyz(1,2,3)')).toBeNull();
    });
  });

  describe('toHex', () => {
    it('converts hex to hex (normalized)', () => {
      expect(toHex('#f00')).toBe('#ff0000');
      expect(toHex('#FF0000')).toBe('#ff0000');
    });

    it('converts named colors to hex', () => {
      expect(toHex('red')).toBe('#ff0000');
      expect(toHex('white')).toBe('#ffffff');
      expect(toHex('black')).toBe('#000000');
    });

    it('converts rgb to hex', () => {
      expect(toHex('rgb(255, 0, 0)')).toBe('#ff0000');
    });

    it('returns fallback for invalid colors', () => {
      expect(toHex('invalid@#$%')).toBe('#000000');
      expect(toHex('')).toBe('#000000');
    });
  });

  describe('toOklch', () => {
    it('converts hex to oklch', () => {
      const result = toOklch('#ff0000');
      expect(result).toContain('oklch');
    });

    it('returns fallback for invalid colors', () => {
      expect(toOklch('invalid@#$%')).toBe('oklch(0 0 0)');
      expect(toOklch('')).toBe('oklch(0 0 0)');
    });
  });

  describe('clampToSrgb', () => {
    it('clamps out-of-gamut colors', () => {
      // Test with a color that might be out of gamut
      const result = clampToSrgb('oklch(0.9 0.4 180)');
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('preserves in-gamut colors', () => {
      const result = clampToSrgb('#ff0000');
      expect(result).toBe('#ff0000');
    });
  });

  describe('interpolate', () => {
    it('interpolates between two colors', () => {
      const start = '#000000';
      const end = '#ffffff';

      const mid = interpolate(start, end, 0.5);
      expect(mid).toMatch(/^#[0-9a-f]{6}$/);

      const atStart = interpolate(start, end, 0);
      expect(atStart).toBe(start);

      const atEnd = interpolate(start, end, 1);
      expect(atEnd).toBe(end);
    });

    it('handles invalid colors gracefully', () => {
      const result = interpolate('invalid@#$%', '#ffffff', 0.5);
      // When first color is invalid, chroma falls back to it
      expect(result).toBe('invalid@#$%');
    });
  });

  describe('contrastRatio', () => {
    it('calculates contrast for black and white', () => {
      const ratio = contrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates contrast for same color', () => {
      const ratio = contrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('is commutative', () => {
      const fg = '#ff0000';
      const bg = '#0000ff';
      expect(contrastRatio(fg, bg)).toBeCloseTo(contrastRatio(bg, fg), 2);
    });

    it('returns 1.0 for invalid colors', () => {
      expect(contrastRatio('invalid@#$%', '#ffffff')).toBe(1.0);
    });
  });

  describe('meetsWcagAA', () => {
    it('passes for high contrast', () => {
      expect(meetsWcagAA('#000000', '#ffffff')).toBe(true);
    });

    it('fails for low contrast', () => {
      expect(meetsWcagAA('#ffffff', '#fefefe')).toBe(false);
    });

    it('handles large text threshold', () => {
      const fg = '#767676';
      const bg = '#ffffff';
      const ratio = contrastRatio(fg, bg);

      if (ratio >= 3.0 && ratio < 4.5) {
        expect(meetsWcagAA(fg, bg, false)).toBe(false);
        expect(meetsWcagAA(fg, bg, true)).toBe(true);
      }
    });
  });

  describe('meetsWcagAAA', () => {
    it('passes for very high contrast', () => {
      expect(meetsWcagAAA('#000000', '#ffffff')).toBe(true);
    });

    it('fails for medium contrast', () => {
      expect(meetsWcagAAA('#767676', '#ffffff')).toBe(false);
    });
  });

  describe('getLuminance', () => {
    it('returns 0 for black', () => {
      expect(getLuminance('#000000')).toBeCloseTo(0, 2);
    });

    it('returns 1 for white', () => {
      expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
    });

    it('returns intermediate values for gray', () => {
      const lum = getLuminance('#808080');
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(1);
    });

    it('returns 0 for invalid colors', () => {
      expect(getLuminance('invalid@#$%')).toBe(0);
    });
  });

  describe('round-trip conversions', () => {
    it('hex → oklch → hex preserves color', () => {
      const original = '#ff0000';
      const oklch = toOklch(original);
      const back = toHex(oklch);
      expect(back).toBe(original);
    });

    it('handles various color formats', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];

      colors.forEach((color) => {
        const oklch = toOklch(color);
        const back = toHex(oklch);
        expect(back).toBe(color);
      });
    });
  });
});
