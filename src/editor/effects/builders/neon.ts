/**
 * Neon Effect Builder
 *
 * Creates neon glow effect with colored stroke + outer glow layers.
 * Simulates neon tube lighting with multiple blur passes.
 */

export interface NeonParams {
  stroke: number    // Stroke width (px)
  glow: number      // Glow intensity/blur (px)
  color: string     // Neon color (hex or rgb)
}

export function makeNeon(params: NeonParams): { id: string; node: SVGFilterElement } {
  const { stroke, glow, color } = params

  // Generate unique ID based on params
  const id = `effect-neon-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
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

  // 1. Create morphology for stroke effect
  const morphology = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology')
  morphology.setAttribute('in', 'SourceAlpha')
  morphology.setAttribute('operator', 'dilate')
  morphology.setAttribute('radius', (stroke / 2).toString())
  morphology.setAttribute('result', 'thick')

  // 2. Outer glow layer (large blur)
  const blur1 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
  blur1.setAttribute('in', 'thick')
  blur1.setAttribute('stdDeviation', glow.toString())
  blur1.setAttribute('result', 'glow')

  // 3. Inner glow layer (medium blur)
  const blur2 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
  blur2.setAttribute('in', 'thick')
  blur2.setAttribute('stdDeviation', (glow * 0.5).toString())
  blur2.setAttribute('result', 'innerGlow')

  // 4. Apply neon color to all layers
  const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood')
  flood.setAttribute('flood-color', color)
  flood.setAttribute('result', 'color')

  // 5. Composite color with outer glow
  const composite1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite1.setAttribute('in', 'color')
  composite1.setAttribute('in2', 'glow')
  composite1.setAttribute('operator', 'in')
  composite1.setAttribute('result', 'outerGlow')

  // 6. Composite color with inner glow
  const composite2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite2.setAttribute('in', 'color')
  composite2.setAttribute('in2', 'innerGlow')
  composite2.setAttribute('operator', 'in')
  composite2.setAttribute('result', 'innerGlowColor')

  // 7. Composite color with stroke
  const composite3 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite3.setAttribute('in', 'color')
  composite3.setAttribute('in2', 'thick')
  composite3.setAttribute('operator', 'in')
  composite3.setAttribute('result', 'stroke')

  // 8. Merge all layers: outer glow + inner glow + stroke + original
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')

  const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode1.setAttribute('in', 'outerGlow')

  const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode2.setAttribute('in', 'innerGlowColor')

  const mergeNode3 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode3.setAttribute('in', 'stroke')

  const mergeNode4 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeNode4.setAttribute('in', 'SourceGraphic')

  merge.appendChild(mergeNode1)
  merge.appendChild(mergeNode2)
  merge.appendChild(mergeNode3)
  merge.appendChild(mergeNode4)

  // Assemble filter
  filter.appendChild(morphology)
  filter.appendChild(blur1)
  filter.appendChild(blur2)
  filter.appendChild(flood)
  filter.appendChild(composite1)
  filter.appendChild(composite2)
  filter.appendChild(composite3)
  filter.appendChild(merge)

  return { id, node: filter }
}
