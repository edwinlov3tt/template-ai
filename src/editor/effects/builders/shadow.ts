/**
 * Shadow Effect Builder
 *
 * Creates drop shadow using SVG filters:
 * - feGaussianBlur for blur
 * - feOffset for position
 * - feComponentTransfer for alpha control
 * - feMerge to composite shadow with original
 */

export interface ShadowParams {
  dx: number        // Horizontal offset (px)
  dy: number        // Vertical offset (px)
  blur: number      // Blur radius (px)
  color: string     // Shadow color (hex or rgb)
  alpha: number     // Shadow opacity (0-1)
}

export function makeShadow(params: ShadowParams): { id: string; node: SVGFilterElement } {
  const { dx, dy, blur, color, alpha } = params

  // Generate unique ID based on params
  const id = `effect-shadow-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)).toString(36)}`

  // Create filter element
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')
  filter.setAttribute('color-interpolation-filters', 'sRGB')

  // 1. Blur the source alpha channel
  const blur1 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
  blur1.setAttribute('in', 'SourceAlpha')
  blur1.setAttribute('stdDeviation', blur.toString())
  blur1.setAttribute('result', 'blur')

  // 2. Offset the blurred shadow
  const offset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset')
  offset.setAttribute('in', 'blur')
  offset.setAttribute('dx', dx.toString())
  offset.setAttribute('dy', dy.toString())
  offset.setAttribute('result', 'offsetBlur')

  // 3. Apply color to shadow
  const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood')
  flood.setAttribute('flood-color', color)
  flood.setAttribute('flood-opacity', alpha.toString())
  flood.setAttribute('result', 'color')

  // 4. Composite color with shadow shape
  const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite.setAttribute('in', 'color')
  composite.setAttribute('in2', 'offsetBlur')
  composite.setAttribute('operator', 'in')
  composite.setAttribute('result', 'shadow')

  // 5. Merge shadow under original
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')

  const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode1.setAttribute('in', 'shadow')

  const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode2.setAttribute('in', 'SourceGraphic')

  merge.appendChild(mergeNode1)
  merge.appendChild(mergeNode2)

  // Assemble filter
  filter.appendChild(blur1)
  filter.appendChild(offset)
  filter.appendChild(flood)
  filter.appendChild(composite)
  filter.appendChild(merge)

  return { id, node: filter }
}
