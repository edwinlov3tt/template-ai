import { describe, it, expect } from 'vitest'
import {
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward,
  alignToPage,
  distribute,
  alignToSelection,
  type Slot,
  type TransformContext,
  type Frame,
} from '../operations'

const createContext = (
  slots: Slot[],
  frames: Record<string, Frame>,
  canvasBounds = { x: 0, y: 0, width: 1000, height: 1000 }
): TransformContext => ({
  slots,
  frames,
  canvasBounds
})

describe('Z-order operations', () => {
  describe('bringToFront', () => {
    it('brings slot to front', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = bringToFront('a', context)

      const slotA = result.find(s => s.name === 'a')
      expect(slotA?.z).toBe(4) // maxZ + 1
    })

    it('does nothing if already at front', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = bringToFront('c', context)

      expect(result).toEqual(slots)
    })

    it('does nothing if slot is locked', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1, locked: true },
        { name: 'b', z: 2 }
      ]
      const context = createContext(slots, {})
      const result = bringToFront('a', context)

      expect(result).toEqual(slots)
    })
  })

  describe('sendToBack', () => {
    it('sends slot to back', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = sendToBack('c', context)

      const slotC = result.find(s => s.name === 'c')
      expect(slotC?.z).toBe(0) // minZ - 1
    })

    it('does nothing if already at back', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = sendToBack('a', context)

      expect(result).toEqual(slots)
    })
  })

  describe('bringForward', () => {
    it('brings slot forward one level', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = bringForward('a', context)

      const slotA = result.find(s => s.name === 'a')
      expect(slotA?.z).toBe(3) // next z + 1
    })

    it('does nothing if already at front', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = bringForward('c', context)

      expect(result).toEqual(slots)
    })
  })

  describe('sendBackward', () => {
    it('sends slot backward one level', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = sendBackward('c', context)

      const slotC = result.find(s => s.name === 'c')
      expect(slotC?.z).toBe(1) // previous z - 1
    })

    it('does nothing if already at back', () => {
      const slots: Slot[] = [
        { name: 'a', z: 1 },
        { name: 'b', z: 2 },
        { name: 'c', z: 3 }
      ]
      const context = createContext(slots, {})
      const result = sendBackward('a', context)

      expect(result).toEqual(slots)
    })
  })
})

describe('Alignment operations', () => {
  const frames: Record<string, Frame> = {
    a: { x: 100, y: 100, width: 100, height: 50 },
    b: { x: 300, y: 200, width: 80, height: 60 },
    c: { x: 500, y: 300, width: 120, height: 40 }
  }

  const slots: Slot[] = [
    { name: 'a', z: 1 },
    { name: 'b', z: 2 },
    { name: 'c', z: 3 }
  ]

  describe('alignToPage', () => {
    it('aligns to left edge', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a', 'b', 'c'], 'left', context)

      expect(updates.a?.x).toBe(0)
      expect(updates.b?.x).toBe(0)
      expect(updates.c?.x).toBe(0)
    })

    it('aligns to center', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a'], 'center', context)

      // center = (1000 - 100) / 2 = 450
      expect(updates.a?.x).toBe(450)
    })

    it('aligns to right edge', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a'], 'right', context)

      // right = 1000 - 100 = 900
      expect(updates.a?.x).toBe(900)
    })

    it('aligns to top edge', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a', 'b', 'c'], 'top', context)

      expect(updates.a?.y).toBe(0)
      expect(updates.b?.y).toBe(0)
      expect(updates.c?.y).toBe(0)
    })

    it('aligns to middle', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a'], 'middle', context)

      // middle = (1000 - 50) / 2 = 475
      expect(updates.a?.y).toBe(475)
    })

    it('aligns to bottom edge', () => {
      const context = createContext(slots, frames)
      const updates = alignToPage(['a'], 'bottom', context)

      // bottom = 1000 - 50 = 950
      expect(updates.a?.y).toBe(950)
    })

    it('skips locked slots', () => {
      const lockedSlots: Slot[] = [
        { name: 'a', z: 1, locked: true },
        { name: 'b', z: 2 }
      ]
      const context = createContext(lockedSlots, frames)
      const updates = alignToPage(['a', 'b'], 'left', context)

      expect(updates.a).toBeUndefined()
      expect(updates.b?.x).toBe(0)
    })
  })

  describe('alignToSelection', () => {
    it('aligns to first selected slot (left)', () => {
      const context = createContext(slots, frames)
      const updates = alignToSelection(['a', 'b', 'c'], 'left', context)

      // b and c should align to a's left edge (x = 100)
      expect(updates.a).toBeUndefined() // Reference slot not updated
      expect(updates.b?.x).toBe(100)
      expect(updates.c?.x).toBe(100)
    })

    it('aligns to first selected slot (center)', () => {
      const context = createContext(slots, frames)
      const updates = alignToSelection(['a', 'b'], 'center', context)

      // b should center align to a
      // a center: 100 + 100/2 = 150
      // b new x: 150 - 80/2 = 110
      expect(updates.b?.x).toBe(110)
    })

    it('returns empty when less than 2 slots', () => {
      const context = createContext(slots, frames)
      const updates = alignToSelection(['a'], 'left', context)

      expect(Object.keys(updates)).toHaveLength(0)
    })
  })
})

describe('Distribution operations', () => {
  const frames: Record<string, Frame> = {
    a: { x: 0, y: 0, width: 100, height: 100 },
    b: { x: 200, y: 200, width: 100, height: 100 },
    c: { x: 400, y: 400, width: 100, height: 100 },
    d: { x: 600, y: 600, width: 100, height: 100 },
    e: { x: 800, y: 800, width: 100, height: 100 }
  }

  const slots: Slot[] = [
    { name: 'a', z: 1 },
    { name: 'b', z: 2 },
    { name: 'c', z: 3 },
    { name: 'd', z: 4 },
    { name: 'e', z: 5 }
  ]

  describe('distribute horizontal', () => {
    it('distributes 3 slots evenly', () => {
      const context = createContext(slots, frames)
      const updates = distribute(['a', 'c', 'e'], 'horizontal', context)

      // First and last should not move
      expect(updates.a).toBeUndefined()
      expect(updates.e).toBeUndefined()

      // Middle should be centered between a and e
      // a center: 0 + 100/2 = 50
      // e center: 800 + 100/2 = 850
      // c center should be at: 50 + (850-50)/2 = 450
      // c.x should be: 450 - 100/2 = 400
      expect(updates.c?.x).toBeCloseTo(400, 1)
    })

    it('distributes 5 slots evenly', () => {
      const context = createContext(slots, frames)
      const updates = distribute(['a', 'b', 'c', 'd', 'e'], 'horizontal', context)

      // First and last should not move
      expect(updates.a).toBeUndefined()
      expect(updates.e).toBeUndefined()

      // Middle slots should be distributed
      expect(updates.b).toBeDefined()
      expect(updates.c).toBeDefined()
      expect(updates.d).toBeDefined()
    })

    it('returns empty for less than 3 slots', () => {
      const context = createContext(slots, frames)
      const updates = distribute(['a', 'b'], 'horizontal', context)

      expect(Object.keys(updates)).toHaveLength(0)
    })
  })

  describe('distribute vertical', () => {
    it('distributes 3 slots evenly', () => {
      const context = createContext(slots, frames)
      const updates = distribute(['a', 'c', 'e'], 'vertical', context)

      // First and last should not move
      expect(updates.a).toBeUndefined()
      expect(updates.e).toBeUndefined()

      // Middle should be centered between a and e
      expect(updates.c?.y).toBeCloseTo(400, 1)
    })
  })

  it('skips locked slots', () => {
    const lockedSlots: Slot[] = [
      { name: 'a', z: 1 },
      { name: 'b', z: 2, locked: true },
      { name: 'c', z: 3 },
      { name: 'e', z: 5 }
    ]
    const context = createContext(lockedSlots, frames)
    const updates = distribute(['a', 'b', 'c', 'e'], 'horizontal', context)

    // b should not be in updates since it's locked
    expect(updates.b).toBeUndefined()
    // Only 3 unlocked slots remain, c should still be distributed
    expect(updates.c).toBeDefined()
  })
})
