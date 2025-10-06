import { describe, it, expect } from 'vitest'
import {
  lockAspectRatio,
  getAspectRatio,
  fitToMaxSize,
  fillMinSize,
  hasSameAspectRatio,
  type Frame,
} from '../aspectRatio'

describe('getAspectRatio', () => {
  it('calculates aspect ratio for landscape', () => {
    const frame: Frame = { x: 0, y: 0, width: 200, height: 100 }
    expect(getAspectRatio(frame)).toBe(2)
  })

  it('calculates aspect ratio for portrait', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 200 }
    expect(getAspectRatio(frame)).toBe(0.5)
  })

  it('calculates aspect ratio for square', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 100 }
    expect(getAspectRatio(frame)).toBe(1)
  })

  it('returns 1 for zero height (avoid division by zero)', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 0 }
    expect(getAspectRatio(frame)).toBe(1)
  })
})

describe('lockAspectRatio', () => {
  const frame: Frame = { x: 0, y: 0, width: 200, height: 100 }

  it('calculates height when width changes', () => {
    const result = lockAspectRatio(frame, 400)
    expect(result.width).toBe(400)
    expect(result.height).toBe(200)
  })

  it('calculates width when height changes', () => {
    const result = lockAspectRatio(frame, undefined, 200)
    expect(result.width).toBe(400)
    expect(result.height).toBe(200)
  })

  it('width takes precedence when both provided', () => {
    const result = lockAspectRatio(frame, 300, 200)
    expect(result.width).toBe(300)
    expect(result.height).toBe(150)
  })

  it('returns unchanged when neither provided', () => {
    const result = lockAspectRatio(frame)
    expect(result).toEqual(frame)
  })

  it('maintains position and rotation', () => {
    const frameWithRotation: Frame = { x: 10, y: 20, width: 200, height: 100, rotation: 45 }
    const result = lockAspectRatio(frameWithRotation, 400)
    expect(result.x).toBe(10)
    expect(result.y).toBe(20)
    expect(result.rotation).toBe(45)
  })

  it('handles square frame', () => {
    const square: Frame = { x: 0, y: 0, width: 100, height: 100 }
    const result = lockAspectRatio(square, 200)
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
  })
})

describe('fitToMaxSize', () => {
  it('scales down to fit width', () => {
    const frame: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const result = fitToMaxSize(frame, 100, 200)

    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('scales down to fit height', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 200 }
    const result = fitToMaxSize(frame, 200, 100)

    expect(result.width).toBe(50)
    expect(result.height).toBe(100)
  })

  it('returns unchanged if already fits', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50 }
    const result = fitToMaxSize(frame, 200, 100)

    expect(result).toEqual(frame)
  })

  it('maintains aspect ratio', () => {
    const frame: Frame = { x: 0, y: 0, width: 300, height: 200 }
    const result = fitToMaxSize(frame, 150, 150)

    expect(result.width).toBe(150)
    expect(result.height).toBe(100)
    expect(getAspectRatio(result)).toBeCloseTo(getAspectRatio(frame), 5)
  })

  it('handles square max size', () => {
    const frame: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const result = fitToMaxSize(frame, 100, 100)

    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })
})

describe('fillMinSize', () => {
  it('scales up to fill width', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50 }
    const result = fillMinSize(frame, 200, 50)

    expect(result.width).toBe(200)
    expect(result.height).toBe(100)
  })

  it('scales up to fill height', () => {
    const frame: Frame = { x: 0, y: 0, width: 50, height: 100 }
    const result = fillMinSize(frame, 50, 200)

    expect(result.width).toBe(100)
    expect(result.height).toBe(200)
  })

  it('returns unchanged if already fills', () => {
    const frame: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const result = fillMinSize(frame, 100, 50)

    expect(result).toEqual(frame)
  })

  it('maintains aspect ratio', () => {
    const frame: Frame = { x: 0, y: 0, width: 100, height: 50 }
    const result = fillMinSize(frame, 300, 200)

    expect(result.width).toBe(400)
    expect(result.height).toBe(200)
    expect(getAspectRatio(result)).toBeCloseTo(getAspectRatio(frame), 5)
  })
})

describe('hasSameAspectRatio', () => {
  it('returns true for same aspect ratio', () => {
    const frameA: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const frameB: Frame = { x: 0, y: 0, width: 400, height: 200 }

    expect(hasSameAspectRatio(frameA, frameB)).toBe(true)
  })

  it('returns false for different aspect ratios', () => {
    const frameA: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const frameB: Frame = { x: 0, y: 0, width: 100, height: 100 }

    expect(hasSameAspectRatio(frameA, frameB)).toBe(false)
  })

  it('uses tolerance for floating point comparison', () => {
    const frameA: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const frameB: Frame = { x: 0, y: 0, width: 200.005, height: 100 }

    expect(hasSameAspectRatio(frameA, frameB, 0.001)).toBe(true)
  })

  it('respects custom tolerance', () => {
    const frameA: Frame = { x: 0, y: 0, width: 200, height: 100 }
    const frameB: Frame = { x: 0, y: 0, width: 201, height: 100 }

    expect(hasSameAspectRatio(frameA, frameB, 0.001)).toBe(false)
    expect(hasSameAspectRatio(frameA, frameB, 0.02)).toBe(true)
  })

  it('handles square frames', () => {
    const frameA: Frame = { x: 0, y: 0, width: 100, height: 100 }
    const frameB: Frame = { x: 0, y: 0, width: 200, height: 200 }

    expect(hasSameAspectRatio(frameA, frameB)).toBe(true)
  })
})
