import type { Template, Page } from '../schema/types'

/**
 * Generate unique ID for pages
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Migrate legacy single-page template to multi-page format
 * Handles backward compatibility for templates with slots/frames at root level
 */
export function migrateTemplate(data: any): Template {
  // Already using new format with pages array
  if (data.pages && Array.isArray(data.pages)) {
    // Ensure all pages have required fields
    return {
      ...data,
      pages: data.pages.map((page: any, index: number) => ({
        id: page.id || generatePageId(),
        name: page.name || `page-${index + 1}`,
        slots: page.slots || [],
        frames: page.frames || {}
      }))
    }
  }

  // Legacy format with slots at root - convert to single page
  if (data.slots && Array.isArray(data.slots)) {
    const legacyPage: Page = {
      id: generatePageId(),
      name: 'page-1',
      slots: data.slots,
      frames: data.frames || {}
    }

    // Remove legacy fields and return clean multi-page structure
    const { slots: _, frames: __, ...cleanData } = data
    return {
      ...cleanData,
      pages: [legacyPage]
    }
  }

  // No slots or pages - create empty page
  return {
    ...data,
    pages: [{
      id: generatePageId(),
      name: 'page-1',
      slots: [],
      frames: {}
    }]
  }
}

/**
 * Export template in legacy single-page format
 * Takes first page and flattens to root level slots/frames
 */
export function exportAsLegacyFormat(template: Template): any {
  if (!template.pages || template.pages.length === 0) {
    return {
      ...template,
      slots: [],
      frames: {},
      pages: undefined
    }
  }

  const firstPage = template.pages[0]

  return {
    ...template,
    slots: firstPage.slots,
    frames: firstPage.frames,
    pages: undefined  // Remove pages for legacy compatibility
  }
}
