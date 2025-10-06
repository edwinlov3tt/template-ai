/**
 * Glitch Effect Builder
 *
 * Creates RGB channel separation glitch effect with horizontal slices.
 * Uses displacement and color matrix for chromatic aberration.
 */

export interface GlitchParams {
  slices: number       // Number of glitch slices
  amplitude: number    // Displacement amount (px)
  seed?: number        // Random seed for deterministic glitch
  colorA: string       // First RGB channel color
  colorB: string       // Second RGB channel color
}

export function makeGlitch(params: GlitchParams): { id: string; node: SVGFilterElement } {
  const { slices, amplitude, seed = 12345, colorA, colorB } = params

  // Generate unique ID based on params
  const id = `effect-glitch-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
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

  // Parse colors to RGB
  const parseColor = (color: string): { r: number; g: number; b: number } => {
    const hex = color.replace('#', '')
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255
    }
  }

  const rgb1 = parseColor(colorA)
  const rgb2 = parseColor(colorB)

  // Create turbulence for displacement
  const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence')
  turbulence.setAttribute('type', 'fractalNoise')
  turbulence.setAttribute('baseFrequency', `0 ${(slices * 0.01).toString()}`)
  turbulence.setAttribute('numOctaves', '2')
  turbulence.setAttribute('seed', seed.toString())
  turbulence.setAttribute('result', 'turbulence')

  // Displace for horizontal slices
  const displace = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap')
  displace.setAttribute('in', 'SourceGraphic')
  displace.setAttribute('in2', 'turbulence')
  displace.setAttribute('scale', amplitude.toString())
  displace.setAttribute('xChannelSelector', 'R')
  displace.setAttribute('yChannelSelector', 'G')
  displace.setAttribute('result', 'displaced')

  // Offset channel A (e.g., magenta/red)
  const offset1 = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset')
  offset1.setAttribute('in', 'SourceGraphic')
  offset1.setAttribute('dx', (-amplitude * 0.5).toString())
  offset1.setAttribute('dy', '0')
  offset1.setAttribute('result', 'offset1')

  // Color matrix for channel A
  const colorMatrix1 = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
  colorMatrix1.setAttribute('in', 'offset1')
  colorMatrix1.setAttribute('type', 'matrix')
  colorMatrix1.setAttribute('values', `
    ${rgb1.r} 0 0 0 0
    ${rgb1.g} 0 0 0 0
    ${rgb1.b} 0 0 0 0
    0 0 0 0.8 0
  `)
  colorMatrix1.setAttribute('result', 'channel1')

  // Offset channel B (e.g., cyan/blue)
  const offset2 = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset')
  offset2.setAttribute('in', 'SourceGraphic')
  offset2.setAttribute('dx', (amplitude * 0.5).toString())
  offset2.setAttribute('dy', '0')
  offset2.setAttribute('result', 'offset2')

  // Color matrix for channel B
  const colorMatrix2 = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
  colorMatrix2.setAttribute('in', 'offset2')
  colorMatrix2.setAttribute('type', 'matrix')
  colorMatrix2.setAttribute('values', `
    0 0 0 0 0
    0 ${rgb2.g} 0 0 0
    0 0 ${rgb2.b} 0 0
    0 0 0 0.8 0
  `)
  colorMatrix2.setAttribute('result', 'channel2')

  // Blend channels using screen mode
  const blend1 = document.createElementNS('http://www.w3.org/2000/svg', 'feBlend')
  blend1.setAttribute('in', 'channel1')
  blend1.setAttribute('in2', 'channel2')
  blend1.setAttribute('mode', 'screen')
  blend1.setAttribute('result', 'blended')

  // Composite with displaced for slice effect
  const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
  composite.setAttribute('in', 'blended')
  composite.setAttribute('in2', 'displaced')
  composite.setAttribute('operator', 'atop')
  composite.setAttribute('result', 'final')

  // Assemble filter
  filter.appendChild(turbulence)
  filter.appendChild(displace)
  filter.appendChild(offset1)
  filter.appendChild(colorMatrix1)
  filter.appendChild(offset2)
  filter.appendChild(colorMatrix2)
  filter.appendChild(blend1)
  filter.appendChild(composite)

  return { id, node: filter }
}
