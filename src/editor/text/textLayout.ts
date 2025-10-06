/**
 * Text Layout Utilities
 *
 * Provides functions for text wrapping, auto-fit sizing, and layout calculations
 * Uses canvas measureText for accurate text measurements
 */

// Create a shared canvas for text measurement
let measurementCanvas: HTMLCanvasElement | null = null
let measurementContext: CanvasRenderingContext2D | null = null

/**
 * Get or create the measurement canvas context
 */
function getMeasurementContext(): CanvasRenderingContext2D {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas')
    measurementContext = measurementCanvas.getContext('2d')
  }

  if (!measurementContext) {
    throw new Error('Unable to create canvas 2D context for text measurement')
  }

  return measurementContext
}

/**
 * Measure text width using canvas
 *
 * @param text - Text to measure
 * @param fontFamily - Font family
 * @param fontSize - Font size in viewBox units
 * @param fontWeight - Font weight
 * @returns Width in viewBox units
 */
export function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number = 400
): number {
  const ctx = getMeasurementContext()

  // Set font properties
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

  // Measure text
  const metrics = ctx.measureText(text)

  return metrics.width
}

/**
 * Measure text height (approximate using fontSize and lineHeight)
 *
 * @param fontSize - Font size in viewBox units
 * @param lineHeight - Line height multiplier (e.g., 1.2)
 * @returns Height in viewBox units
 */
export function measureTextHeight(fontSize: number, lineHeight: number = 1.2): number {
  return fontSize * lineHeight
}

/**
 * Wrap text to fit within a box width
 *
 * @param text - Text to wrap
 * @param fontFamily - Font family
 * @param fontSize - Font size in viewBox units
 * @param boxWidth - Maximum width per line
 * @param lineHeight - Line height multiplier
 * @param fontWeight - Font weight
 * @returns Array of lines
 */
export function wrapTextToBox(
  text: string,
  fontFamily: string,
  fontSize: number,
  boxWidth: number,
  lineHeight: number = 1.2,
  fontWeight: number = 400
): string[] {
  if (!text) return []

  // Split into paragraphs first (preserve explicit line breaks)
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      // Empty paragraph - add blank line
      lines.push('')
      continue
    }

    // Split paragraph into words
    const words = paragraph.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = measureTextWidth(testLine, fontFamily, fontSize, fontWeight)

      if (testWidth <= boxWidth) {
        currentLine = testLine
      } else {
        // Line is too long
        if (currentLine) {
          // Push current line and start new one
          lines.push(currentLine)
          currentLine = word
        } else {
          // Single word is too long - add it anyway
          lines.push(word)
          currentLine = ''
        }
      }
    }

    // Add remaining text
    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * Calculate optimal font size to fit text within a box (auto-fit)
 *
 * Uses binary search to find the largest fontSize that fits
 *
 * @param text - Text to fit
 * @param fontFamily - Font family
 * @param fontWeight - Font weight
 * @param boxWidth - Maximum width
 * @param boxHeight - Maximum height
 * @param padding - Padding to subtract from box dimensions
 * @param lineHeight - Line height multiplier
 * @param minSize - Minimum font size
 * @param maxSize - Maximum font size
 * @returns Optimal font size in viewBox units
 */
export function calculateAutoFitSize(
  text: string,
  fontFamily: string,
  fontWeight: number,
  boxWidth: number,
  boxHeight: number,
  padding: number = 0,
  lineHeight: number = 1.2,
  minSize: number = 6,
  maxSize: number = 500
): number {
  if (!text || boxWidth <= 0 || boxHeight <= 0) {
    return minSize
  }

  // Adjust for padding
  const availableWidth = Math.max(0, boxWidth - padding * 2)
  const availableHeight = Math.max(0, boxHeight - padding * 2)

  if (availableWidth <= 0 || availableHeight <= 0) {
    return minSize
  }

  // Binary search for optimal size
  let low = minSize
  let high = maxSize
  let bestSize = minSize

  // Maximum iterations to prevent infinite loop
  const maxIterations = 20
  let iterations = 0

  while (low <= high && iterations < maxIterations) {
    iterations++
    const mid = Math.floor((low + high) / 2)

    // Try wrapping at this font size
    const lines = wrapTextToBox(text, fontFamily, mid, availableWidth, lineHeight, fontWeight)
    const totalHeight = lines.length * measureTextHeight(mid, lineHeight)

    if (totalHeight <= availableHeight) {
      // Text fits - try larger
      bestSize = mid
      low = mid + 1
    } else {
      // Text too tall - try smaller
      high = mid - 1
    }
  }

  return bestSize
}

/**
 * Check if text fits within a box at a given font size
 *
 * @param text - Text to check
 * @param fontFamily - Font family
 * @param fontSize - Font size in viewBox units
 * @param fontWeight - Font weight
 * @param boxWidth - Maximum width
 * @param boxHeight - Maximum height
 * @param lineHeight - Line height multiplier
 * @returns True if text fits
 */
export function textFitsInBox(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  boxWidth: number,
  boxHeight: number,
  lineHeight: number = 1.2
): boolean {
  const lines = wrapTextToBox(text, fontFamily, fontSize, boxWidth, lineHeight, fontWeight)
  const totalHeight = lines.length * measureTextHeight(fontSize, lineHeight)

  return totalHeight <= boxHeight
}

/**
 * Calculate text bounds (width and height) for wrapped text
 *
 * @param text - Text to measure
 * @param fontFamily - Font family
 * @param fontSize - Font size in viewBox units
 * @param fontWeight - Font weight
 * @param boxWidth - Maximum width for wrapping
 * @param lineHeight - Line height multiplier
 * @returns Bounds { width, height }
 */
export function calculateTextBounds(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  boxWidth: number,
  lineHeight: number = 1.2
): { width: number; height: number } {
  const lines = wrapTextToBox(text, fontFamily, fontSize, boxWidth, lineHeight, fontWeight)

  if (lines.length === 0) {
    return { width: 0, height: 0 }
  }

  // Find widest line
  const maxLineWidth = Math.max(
    ...lines.map((line) => measureTextWidth(line, fontFamily, fontSize, fontWeight))
  )

  const totalHeight = lines.length * measureTextHeight(fontSize, lineHeight)

  return {
    width: maxLineWidth,
    height: totalHeight
  }
}
