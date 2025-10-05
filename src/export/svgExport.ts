import type { Template } from '../schema/types'

/**
 * Export template as SVG string
 * Serializes the current SVG DOM to a string with proper viewBox and attributes
 */
export function exportSVG(svgElement: SVGSVGElement): string {
  if (!svgElement) {
    throw new Error('SVG element is required for export')
  }

  // Clone the SVG to avoid modifying the original
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  // Ensure xmlns attributes are present for standalone SVG
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  // Normalize href/xlink:href for maximum compatibility
  normalizeHrefs(clone)

  // Serialize to string
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)

  // Pretty print with proper indentation (optional)
  return formatSvgString(svgString)
}

/**
 * Normalize href and xlink:href attributes
 * SVG2 prefers href, but xlink:href is included for backward compatibility
 */
function normalizeHrefs(svgElement: SVGElement) {
  // Find all elements with href or xlink:href
  const elements = svgElement.querySelectorAll('image, use, a')

  elements.forEach(el => {
    const href = el.getAttribute('href')
    const xlinkHref = el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')

    // If we have href but no xlink:href, add xlink:href for compatibility
    if (href && !xlinkHref) {
      el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href)
    }

    // If we have xlink:href but no href, add href for SVG2
    if (xlinkHref && !href) {
      el.setAttribute('href', xlinkHref)
    }
  })
}

/**
 * Format SVG string with basic indentation
 * This makes the exported SVG more readable
 */
function formatSvgString(svgString: string): string {
  // Basic formatting - add newlines and indentation
  let formatted = svgString
    .replace(/></g, '>\n<')
    .replace(/(<\w+)([^>]*>)/g, (match, tag, rest) => {
      // Don't add newlines inside tags
      return tag + rest
    })

  return formatted
}

/**
 * Download SVG as a file
 */
export function downloadSVG(svgString: string, filename: string = 'template.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

/**
 * Copy SVG to clipboard
 */
export async function copySVGToClipboard(svgString: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(svgString)
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err)
    throw err
  }
}
