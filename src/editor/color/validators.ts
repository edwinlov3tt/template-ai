/**
 * Paint Validators
 *
 * Runtime validation for Paint types and gradient stop sorting.
 */

import type { Paint, GradientStop, SolidPaint, LinearGradientPaint, RadialGradientPaint } from './types';
import { parseColor } from './colorMath';

/**
 * Type guard that validates if an unknown value is a valid Paint
 *
 * @param paint - Value to validate
 * @returns True if paint is a valid Paint type
 */
export function validatePaint(paint: unknown): paint is Paint {
  if (!paint || typeof paint !== 'object') {
    return false;
  }

  const p = paint as Record<string, unknown>;

  if (!p.kind || typeof p.kind !== 'string') {
    return false;
  }

  switch (p.kind) {
    case 'solid':
      return validateSolidPaint(p);
    case 'linear-gradient':
      return validateLinearGradientPaint(p);
    case 'radial-gradient':
      return validateRadialGradientPaint(p);
    default:
      return false;
  }
}

/**
 * Validate a solid paint
 */
function validateSolidPaint(p: Record<string, unknown>): p is SolidPaint {
  if (typeof p.color !== 'string') {
    return false;
  }

  // Verify color is parseable
  return parseColor(p.color) !== null;
}

/**
 * Validate a linear gradient paint
 */
function validateLinearGradientPaint(p: Record<string, unknown>): p is LinearGradientPaint {
  if (typeof p.angle !== 'number') {
    return false;
  }

  if (!Array.isArray(p.stops)) {
    return false;
  }

  return p.stops.every(validateGradientStop);
}

/**
 * Validate a radial gradient paint
 */
function validateRadialGradientPaint(p: Record<string, unknown>): p is RadialGradientPaint {
  if (typeof p.cx !== 'number' || typeof p.cy !== 'number' || typeof p.radius !== 'number') {
    return false;
  }

  if (p.cx < 0 || p.cx > 1 || p.cy < 0 || p.cy > 1) {
    return false;
  }

  if (p.radius < 0 || p.radius > 1) {
    return false;
  }

  if (!Array.isArray(p.stops)) {
    return false;
  }

  return p.stops.every(validateGradientStop);
}

/**
 * Validate a gradient stop
 */
function validateGradientStop(stop: unknown): stop is GradientStop {
  if (!stop || typeof stop !== 'object') {
    return false;
  }

  const s = stop as Record<string, unknown>;

  if (typeof s.offset !== 'number' || typeof s.color !== 'string') {
    return false;
  }

  if (s.offset < 0 || s.offset > 1) {
    return false;
  }

  // Verify color is parseable
  return parseColor(s.color) !== null;
}

/**
 * Sort gradient stops by offset (ascending)
 *
 * Creates a new array with stops sorted by offset.
 * Does NOT mutate the input array.
 *
 * @param stops - Gradient stops (may be unsorted)
 * @returns New array with stops sorted by offset
 *
 * @example
 * ```ts
 * const stops = [
 *   { offset: 1, color: '#fff' },
 *   { offset: 0, color: '#000' },
 *   { offset: 0.5, color: '#888' }
 * ];
 * const sorted = sortStops(stops);
 * // [{ offset: 0, ... }, { offset: 0.5, ... }, { offset: 1, ... }]
 * ```
 */
export function sortStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.offset - b.offset);
}

/**
 * Normalize gradient stops to ensure valid offsets
 *
 * - Clamps offsets to [0, 1] range
 * - Sorts stops by offset
 * - Removes duplicate offsets (keeps first occurrence)
 * - Ensures at least one stop at 0 and one at 1
 *
 * @param stops - Raw gradient stops
 * @returns Normalized gradient stops
 */
export function normalizeStops(stops: GradientStop[]): GradientStop[] {
  if (stops.length === 0) {
    return [
      { offset: 0, color: '#000000' },
      { offset: 1, color: '#ffffff' }
    ];
  }

  // Clamp offsets
  const clamped = stops.map((stop) => ({
    ...stop,
    offset: Math.max(0, Math.min(1, stop.offset))
  }));

  // Sort by offset
  const sorted = sortStops(clamped);

  // Remove duplicate offsets (keep first)
  const deduplicated: GradientStop[] = [];
  const seenOffsets = new Set<number>();

  for (const stop of sorted) {
    if (!seenOffsets.has(stop.offset)) {
      deduplicated.push(stop);
      seenOffsets.add(stop.offset);
    }
  }

  // Ensure stops at 0 and 1
  const hasStart = deduplicated.some((s) => s.offset === 0);
  const hasEnd = deduplicated.some((s) => s.offset === 1);

  if (!hasStart) {
    deduplicated.unshift({ offset: 0, color: deduplicated[0].color });
  }

  if (!hasEnd) {
    deduplicated.push({ offset: 1, color: deduplicated[deduplicated.length - 1].color });
  }

  return deduplicated;
}

/**
 * Check if two paints are equal
 *
 * @param a - First paint
 * @param b - Second paint
 * @returns True if paints are structurally equal
 */
export function paintsEqual(a: Paint, b: Paint): boolean {
  if (a.kind !== b.kind) {
    return false;
  }

  if (a.kind === 'solid' && b.kind === 'solid') {
    return a.color === b.color;
  }

  if (a.kind === 'linear-gradient' && b.kind === 'linear-gradient') {
    return a.angle === b.angle && stopsEqual(a.stops, b.stops);
  }

  if (a.kind === 'radial-gradient' && b.kind === 'radial-gradient') {
    return a.cx === b.cx && a.cy === b.cy && a.radius === b.radius && stopsEqual(a.stops, b.stops);
  }

  return false;
}

/**
 * Check if two gradient stop arrays are equal
 */
function stopsEqual(a: GradientStop[], b: GradientStop[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((stopA, i) => {
    const stopB = b[i];
    return stopA.offset === stopB.offset && stopA.color === stopB.color;
  });
}
