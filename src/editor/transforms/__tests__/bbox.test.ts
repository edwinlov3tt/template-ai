import { describe, it, expect } from 'vitest'
import {
  getUnionBBox,
  getRotatedBBox,
  containsPoint,
  getBBoxCorners,
  bboxesIntersect,
  getBBoxCenter,
  expandBBox,
  clampBBox,
  type Frame,
  type BBox,
} from '../bbox'

describe('getUnionBBox', () => {
  it('returns zero bbox for empty array', () => {
    const result = getUnionBBox([])
    expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('returns same bbox for single frame', () => {
    const frame: Frame = { x: 10, y: 20, width: 100, height: 50 }
    const result = getUnionBBox([frame])
    expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('calculates union of 2 non-rotated frames', () => {
    const frames: Frame[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 }
    ]
    const result = getUnionBBox(frames)
    expect(result).toEqual({ x: 0, y: 0, width: 150, height: 150 })
  })

  it('calculates union of 3 frames', () => {
    const frames: Frame[] = [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 100, y: 100, width: 50, height: 50 },
      { x: 200, y: 200, width: 50, height: 50 }
    ]
    const result = getUnionBBox(frames)
    expect(result).toEqual({ x: 0, y: 0, width: 250, height: 250 })
  })
})

describe('getRotatedBBox', () => {
  it('returns same bbox for no rotation', () => {
    const frame: Frame = { x: 10, y: 20, width: 100, height: 50, rotation: 0 }
    const result = getRotatedBBox(frame)
    expect(result).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('handles 90 degree rotation', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50, rotation: 90 }
    const result = getRotatedBBox(frame)
    // After 90° rotation, bbox should swap width/height
    expect(result.width).toBeCloseTo(50, 1)
    expect(result.height).toBeCloseTo(100, 1)
  })

  it('handles 180 degree rotation', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50, rotation: 180 }
    const result = getRotatedBBox(frame)
    // After 180° rotation, bbox dimensions stay same
    expect(result.width).toBeCloseTo(100, 1)
    expect(result.height).toBeCloseTo(50, 1)
  })

  it('handles 45 degree rotation', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 100, rotation: 45 }
    const result = getRotatedBBox(frame)
    // After 45° rotation of a square, bbox should be larger
    const expected = 100 * Math.sqrt(2)
    expect(result.width).toBeCloseTo(expected, 1)
    expect(result.height).toBeCloseTo(expected, 1)
  })

  it('handles arbitrary angle', () => {
    const frame: Frame = { x: 10, y: 20, width: 100, height: 50, rotation: 30 }
    const result = getRotatedBBox(frame)
    // Should return valid bbox
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })

  it('handles negative rotation', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50, rotation: -45 }
    const result = getRotatedBBox(frame)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })
})

describe('containsPoint', () => {
  const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 }

  it('returns true for point inside bbox', () => {
    expect(containsPoint(bbox, { x: 50, y: 40 })).toBe(true)
  })

  it('returns true for point on bbox edge', () => {
    expect(containsPoint(bbox, { x: 10, y: 20 })).toBe(true)
    expect(containsPoint(bbox, { x: 110, y: 70 })).toBe(true)
  })

  it('returns false for point outside bbox', () => {
    expect(containsPoint(bbox, { x: 0, y: 0 })).toBe(false)
    expect(containsPoint(bbox, { x: 200, y: 100 })).toBe(false)
  })

  it('returns false for point to the left', () => {
    expect(containsPoint(bbox, { x: 5, y: 40 })).toBe(false)
  })

  it('returns false for point to the right', () => {
    expect(containsPoint(bbox, { x: 115, y: 40 })).toBe(false)
  })

  it('returns false for point above', () => {
    expect(containsPoint(bbox, { x: 50, y: 15 })).toBe(false)
  })

  it('returns false for point below', () => {
    expect(containsPoint(bbox, { x: 50, y: 75 })).toBe(false)
  })
})

describe('getBBoxCorners', () => {
  it('returns 4 corners in clockwise order', () => {
    const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 }
    const corners = getBBoxCorners(bbox)

    expect(corners).toHaveLength(4)
    expect(corners[0]).toEqual({ x: 10, y: 20 })         // top-left
    expect(corners[1]).toEqual({ x: 110, y: 20 })        // top-right
    expect(corners[2]).toEqual({ x: 110, y: 70 })        // bottom-right
    expect(corners[3]).toEqual({ x: 10, y: 70 })         // bottom-left
  })

  it('handles zero-size bbox', () => {
    const bbox: BBox = { x: 50, y: 50, width: 0, height: 0 }
    const corners = getBBoxCorners(bbox)

    expect(corners).toHaveLength(4)
    corners.forEach(corner => {
      expect(corner).toEqual({ x: 50, y: 50 })
    })
  })
})

describe('bboxesIntersect', () => {
  it('returns true for overlapping bboxes', () => {
    const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
    const b: BBox = { x: 50, y: 50, width: 100, height: 100 }
    expect(bboxesIntersect(a, b)).toBe(true)
  })

  it('returns false for non-overlapping bboxes', () => {
    const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
    const b: BBox = { x: 200, y: 200, width: 100, height: 100 }
    expect(bboxesIntersect(a, b)).toBe(false)
  })

  it('returns true for touching bboxes (edge case)', () => {
    const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
    const b: BBox = { x: 100, y: 0, width: 100, height: 100 }
    expect(bboxesIntersect(a, b)).toBe(true)
  })

  it('returns true when one bbox contains another', () => {
    const a: BBox = { x: 0, y: 0, width: 200, height: 200 }
    const b: BBox = { x: 50, y: 50, width: 50, height: 50 }
    expect(bboxesIntersect(a, b)).toBe(true)
  })
})

describe('getBBoxCenter', () => {
  it('calculates center point', () => {
    const bbox: BBox = { x: 0, y: 0, width: 100, height: 50 }
    const center = getBBoxCenter(bbox)
    expect(center).toEqual({ x: 50, y: 25 })
  })

  it('handles offset bbox', () => {
    const bbox: BBox = { x: 100, y: 200, width: 50, height: 50 }
    const center = getBBoxCenter(bbox)
    expect(center).toEqual({ x: 125, y: 225 })
  })
})

describe('expandBBox', () => {
  it('expands bbox by padding', () => {
    const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 }
    const expanded = expandBBox(bbox, 10)

    expect(expanded).toEqual({
      x: 0,
      y: 10,
      width: 120,
      height: 70
    })
  })

  it('handles negative padding (shrink)', () => {
    const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 }
    const shrunk = expandBBox(bbox, -5)

    expect(shrunk).toEqual({
      x: 15,
      y: 25,
      width: 90,
      height: 40
    })
  })

  it('handles zero padding', () => {
    const bbox: BBox = { x: 10, y: 20, width: 100, height: 50 }
    const result = expandBBox(bbox, 0)
    expect(result).toEqual(bbox)
  })
})

describe('clampBBox', () => {
  const container: BBox = { x: 0, y: 0, width: 500, height: 500 }

  it('clamps bbox position to container', () => {
    const bbox: BBox = { x: -10, y: -20, width: 100, height: 50 }
    const clamped = clampBBox(bbox, container)

    expect(clamped.x).toBe(0)
    expect(clamped.y).toBe(0)
  })

  it('clamps bbox that extends beyond right edge', () => {
    const bbox: BBox = { x: 450, y: 0, width: 100, height: 50 }
    const clamped = clampBBox(bbox, container)

    expect(clamped.x).toBe(400) // 500 - 100
    expect(clamped.width).toBe(100)
  })

  it('clamps bbox that extends beyond bottom edge', () => {
    const bbox: BBox = { x: 0, y: 480, width: 100, height: 50 }
    const clamped = clampBBox(bbox, container)

    expect(clamped.y).toBe(450) // 500 - 50
    expect(clamped.height).toBe(50)
  })

  it('shrinks bbox that is larger than container', () => {
    const bbox: BBox = { x: 0, y: 0, width: 600, height: 700 }
    const clamped = clampBBox(bbox, container)

    expect(clamped.width).toBe(500)
    expect(clamped.height).toBe(500)
  })

  it('keeps bbox unchanged if already in bounds', () => {
    const bbox: BBox = { x: 100, y: 100, width: 100, height: 100 }
    const clamped = clampBBox(bbox, container)

    expect(clamped).toEqual(bbox)
  })
})
