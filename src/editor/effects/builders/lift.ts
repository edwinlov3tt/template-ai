/**
 * Lift Effect Builder
 *
 * Creates ambient elevation shadow (no offset) for "floating" appearance.
 * Similar to Material Design elevation but as an SVG filter.
 */

export interface LiftParams {
  blur: number      // Blur radius (px)
  alpha: number     // Shadow opacity (0-1)
}

export function makeLift(params: LiftParams): { id: string; node: SVGFilterElement } {
  const { blur, alpha } = params

  // Generate unique ID based on params
  const id = `effect-lift-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
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

  // 1. Blur the source alpha channel (no offset = ambient glow)
  const blur1 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
  blur1.setAttribute('in', 'SourceAlpha')
  blur1.setAttribute('stdDeviation', blur.toString())
  blur1.setAttribute('result', 'blur')

  // 2. Apply black color with alpha
  const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood')
  flood.setAttribute('flood-color', '#000000')
  flood.setAttribute('flood-opacity', alpha.toString())
  flood.setAttribute('result', 'color')

  // 3. Composite color with shadow shape
  const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite.setAttribute('in', 'color')
  composite.setAttribute('in2', 'blur')
  composite.setAttribute('operator', 'in')
  composite.setAttribute('result', 'shadow')

  // 4. Merge shadow under original
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')

  const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode1.setAttribute('in', 'shadow')

  const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode2.setAttribute('in', 'SourceGraphic')

  merge.appendChild(mergeNode1)
  merge.appendChild(mergeNode2)

  // Assemble filter
  filter.appendChild(blur1)
  filter.appendChild(flood)
  filter.appendChild(composite)
  filter.appendChild(merge)

  return { id, node: filter }
}
