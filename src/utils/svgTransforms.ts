/**
 * SVG coordinate transformation utilities
 * Converts between screen pixels and SVG viewBox coordinates
 */

/**
 * Convert pixel delta to viewBox coordinates
 * Uses the SVG's Current Transformation Matrix (CTM) to convert screen-space deltas to user-space
 */
export function pxDeltaToViewBox(
  svgEl: SVGSVGElement,
  dxPx: number,
  dyPx: number
): { dx: number; dy: number } {
  const ctm = svgEl.getScreenCTM()
  if (!ctm) return { dx: 0, dy: 0 }

  const inv = ctm.inverse()

  // Convert (dx, dy) in screen pixels to user-space (viewBox)
  const p1 = svgEl.createSVGPoint()
  p1.x = 0
  p1.y = 0

  const p2 = svgEl.createSVGPoint()
  p2.x = dxPx
  p2.y = dyPx

  const u1 = p1.matrixTransform(inv)
  const u2 = p2.matrixTransform(inv)

  return {
    dx: u2.x - u1.x,
    dy: u2.y - u1.y
  }
}

/**
 * Convert viewBox delta to pixel coordinates
 */
export function viewBoxDeltaToPx(
  svgEl: SVGSVGElement,
  dx: number,
  dy: number
): { dxPx: number; dyPx: number } {
  const ctm = svgEl.getScreenCTM()
  if (!ctm) return { dxPx: 0, dyPx: 0 }

  // Convert (dx, dy) in user-space to screen pixels
  const p1 = svgEl.createSVGPoint()
  p1.x = 0
  p1.y = 0

  const p2 = svgEl.createSVGPoint()
  p2.x = dx
  p2.y = dy

  const s1 = p1.matrixTransform(ctm)
  const s2 = p2.matrixTransform(ctm)

  return {
    dxPx: s2.x - s1.x,
    dyPx: s2.y - s1.y
  }
}

/**
 * Get the viewBox as a parsed object
 */
export function getViewBox(svgEl: SVGSVGElement): {
  x: number
  y: number
  width: number
  height: number
} | null {
  const viewBox = svgEl.viewBox.baseVal
  if (!viewBox || viewBox.width === 0 || viewBox.height === 0) {
    return null
  }

  return {
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height
  }
}

/**
 * Create transform string for positioning/sizing a slot
 */
export function createTransform(
  x: number,
  y: number,
  rotation?: number,
  scaleX?: number,
  scaleY?: number
): string {
  const parts: string[] = []

  parts.push(`translate(${x} ${y})`)

  if (rotation) {
    parts.push(`rotate(${rotation})`)
  }

  if (scaleX !== undefined && scaleY !== undefined && (scaleX !== 1 || scaleY !== 1)) {
    parts.push(`scale(${scaleX} ${scaleY})`)
  }

  return parts.join(' ')
}

/**
 * Parse transform attribute to extract translate/rotate/scale values
 */
export function parseTransform(transformStr: string): {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
} {
  const result = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }

  if (!transformStr) return result

  // Parse translate
  const translateMatch = transformStr.match(/translate\s*\(\s*([^,\s)]+)[\s,]+([^)]+)\)/)
  if (translateMatch) {
    result.x = parseFloat(translateMatch[1]) || 0
    result.y = parseFloat(translateMatch[2]) || 0
  }

  // Parse rotate
  const rotateMatch = transformStr.match(/rotate\s*\(\s*([^)]+)\)/)
  if (rotateMatch) {
    result.rotation = parseFloat(rotateMatch[1]) || 0
  }

  // Parse scale
  const scaleMatch = transformStr.match(/scale\s*\(\s*([^,\s)]+)(?:[\s,]+([^)]+))?\)/)
  if (scaleMatch) {
    result.scaleX = parseFloat(scaleMatch[1]) || 1
    result.scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : result.scaleX
  }

  return result
}
