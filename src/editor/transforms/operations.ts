/**
 * operations.ts
 *
 * Transform operations for z-order, alignment, and distribution.
 * Works with all slot types (text, image, shape, button).
 */

import type { Frame, BBox } from './bbox'
import { getRotatedBBox } from './bbox'

export interface Slot {
  name: string
  z: number
  locked?: boolean
  [key: string]: unknown
}

export interface TransformContext {
  slots: Slot[]
  frames: Record<string, Frame>
  canvasBounds: BBox
}

// ============================================================================
// Z-Order Operations
// ============================================================================

/**
 * Bring slot to front (highest z-index).
 */
export function bringToFront(slotName: string, context: TransformContext): Slot[] {
  const { slots } = context
  const slot = slots.find(s => s.name === slotName)

  if (!slot || slot.locked) {
    return slots
  }

  const maxZ = Math.max(...slots.map(s => s.z))

  // If already at front, no change
  if (slot.z === maxZ) {
    return slots
  }

  return slots.map(s =>
    s.name === slotName ? { ...s, z: maxZ + 1 } : s
  )
}

/**
 * Send slot to back (lowest z-index).
 */
export function sendToBack(slotName: string, context: TransformContext): Slot[] {
  const { slots } = context
  const slot = slots.find(s => s.name === slotName)

  if (!slot || slot.locked) {
    return slots
  }

  const minZ = Math.min(...slots.map(s => s.z))

  // If already at back, no change
  if (slot.z === minZ) {
    return slots
  }

  return slots.map(s =>
    s.name === slotName ? { ...s, z: minZ - 1 } : s
  )
}

/**
 * Bring slot forward one level.
 */
export function bringForward(slotName: string, context: TransformContext): Slot[] {
  const { slots } = context
  const slot = slots.find(s => s.name === slotName)

  if (!slot || slot.locked) {
    return slots
  }

  // Find next higher z-index
  const higherSlots = slots.filter(s => s.z > slot.z)

  if (higherSlots.length === 0) {
    // Already at front
    return slots
  }

  const nextZ = Math.min(...higherSlots.map(s => s.z))

  return slots.map(s =>
    s.name === slotName ? { ...s, z: nextZ + 1 } : s
  )
}

/**
 * Send slot backward one level.
 */
export function sendBackward(slotName: string, context: TransformContext): Slot[] {
  const { slots } = context
  const slot = slots.find(s => s.name === slotName)

  if (!slot || slot.locked) {
    return slots
  }

  // Find next lower z-index
  const lowerSlots = slots.filter(s => s.z < slot.z)

  if (lowerSlots.length === 0) {
    // Already at back
    return slots
  }

  const nextZ = Math.max(...lowerSlots.map(s => s.z))

  return slots.map(s =>
    s.name === slotName ? { ...s, z: nextZ - 1 } : s
  )
}

// ============================================================================
// Alignment Operations
// ============================================================================

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

/**
 * Align slots to page/canvas bounds.
 * Returns updated frames for aligned slots.
 */
export function alignToPage(
  slotNames: string[],
  mode: AlignMode,
  context: TransformContext
): Record<string, Partial<Frame>> {
  const { frames, canvasBounds, slots } = context
  const updates: Record<string, Partial<Frame>> = {}

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    const bbox = getRotatedBBox(frame)

    switch (mode) {
      case 'left':
        updates[slotName] = { x: canvasBounds.x }
        break

      case 'center':
        updates[slotName] = {
          x: canvasBounds.x + (canvasBounds.width - bbox.width) / 2
        }
        break

      case 'right':
        updates[slotName] = {
          x: canvasBounds.x + canvasBounds.width - bbox.width
        }
        break

      case 'top':
        updates[slotName] = { y: canvasBounds.y }
        break

      case 'middle':
        updates[slotName] = {
          y: canvasBounds.y + (canvasBounds.height - bbox.height) / 2
        }
        break

      case 'bottom':
        updates[slotName] = {
          y: canvasBounds.y + canvasBounds.height - bbox.height
        }
        break
    }
  })

  return updates
}

// ============================================================================
// Distribution Operations
// ============================================================================

export type DistributeMode = 'horizontal' | 'vertical'

/**
 * Distribute slots evenly.
 * For horizontal: distribute centers evenly across width
 * For vertical: distribute centers evenly across height
 */
export function distribute(
  slotNames: string[],
  mode: DistributeMode,
  context: TransformContext
): Record<string, Partial<Frame>> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length < 3) {
    // Need at least 3 slots to distribute
    return {}
  }

  const updates: Record<string, Partial<Frame>> = {}

  // Get bboxes
  const bboxes = unlocked.map(name => ({
    name,
    bbox: getRotatedBBox(frames[name])
  }))

  if (mode === 'horizontal') {
    // Sort by x position
    bboxes.sort((a, b) => a.bbox.x - b.bbox.x)

    const first = bboxes[0].bbox
    const last = bboxes[bboxes.length - 1].bbox

    const firstCenter = first.x + first.width / 2
    const lastCenter = last.x + last.width / 2
    const totalWidth = lastCenter - firstCenter
    const spacing = totalWidth / (bboxes.length - 1)

    bboxes.forEach((item, index) => {
      if (index === 0 || index === bboxes.length - 1) {
        // Don't move first and last
        return
      }

      const targetCenter = firstCenter + spacing * index
      const currentCenter = item.bbox.x + item.bbox.width / 2
      const offset = targetCenter - currentCenter

      updates[item.name] = {
        x: frames[item.name].x + offset
      }
    })
  } else {
    // Vertical distribution
    // Sort by y position
    bboxes.sort((a, b) => a.bbox.y - b.bbox.y)

    const first = bboxes[0].bbox
    const last = bboxes[bboxes.length - 1].bbox

    const firstCenter = first.y + first.height / 2
    const lastCenter = last.y + last.height / 2
    const totalHeight = lastCenter - firstCenter
    const spacing = totalHeight / (bboxes.length - 1)

    bboxes.forEach((item, index) => {
      if (index === 0 || index === bboxes.length - 1) {
        // Don't move first and last
        return
      }

      const targetCenter = firstCenter + spacing * index
      const currentCenter = item.bbox.y + item.bbox.height / 2
      const offset = targetCenter - currentCenter

      updates[item.name] = {
        y: frames[item.name].y + offset
      }
    })
  }

  return updates
}

/**
 * Align slots to each other (not to canvas).
 * Uses the first selected slot as the reference.
 */
export function alignToSelection(
  slotNames: string[],
  mode: AlignMode,
  context: TransformContext
): Record<string, Partial<Frame>> {
  const { frames, slots } = context

  if (slotNames.length < 2) {
    return {}
  }

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length < 2) {
    return {}
  }

  const updates: Record<string, Partial<Frame>> = {}

  // Use first slot as reference
  const reference = getRotatedBBox(frames[unlocked[0]])

  // Align others to reference
  unlocked.slice(1).forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    const bbox = getRotatedBBox(frame)

    switch (mode) {
      case 'left':
        updates[slotName] = { x: reference.x }
        break

      case 'center':
        updates[slotName] = {
          x: reference.x + (reference.width - bbox.width) / 2
        }
        break

      case 'right':
        updates[slotName] = {
          x: reference.x + reference.width - bbox.width
        }
        break

      case 'top':
        updates[slotName] = { y: reference.y }
        break

      case 'middle':
        updates[slotName] = {
          y: reference.y + (reference.height - bbox.height) / 2
        }
        break

      case 'bottom':
        updates[slotName] = {
          y: reference.y + reference.height - bbox.height
        }
        break
    }
  })

  return updates
}
