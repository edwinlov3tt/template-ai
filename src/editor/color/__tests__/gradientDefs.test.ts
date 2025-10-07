/**
 * Tests for SVG gradient definition management
 *
 * Note: These tests use JSDOM for SVG manipulation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensureGradientDef,
  removeGradientDef,
  getPaintFillValue
} from '../gradientDefs';
import type { Paint } from '../types';

describe('gradientDefs', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    // Create a fresh SVG element for each test
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
  });

  describe('ensureGradientDef', () => {
    it('creates a linear gradient definition', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const gradientId = ensureGradientDef(svg, 'headline', paint);

      expect(gradientId).toBe('grad-headline');

      const defs = svg.querySelector('defs');
      expect(defs).not.toBeNull();

      const gradient = defs?.querySelector(`#${gradientId}`) as SVGLinearGradientElement;
      expect(gradient).not.toBeNull();
      expect(gradient.tagName).toBe('linearGradient');

      const stops = gradient.querySelectorAll('stop');
      expect(stops.length).toBe(2);
      expect(stops[0].getAttribute('stop-color')).toBe('#ff0000');
      expect(stops[1].getAttribute('stop-color')).toBe('#0000ff');
    });

    it('creates a radial gradient definition', () => {
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

      const gradientId = ensureGradientDef(svg, 'bg', paint);

      expect(gradientId).toBe('grad-bg');

      const gradient = svg.querySelector(`#${gradientId}`) as SVGRadialGradientElement;
      expect(gradient).not.toBeNull();
      expect(gradient.tagName).toBe('radialGradient');
      expect(gradient.getAttribute('cx')).toBe('50%');
      expect(gradient.getAttribute('cy')).toBe('50%');
      expect(gradient.getAttribute('r')).toBe('50%');
    });

    it('creates <defs> if it does not exist', () => {
      expect(svg.querySelector('defs')).toBeNull();

      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint);

      expect(svg.querySelector('defs')).not.toBeNull();
    });

    it('updates existing gradient definition', () => {
      const paint1: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'headline', paint1);

      const paint2: Paint = {
        kind: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#00ff00' },
          { offset: 0.5, color: '#ffff00' },
          { offset: 1, color: '#ff00ff' }
        ]
      };

      ensureGradientDef(svg, 'headline', paint2);

      const gradient = svg.querySelector('#grad-headline') as SVGLinearGradientElement;
      const stops = gradient.querySelectorAll('stop');

      expect(stops.length).toBe(3);
      expect(stops[0].getAttribute('stop-color')).toBe('#00ff00');
      expect(stops[1].getAttribute('stop-color')).toBe('#ffff00');
      expect(stops[2].getAttribute('stop-color')).toBe('#ff00ff');
    });

    it('replaces gradient type if changed', () => {
      const linear: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'test', linear);
      expect(svg.querySelector('#grad-test')?.tagName).toBe('linearGradient');

      const radial: Paint = {
        kind: 'radial-gradient',
        cx: 0.5,
        cy: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'test', radial);
      expect(svg.querySelector('#grad-test')?.tagName).toBe('radialGradient');
    });

    it('throws error for solid paint', () => {
      const paint: Paint = { kind: 'solid', color: '#ff0000' };

      expect(() => ensureGradientDef(svg, 'test', paint)).toThrow();
    });

    it('removes excess stops when updating', () => {
      const paint1: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 0.5, color: '#00ff00' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint1);

      const paint2: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#ffffff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint2);

      const gradient = svg.querySelector('#grad-test') as SVGLinearGradientElement;
      const stops = gradient.querySelectorAll('stop');

      expect(stops.length).toBe(2);
    });
  });

  describe('removeGradientDef', () => {
    it('removes gradient definition', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'headline', paint);
      expect(svg.querySelector('#grad-headline')).not.toBeNull();

      removeGradientDef(svg, 'headline');
      expect(svg.querySelector('#grad-headline')).toBeNull();
    });

    it('removes <defs> if empty', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'headline', paint);
      expect(svg.querySelector('defs')).not.toBeNull();

      removeGradientDef(svg, 'headline');
      expect(svg.querySelector('defs')).toBeNull();
    });

    it('keeps <defs> if other gradients exist', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      ensureGradientDef(svg, 'headline', paint);
      ensureGradientDef(svg, 'bg', paint);

      removeGradientDef(svg, 'headline');
      expect(svg.querySelector('defs')).not.toBeNull();
      expect(svg.querySelector('#grad-bg')).not.toBeNull();
    });

    it('handles non-existent gradient', () => {
      expect(() => removeGradientDef(svg, 'nonexistent')).not.toThrow();
    });

    it('handles missing <defs>', () => {
      expect(() => removeGradientDef(svg, 'test')).not.toThrow();
    });
  });

  describe('getPaintFillValue', () => {
    it('returns color for solid paint', () => {
      const paint: Paint = { kind: 'solid', color: '#ff0000' };
      const fillValue = getPaintFillValue(svg, 'headline', paint);

      expect(fillValue).toBe('#ff0000');
    });

    it('returns url() for linear gradient', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#ff0000' },
          { offset: 1, color: '#0000ff' }
        ]
      };

      const fillValue = getPaintFillValue(svg, 'headline', paint);

      expect(fillValue).toBe('url(#grad-headline)');
      expect(svg.querySelector('#grad-headline')).not.toBeNull();
    });

    it('returns url() for radial gradient', () => {
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

      const fillValue = getPaintFillValue(svg, 'bg', paint);

      expect(fillValue).toBe('url(#grad-bg)');
      expect(svg.querySelector('#grad-bg')).not.toBeNull();
    });
  });

  describe('gradient angle calculations', () => {
    it('converts 0° to bottom-to-top', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 0,
        stops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint);

      const gradient = svg.querySelector('#grad-test') as SVGLinearGradientElement;
      const y1 = parseFloat(gradient.getAttribute('y1') || '0');
      const y2 = parseFloat(gradient.getAttribute('y2') || '0');

      expect(y1).toBeGreaterThan(y2); // Bottom to top
    });

    it('converts 90° to left-to-right', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint);

      const gradient = svg.querySelector('#grad-test') as SVGLinearGradientElement;
      const x1 = parseFloat(gradient.getAttribute('x1') || '0');
      const x2 = parseFloat(gradient.getAttribute('x2') || '0');

      expect(x1).toBeLessThan(x2); // Left to right
    });

    it('converts 180° to top-to-bottom', () => {
      const paint: Paint = {
        kind: 'linear-gradient',
        angle: 180,
        stops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' }
        ]
      };

      ensureGradientDef(svg, 'test', paint);

      const gradient = svg.querySelector('#grad-test') as SVGLinearGradientElement;
      const y1 = parseFloat(gradient.getAttribute('y1') || '0');
      const y2 = parseFloat(gradient.getAttribute('y2') || '0');

      expect(y1).toBeLessThan(y2); // Top to bottom
    });
  });
});
