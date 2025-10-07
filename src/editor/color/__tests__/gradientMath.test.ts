/**
 * Gradient Math Tests
 *
 * Tests for coordinate conversions, gradient geometry, and stop management
 */

import { describe, it, expect } from 'vitest'
import {
  angleToVector,
  vectorToAngle,
  gradientToPoints,
  bboxToAbsolute,
  absoluteToBbox,
  sortStops,
  interpolateStopColor,
  projectPointOnLine,
  distance,
  clamp,
  type BBox,
  type Point
} from '../gradientMath'
import type { GradientStop } from '../types'

describe('angleToVector', () => {
  it('converts 0° to bottom-to-top vector', () => {
    const { dx, dy } = angleToVector(0)
    expect(dx).toBeCloseTo(0, 5)
    expect(dy).toBeCloseTo(-1, 5)
  })

  it('converts 90° to left-to-right vector', () => {
    const { dx, dy } = angleToVector(90)
    expect(dx).toBeCloseTo(1, 5)
    expect(dy).toBeCloseTo(0, 5)
  })

  it('converts 180° to top-to-bottom vector', () => {
    const { dx, dy } = angleToVector(180)
    expect(dx).toBeCloseTo(0, 5)
    expect(dy).toBeCloseTo(1, 5)
  })

  it('converts 270° to right-to-left vector', () => {
    const { dx, dy } = angleToVector(270)
    expect(dx).toBeCloseTo(-1, 5)
    expect(dy).toBeCloseTo(0, 5)
  })

  it('handles 45° diagonal', () => {
    const { dx, dy } = angleToVector(45)
    expect(dx).toBeCloseTo(0.7071, 4) // ~√2/2
    expect(dy).toBeCloseTo(-0.7071, 4)
  })

  it('normalizes angles > 360', () => {
    const v1 = angleToVector(45)
    const v2 = angleToVector(405) // 45 + 360
    expect(v2.dx).toBeCloseTo(v1.dx, 5)
    expect(v2.dy).toBeCloseTo(v1.dy, 5)
  })

  it('normalizes negative angles', () => {
    const v1 = angleToVector(270)
    const v2 = angleToVector(-90)
    expect(v2.dx).toBeCloseTo(v1.dx, 5)
    expect(v2.dy).toBeCloseTo(v1.dy, 5)
  })
})

describe('vectorToAngle', () => {
  it('converts up vector to 0°', () => {
    const angle = vectorToAngle(0, -1)
    expect(angle).toBeCloseTo(0, 5)
  })

  it('converts right vector to 90°', () => {
    const angle = vectorToAngle(1, 0)
    expect(angle).toBeCloseTo(90, 5)
  })

  it('converts down vector to 180°', () => {
    const angle = vectorToAngle(0, 1)
    expect(angle).toBeCloseTo(180, 5)
  })

  it('converts left vector to 270°', () => {
    const angle = vectorToAngle(-1, 0)
    expect(angle).toBeCloseTo(270, 5)
  })

  it('handles zero vector (returns 0)', () => {
    const angle = vectorToAngle(0, 0)
    expect(angle).toBe(0)
  })

  it('normalizes result to 0-360 range', () => {
    const angle = vectorToAngle(-1, -1)
    expect(angle).toBeGreaterThanOrEqual(0)
    expect(angle).toBeLessThan(360)
  })
})

describe('angleToVector ↔ vectorToAngle (round-trip)', () => {
  const testAngles = [0, 45, 90, 135, 180, 225, 270, 315]

  testAngles.forEach((angle) => {
    it(`round-trips ${angle}° correctly`, () => {
      const vector = angleToVector(angle)
      const recoveredAngle = vectorToAngle(vector.dx, vector.dy)
      expect(recoveredAngle).toBeCloseTo(angle, 4)
    })
  })
})

describe('gradientToPoints', () => {
  const bbox: BBox = {
    x: 0,
    y: 0,
    width: 100,
    height: 100
  }

  it('generates vertical gradient for 0° (bottom-to-top)', () => {
    const { x1, y1, x2, y2 } = gradientToPoints(bbox, 0)

    // Should be centered horizontally
    expect(x1).toBeCloseTo(50, 1)
    expect(x2).toBeCloseTo(50, 1)

    // Y coordinates should span bbox (with some margin for diagonal coverage)
    expect(y1).toBeGreaterThan(y2) // Start at bottom, end at top
  })

  it('generates horizontal gradient for 90° (left-to-right)', () => {
    const { x1, y1, x2, y2 } = gradientToPoints(bbox, 90)

    // Should be centered vertically
    expect(y1).toBeCloseTo(50, 1)
    expect(y2).toBeCloseTo(50, 1)

    // X coordinates should span bbox
    expect(x2).toBeGreaterThan(x1)
  })

  it('generates diagonal gradient for 45°', () => {
    const { x1, y1, x2, y2 } = gradientToPoints(bbox, 45)

    // 45° is between 0° (up) and 90° (right), so gradient goes up-right
    // Start point should be lower-left, end point upper-right
    expect(x2).toBeGreaterThan(x1) // End is to the right of start
    expect(y2).toBeLessThan(y1) // End is above start (lower Y in SVG)
  })

  it('handles non-square bbox', () => {
    const wideBbox: BBox = {
      x: 0,
      y: 0,
      width: 200,
      height: 100
    }

    const { x1, y1, x2, y2 } = gradientToPoints(wideBbox, 90)

    // Center should be at (100, 50)
    expect((x1 + x2) / 2).toBeCloseTo(100, 1)
    expect((y1 + y2) / 2).toBeCloseTo(50, 1)
  })

  it('handles offset bbox', () => {
    const offsetBbox: BBox = {
      x: 50,
      y: 50,
      width: 100,
      height: 100
    }

    const { x1, y1, x2, y2 } = gradientToPoints(offsetBbox, 0)

    // Center should be at (100, 100)
    expect((x1 + x2) / 2).toBeCloseTo(100, 1)
    expect((y1 + y2) / 2).toBeCloseTo(100, 1)
  })
})

describe('bboxToAbsolute', () => {
  const bbox: BBox = {
    x: 0,
    y: 0,
    width: 100,
    height: 100
  }

  it('converts center (0.5, 0.5) to bbox center', () => {
    const { cx, cy } = bboxToAbsolute(bbox, 0.5, 0.5, 0.5)
    expect(cx).toBeCloseTo(50, 5)
    expect(cy).toBeCloseTo(50, 5)
  })

  it('converts top-left (0, 0) to bbox origin', () => {
    const { cx, cy } = bboxToAbsolute(bbox, 0, 0, 0)
    expect(cx).toBeCloseTo(0, 5)
    expect(cy).toBeCloseTo(0, 5)
  })

  it('converts bottom-right (1, 1) to bbox corner', () => {
    const { cx, cy } = bboxToAbsolute(bbox, 1, 1, 0)
    expect(cx).toBeCloseTo(100, 5)
    expect(cy).toBeCloseTo(100, 5)
  })

  it('converts radius relative to diagonal', () => {
    const diagonal = Math.sqrt(100 ** 2 + 100 ** 2) // ~141.42
    const { r } = bboxToAbsolute(bbox, 0.5, 0.5, 0.5)
    expect(r).toBeCloseTo(diagonal * 0.5, 2)
  })

  it('handles offset bbox', () => {
    const offsetBbox: BBox = {
      x: 50,
      y: 50,
      width: 100,
      height: 100
    }

    const { cx, cy } = bboxToAbsolute(offsetBbox, 0.5, 0.5, 0)
    expect(cx).toBeCloseTo(100, 5)
    expect(cy).toBeCloseTo(100, 5)
  })
})

describe('absoluteToBbox', () => {
  const bbox: BBox = {
    x: 0,
    y: 0,
    width: 100,
    height: 100
  }

  it('converts bbox center to (0.5, 0.5)', () => {
    const { cx, cy } = absoluteToBbox(bbox, 50, 50, 0)
    expect(cx).toBeCloseTo(0.5, 5)
    expect(cy).toBeCloseTo(0.5, 5)
  })

  it('converts bbox origin to (0, 0)', () => {
    const { cx, cy } = absoluteToBbox(bbox, 0, 0, 0)
    expect(cx).toBeCloseTo(0, 5)
    expect(cy).toBeCloseTo(0, 5)
  })

  it('converts bbox corner to (1, 1)', () => {
    const { cx, cy } = absoluteToBbox(bbox, 100, 100, 0)
    expect(cx).toBeCloseTo(1, 5)
    expect(cy).toBeCloseTo(1, 5)
  })

  it('converts radius relative to diagonal', () => {
    const diagonal = Math.sqrt(100 ** 2 + 100 ** 2) // ~141.42
    const halfDiagonal = diagonal / 2
    const { r } = absoluteToBbox(bbox, 50, 50, halfDiagonal)
    expect(r).toBeCloseTo(0.5, 5)
  })
})

describe('bboxToAbsolute ↔ absoluteToBbox (round-trip)', () => {
  const bbox: BBox = {
    x: 10,
    y: 20,
    width: 200,
    height: 150
  }

  const testCases = [
    { cx: 0, cy: 0, r: 0 },
    { cx: 0.5, cy: 0.5, r: 0.5 },
    { cx: 1, cy: 1, r: 1 },
    { cx: 0.25, cy: 0.75, r: 0.3 }
  ]

  testCases.forEach(({ cx, cy, r }) => {
    it(`round-trips (${cx}, ${cy}, ${r}) correctly`, () => {
      const abs = bboxToAbsolute(bbox, cx, cy, r)
      const rel = absoluteToBbox(bbox, abs.cx, abs.cy, abs.r)

      expect(rel.cx).toBeCloseTo(cx, 5)
      expect(rel.cy).toBeCloseTo(cy, 5)
      expect(rel.r).toBeCloseTo(r, 5)
    })
  })
})

describe('sortStops', () => {
  it('sorts stops by offset (ascending)', () => {
    const stops: GradientStop[] = [
      { offset: 0.7, color: '#ff0000' },
      { offset: 0.2, color: '#00ff00' },
      { offset: 0.5, color: '#0000ff' }
    ]

    const sorted = sortStops(stops)

    expect(sorted[0].offset).toBe(0.2)
    expect(sorted[1].offset).toBe(0.5)
    expect(sorted[2].offset).toBe(0.7)
  })

  it('handles already sorted stops', () => {
    const stops: GradientStop[] = [
      { offset: 0, color: '#000000' },
      { offset: 0.5, color: '#808080' },
      { offset: 1, color: '#ffffff' }
    ]

    const sorted = sortStops(stops)

    expect(sorted).toEqual(stops)
  })

  it('mutates the original array', () => {
    const stops: GradientStop[] = [
      { offset: 1, color: '#ffffff' },
      { offset: 0, color: '#000000' }
    ]

    const sorted = sortStops(stops)

    expect(sorted).toBe(stops) // Same reference
    expect(stops[0].offset).toBe(0)
  })
})

describe('interpolateStopColor', () => {
  const stops: GradientStop[] = [
    { offset: 0, color: '#000000' },
    { offset: 1, color: '#ffffff' }
  ]

  it('interpolates color at midpoint', () => {
    const color = interpolateStopColor(stops, 0.5)

    // Should be roughly gray (midpoint between black and white)
    expect(color).toMatch(/#[0-9a-f]{6}/i)
    // Note: exact color depends on interpolation mode (OKLCH in colorMath)
  })

  it('returns first stop color for offset 0', () => {
    const color = interpolateStopColor(stops, 0)
    expect(color.toLowerCase()).toBe('#000000')
  })

  it('returns last stop color for offset 1', () => {
    const color = interpolateStopColor(stops, 1)
    expect(color.toLowerCase()).toBe('#ffffff')
  })

  it('clamps offset below 0 to first stop', () => {
    const color = interpolateStopColor(stops, -0.5)
    expect(color.toLowerCase()).toBe('#000000')
  })

  it('clamps offset above 1 to last stop', () => {
    const color = interpolateStopColor(stops, 1.5)
    expect(color.toLowerCase()).toBe('#ffffff')
  })

  it('handles multi-stop gradients', () => {
    const multiStops: GradientStop[] = [
      { offset: 0, color: '#ff0000' },
      { offset: 0.5, color: '#00ff00' },
      { offset: 1, color: '#0000ff' }
    ]

    const color1 = interpolateStopColor(multiStops, 0.25) // Between red and green
    const color2 = interpolateStopColor(multiStops, 0.75) // Between green and blue

    expect(color1).toMatch(/#[0-9a-f]{6}/i)
    expect(color2).toMatch(/#[0-9a-f]{6}/i)
    expect(color1).not.toBe(color2)
  })
})

describe('projectPointOnLine', () => {
  const lineStart: Point = { x: 0, y: 0 }
  const lineEnd: Point = { x: 100, y: 0 }

  it('projects point onto horizontal line', () => {
    const point: Point = { x: 50, y: 30 }
    const { point: projected, offset } = projectPointOnLine(point, lineStart, lineEnd)

    expect(projected.x).toBeCloseTo(50, 5)
    expect(projected.y).toBeCloseTo(0, 5)
    expect(offset).toBeCloseTo(0.5, 5)
  })

  it('projects point before line start (clamps to 0)', () => {
    const point: Point = { x: -50, y: 0 }
    const { point: projected, offset } = projectPointOnLine(point, lineStart, lineEnd)

    expect(projected.x).toBeCloseTo(0, 5)
    expect(projected.y).toBeCloseTo(0, 5)
    expect(offset).toBe(0)
  })

  it('projects point after line end (clamps to 1)', () => {
    const point: Point = { x: 150, y: 0 }
    const { point: projected, offset } = projectPointOnLine(point, lineStart, lineEnd)

    expect(projected.x).toBeCloseTo(100, 5)
    expect(projected.y).toBeCloseTo(0, 5)
    expect(offset).toBe(1)
  })

  it('projects point onto diagonal line', () => {
    const diagStart: Point = { x: 0, y: 0 }
    const diagEnd: Point = { x: 100, y: 100 }
    const point: Point = { x: 50, y: 70 }

    const { point: projected, offset } = projectPointOnLine(point, diagStart, diagEnd)

    // Projected point should be on the line y = x
    expect(projected.x).toBeCloseTo(projected.y, 1)
    expect(offset).toBeGreaterThan(0)
    expect(offset).toBeLessThan(1)
  })

  it('handles degenerate line (point)', () => {
    const pointLine: Point = { x: 50, y: 50 }
    const point: Point = { x: 100, y: 100 }

    const { point: projected, offset } = projectPointOnLine(point, pointLine, pointLine)

    expect(projected.x).toBe(50)
    expect(projected.y).toBe(50)
    expect(offset).toBe(0)
  })
})

describe('distance', () => {
  it('calculates distance between two points', () => {
    const p1: Point = { x: 0, y: 0 }
    const p2: Point = { x: 3, y: 4 }

    expect(distance(p1, p2)).toBeCloseTo(5, 5) // 3-4-5 triangle
  })

  it('returns 0 for same point', () => {
    const p: Point = { x: 10, y: 20 }
    expect(distance(p, p)).toBe(0)
  })

  it('handles negative coordinates', () => {
    const p1: Point = { x: -3, y: -4 }
    const p2: Point = { x: 0, y: 0 }

    expect(distance(p1, p2)).toBeCloseTo(5, 5)
  })
})

describe('clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps value above max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns value within range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('handles min === max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })
})
