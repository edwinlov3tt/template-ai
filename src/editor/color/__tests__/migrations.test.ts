/**
 * Tests for legacy fill migration utilities
 */

import { describe, it, expect } from 'vitest';
import {
  migrateFillToPaint,
  paintToLegacyFill,
  migrateTemplateFills,
  extractTemplateColors
} from '../migrations';
import type { Paint } from '../types';

describe('migrations', () => {
  describe('migrateFillToPaint', () => {
    it('converts string color to solid paint', () => {
      const paint = migrateFillToPaint('#ff0000');
      expect(paint).toEqual({ kind: 'solid', color: '#ff0000' });
    });

    it('converts named color to solid paint', () => {
      const paint = migrateFillToPaint('red');
      expect(paint.kind).toBe('solid');
      expect(paint).toHaveProperty('color');
    });

    it('converts rgb color to solid paint', () => {
      const paint = migrateFillToPaint('rgb(255, 0, 0)');
      expect(paint.kind).toBe('solid');
      expect(paint).toHaveProperty('color');
    });

    it('converts object with color property', () => {
      const paint = migrateFillToPaint({ color: '#ff0000' });
      expect(paint).toEqual({ kind: 'solid', color: '#ff0000' });
    });

    it('converts object with fill property', () => {
      const paint = migrateFillToPaint({ fill: '#ff0000' });
      expect(paint).toEqual({ kind: 'solid', color: '#ff0000' });
    });

    it('returns existing Paint objects unchanged', () => {
      const existingPaint: Paint = { kind: 'solid', color: '#ff0000' };
      const result = migrateFillToPaint(existingPaint);
      expect(result).toEqual(existingPaint);
    });

    it('returns fallback for invalid colors', () => {
      expect(migrateFillToPaint('invalid@#$%')).toEqual({ kind: 'solid', color: '#000000' });
      expect(migrateFillToPaint('')).toEqual({ kind: 'solid', color: '#000000' });
      expect(migrateFillToPaint(null)).toEqual({ kind: 'solid', color: '#000000' });
      expect(migrateFillToPaint(undefined)).toEqual({ kind: 'solid', color: '#000000' });
      expect(migrateFillToPaint(123)).toEqual({ kind: 'solid', color: '#000000' });
    });
  });

  describe('paintToLegacyFill', () => {
    it('converts solid paint to color string', () => {
      const paint: Paint = { kind: 'solid', color: '#ff0000' };
      expect(paintToLegacyFill(paint)).toBe('#ff0000');
    });

    it('converts linear gradient to CSS gradient', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const result = paintToLegacyFill(paint);
      expect(result).toContain('linear-gradient');
      expect(result).toContain('135deg');
      expect(result).toContain('#ff0000');
      expect(result).toContain('#0000ff');
    });

    it('converts radial gradient to CSS gradient', () => {
      const paint: Paint = {
        kind: 'radial-gradient',
        cx: 0.5,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const result = paintToLegacyFill(paint);
      expect(result).toContain('radial-gradient');
      expect(result).toContain('50%');
    });
  });

  describe('migrateTemplateFills', () => {
    it('migrates slot fills', () => {
      const template = {
        slots: [
          { name: 'headline', fill: '#ff0000' },
          { name: 'bg', fill: 'blue' }
        ]
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated.slots[0].fill).toHaveProperty('kind', 'solid');
      expect(migrated.slots[1].fill).toHaveProperty('kind', 'solid');
    });

    it('migrates slot strokes', () => {
      const template = {
        slots: [
          { name: 'shape', stroke: '#ff0000' }
        ]
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated.slots[0].stroke).toHaveProperty('kind', 'solid');
    });

    it('migrates page slot fills', () => {
      const template = {
        pages: [
          {
            id: 'page1',
            slots: {
              headline: { fill: '#ff0000' },
              bg: { fill: 'blue' }
            }
          }
        ]
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated.pages[0].slots.headline.fill).toHaveProperty('kind', 'solid');
      expect(migrated.pages[0].slots.bg.fill).toHaveProperty('kind', 'solid');
    });

    it('migrates token palette colors', () => {
      const template = {
        tokens: {
          palette: {
            primary: '#ff0000',
            secondary: '#0000ff'
          }
        }
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated.tokens.palette.primary).toHaveProperty('kind', 'solid');
      expect(migrated.tokens.palette.secondary).toHaveProperty('kind', 'solid');
    });

    it('handles templates without fills', () => {
      const template = {
        name: 'Test Template'
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated).toEqual(template);
    });

    it('handles empty arrays', () => {
      const template = {
        slots: [],
        pages: []
      };

      const migrated = migrateTemplateFills(template);
      expect(migrated).toEqual(template);
    });
  });

  describe('extractTemplateColors', () => {
    it('extracts colors from slots', () => {
      const template = {
        slots: [
          { name: 'headline', fill: { kind: 'solid', color: '#ff0000' } },
          { name: 'bg', fill: { kind: 'solid', color: '#0000ff' } }
        ]
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(2);
      expect(colors[0]).toEqual({ kind: 'solid', color: '#ff0000' });
      expect(colors[1]).toEqual({ kind: 'solid', color: '#0000ff' });
    });

    it('extracts colors from page slots', () => {
      const template = {
        pages: [
          {
            id: 'page1',
            slots: {
              headline: { fill: { kind: 'solid', color: '#ff0000' } },
              bg: { fill: { kind: 'solid', color: '#0000ff' } }
            }
          }
        ]
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(2);
    });

    it('deduplicates colors', () => {
      const template = {
        slots: [
          { name: 'headline', fill: { kind: 'solid', color: '#ff0000' } },
          { name: 'subhead', fill: { kind: 'solid', color: '#ff0000' } }
        ]
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(1);
    });

    it('extracts gradients', () => {
      const template = {
        slots: [
          {
            name: 'bg',
            fill: {
              kind: 'linear-gradient',
              angle: 135,
              stops: [
                { offset: 0, color: '#ff0000' },
                { offset: 1, color: '#0000ff' }
              ]
            }
          }
        ]
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(1);
      expect(colors[0].kind).toBe('linear-gradient');
    });

    it('extracts stroke colors', () => {
      const template = {
        slots: [
          { name: 'shape', stroke: { kind: 'solid', color: '#ff0000' } }
        ]
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(1);
    });

    it('handles templates without colors', () => {
      const template = {
        name: 'Test Template'
      };

      const colors = extractTemplateColors(template);
      expect(colors).toHaveLength(0);
    });
  });
});
