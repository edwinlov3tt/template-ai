/**
 * EffectsManager - SVG Filter Engine with parameter caching
 *
 * Generates optimized <defs> nodes for text effects with hash-based deduplication.
 * Each unique set of effect parameters gets a stable ID and reusable filter definition.
 */

export type EffectType = 'shadow' | 'lift' | 'neon' | 'echo' | 'glitch' | 'curve'

export interface EffectParams {
  type: EffectType
  params: Record<string, any>
}

interface CacheEntry {
  id: string
  node: SVGElement
}

export class EffectsManager {
  private defsCache: Map<string, CacheEntry> = new Map()
  private nextId = 0

  /**
   * Generate stable hash from effect parameters
   * Uses JSON serialization with sorted keys for deterministic hashing
   */
  hashParams(effect: EffectParams): string {
    // Sort params keys for deterministic hash
    const sortedParams = Object.keys(effect.params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = effect.params[key]
        return acc
      }, {} as Record<string, any>)

    // Create deterministic string representation
    const str = `${effect.type}:${JSON.stringify(sortedParams)}`

    // Simple hash function (djb2)
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }

    return `effect-${effect.type}-${Math.abs(hash).toString(36)}`
  }

  /**
   * Get or create filter definition
   * Returns the filter ID to use in CSS/SVG references
   */
  getOrCreateFilter(effect: EffectParams, builder: (params: any) => { id: string; node: SVGElement }): string {
    const hash = this.hashParams(effect)

    // Return cached if exists
    if (this.defsCache.has(hash)) {
      return this.defsCache.get(hash)!.id
    }

    // Create new filter using builder
    const { id, node } = builder(effect.params)

    // Cache it
    this.defsCache.set(hash, { id, node })

    return id
  }

  /**
   * Get a cached filter by hash
   */
  getFilter(hash: string): CacheEntry | undefined {
    return this.defsCache.get(hash)
  }

  /**
   * Mount all cached defs to SVG element
   * This should be called once when rendering the canvas
   */
  mountDefs(svgElement: SVGSVGElement): void {
    // Get or create <defs> element
    let defs = svgElement.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svgElement.insertBefore(defs, svgElement.firstChild)
    }

    // Clear existing effect defs (keep other defs like gradients, clipPaths)
    const existingEffects = defs.querySelectorAll('[id^="effect-"]')
    existingEffects.forEach(node => node.remove())

    // Mount all cached filters
    this.defsCache.forEach(({ node }) => {
      defs!.appendChild(node.cloneNode(true))
    })
  }

  /**
   * Unmount defs from SVG element
   */
  unmountDefs(svgElement: SVGSVGElement): void {
    const defs = svgElement.querySelector('defs')
    if (!defs) return

    // Remove all effect defs
    const effectNodes = defs.querySelectorAll('[id^="effect-"]')
    effectNodes.forEach(node => node.remove())

    // Remove defs element if empty
    if (defs.children.length === 0) {
      defs.remove()
    }
  }

  /**
   * Clear all cached filters
   */
  clear(): void {
    this.defsCache.clear()
    this.nextId = 0
  }

  /**
   * Get all cached filter IDs
   */
  getAllFilterIds(): string[] {
    return Array.from(this.defsCache.values()).map(entry => entry.id)
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.defsCache.size
  }

  /**
   * Check if a filter is cached
   */
  has(effect: EffectParams): boolean {
    const hash = this.hashParams(effect)
    return this.defsCache.has(hash)
  }

  /**
   * Remove a specific filter from cache
   */
  remove(effect: EffectParams): boolean {
    const hash = this.hashParams(effect)
    return this.defsCache.delete(hash)
  }
}

/**
 * Global singleton instance
 * Can be imported and used across the application
 */
export const effectsManager = new EffectsManager()
