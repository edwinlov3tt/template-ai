/**
 * Google Fonts Dynamic Loader
 * Automatically loads fonts from Google Fonts API based on template requirements
 */

interface LoadedFont {
  family: string
  weights: number[]
  loaded: boolean
}

class FontLoader {
  private loadedFonts: Map<string, LoadedFont> = new Map()
  private googleFontsLink: HTMLLinkElement | null = null

  /**
   * Common web-safe fonts that don't need to be loaded from Google Fonts
   */
  private webSafeFonts = new Set([
    'arial',
    'helvetica',
    'times new roman',
    'times',
    'courier new',
    'courier',
    'verdana',
    'georgia',
    'palatino',
    'garamond',
    'bookman',
    'comic sans ms',
    'trebuchet ms',
    'impact',
    'inter',
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    '-apple-system',
    'blinkmacsystemfont',
    'segoe ui',
    'roboto',
    'oxygen',
    'ubuntu',
    'cantarell',
    'fira sans',
    'droid sans',
    'helvetica neue',
    'sans-serif',
    'serif',
    'monospace'
  ])

  /**
   * Normalize font family name (remove quotes, lowercase, trim)
   */
  private normalizeFontFamily(family: string): string {
    return family
      .replace(/['"]/g, '')
      .toLowerCase()
      .trim()
  }

  /**
   * Check if font is web-safe (doesn't need loading)
   */
  private isWebSafeFont(family: string): boolean {
    const normalized = this.normalizeFontFamily(family)
    return this.webSafeFonts.has(normalized)
  }

  /**
   * Parse font-weight value to number
   */
  private parseFontWeight(weight: string | number | undefined): number {
    if (!weight) return 400

    if (typeof weight === 'number') return weight

    const weightMap: Record<string, number> = {
      'thin': 100,
      'extralight': 200,
      'light': 300,
      'normal': 400,
      'regular': 400,
      'medium': 500,
      'semibold': 600,
      'bold': 700,
      'extrabold': 800,
      'black': 900
    }

    const normalized = weight.toLowerCase()
    return weightMap[normalized] || parseInt(weight) || 400
  }

  /**
   * Load a single font from Google Fonts
   */
  async loadFont(family: string, weight: number = 400): Promise<boolean> {
    // Skip web-safe fonts
    if (this.isWebSafeFont(family)) {
      // console.log(`[FontLoader] Skipping web-safe font: ${family}`)
      return true
    }

    const normalized = this.normalizeFontFamily(family)

    // Check if already loaded
    const existing = this.loadedFonts.get(normalized)
    if (existing && existing.weights.includes(weight)) {
      return true
    }

    // Add to loaded fonts registry
    if (!existing) {
      this.loadedFonts.set(normalized, {
        family: normalized,
        weights: [weight],
        loaded: false
      })
    } else {
      existing.weights.push(weight)
    }

    // Rebuild Google Fonts URL with all fonts
    this.rebuildGoogleFontsLink()

    // Wait for font to load via CSS (Google Fonts link tag)
    try {
      // Use document.fonts.load() to check when the font is ready
      // This works with fonts loaded via <link> tags
      await document.fonts.load(`${weight} 16px "${family}"`)

      if (existing) {
        existing.loaded = true
      } else {
        const current = this.loadedFonts.get(normalized)
        if (current) current.loaded = true
      }

      // console.log(`[FontLoader] Loaded: ${family} (${weight})`)
      return true
    } catch (error) {
      // Font loading via CSS might fail silently - that's okay
      // The font will still be requested by the browser when needed
      // console.warn(`[FontLoader] Could not verify load for ${family} (${weight}):`, error)
      return true // Return true anyway since CSS link will handle it
    }
  }

  /**
   * Rebuild the Google Fonts <link> tag with all loaded fonts
   */
  private rebuildGoogleFontsLink() {
    // Remove existing link
    if (this.googleFontsLink) {
      this.googleFontsLink.remove()
    }

    // Build font families query string
    const families: string[] = []
    this.loadedFonts.forEach((font) => {
      const weights = [...new Set(font.weights)].sort((a, b) => a - b)
      const weightsStr = weights.join(';')
      const familyName = font.family.replace(/\s+/g, '+')
      families.push(`${familyName}:wght@${weightsStr}`)
    })

    if (families.length === 0) return

    // Create new link
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`

    document.head.appendChild(link)
    this.googleFontsLink = link

    // console.log(`[FontLoader] Updated Google Fonts link: ${families.length} fonts`)
  }

  /**
   * Load multiple fonts at once
   */
  async loadFonts(fonts: Array<{ family: string; weight?: number }>): Promise<void> {
    const promises = fonts.map(({ family, weight }) =>
      this.loadFont(family, weight || 400)
    )
    await Promise.all(promises)
  }

  /**
   * Extract unique fonts from a template
   */
  extractFontsFromTemplate(template: any): Array<{ family: string; weight: number }> {
    const fonts: Array<{ family: string; weight: number }> = []
    const seen = new Set<string>()

    if (!template) return fonts

    // Collect all slots from pages (new format) or use legacy slots
    const allSlots = template.pages
      ? template.pages.flatMap((page: any) => page.slots)
      : (template.slots || [])

    allSlots.forEach((slot: any) => {
      if (slot.type === 'text' || slot.type === 'button') {
        const family = slot.fontFamily || 'Inter'
        const weight = this.parseFontWeight(slot.fontWeight)
        const key = `${family}-${weight}`

        if (!seen.has(key)) {
          seen.add(key)
          fonts.push({ family, weight })
        }
      }
    })

    return fonts
  }

  /**
   * Get list of loaded fonts
   */
  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts.keys())
  }

  /**
   * Clear all loaded fonts
   */
  clear() {
    if (this.googleFontsLink) {
      this.googleFontsLink.remove()
      this.googleFontsLink = null
    }
    this.loadedFonts.clear()
  }
}

// Export singleton instance
export const fontLoader = new FontLoader()

/**
 * Preload fonts for a template
 */
export async function preloadTemplateFonts(template: any): Promise<void> {
  const fonts = fontLoader.extractFontsFromTemplate(template)
  // console.log(`[FontLoader] Preloading ${fonts.length} fonts for template`)
  await fontLoader.loadFonts(fonts)
}

/**
 * Load a single font by name
 */
export async function loadFont(family: string, weight: number = 400): Promise<boolean> {
  return fontLoader.loadFont(family, weight)
}
