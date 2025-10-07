/**
 * Background/Highlight Utilities
 *
 * Creates auto-sized background rectangles behind text elements.
 * Useful for creating highlighted text effects.
 */

export interface HighlightParams {
  text: SVGTextElement         // Text element to measure
  fill: string                 // Background fill color
  padding: [number, number]    // Padding [horizontal, vertical] in px
  rx?: number                  // Border radius (optional)
}

/**
 * Create highlight rectangle behind text
 *
 * Measures text bounding box and creates a rect with padding.
 * The rect should be inserted before the text element in DOM.
 */
export function createHighlightRect(params: HighlightParams): SVGRectElement {
  const { text, fill, padding, rx = 0 } = params

  // Get text bounding box
  const bbox = text.getBBox()

  // Create rect element
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

  // Apply dimensions with padding
  rect.setAttribute('x', (bbox.x - padding[0]).toString())
  rect.setAttribute('y', (bbox.y - padding[1]).toString())
  rect.setAttribute('width', (bbox.width + padding[0] * 2).toString())
  rect.setAttribute('height', (bbox.height + padding[1] * 2).toString())

  // Apply styling
  rect.setAttribute('fill', fill)

  if (rx > 0) {
    rect.setAttribute('rx', rx.toString())
    rect.setAttribute('ry', rx.toString())
  }

  return rect
}

/**
 * Update highlight rect to match text bounds
 *
 * Useful when text content or style changes.
 */
export function updateHighlightRect(rect: SVGRectElement, params: HighlightParams): void {
  const { text, fill, padding, rx = 0 } = params

  // Get updated text bounding box
  const bbox = text.getBBox()

  // Update rect attributes
  rect.setAttribute('x', (bbox.x - padding[0]).toString())
  rect.setAttribute('y', (bbox.y - padding[1]).toString())
  rect.setAttribute('width', (bbox.width + padding[0] * 2).toString())
  rect.setAttribute('height', (bbox.height + padding[1] * 2).toString())
  rect.setAttribute('fill', fill)

  if (rx > 0) {
    rect.setAttribute('rx', rx.toString())
    rect.setAttribute('ry', rx.toString())
  }
}

/**
 * Create highlight with multiple lines
 *
 * For multi-line text, create separate rects for each line.
 */
export function createMultiLineHighlight(params: {
  text: SVGTextElement
  fill: string
  padding: [number, number]
  rx?: number
}): SVGGElement {
  const { text, fill, padding, rx = 0 } = params

  // Create group to hold all highlight rects
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.setAttribute('class', 'text-highlight')

  // Get all tspan elements (one per line)
  const tspans = text.querySelectorAll('tspan')

  if (tspans.length === 0) {
    // No tspans, treat as single line
    const rect = createHighlightRect({ text, fill, padding, rx })
    group.appendChild(rect)
  } else {
    // Create rect for each line
    tspans.forEach((tspan) => {
      try {
        const bbox = (tspan as SVGTSpanElement).getBBox()

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', (bbox.x - padding[0]).toString())
        rect.setAttribute('y', (bbox.y - padding[1]).toString())
        rect.setAttribute('width', (bbox.width + padding[0] * 2).toString())
        rect.setAttribute('height', (bbox.height + padding[1] * 2).toString())
        rect.setAttribute('fill', fill)

        if (rx > 0) {
          rect.setAttribute('rx', rx.toString())
          rect.setAttribute('ry', rx.toString())
        }

        group.appendChild(rect)
      } catch (e) {
        // getBBox can fail for hidden elements
        console.warn('Failed to get bbox for tspan', e)
      }
    })
  }

  return group
}

/**
 * Remove highlight from text element
 *
 * Finds and removes the highlight rect/group that precedes the text.
 */
export function removeHighlight(text: SVGTextElement): void {
  const parent = text.parentElement
  if (!parent) return

  // Look for previous sibling with class 'text-highlight'
  let prev = text.previousElementSibling
  while (prev) {
    if (prev.classList.contains('text-highlight') ||
        prev.getAttribute('data-highlight') === 'true') {
      prev.remove()
      return
    }
    prev = prev.previousElementSibling
  }
}
