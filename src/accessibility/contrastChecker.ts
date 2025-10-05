/**
 * Contrast checking service for text layers
 * Evaluates text against backgrounds and provides fix suggestions
 */

import type { Template, Slot } from '../schema/types'
import { checkWcagContrast, getAutoFixSuggestions, type ContrastResult, type AutoFixSuggestion } from './contrastUtils'

export interface LayerContrastInfo {
  slotId: string
  slotName: string
  textColor: string
  backgroundColor: string
  contrastResult: ContrastResult
  suggestions: AutoFixSuggestion[]
  hasIssue: boolean
}

/**
 * Check contrast for all text layers in template
 */
export function checkTemplateContrast(template: Template): LayerContrastInfo[] {
  const results: LayerContrastInfo[] = []

  // Collect all slots from all pages
  const allSlots = template.pages.flatMap(page => page.slots)

  // Get background color - find a slot with name 'bg' or use palette background
  const bgSlot = allSlots.find(s => s.name === 'bg')
  const bgColor = bgSlot?.fill || template.tokens.palette.background || '#FFFFFF'

  // Check all text slots across all pages
  allSlots.forEach((slot) => {
    if (slot.type === 'text' && slot.fill) {
      const textColor = slot.fill
      const fontSize = slot.fontSize
      const fontWeight = slot.fontWeight
      const isLargeText = (fontSize || 16) >= 18 ||
                          ((fontSize || 16) >= 14 && (fontWeight === 'bold' || fontWeight === '700' || fontWeight === 700))

      const contrastResult = checkWcagContrast(textColor, bgColor, isLargeText)
      const suggestions = contrastResult.passAA
        ? []
        : getAutoFixSuggestions(textColor, bgColor, 0)

      results.push({
        slotId: slot.name,
        slotName: slot.name,
        textColor,
        backgroundColor: bgColor,
        contrastResult,
        suggestions,
        hasIssue: !contrastResult.passAA
      })
    }
  })

  return results
}

/**
 * Get contrast info for a specific slot
 */
export function checkSlotContrast(
  template: Template,
  slotName: string
): LayerContrastInfo | null {
  // Collect all slots from all pages
  const allSlots = template.pages.flatMap(page => page.slots)

  const slot = allSlots.find(s => s.name === slotName)
  if (!slot || slot.type !== 'text' || !slot.fill) {
    return null
  }

  const bgSlot = allSlots.find(s => s.name === 'bg')
  const bgColor = bgSlot?.fill || template.tokens.palette.background || '#FFFFFF'
  const textColor = slot.fill
  const fontSize = slot.fontSize
  const fontWeight = slot.fontWeight
  const isLargeText = (fontSize || 16) >= 18 ||
                      ((fontSize || 16) >= 14 && (fontWeight === 'bold' || fontWeight === '700' || fontWeight === 700))

  const contrastResult = checkWcagContrast(textColor, bgColor, isLargeText)
  const suggestions = contrastResult.passAA
    ? []
    : getAutoFixSuggestions(textColor, bgColor, 0)

  return {
    slotId: slotName,
    slotName: slot.name,
    textColor,
    backgroundColor: bgColor,
    contrastResult,
    suggestions,
    hasIssue: !contrastResult.passAA
  }
}

/**
 * Get contrast badge color based on WCAG level
 */
export function getContrastBadgeColor(level: 'fail' | 'AA' | 'AAA'): string {
  switch (level) {
    case 'AAA': return '#10b981' // green
    case 'AA': return '#f59e0b'  // amber
    case 'fail': return '#ef4444' // red
  }
}

/**
 * Get contrast badge label
 */
export function getContrastBadgeLabel(level: 'fail' | 'AA' | 'AAA'): string {
  switch (level) {
    case 'AAA': return 'AAA'
    case 'AA': return 'AA'
    case 'fail': return 'Fail'
  }
}
