/**
 * Legacy Fill → Paint Migration Utilities
 *
 * Converts old template fill formats to the new Paint type system.
 */

import type { Paint, SolidPaint } from './types';
import { parseColor, toHex } from './colorMath';

/**
 * Migrate a legacy fill value to a Paint
 *
 * Legacy formats supported:
 * - String color: "#ff0000", "rgb(255, 0, 0)", "red"
 * - Object with color property: { color: "#ff0000" }
 * - Object with fill property: { fill: "#ff0000" }
 *
 * @param legacyFill - Legacy fill value
 * @returns Paint object, or default black if invalid
 */
export function migrateFillToPaint(legacyFill: unknown): Paint {
  // Already a Paint object
  if (isPaintLike(legacyFill)) {
    return legacyFill as Paint;
  }

  // String color
  if (typeof legacyFill === 'string') {
    const parsed = parseColor(legacyFill);
    if (parsed) {
      return { kind: 'solid', color: toHex(legacyFill) };
    }
  }

  // Object with color property
  if (isObjectWithProperty(legacyFill, 'color')) {
    const colorValue = (legacyFill as Record<string, unknown>).color;
    if (typeof colorValue === 'string') {
      const parsed = parseColor(colorValue);
      if (parsed) {
        return { kind: 'solid', color: toHex(colorValue) };
      }
    }
  }

  // Object with fill property
  if (isObjectWithProperty(legacyFill, 'fill')) {
    const fillValue = (legacyFill as Record<string, unknown>).fill;
    if (typeof fillValue === 'string') {
      const parsed = parseColor(fillValue);
      if (parsed) {
        return { kind: 'solid', color: toHex(fillValue) };
      }
    }
  }

  // Fallback to black
  return { kind: 'solid', color: '#000000' };
}

/**
 * Convert a Paint back to a legacy fill string (for backward compatibility)
 *
 * @param paint - Paint object
 * @returns Color string
 */
export function paintToLegacyFill(paint: Paint): string {
  if (paint.kind === 'solid') {
    return paint.color;
  }

  // For gradients, return CSS gradient syntax (limited browser support)
  if (paint.kind === 'linear-gradient') {
    const stops = paint.stops
      .map((stop) => `${stop.color} ${stop.offset * 100}%`)
      .join(', ');
    return `linear-gradient(${paint.angle}deg, ${stops})`;
  }

  if (paint.kind === 'radial-gradient') {
    const stops = paint.stops
      .map((stop) => `${stop.color} ${stop.offset * 100}%`)
      .join(', ');
    return `radial-gradient(circle at ${paint.cx * 100}% ${paint.cy * 100}%, ${stops})`;
  }

  return '#000000';
}

/**
 * Migrate all fills in a template to Paint objects
 *
 * Walks through template structure and converts all fill properties.
 *
 * @param template - Template object (mutated in place)
 * @returns Modified template
 */
export function migrateTemplateFills(template: Record<string, unknown>): Record<string, unknown> {
  // Migrate slot fills
  if (Array.isArray(template.slots)) {
    template.slots.forEach((slot: unknown) => {
      if (isObjectWithProperty(slot, 'fill')) {
        const slotObj = slot as Record<string, unknown>;
        slotObj.fill = migrateFillToPaint(slotObj.fill);
      }

      if (isObjectWithProperty(slot, 'stroke')) {
        const slotObj = slot as Record<string, unknown>;
        slotObj.stroke = migrateFillToPaint(slotObj.stroke);
      }
    });
  }

  // Migrate page fills
  if (Array.isArray(template.pages)) {
    template.pages.forEach((page: unknown) => {
      if (isObjectWithProperty(page, 'slots')) {
        const pageObj = page as Record<string, unknown>;
        const slots = pageObj.slots as Record<string, unknown>;

        Object.keys(slots).forEach((slotName) => {
          const slot = slots[slotName];
          if (isObjectWithProperty(slot, 'fill')) {
            const slotObj = slot as Record<string, unknown>;
            slotObj.fill = migrateFillToPaint(slotObj.fill);
          }

          if (isObjectWithProperty(slot, 'stroke')) {
            const slotObj = slot as Record<string, unknown>;
            slotObj.stroke = migrateFillToPaint(slotObj.stroke);
          }
        });
      }
    });
  }

  // Migrate token colors
  if (isObjectWithProperty(template, 'tokens')) {
    const tokens = template.tokens as Record<string, unknown>;

    if (isObjectWithProperty(tokens, 'palette')) {
      const palette = tokens.palette as Record<string, unknown>;

      Object.keys(palette).forEach((key) => {
        const value = palette[key];
        if (typeof value === 'string') {
          palette[key] = migrateFillToPaint(value);
        }
      });
    }
  }

  return template;
}

/**
 * Extract all unique colors from a template
 *
 * Useful for building a document color palette.
 *
 * @param template - Template object
 * @returns Array of unique Paint objects
 */
export function extractTemplateColors(template: Record<string, unknown>): Paint[] {
  const paints = new Set<string>();
  const result: Paint[] = [];

  const addPaint = (paint: Paint) => {
    const key = JSON.stringify(paint);
    if (!paints.has(key)) {
      paints.add(key);
      result.push(paint);
    }
  };

  // Extract from slots
  if (Array.isArray(template.slots)) {
    template.slots.forEach((slot: unknown) => {
      if (isObjectWithProperty(slot, 'fill')) {
        const fill = (slot as Record<string, unknown>).fill;
        if (isPaintLike(fill)) {
          addPaint(fill as Paint);
        }
      }

      if (isObjectWithProperty(slot, 'stroke')) {
        const stroke = (slot as Record<string, unknown>).stroke;
        if (isPaintLike(stroke)) {
          addPaint(stroke as Paint);
        }
      }
    });
  }

  // Extract from pages
  if (Array.isArray(template.pages)) {
    template.pages.forEach((page: unknown) => {
      if (isObjectWithProperty(page, 'slots')) {
        const slots = (page as Record<string, unknown>).slots as Record<string, unknown>;

        Object.values(slots).forEach((slot) => {
          if (isObjectWithProperty(slot, 'fill')) {
            const fill = (slot as Record<string, unknown>).fill;
            if (isPaintLike(fill)) {
              addPaint(fill as Paint);
            }
          }

          if (isObjectWithProperty(slot, 'stroke')) {
            const stroke = (slot as Record<string, unknown>).stroke;
            if (isPaintLike(stroke)) {
              addPaint(stroke as Paint);
            }
          }
        });
      }
    });
  }

  return result;
}

/**
 * Type guard for Paint-like objects
 */
function isPaintLike(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return obj.kind === 'solid' || obj.kind === 'linear-gradient' || obj.kind === 'radial-gradient';
}

/**
 * Type guard for objects with a specific property
 */
function isObjectWithProperty(value: unknown, property: string): boolean {
  return typeof value === 'object' && value !== null && property in value;
}
