import { describe, it, expect } from 'vitest'
import {
  transformGroup,
  resizeGroup,
  moveGroup,
  scaleGroup,
  rotateGroup,
  type Frame,
} from '../multiSelect'
import type { TransformContext, Slot } from '../operations'

const createContext = (
  slots: Slot[],
  frames: Record<string, Frame>
): TransformContext => ({
  slots,
  frames,
  canvasBounds: { x: 0, y: 0, width: 1000, height: 1000 }
})

describe('moveGroup', () => {
  it('moves all slots by delta', () => {
    const frames: Record<string, Frame> = {
      a: { x: 100, y: 100, width: 100, height: 50 },
      b: { x: 300, y: 200, width: 80, height: 60 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = moveGroup(['a', 'b'], 50, 100, context)

    expect(updates.a?.x).toBe(150)
    expect(updates.a?.y).toBe(200)
    expect(updates.b?.x).toBe(350)
    expect(updates.b?.y).toBe(300)
  })

  it('skips locked slots', () => {
    const frames: Record<string, Frame> = {
      a: { x: 100, y: 100, width: 100, height: 50 },
      b: { x: 300, y: 200, width: 80, height: 60 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1, locked: true },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = moveGroup(['a', 'b'], 50, 100, context)

    expect(updates.a).toBeUndefined()
    expect(updates.b?.x).toBe(350)
  })

  it('handles negative deltas', () => {
    const frames: Record<string, Frame> = {
      a: { x: 100, y: 100, width: 100, height: 50 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = moveGroup(['a'], -50, -25, context)

    expect(updates.a?.x).toBe(50)
    expect(updates.a?.y).toBe(75)
  })
})

describe('transformGroup', () => {
  it('transforms group with translation only', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = transformGroup(['a', 'b'], 50, 50, 1, 1, context)

    expect(updates.a?.x).toBe(50)
    expect(updates.a?.y).toBe(50)
    expect(updates.b?.x).toBe(150)
    expect(updates.b?.y).toBe(50)
  })

  it('transforms group with scaling', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = transformGroup(['a', 'b'], 0, 0, 2, 2, context)

    // a stays at 0,0 but doubles in size
    expect(updates.a?.x).toBe(0)
    expect(updates.a?.y).toBe(0)
    expect(updates.a?.width).toBe(200)
    expect(updates.a?.height).toBe(200)

    // b moves to 200,0 (offset doubles) and doubles in size
    expect(updates.b?.x).toBe(200)
    expect(updates.b?.y).toBe(0)
    expect(updates.b?.width).toBe(200)
    expect(updates.b?.height).toBe(200)
  })

  it('preserves rotation', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100, rotation: 45 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = transformGroup(['a'], 0, 0, 1, 1, context)

    expect(updates.a?.rotation).toBe(45)
  })

  it('returns empty for all locked slots', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1, locked: true }]
    const context = createContext(slots, frames)

    const updates = transformGroup(['a'], 50, 50, 1, 1, context)

    expect(Object.keys(updates)).toHaveLength(0)
  })
})

describe('resizeGroup', () => {
  it('resizes group while preserving aspect ratios', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    // Union bbox is 0,0,200,100
    // Resize to 400x200 (2x scale)
    const updates = resizeGroup(['a', 'b'], 400, 200, context)

    // Each slot should scale by min(2, 2) = 2
    expect(updates.a?.width).toBe(200)
    expect(updates.a?.height).toBe(200)
    expect(updates.b?.width).toBe(200)
    expect(updates.b?.height).toBe(200)
  })

  it('handles different aspect ratios', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 200, height: 100 },
      b: { x: 0, y: 100, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = resizeGroup(['a', 'b'], 400, 400, context)

    // Should maintain aspect ratios
    expect(updates.a?.width / updates.a?.height).toBeCloseTo(2, 1)
    expect(updates.b?.width / updates.b?.height).toBeCloseTo(1, 1)
  })

  it('returns empty for all locked slots', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1, locked: true }]
    const context = createContext(slots, frames)

    const updates = resizeGroup(['a'], 200, 200, context)

    expect(Object.keys(updates)).toHaveLength(0)
  })
})

describe('scaleGroup', () => {
  it('scales group uniformly from center', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = scaleGroup(['a', 'b'], 2, context)

    // Union bbox center: (100, 50)
    // After 2x scale, slots should double in size and move away from center

    expect(updates.a?.width).toBe(200)
    expect(updates.a?.height).toBe(200)
    expect(updates.b?.width).toBe(200)
    expect(updates.b?.height).toBe(200)

    // Positions should scale relative to center
    // a center was at (50, 50), offset from group center: (-50, 0)
    // After 2x scale: offset becomes (-100, 0), new position: 100-100-100 = -100
    expect(updates.a?.x).toBeCloseTo(-100, 1)
    // b center was at (150, 50), offset from group center: (50, 0)
    // After 2x scale: offset becomes (100, 0), new position: 100+100-100 = 100
    expect(updates.b?.x).toBeCloseTo(100, 1)
  })

  it('handles scale down', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = scaleGroup(['a'], 0.5, context)

    expect(updates.a?.width).toBe(50)
    expect(updates.a?.height).toBe(50)
  })

  it('preserves rotation', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100, rotation: 45 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = scaleGroup(['a'], 2, context)

    expect(updates.a?.rotation).toBe(45)
  })

  it('returns empty for all locked slots', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1, locked: true }]
    const context = createContext(slots, frames)

    const updates = scaleGroup(['a'], 2, context)

    expect(Object.keys(updates)).toHaveLength(0)
  })
})

describe('rotateGroup', () => {
  it('rotates group around union bbox center', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = rotateGroup(['a'], 90, context)

    expect(updates.a?.rotation).toBe(90)
  })

  it('accumulates rotation', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100, rotation: 45 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = rotateGroup(['a'], 45, context)

    expect(updates.a?.rotation).toBe(90)
  })

  it('rotates multiple slots around group center', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 },
      b: { x: 100, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2 }
    ]
    const context = createContext(slots, frames)

    const updates = rotateGroup(['a', 'b'], 180, context)

    // After 180° rotation, positions should be mirrored around center
    expect(updates.a).toBeDefined()
    expect(updates.b).toBeDefined()
    expect(updates.a?.rotation).toBe(180)
    expect(updates.b?.rotation).toBe(180)
  })

  it('handles negative rotation', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100, rotation: 45 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1 }]
    const context = createContext(slots, frames)

    const updates = rotateGroup(['a'], -45, context)

    expect(updates.a?.rotation).toBe(0)
  })

  it('returns empty for all locked slots', () => {
    const frames: Record<string, Frame> = {
      a: { x: 0, y: 0, width: 100, height: 100 }
    }
    const slots: Slot[] = [{ name: 'a', z: 1, locked: true }]
    const context = createContext(slots, frames)

    const updates = rotateGroup(['a'], 45, context)

    expect(Object.keys(updates)).toHaveLength(0)
  })
})
