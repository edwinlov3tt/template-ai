/**
 * Stroke Utilities
 *
 * Helper functions for applying stroke effects to SVG text elements.
 * Supports hollow text, outlined text, and custom paint order.
 */

export interface StrokeConfig {
  width: number                              // Stroke width (px)
  color: string                              // Stroke color (hex or rgb)
  paintOrder?: 'stroke fill' | 'fill stroke' // Paint order (default: 'fill stroke')
}

/**
 * Apply stroke to SVG element
 *
 * For hollow text: set fill='none', apply stroke
 * For outline: set paint-order='stroke fill' to render stroke behind fill
 */
export function applyStroke(element: SVGElement, config: StrokeConfig): void {
  const { width, color, paintOrder = 'fill stroke' } = config

  element.setAttribute('stroke', color)
  element.setAttribute('stroke-width', width.toString())
  element.setAttribute('stroke-linecap', 'round')
  element.setAttribute('stroke-linejoin', 'round')
  element.setAttribute('paint-order', paintOrder)
}

/**
 * Create hollow text effect (no fill, stroke only)
 */
export function applyHollowStroke(element: SVGElement, config: Omit<StrokeConfig, 'paintOrder'>): void {
  const { width, color } = config

  element.setAttribute('fill', 'none')
  element.setAttribute('stroke', color)
  element.setAttribute('stroke-width', width.toString())
  element.setAttribute('stroke-linecap', 'round')
  element.setAttribute('stroke-linejoin', 'round')
}

/**
 * Create outlined text effect (stroke behind fill)
 */
export function applyOutlineStroke(element: SVGElement, config: Omit<StrokeConfig, 'paintOrder'>): void {
  applyStroke(element, { ...config, paintOrder: 'stroke fill' })
}

/**
 * Remove stroke from element
 */
export function removeStroke(element: SVGElement): void {
  element.removeAttribute('stroke')
  element.removeAttribute('stroke-width')
  element.removeAttribute('stroke-linecap')
  element.removeAttribute('stroke-linejoin')
  element.removeAttribute('paint-order')
}

/**
 * Check if element has stroke applied
 */
export function hasStroke(element: SVGElement): boolean {
  return element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none'
}

/**
 * Get stroke configuration from element
 */
export function getStrokeConfig(element: SVGElement): StrokeConfig | null {
  if (!hasStroke(element)) return null

  const width = parseFloat(element.getAttribute('stroke-width') || '0')
  const color = element.getAttribute('stroke') || '#000000'
  const paintOrder = (element.getAttribute('paint-order') || 'fill stroke') as 'stroke fill' | 'fill stroke'

  return { width, color, paintOrder }
}
