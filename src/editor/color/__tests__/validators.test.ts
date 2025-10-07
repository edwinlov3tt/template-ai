/**
 * Tests for Paint validators
 */

import { describe, it, expect } from 'vitest';
import {
  validatePaint,
  sortStops,
  normalizeStops,
  paintsEqual
} from '../validators';
import type { Paint, GradientStop } from '../types';

describe('validators', () => {
  describe('validatePaint', () => {
    it('validates solid paints', () => {
      const paint = { kind: 'solid', color: '#ff0000' };
      expect(validatePaint(paint)).toBe(true);
    });

    it('validates linear gradient paints', () => {
      const paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };
      expect(validatePaint(paint)).toBe(true);
    });

    it('validates radial gradient paints', () => {
      const paint = {
        kind: 'radial-gradient',
        cx: 0.5,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };
      expect(validatePaint(paint)).toBe(true);
    });

    it('rejects invalid kind', () => {
      expect(validatePaint({ kind: 'unknown' })).toBe(false);
    });

    it('rejects missing kind', () => {
      expect(validatePaint({ color: '#ff0000' })).toBe(false);
    });

    it('rejects invalid solid paint', () => {
      expect(validatePaint({ kind: 'solid' })).toBe(false);
      expect(validatePaint({ kind: 'solid', color: 123 })).toBe(false);
      expect(validatePaint({ kind: 'solid', color: 'invalid@#$%' })).toBe(false);
      expect(validatePaint({ kind: 'solid', color: '' })).toBe(false);
    });

    it('rejects invalid linear gradient paint', () => {
      expect(validatePaint({ kind: 'linear-gradient' })).toBe(false);
      expect(validatePaint({ kind: 'linear-gradient', angle: 'not-a-number' })).toBe(false);
      expect(validatePaint({ kind: 'linear-gradient', angle: 90, stops: 'not-an-array' })).toBe(false);
    });

    it('rejects invalid radial gradient paint', () => {
      expect(validatePaint({ kind: 'radial-gradient' })).toBe(false);
      expect(validatePaint({ kind: 'radial-gradient', cx: 0.5, cy: 0.5, radius: 2 })).toBe(false);
      expect(validatePaint({ kind: 'radial-gradient', cx: -1, cy: 0.5, radius: 0.5 })).toBe(false);
    });

    it('rejects invalid gradient stops', () => {
      const paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 2, color: '#0000ff' } // Invalid offset
        ]
      };
      expect(validatePaint(paint)).toBe(false);
    });

    it('rejects non-objects', () => {
      expect(validatePaint(null)).toBe(false);
      expect(validatePaint(undefined)).toBe(false);
      expect(validatePaint('not-an-object')).toBe(false);
      expect(validatePaint(123)).toBe(false);
    });
  });

  describe('sortStops', () => {
    it('sorts stops by offset', () => {
      const stops: GradientStop[] = [
        { offset: 1, color: '#fff' },
        { offset: 0, color: '#000' },
        { offset: 0.5, color: '#888' }
      ];

      const sorted = sortStops(stops);
      expect(sorted[0].offset).toBe(0);
      expect(sorted[1].offset).toBe(0.5);
      expect(sorted[2].offset).toBe(1);
    });

    it('does not mutate input array', () => {
      const stops: GradientStop[] = [
        { offset: 1, color: '#fff' },
        { offset: 0, color: '#000' }
      ];

      const sorted = sortStops(stops);
      expect(stops[0].offset).toBe(1);
      expect(sorted).not.toBe(stops);
    });

    it('handles already sorted stops', () => {
      const stops: GradientStop[] = [
        { offset: 0, color: '#000' },
        { offset: 0.5, color: '#888' },
        { offset: 1, color: '#fff' }
      ];

      const sorted = sortStops(stops);
      expect(sorted).toEqual(stops);
    });
  });

  describe('normalizeStops', () => {
    it('clamps out-of-range offsets', () => {
      const stops: GradientStop[] = [
        { offset: -0.5, color: '#000' },
        { offset: 1.5, color: '#fff' }
      ];

      const normalized = normalizeStops(stops);
      expect(normalized[0].offset).toBe(0);
      expect(normalized[normalized.length - 1].offset).toBe(1);
    });

    it('sorts stops', () => {
      const stops: GradientStop[] = [
        { offset: 1, color: '#fff' },
        { offset: 0, color: '#000' }
      ];

      const normalized = normalizeStops(stops);
      expect(normalized[0].offset).toBe(0);
      expect(normalized[1].offset).toBe(1);
    });

    it('removes duplicate offsets', () => {
      const stops: GradientStop[] = [
        { offset: 0, color: '#000' },
        { offset: 0, color: '#111' },
        { offset: 1, color: '#fff' }
      ];

      const normalized = normalizeStops(stops);
      expect(normalized.length).toBe(2);
      expect(normalized[0].color).toBe('#000'); // Keeps first
    });

    it('ensures stops at 0 and 1', () => {
      const stops: GradientStop[] = [
        { offset: 0.5, color: '#888' }
      ];

      const normalized = normalizeStops(stops);
      expect(normalized.length).toBe(3);
      expect(normalized[0].offset).toBe(0);
      expect(normalized[2].offset).toBe(1);
    });

    it('handles empty stops array', () => {
      const normalized = normalizeStops([]);
      expect(normalized.length).toBe(2);
      expect(normalized[0]).toEqual({ offset: 0, color: '#000000' });
      expect(normalized[1]).toEqual({ offset: 1, color: '#ffffff' });
    });
  });

  describe('paintsEqual', () => {
    it('compares solid paints', () => {
      const a: Paint = { kind: 'solid', color: '#ff0000' };
      const b: Paint = { kind: 'solid', color: '#ff0000' };
      const c: Paint = { kind: 'solid', color: '#0000ff' };

      expect(paintsEqual(a, b)).toBe(true);
      expect(paintsEqual(a, c)).toBe(false);
    });

    it('compares linear gradient paints', () => {
      const a: Paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const b: Paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const c: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      expect(paintsEqual(a, b)).toBe(true);
      expect(paintsEqual(a, c)).toBe(false);
    });

    it('compares radial gradient paints', () => {
      const a: Paint = {
        kind: 'radial-gradient',
        cx: 0.5,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const b: Paint = {
        kind: 'radial-gradient',
        cx: 0.5,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const c: Paint = {
        kind: 'radial-gradient',
        cx: 0.3,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      expect(paintsEqual(a, b)).toBe(true);
      expect(paintsEqual(a, c)).toBe(false);
    });

    it('compares different paint types', () => {
      const solid: Paint = { kind: 'solid', color: '#ff0000' };
      const gradient: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      expect(paintsEqual(solid, gradient)).toBe(false);
    });
  });
});
