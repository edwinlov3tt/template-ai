import { describe, it, expect, beforeEach } from 'vitest'
import { EffectsManager, type EffectParams } from '../EffectsManager'

describe('EffectsManager', () => {
  let manager: EffectsManager

  beforeEach(() => {
    manager = new EffectsManager()
  })

  describe('hashParams', () => {
    it('should generate stable hash for same parameters', () => {
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const hash1 = manager.hashParams(effect)
      const hash2 = manager.hashParams(effect)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different parameters', () => {
      const effect1: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const effect2: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 10, color: '#000000', alpha: 0.3 }
      }

      const hash1 = manager.hashParams(effect1)
      const hash2 = manager.hashParams(effect2)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate same hash for parameters with different key order', () => {
      const effect1: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const effect2: EffectParams = {
        type: 'shadow',
        params: { alpha: 0.3, blur: 8, color: '#000000', dy: 4, dx: 0 }
      }

      const hash1 = manager.hashParams(effect1)
      const hash2 = manager.hashParams(effect2)

      expect(hash1).toBe(hash2)
    })

    it('should include effect type in hash', () => {
      const params = { blur: 8, alpha: 0.3 }

      const shadow: EffectParams = { type: 'shadow', params }
      const lift: EffectParams = { type: 'lift', params }

      const hash1 = manager.hashParams(shadow)
      const hash2 = manager.hashParams(lift)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate hash with effect type prefix', () => {
      const effect: EffectParams = {
        type: 'neon',
        params: { stroke: 2, glow: 10, color: '#FF00FF' }
      }

      const hash = manager.hashParams(effect)

      expect(hash).toMatch(/^effect-neon-/)
    })
  })

  describe('getOrCreateFilter', () => {
    const mockBuilder = (params: any) => {
      const id = `test-filter-${Math.random().toString(36).slice(2)}`
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      node.setAttribute('id', id)
      return { id, node }
    }

    it('should create new filter on first call', () => {
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const filterId = manager.getOrCreateFilter(effect, mockBuilder)

      expect(filterId).toBeDefined()
      expect(filterId).toMatch(/^test-filter-/)
    })

    it('should return same filter ID for same parameters', () => {
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const id1 = manager.getOrCreateFilter(effect, mockBuilder)
      const id2 = manager.getOrCreateFilter(effect, mockBuilder)

      expect(id1).toBe(id2)
    })

    it('should cache filter node', () => {
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      manager.getOrCreateFilter(effect, mockBuilder)

      const hash = manager.hashParams(effect)
      const cached = manager.getFilter(hash)

      expect(cached).toBeDefined()
      expect(cached?.node.tagName).toBe('filter')
    })

    it('should increase cache size when adding new filters', () => {
      expect(manager.size()).toBe(0)

      const effect1: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      manager.getOrCreateFilter(effect1, mockBuilder)
      expect(manager.size()).toBe(1)

      const effect2: EffectParams = {
        type: 'lift',
        params: { blur: 12, alpha: 0.2 }
      }

      manager.getOrCreateFilter(effect2, mockBuilder)
      expect(manager.size()).toBe(2)
    })

    it('should not increase cache size for duplicate parameters', () => {
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      manager.getOrCreateFilter(effect, mockBuilder)
      manager.getOrCreateFilter(effect, mockBuilder)
      manager.getOrCreateFilter(effect, mockBuilder)

      expect(manager.size()).toBe(1)
    })
  })

  describe('mountDefs', () => {
    const mockBuilder = (params: any) => {
      const id = `test-filter-${Math.random().toString(36).slice(2)}`
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      node.setAttribute('id', id)
      return { id, node }
    }

    it('should create defs element if not present', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const effect: EffectParams = {
        type: 'shadow',
        params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      manager.getOrCreateFilter(effect, mockBuilder)
      manager.mountDefs(svg)

      const defs = svg.querySelector('defs')
      expect(defs).toBeDefined()
    })

    it('should mount all cached filters', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

      const effect1: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }
      const effect2: EffectParams = { type: 'lift', params: { blur: 12, alpha: 0.2 } }

      manager.getOrCreateFilter(effect1, mockBuilder)
      manager.getOrCreateFilter(effect2, mockBuilder)

      manager.mountDefs(svg)

      const defs = svg.querySelector('defs')
      const filters = defs?.querySelectorAll('filter')

      expect(filters?.length).toBe(2)
    })

    it('should clear existing effect defs before mounting', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svg.appendChild(defs)

      // Add old effect def
      const oldFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      oldFilter.setAttribute('id', 'effect-old')
      defs.appendChild(oldFilter)

      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }
      manager.getOrCreateFilter(effect, mockBuilder)

      manager.mountDefs(svg)

      const oldFilterExists = svg.querySelector('#effect-old')
      expect(oldFilterExists).toBeNull()
    })

    it('should preserve non-effect defs', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      svg.appendChild(defs)

      // Add non-effect def (gradient)
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      gradient.setAttribute('id', 'my-gradient')
      defs.appendChild(gradient)

      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }
      manager.getOrCreateFilter(effect, mockBuilder)

      manager.mountDefs(svg)

      const gradientExists = svg.querySelector('#my-gradient')
      expect(gradientExists).toBeDefined()
    })
  })

  describe('unmountDefs', () => {
    const mockBuilder = (params: any) => {
      const id = `test-filter-${Math.random().toString(36).slice(2)}`
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
      node.setAttribute('id', id)
      return { id, node }
    }

    it('should remove effect defs from SVG', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }

      manager.getOrCreateFilter(effect, mockBuilder)
      manager.mountDefs(svg)

      expect(svg.querySelector('defs filter')).toBeDefined()

      manager.unmountDefs(svg)

      const filters = svg.querySelectorAll('defs filter[id^="effect-"]')
      expect(filters.length).toBe(0)
    })

    it('should remove empty defs element', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }

      manager.getOrCreateFilter(effect, mockBuilder)
      manager.mountDefs(svg)
      manager.unmountDefs(svg)

      // Defs should be empty (no effect defs remaining)
      const defs = svg.querySelector('defs')
      const effectDefs = defs?.querySelectorAll('[id^="effect-"]')
      expect(effectDefs?.length).toBe(0)
    })
  })

  describe('cache management', () => {
    it('should clear all cached filters', () => {
      const mockBuilder = (params: any) => {
        const id = `test-filter-${Math.random().toString(36).slice(2)}`
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
        node.setAttribute('id', id)
        return { id, node }
      }

      const effect1: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }
      const effect2: EffectParams = { type: 'lift', params: { blur: 12, alpha: 0.2 } }

      manager.getOrCreateFilter(effect1, mockBuilder)
      manager.getOrCreateFilter(effect2, mockBuilder)

      expect(manager.size()).toBe(2)

      manager.clear()

      expect(manager.size()).toBe(0)
    })

    it('should check if filter is cached', () => {
      const mockBuilder = (params: any) => {
        const id = `test-filter-${Math.random().toString(36).slice(2)}`
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
        node.setAttribute('id', id)
        return { id, node }
      }

      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }

      expect(manager.has(effect)).toBe(false)

      manager.getOrCreateFilter(effect, mockBuilder)

      expect(manager.has(effect)).toBe(true)
    })

    it('should remove specific filter from cache', () => {
      const mockBuilder = (params: any) => {
        const id = `test-filter-${Math.random().toString(36).slice(2)}`
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
        node.setAttribute('id', id)
        return { id, node }
      }

      const effect: EffectParams = { type: 'shadow', params: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 } }

      manager.getOrCreateFilter(effect, mockBuilder)
      expect(manager.has(effect)).toBe(true)

      manager.remove(effect)
      expect(manager.has(effect)).toBe(false)
    })

    it('should get all filter IDs', () => {
      const mockBuilder = (params: any) => {
        const id = `effect-${params.type || 'test'}`
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
        node.setAttribute('id', id)
        return { id, node }
      }

      const effect1: EffectParams = { type: 'shadow', params: { type: 'shadow' } }
      const effect2: EffectParams = { type: 'lift', params: { type: 'lift' } }

      manager.getOrCreateFilter(effect1, mockBuilder)
      manager.getOrCreateFilter(effect2, mockBuilder)

      const ids = manager.getAllFilterIds()

      expect(ids).toContain('effect-shadow')
      expect(ids).toContain('effect-lift')
      expect(ids.length).toBe(2)
    })
  })
})
