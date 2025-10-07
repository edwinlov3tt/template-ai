/**
 * Echo Effect Builder
 *
 * Creates echo/trail effect by duplicating text N times with incremental offsets.
 * Each echo has progressively lower opacity.
 */

export interface EchoParams {
  count: number     // Number of echoes
  dx: number        // Horizontal offset per echo (px)
  dy: number        // Vertical offset per echo (px)
  blur: number      // Blur amount (px)
  color: string     // Echo color (hex or rgb)
  alpha: number     // Base echo opacity (0-1)
}

export function makeEcho(params: EchoParams): { id: string; node: SVGFilterElement } {
  const { count, dx, dy, blur, color, alpha } = params

  // Generate unique ID based on params
  const id = `effect-echo-${Math.abs(JSON.stringify(params).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)).toString(36)}`

  // Create filter element
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('x', '-100%')
  filter.setAttribute('y', '-100%')
  filter.setAttribute('width', '300%')
  filter.setAttribute('height', '300%')
  filter.setAttribute('color-interpolation-filters', 'sRGB')

  // Apply color to all echoes
  const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood')
  flood.setAttribute('flood-color', color)
  flood.setAttribute('result', 'echoColor')

  filter.appendChild(flood)

  // Create merge node to combine all echoes
  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')

  // Generate echoes from back to front
  for (let i = count; i > 0; i--) {
    const echoAlpha = alpha * (i / count) // Fade older echoes
    const offsetX = dx * i
    const offsetY = dy * i

    // Offset the source alpha
    const offset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset')
    offset.setAttribute('in', 'SourceAlpha')
    offset.setAttribute('dx', offsetX.toString())
    offset.setAttribute('dy', offsetY.toString())
    offset.setAttribute('result', `offset${i}`)

    // Optional blur
    let blurResult = `offset${i}`
    if (blur > 0) {
      const blurNode = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
      blurNode.setAttribute('in', `offset${i}`)
      blurNode.setAttribute('stdDeviation', blur.toString())
      blurNode.setAttribute('result', `blur${i}`)
      blurResult = `blur${i}`
      filter.appendChild(offset)
      filter.appendChild(blurNode)
    } else {
      filter.appendChild(offset)
    }

    // Apply color and alpha
    const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite')
    composite.setAttribute('in', 'echoColor')
    composite.setAttribute('in2', blurResult)
    composite.setAttribute('operator', 'in')
    composite.setAttribute('result', `composited${i}`)

    const componentTransfer = document.createElementNS('http://www.w3.org/2000/svg', 'feComponentTransfer')
    componentTransfer.setAttribute('in', `composited${i}`)
    componentTransfer.setAttribute('result', `echo${i}`)

    const funcA = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncA')
    funcA.setAttribute('type', 'linear')
    funcA.setAttribute('slope', echoAlpha.toString())

    componentTransfer.appendChild(funcA)

    filter.appendChild(composite)
    filter.appendChild(componentTransfer)

    // Add to merge
    const mergeNode = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
    mergeNode.setAttribute('in', `echo${i}`)
    merge.appendChild(mergeNode)
  }

  // Add original on top
  const mergeOriginal = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
  mergeOriginal.setAttribute('in', 'SourceGraphic')
  merge.appendChild(mergeOriginal)

  filter.appendChild(merge)

  return { id, node: filter }
}
