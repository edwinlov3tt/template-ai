/**
 * WCAG 2.1 and APCA contrast utilities
 * Based on W3C WCAG contrast requirements
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Calculate relative luminance (WCAG 2.1)
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255
  const gsRGB = rgb.g / 255
  const bsRGB = rgb.b / 255

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG 2.1 contrast ratio
 * Returns ratio between 1:1 and 21:1
 */
export function wcagContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 1

  const lum1 = relativeLuminance(rgb1)
  const lum2 = relativeLuminance(rgb2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG requirements
 *
 * WCAG 2.1 Level AA:
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 *
 * WCAG 2.1 Level AAA:
 * - Normal text: 7:1
 * - Large text: 4.5:1
 */
export interface ContrastResult {
  ratio: number
  passAA: boolean
  passAAA: boolean
  level: 'fail' | 'AA' | 'AAA'
}

export function checkWcagContrast(
  textColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): ContrastResult {
  const ratio = wcagContrastRatio(textColor, backgroundColor)

  const minAA = isLargeText ? 3 : 4.5
  const minAAA = isLargeText ? 4.5 : 7

  const passAA = ratio >= minAA
  const passAAA = ratio >= minAAA

  const level = passAAA ? 'AAA' : passAA ? 'AA' : 'fail'

  return { ratio, passAA, passAAA, level }
}

/**
 * Get suggested text color (black or white) for maximum contrast
 */
export function getSuggestedTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#000000'

  const luminance = relativeLuminance(rgb)

  // Use white text on dark backgrounds, black on light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Invert text color for contrast
 */
export function invertTextColor(currentColor: string): string {
  const rgb = hexToRgb(currentColor)
  if (!rgb) return '#000000'

  const luminance = relativeLuminance(rgb)
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Calculate overlay alpha needed for minimum contrast
 * Returns alpha value between 0 and 1
 */
export function calculateOverlayAlpha(
  textColor: string,
  backgroundColor: string,
  overlayColor: string = '#000000',
  targetRatio: number = 4.5
): number {
  let alpha = 0
  const step = 0.05

  while (alpha <= 1) {
    const blendedBg = blendColors(backgroundColor, overlayColor, alpha)
    const ratio = wcagContrastRatio(textColor, blendedBg)

    if (ratio >= targetRatio) {
      return Math.min(alpha, 1)
    }

    alpha += step
  }

  return 1
}

/**
 * Blend two colors with alpha
 */
function blendColors(baseColor: string, overlayColor: string, alpha: number): string {
  const base = hexToRgb(baseColor)
  const overlay = hexToRgb(overlayColor)

  if (!base || !overlay) return baseColor

  const r = Math.round(overlay.r * alpha + base.r * (1 - alpha))
  const g = Math.round(overlay.g * alpha + base.g * (1 - alpha))
  const b = Math.round(overlay.b * alpha + base.b * (1 - alpha))

  return rgbToHex(r, g, b)
}

/**
 * Auto-fix strategies for contrast issues
 */
export type AutoFixStrategy = 'invertText' | 'addChip' | 'increaseOverlay'

export interface AutoFixSuggestion {
  strategy: AutoFixStrategy
  description: string
  preview: {
    textColor?: string
    chipColor?: string
    overlayAlpha?: number
  }
}

export function getAutoFixSuggestions(
  textColor: string,
  backgroundColor: string,
  currentOverlayAlpha: number = 0
): AutoFixSuggestion[] {
  const suggestions: AutoFixSuggestion[] = []

  // Strategy 1: Invert text color
  const invertedColor = invertTextColor(textColor)
  const invertedRatio = wcagContrastRatio(invertedColor, backgroundColor)
  if (invertedRatio >= 4.5) {
    suggestions.push({
      strategy: 'invertText',
      description: `Change text to ${invertedColor === '#FFFFFF' ? 'white' : 'black'}`,
      preview: { textColor: invertedColor }
    })
  }

  // Strategy 2: Add chip (solid background behind text)
  const chipColor = getSuggestedTextColor(textColor)
  suggestions.push({
    strategy: 'addChip',
    description: `Add ${chipColor === '#FFFFFF' ? 'white' : 'black'} chip behind text`,
    preview: { chipColor }
  })

  // Strategy 3: Increase overlay
  const neededAlpha = calculateOverlayAlpha(textColor, backgroundColor, '#000000', 4.5)
  if (neededAlpha > currentOverlayAlpha && neededAlpha < 1) {
    suggestions.push({
      strategy: 'increaseOverlay',
      description: `Increase overlay to ${Math.round(neededAlpha * 100)}%`,
      preview: { overlayAlpha: neededAlpha }
    })
  }

  return suggestions
}
