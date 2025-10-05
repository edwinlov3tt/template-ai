import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CoordinateSystem } from '../CoordinateSystem'

/**
 * Create a mock SVG element with configurable CTM for testing
 */
function createMockSVG(options: {
  scale?: number
  translateX?: number
  translateY?: number
  useScreenCTM?: boolean
}): SVGSVGElement {
  const { scale = 1, translateX = 0, translateY = 0, useScreenCTM = true } = options

  // Create a DOMMatrix for the transform
  const matrix = new DOMMatrix()
    .translate(translateX, translateY)
    .scale(scale)

  const svg = {
    getScreenCTM: vi.fn(() => useScreenCTM ? matrix : null),
    getCTM: vi.fn(() => matrix),
  } as unknown as SVGSVGElement

  return svg
}

describe('CoordinateSystem', () => {
  let coordSystem: CoordinateSystem

  beforeEach(() => {
    coordSystem = new CoordinateSystem()
  })

  describe('initialization and setup', () => {
    it('should throw error when converting without SVG set', () => {
      expect(() => {
        coordSystem.screenToUser({ x: 100, y: 100 })
      }).toThrow('SVG element not set')
    })

    it('should accept SVG element via setSvg', () => {
      const svg = createMockSVG({})
      coordSystem.setSvg(svg)

      // Should not throw
      expect(() => {
        coordSystem.screenToUser({ x: 0, y: 0 })
      }).not.toThrow()
    })

    it('should invalidate cache when setSvg is called', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      // First call should compute CTM
      coordSystem.screenToUser({ x: 100, y: 100 })
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)

      // Second call should use cache
      coordSystem.screenToUser({ x: 200, y: 200 })
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)

      // setSvg should invalidate cache
      coordSystem.setSvg(svg)
      coordSystem.screenToUser({ x: 300, y: 300 })
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(2)
    })
  })

  describe('CTM caching and invalidation', () => {
    it('should cache inverse CTM across multiple calls', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      coordSystem.screenToUser({ x: 100, y: 100 })
      coordSystem.screenToUser({ x: 200, y: 200 })
      coordSystem.pxDeltaToUser(10, 20)

      // getScreenCTM should only be called once (cached after first call)
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache when invalidate() is called', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      coordSystem.screenToUser({ x: 100, y: 100 })
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(1)

      coordSystem.invalidate()

      coordSystem.screenToUser({ x: 200, y: 200 })
      expect(svg.getScreenCTM).toHaveBeenCalledTimes(2)
    })

    it('should fallback to getCTM when getScreenCTM returns null', () => {
      const svg = createMockSVG({ scale: 1.5, useScreenCTM: false })
      coordSystem.setSvg(svg)

      const result = coordSystem.screenToUser({ x: 150, y: 150 })

      expect(svg.getScreenCTM).toHaveBeenCalled()
      expect(svg.getCTM).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('screenToUser transformation', () => {
    it('should convert screen coordinates to user coordinates with identity transform', () => {
      const svg = createMockSVG({ scale: 1, translateX: 0, translateY: 0 })
      coordSystem.setSvg(svg)

      const result = coordSystem.screenToUser({ x: 100, y: 200 })

      expect(result.x).toBeCloseTo(100, 5)
      expect(result.y).toBeCloseTo(200, 5)
    })

    it('should handle scale transformations', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const result = coordSystem.screenToUser({ x: 200, y: 400 })

      // With 2x scale, screen 200,400 → user 100,200
      expect(result.x).toBeCloseTo(100, 5)
      expect(result.y).toBeCloseTo(200, 5)
    })

    it('should handle translation', () => {
      const svg = createMockSVG({ scale: 1, translateX: 50, translateY: 100 })
      coordSystem.setSvg(svg)

      const result = coordSystem.screenToUser({ x: 150, y: 250 })

      // With translate(50, 100), screen 150,250 → user 100,150
      expect(result.x).toBeCloseTo(100, 5)
      expect(result.y).toBeCloseTo(150, 5)
    })

    it('should handle combined scale and translate', () => {
      const svg = createMockSVG({ scale: 2, translateX: 100, translateY: 200 })
      coordSystem.setSvg(svg)

      const result = coordSystem.screenToUser({ x: 300, y: 600 })

      // With translate(100,200).scale(2), screen 300,600 → user 100,200
      expect(result.x).toBeCloseTo(100, 5)
      expect(result.y).toBeCloseTo(200, 5)
    })
  })

  describe('userToScreen transformation', () => {
    it('should convert user coordinates to screen coordinates', () => {
      const svg = createMockSVG({ scale: 2, translateX: 100, translateY: 200 })
      coordSystem.setSvg(svg)

      const result = coordSystem.userToScreen({ x: 100, y: 200 })

      // With translate(100,200).scale(2), user 100,200 → screen 300,600
      expect(result.x).toBeCloseTo(300, 5)
      expect(result.y).toBeCloseTo(600, 5)
    })

    it('should throw error when SVG not set', () => {
      expect(() => {
        coordSystem.userToScreen({ x: 100, y: 100 })
      }).toThrow('SVG element not set')
    })
  })

  describe('round-trip transformations', () => {
    it('should round-trip with identity transform (user→screen→user)', () => {
      const svg = createMockSVG({ scale: 1 })
      coordSystem.setSvg(svg)

      const original = { x: 123.456, y: 789.012 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })

    it('should round-trip with 2x zoom (user→screen→user)', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const original = { x: 50.5, y: 100.25 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })

    it('should round-trip with 0.5x zoom (user→screen→user)', () => {
      const svg = createMockSVG({ scale: 0.5 })
      coordSystem.setSvg(svg)

      const original = { x: 200, y: 400 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })

    it('should round-trip with pan (translate) transform', () => {
      const svg = createMockSVG({ scale: 1, translateX: 150, translateY: -200 })
      coordSystem.setSvg(svg)

      const original = { x: 300, y: 450 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })

    it('should round-trip with combined zoom and pan', () => {
      const svg = createMockSVG({ scale: 1.5, translateX: 200, translateY: 100 })
      coordSystem.setSvg(svg)

      const original = { x: 500, y: 600 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })

    it('should round-trip screen→user→screen', () => {
      const svg = createMockSVG({ scale: 2, translateX: 100, translateY: 50 })
      coordSystem.setSvg(svg)

      const original = { x: 350, y: 450 }
      const user = coordSystem.screenToUser(original)
      const roundTrip = coordSystem.userToScreen(user)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })
  })

  describe('pxDeltaToUser', () => {
    it('should convert pixel delta with identity transform', () => {
      const svg = createMockSVG({ scale: 1 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(100, 200)

      expect(delta.dx).toBeCloseTo(100, 5)
      expect(delta.dy).toBeCloseTo(200, 5)
    })

    it('should convert pixel delta with 2x scale', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(100, 200)

      // 2x scale means 100px screen = 50 user units
      expect(delta.dx).toBeCloseTo(50, 5)
      expect(delta.dy).toBeCloseTo(100, 5)
    })

    it('should convert pixel delta with 0.5x scale', () => {
      const svg = createMockSVG({ scale: 0.5 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(100, 200)

      // 0.5x scale means 100px screen = 200 user units
      expect(delta.dx).toBeCloseTo(200, 5)
      expect(delta.dy).toBeCloseTo(400, 5)
    })

    it('should handle negative deltas', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(-50, -100)

      expect(delta.dx).toBeCloseTo(-25, 5)
      expect(delta.dy).toBeCloseTo(-50, 5)
    })

    it('should be independent of translation', () => {
      const svg = createMockSVG({ scale: 2, translateX: 500, translateY: 1000 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(100, 200)

      // Translation should not affect delta calculation
      expect(delta.dx).toBeCloseTo(50, 5)
      expect(delta.dy).toBeCloseTo(100, 5)
    })
  })

  describe('high-DPI scenarios', () => {
    it('should handle high-DPI with devicePixelRatio simulation', () => {
      // Simulate 2x DPI by scaling the transform
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const screenPoint = { x: 200, y: 400 }
      const userPoint = coordSystem.screenToUser(screenPoint)
      const backToScreen = coordSystem.userToScreen(userPoint)

      expect(backToScreen.x).toBeCloseTo(screenPoint.x, 5)
      expect(backToScreen.y).toBeCloseTo(screenPoint.y, 5)
    })

    it('should handle high-DPI with 3x scale', () => {
      const svg = createMockSVG({ scale: 3 })
      coordSystem.setSvg(svg)

      const original = { x: 150, y: 300 }
      const screen = coordSystem.userToScreen(original)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(original.x, 5)
      expect(roundTrip.y).toBeCloseTo(original.y, 5)
    })
  })

  describe('viewBox preservation', () => {
    it('should preserve viewBox semantics through transformations', () => {
      // Simulating a viewBox scenario:
      // SVG might be scaled to fit viewport, but coordinates should be in viewBox units
      const svg = createMockSVG({ scale: 0.75, translateX: 50, translateY: 50 })
      coordSystem.setSvg(svg)

      // User coordinates are in viewBox units
      const userPoint = { x: 100, y: 200 }

      // Convert to screen
      const screenPoint = coordSystem.userToScreen(userPoint)

      // Convert back - should get original viewBox coordinates
      const backToUser = coordSystem.screenToUser(screenPoint)

      expect(backToUser.x).toBeCloseTo(userPoint.x, 5)
      expect(backToUser.y).toBeCloseTo(userPoint.y, 5)
    })
  })

  describe('edge cases', () => {
    it('should handle zero deltas', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(0, 0)

      expect(delta.dx).toBe(0)
      expect(delta.dy).toBe(0)
    })

    it('should handle very small deltas', () => {
      const svg = createMockSVG({ scale: 2 })
      coordSystem.setSvg(svg)

      const delta = coordSystem.pxDeltaToUser(0.1, 0.1)

      expect(delta.dx).toBeCloseTo(0.05, 5)
      expect(delta.dy).toBeCloseTo(0.05, 5)
    })

    it('should handle very large coordinates', () => {
      const svg = createMockSVG({ scale: 1 })
      coordSystem.setSvg(svg)

      const large = { x: 1000000, y: 2000000 }
      const screen = coordSystem.userToScreen(large)
      const roundTrip = coordSystem.screenToUser(screen)

      expect(roundTrip.x).toBeCloseTo(large.x, 5)
      expect(roundTrip.y).toBeCloseTo(large.y, 5)
    })
  })
})
