/**
 * Curve Path Builder
 *
 * Creates circular arc path for <textPath> element.
 * Allows text to follow curved path.
 */

export interface CurveParams {
  radius: number        // Curve radius (px)
  viewBoxWidth: number  // ViewBox width for centering
}

export function makeCurvePath(params: CurveParams): { id: string; node: SVGPathElement } {
  const { radius, viewBoxWidth } = params

  // Generate unique ID based on params
  const id = `effect-curve-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)).toString(36)}`

  // Create path element
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('id', id)

  // Calculate arc center and endpoints
  const centerX = viewBoxWidth / 2
  const startX = centerX - radius
  const endX = centerX + radius
  const y = radius // Arc starts at top

  // Create circular arc path (top half of circle)
  // M = move to start point
  // A = arc (rx ry rotation large-arc-flag sweep-flag x y)
  const pathData = `M ${startX} ${y} A ${radius} ${radius} 0 0 1 ${endX} ${y}`
  path.setAttribute('d', pathData)

  // Make path invisible (only used for textPath reference)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'none')

  return { id, node: path }
}
