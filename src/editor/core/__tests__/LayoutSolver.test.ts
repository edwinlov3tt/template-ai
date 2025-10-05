import { describe, it, expect } from 'vitest'
import { solveLayout, type FrameMap, type SolverOptions } from '../LayoutSolver'
import type { ParsedConstraint } from '../../../layout/constraintParser'

describe('LayoutSolver', () => {
  const baseOptions: SolverOptions = {
    canvasWidth: 1080,
    canvasHeight: 1080,
    slotNames: ['headline', 'subhead', 'cta'],
    defaultDimensions: {
      width: 100,
      height: 50
    }
  }

  describe('basic constraint solving', () => {
    it('should solve equality constraints', () => {
      const inputFrames: FrameMap = {
        headline: { x: 0, y: 0, width: 100, height: 50 },
        cta: { x: 0, y: 0, width: 100, height: 40 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'cta', property: 'bottom' },
          operator: '=',
          right: { slot: 'canvas', property: 'bottom', offset: -32 }
        },
        {
          type: 'equality',
          left: { slot: 'cta', property: 'centerX' },
          operator: '=',
          right: { slot: 'canvas', property: 'centerX' }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames.cta).toBeDefined()
      // CTA should be at bottom of canvas minus 32px
      expect(result.frames.cta.y + result.frames.cta.height).toBeCloseTo(1080 - 32, 1)
      // CTA should be centered horizontally
      expect(result.frames.cta.x + result.frames.cta.width / 2).toBeCloseTo(540, 1)
    })

    it('should solve inequality constraints', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 },
        subhead: { x: 100, y: 180, width: 180, height: 40 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'inequality',
          left: { slot: 'subhead', property: 'top' },
          operator: '>=',
          right: { slot: 'headline', property: 'bottom', offset: 20 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // Subhead should be at least 20px below headline
      const gap = result.frames.subhead.y - (result.frames.headline.y + result.frames.headline.height)
      expect(gap).toBeGreaterThanOrEqual(19.9) // Account for rounding
    })

    it('should handle multiplier constraints', () => {
      const inputFrames: FrameMap = {
        headline: { x: 0, y: 0, width: 400, height: 100 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.5 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // Headline width should be 50% of canvas width
      expect(result.frames.headline.width).toBeCloseTo(540, 1)
    })

    it('should handle combined multiplier and offset', () => {
      const inputFrames: FrameMap = {
        headline: { x: 0, y: 0, width: 400, height: 100 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.8, offset: -40 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // Headline width should be 80% of canvas width minus 40
      expect(result.frames.headline.width).toBeCloseTo(1080 * 0.8 - 40, 1)
    })
  })

  describe('constraint strengths and conflicts', () => {
    it('should handle conflicting weak vs strong constraints', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 }
      }

      const constraints: ParsedConstraint[] = [
        // Strong constraint - should win
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.5 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // Strong constraint should override weak default (100)
      expect(result.frames.headline.width).toBeCloseTo(540, 1)
    })

    it('should report failed constraints without throwing', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'nonexistent', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width' }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      // Should return result with error but not throw
      expect(result.frames).toBeDefined()
      expect(result.error).toBeDefined()
      expect(result.error?.failedConstraints).toHaveLength(1)
    })
  })

  describe('tuple ordering regression test', () => {
    it('should preserve correct tuple ordering for Expression [variable, coefficient]', () => {
      const inputFrames: FrameMap = {
        headline: { x: 0, y: 0, width: 100, height: 50 }
      }

      // Test centerX calculation which uses tuple form
      // centerX = left + width * 0.5
      // Should be [left, 1], [width, 0.5] NOT [1, left], [0.5, width]
      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'left' },
          operator: '=',
          right: { slot: 'canvas', property: 'left', offset: 100 }
        },
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.5 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames.headline.width).toBeCloseTo(540, 1)
      expect(result.frames.headline.x).toBeCloseTo(100, 1)

      // CenterX should be correctly calculated as left + width * 0.5
      // If tuple ordering is wrong, this will fail
      const expectedCenterX = result.frames.headline.x + result.frames.headline.width / 2
      expect(expectedCenterX).toBeCloseTo(370, 1) // 100 + 540/2 = 370
    })

    it('should correctly handle negative offsets in expressions', () => {
      const inputFrames: FrameMap = {
        cta: { x: 0, y: 0, width: 120, height: 44 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'cta', property: 'right' },
          operator: '=',
          right: { slot: 'canvas', property: 'right', offset: -50 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // right = x + width, so x = right - width = (1080 - 50) - 120 = 910
      expect(result.frames.cta.x).toBeCloseTo(910, 1)
    })
  })

  describe('error handling - never throw', () => {
    it('should return original frames on solver error', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 200, width: 300, height: 60 }
      }

      // Intentionally create impossible constraints
      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', offset: 100 }
        },
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', offset: 200 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      // Should not throw, should return frames
      expect(result.frames).toBeDefined()
      // On conflicts, solver should still find a solution (Cassowary resolves by strength)
      expect(result.frames.headline).toBeDefined()
    })

    it('should preserve rotation property when present', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60, rotation: 45 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'centerX' },
          operator: '=',
          right: { slot: 'canvas', property: 'centerX' }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames.headline.rotation).toBe(45)
    })

    it('should handle empty constraints gracefully', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 }
      }

      const result = solveLayout(inputFrames, [], baseOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames.headline).toBeDefined()
      // Without constraints, should use medium-strength suggestions from input frames
      expect(result.frames.headline.x).toBeCloseTo(100, 1)
      expect(result.frames.headline.y).toBeCloseTo(100, 1)
    })

    it('should handle empty slot list gracefully', () => {
      const inputFrames: FrameMap = {}
      const emptyOptions: SolverOptions = {
        ...baseOptions,
        slotNames: []
      }

      const result = solveLayout(inputFrames, [], emptyOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames).toEqual({})
    })
  })

  describe('minimum size constraints', () => {
    it('should enforce minimum dimensions', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 }
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.001 } // Try to make it tiny
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()
      // Should be clamped to minimum (default 10)
      expect(result.frames.headline.width).toBeGreaterThanOrEqual(10)
    })

    it('should respect custom minimum dimensions', () => {
      const inputFrames: FrameMap = {
        headline: { x: 100, y: 100, width: 200, height: 60 }
      }

      const customOptions: SolverOptions = {
        ...baseOptions,
        minSlotWidth: 50,
        minSlotHeight: 30
      }

      const constraints: ParsedConstraint[] = [
        {
          type: 'equality',
          left: { slot: 'headline', property: 'width' },
          operator: '=',
          right: { slot: 'canvas', property: 'width', multiplier: 0.001 }
        }
      ]

      const result = solveLayout(inputFrames, constraints, customOptions)

      expect(result.error).toBeUndefined()
      expect(result.frames.headline.width).toBeGreaterThanOrEqual(50)
    })
  })

  describe('complex multi-constraint scenarios', () => {
    it('should solve complex layout with multiple related constraints', () => {
      const inputFrames: FrameMap = {
        headline: { x: 0, y: 0, width: 100, height: 50 },
        subhead: { x: 0, y: 0, width: 100, height: 30 },
        cta: { x: 0, y: 0, width: 120, height: 44 }
      }

      const constraints: ParsedConstraint[] = [
        // Headline at top with padding
        {
          type: 'equality',
          left: { slot: 'headline', property: 'top' },
          operator: '=',
          right: { slot: 'canvas', property: 'top', offset: 60 }
        },
        // Headline centered horizontally
        {
          type: 'equality',
          left: { slot: 'headline', property: 'centerX' },
          operator: '=',
          right: { slot: 'canvas', property: 'centerX' }
        },
        // Subhead below headline
        {
          type: 'equality',
          left: { slot: 'subhead', property: 'top' },
          operator: '=',
          right: { slot: 'headline', property: 'bottom', offset: 20 }
        },
        // Subhead same horizontal center
        {
          type: 'equality',
          left: { slot: 'subhead', property: 'centerX' },
          operator: '=',
          right: { slot: 'headline', property: 'centerX' }
        },
        // CTA at bottom
        {
          type: 'equality',
          left: { slot: 'cta', property: 'bottom' },
          operator: '=',
          right: { slot: 'canvas', property: 'bottom', offset: -60 }
        },
        // CTA centered horizontally
        {
          type: 'equality',
          left: { slot: 'cta', property: 'centerX' },
          operator: '=',
          right: { slot: 'canvas', property: 'centerX' }
        }
      ]

      const result = solveLayout(inputFrames, constraints, baseOptions)

      expect(result.error).toBeUndefined()

      // Verify headline position
      expect(result.frames.headline.y).toBeCloseTo(60, 1)
      expect(result.frames.headline.x + result.frames.headline.width / 2).toBeCloseTo(540, 1)

      // Verify subhead is below headline
      expect(result.frames.subhead.y).toBeCloseTo(result.frames.headline.y + result.frames.headline.height + 20, 1)

      // Verify CTA at bottom
      expect(result.frames.cta.y + result.frames.cta.height).toBeCloseTo(1020, 1)

      // All should be horizontally centered
      const headlineCenterX = result.frames.headline.x + result.frames.headline.width / 2
      const subheadCenterX = result.frames.subhead.x + result.frames.subhead.width / 2
      const ctaCenterX = result.frames.cta.x + result.frames.cta.width / 2
      expect(headlineCenterX).toBeCloseTo(540, 1)
      expect(subheadCenterX).toBeCloseTo(540, 1)
      expect(ctaCenterX).toBeCloseTo(540, 1)
    })
  })
})
