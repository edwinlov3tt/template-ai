
import { applyConstraints, type FrameMap } from './constraintSolver'
import type { Template, Page } from '../schema/types'

/**
 * Layout engine using kiwi.js constraint solver
 * Parses template constraints and solves for optimal positions
 *
 * NOTE: This is deprecated for multi-page templates. Use page.frames[ratioId] directly.
 * Only used as fallback for legacy single-page templates without pages array.
 */
export function applyLayoutForSize(template: Template, width: number, height: number, currentRatio?: string): FrameMap {
  try {
    // For multi-page templates, use first page's frames as fallback
    if (template.pages && template.pages.length > 0) {
      const firstPage = template.pages[0]
      const ratioKey = currentRatio || '1:1'
      if (firstPage.frames && firstPage.frames[ratioKey]) {
        console.log('[layoutEngine] Using frames from first page (multi-page fallback)')
        return firstPage.frames[ratioKey]
      }
      // If no frames for current ratio, use fallback layout with first page's slots
      return fallbackLayoutWithPage(firstPage, template.canvas.baseViewBox)
    }

    // Legacy: Use constraint solver if template has constraints (deprecated)
    if (template.constraints && (template.constraints.global?.length || Object.keys(template.constraints.byRatio || {}).length)) {
      console.warn('[layoutEngine] Using deprecated constraint solver with legacy template structure')
      return applyConstraints(template, width, height, currentRatio)
    }

    // Fallback to simple layout if no constraints (deprecated path)
    console.warn('[layoutEngine] Using deprecated fallback layout - template should use pages structure')
    return {}
  } catch (error) {
    console.error('Layout engine failed:', error)
    return {}
  }
}

/**
 * Fallback layout for a specific page
 * Uses page's slots to generate default frame positions
 */
function fallbackLayoutWithPage(page: Page, viewBox: [number, number, number, number]): FrameMap {
  const [vbX, vbY, vbWidth, vbHeight] = viewBox
  const pad = vbWidth * 0.03 // 3% padding in viewBox coordinates
  const frames: FrameMap = {}

  console.log('[fallbackLayoutWithPage] Creating default layout for', page.slots.length, 'slots')

  // For each slot, create a default grid position
  page.slots.forEach((slot, index) => {
    const cols = Math.ceil(Math.sqrt(page.slots.length))
    const col = index % cols
    const row = Math.floor(index / cols)
    const spacing = vbWidth * 0.11

    frames[slot.name] = {
      x: vbX + pad + col * spacing,
      y: vbY + pad + row * spacing,
      width: vbWidth * 0.09,
      height: vbHeight * 0.09
    }
  })

  return frames
}

