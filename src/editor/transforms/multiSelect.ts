/**
 * multiSelect.ts
 *
 * Multi-select transform operations for groups of slots.
 * Handles group move, resize, and preserving relative positions.
 */

import type { Frame } from './bbox'
import { getUnionBBox, getRotatedBBox } from './bbox'
import { getAspectRatio } from './aspectRatio'
import type { TransformContext } from './operations'

/**
 * Transform all selected slots relative to union bbox.
 * Applies translation and scaling to maintain relative positions.
 */
export function transformGroup(
  slotNames: string[],
  deltaX: number,
  deltaY: number,
  scaleX: number,
  scaleY: number,
  context: TransformContext
): Record<string, Frame> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length === 0) {
    return {}
  }

  const updates: Record<string, Frame> = {}

  // Get union bbox
  const groupFrames = unlocked.map(name => frames[name]).filter(Boolean)
  const unionBBox = getUnionBBox(groupFrames)

  // Transform each slot relative to union bbox
  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    // Calculate offset from union bbox origin
    const offsetX = frame.x - unionBBox.x
    const offsetY = frame.y - unionBBox.y

    // Apply scaling to offset
    const newOffsetX = offsetX * scaleX
    const newOffsetY = offsetY * scaleY

    // Apply scaling to dimensions
    const newWidth = frame.width * scaleX
    const newHeight = frame.height * scaleY

    // Apply translation and scaled offset
    updates[slotName] = {
      x: unionBBox.x + deltaX + newOffsetX,
      y: unionBBox.y + deltaY + newOffsetY,
      width: newWidth,
      height: newHeight,
      rotation: frame.rotation
    }
  })

  return updates
}

/**
 * Resize group while preserving individual aspect ratios.
 */
export function resizeGroup(
  slotNames: string[],
  newWidth: number,
  newHeight: number,
  context: TransformContext
): Record<string, Frame> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length === 0) {
    return {}
  }

  const updates: Record<string, Frame> = {}

  // Get union bbox
  const groupFrames = unlocked.map(name => frames[name]).filter(Boolean)
  const unionBBox = getUnionBBox(groupFrames)

  // Calculate scale factors
  const scaleX = newWidth / unionBBox.width
  const scaleY = newHeight / unionBBox.height

  // Resize each slot relative to union bbox
  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    // Calculate offset from union bbox origin
    const offsetX = frame.x - unionBBox.x
    const offsetY = frame.y - unionBBox.y

    // Scale offset
    const newOffsetX = offsetX * scaleX
    const newOffsetY = offsetY * scaleY

    // Get aspect ratio
    const ratio = getAspectRatio(frame)

    // Scale dimensions (using smaller scale to maintain aspect ratio)
    const scale = Math.min(scaleX, scaleY)
    const newFrameWidth = frame.width * scale
    const newFrameHeight = newFrameWidth / ratio

    updates[slotName] = {
      x: unionBBox.x + newOffsetX,
      y: unionBBox.y + newOffsetY,
      width: newFrameWidth,
      height: newFrameHeight,
      rotation: frame.rotation
    }
  })

  return updates
}

/**
 * Move group by delta while preserving relative positions.
 */
export function moveGroup(
  slotNames: string[],
  deltaX: number,
  deltaY: number,
  context: TransformContext
): Record<string, Partial<Frame>> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  const updates: Record<string, Partial<Frame>> = {}

  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    updates[slotName] = {
      x: frame.x + deltaX,
      y: frame.y + deltaY
    }
  })

  return updates
}

/**
 * Scale group uniformly from center point.
 */
export function scaleGroup(
  slotNames: string[],
  scaleFactor: number,
  context: TransformContext
): Record<string, Frame> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length === 0) {
    return {}
  }

  const updates: Record<string, Frame> = {}

  // Get union bbox center
  const groupFrames = unlocked.map(name => frames[name]).filter(Boolean)
  const unionBBox = getUnionBBox(groupFrames)
  const centerX = unionBBox.x + unionBBox.width / 2
  const centerY = unionBBox.y + unionBBox.height / 2

  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    // Get current center
    const frameCenterX = frame.x + frame.width / 2
    const frameCenterY = frame.y + frame.height / 2

    // Calculate offset from group center
    const offsetX = frameCenterX - centerX
    const offsetY = frameCenterY - centerY

    // Scale offset
    const newOffsetX = offsetX * scaleFactor
    const newOffsetY = offsetY * scaleFactor

    // Scale dimensions
    const newWidth = frame.width * scaleFactor
    const newHeight = frame.height * scaleFactor

    // Calculate new position (keeping center at scaled offset)
    const newX = centerX + newOffsetX - newWidth / 2
    const newY = centerY + newOffsetY - newHeight / 2

    updates[slotName] = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: frame.rotation
    }
  })

  return updates
}

/**
 * Rotate group around union bbox center.
 */
export function rotateGroup(
  slotNames: string[],
  angleDelta: number,
  context: TransformContext
): Record<string, Frame> {
  const { frames, slots } = context

  // Filter out locked slots
  const slotMap = new Map(slots.map(s => [s.name, s]))
  const unlocked = slotNames.filter(name => {
    const slot = slotMap.get(name)
    return slot && !slot.locked
  })

  if (unlocked.length === 0) {
    return {}
  }

  const updates: Record<string, Frame> = {}

  // Get union bbox center
  const groupFrames = unlocked.map(name => frames[name]).filter(Boolean)
  const unionBBox = getUnionBBox(groupFrames)
  const centerX = unionBBox.x + unionBBox.width / 2
  const centerY = unionBBox.y + unionBBox.height / 2

  const rad = (angleDelta * Math.PI) / 180

  unlocked.forEach(slotName => {
    const frame = frames[slotName]
    if (!frame) return

    // Get current center
    const frameCenterX = frame.x + frame.width / 2
    const frameCenterY = frame.y + frame.height / 2

    // Calculate offset from group center
    const offsetX = frameCenterX - centerX
    const offsetY = frameCenterY - centerY

    // Rotate offset around group center
    const newOffsetX = offsetX * Math.cos(rad) - offsetY * Math.sin(rad)
    const newOffsetY = offsetX * Math.sin(rad) + offsetY * Math.cos(rad)

    // Calculate new position
    const newCenterX = centerX + newOffsetX
    const newCenterY = centerY + newOffsetY

    updates[slotName] = {
      x: newCenterX - frame.width / 2,
      y: newCenterY - frame.height / 2,
      width: frame.width,
      height: frame.height,
      rotation: ((frame.rotation || 0) + angleDelta) % 360
    }
  })

  return updates
}
