/**
 * SVG Gradient Definition Management
 *
 * Creates and updates SVG <linearGradient> and <radialGradient> definitions
 * with minimal DOM manipulation (update attributes, don't replace nodes).
 */

import type { Paint, LinearGradientPaint, RadialGradientPaint, GradientStop } from './types';
import { isLinearGradientPaint, isRadialGradientPaint } from './types';

/**
 * Ensure a gradient definition exists in the SVG <defs> and return its ID
 *
 * Creates or updates the gradient definition to match the paint specification.
 * Uses stable IDs based on slotId to enable efficient updates.
 *
 * @param svg - SVG root element
 * @param slotId - Unique identifier for the slot (used in gradient ID)
 * @param paint - Paint specification (must be a gradient type)
 * @returns Gradient ID for use in fill="url(#gradientId)"
 *
 * @example
 * ```ts
 * const gradientId = ensureGradientDef(svgElement, 'headline-fill', {
 *   kind: 'linear-gradient',
 *   angle: 135,
 *   stops: [
 *     { offset: 0, color: '#ff0000' },
 *     { offset: 1, color: '#0000ff' }
 *   ]
 * });
 * element.setAttribute('fill', `url(#${gradientId})`);
 * ```
 */
export function ensureGradientDef(
  svg: SVGSVGElement,
  slotId: string,
  paint: Paint
): string {
  if (!isLinearGradientPaint(paint) && !isRadialGradientPaint(paint)) {
    throw new Error(`ensureGradientDef requires a gradient paint, got kind=${paint.kind}`);
  }

  // Stable gradient ID
  const gradientId = `grad-${slotId}`;

  // Get or create <defs>
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  // Get or create gradient element
  let gradientEl = defs.querySelector(`#${gradientId}`) as
    | SVGLinearGradientElement
    | SVGRadialGradientElement
    | null;

  if (isLinearGradientPaint(paint)) {
    // Ensure correct gradient type (replace if wrong type)
    if (!gradientEl || gradientEl.tagName !== 'linearGradient') {
      if (gradientEl) gradientEl.remove();
      gradientEl = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradientEl.setAttribute('id', gradientId);
      defs.appendChild(gradientEl);
    }

    updateLinearGradient(gradientEl as SVGLinearGradientElement, paint);
  } else if (isRadialGradientPaint(paint)) {
    // Ensure correct gradient type (replace if wrong type)
    if (!gradientEl || gradientEl.tagName !== 'radialGradient') {
      if (gradientEl) gradientEl.remove();
      gradientEl = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradientEl.setAttribute('id', gradientId);
      defs.appendChild(gradientEl);
    }

    updateRadialGradient(gradientEl as SVGRadialGradientElement, paint);
  }

  return gradientId;
}

/**
 * Update a <linearGradient> element to match the paint specification
 *
 * Only updates changed attributes to minimize DOM thrashing.
 */
function updateLinearGradient(el: SVGLinearGradientElement, paint: LinearGradientPaint): void {
  // Convert angle to x1, y1, x2, y2
  // 0° = bottom to top, 90° = left to right, 180° = top to bottom, 270° = right to left
  const angleRad = ((paint.angle - 90) * Math.PI) / 180;
  const x2 = 0.5 + Math.cos(angleRad) * 0.5;
  const y2 = 0.5 + Math.sin(angleRad) * 0.5;
  const x1 = 1 - x2;
  const y1 = 1 - y2;

  // Set gradient vector
  el.setAttribute('x1', `${x1 * 100}%`);
  el.setAttribute('y1', `${y1 * 100}%`);
  el.setAttribute('x2', `${x2 * 100}%`);
  el.setAttribute('y2', `${y2 * 100}%`);

  // Update stops
  updateGradientStops(el, paint.stops);
}

/**
 * Update a <radialGradient> element to match the paint specification
 *
 * Only updates changed attributes to minimize DOM thrashing.
 */
function updateRadialGradient(el: SVGRadialGradientElement, paint: RadialGradientPaint): void {
  // Set gradient center and radius
  el.setAttribute('cx', `${paint.cx * 100}%`);
  el.setAttribute('cy', `${paint.cy * 100}%`);
  el.setAttribute('r', `${paint.radius * 100}%`);

  // Update stops
  updateGradientStops(el, paint.stops);
}

/**
 * Update gradient stops, reusing existing <stop> elements when possible
 */
function updateGradientStops(
  gradientEl: SVGLinearGradientElement | SVGRadialGradientElement,
  stops: GradientStop[]
): void {
  const existingStops = Array.from(gradientEl.querySelectorAll('stop'));

  // Update existing stops or create new ones
  stops.forEach((stop, i) => {
    let stopEl = existingStops[i];

    if (!stopEl) {
      stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      gradientEl.appendChild(stopEl);
    }

    stopEl.setAttribute('offset', `${stop.offset * 100}%`);
    stopEl.setAttribute('stop-color', stop.color);
  });

  // Remove excess stops
  for (let i = stops.length; i < existingStops.length; i++) {
    existingStops[i].remove();
  }
}

/**
 * Remove a gradient definition from the SVG <defs>
 *
 * @param svg - SVG root element
 * @param slotId - Slot identifier used in gradient ID
 */
export function removeGradientDef(svg: SVGSVGElement, slotId: string): void {
  const gradientId = `grad-${slotId}`;
  const defs = svg.querySelector('defs');
  if (!defs) return;

  const gradientEl = defs.querySelector(`#${gradientId}`);
  if (gradientEl) {
    gradientEl.remove();
  }

  // Clean up empty <defs>
  if (defs.children.length === 0) {
    defs.remove();
  }
}

/**
 * Get a CSS fill value for a paint
 *
 * For solid colors, returns the color directly.
 * For gradients, returns url(#gradientId) after ensuring the gradient def exists.
 *
 * @param svg - SVG root element (for gradient defs)
 * @param slotId - Slot identifier
 * @param paint - Paint specification
 * @returns CSS fill value
 */
export function getPaintFillValue(svg: SVGSVGElement, slotId: string, paint: Paint): string {
  if (paint.kind === 'solid') {
    return paint.color;
  }

  const gradientId = ensureGradientDef(svg, slotId, paint);
  return `url(#${gradientId})`;
}
