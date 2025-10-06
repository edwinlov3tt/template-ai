/**
 * numeric.ts
 *
 * Numeric transform inputs for precise positioning and sizing.
 */

import type { Frame, BBox } from './bbox'
import { lockAspectRatio } from './aspectRatio'

export interface NumericTransform {
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
}

/**
 * Apply numeric transform to frame.
 * If lockRatio is true, maintains aspect ratio when resizing.
 */
export function applyNumericTransform(
  frame: Frame,
  transform: NumericTransform,
  lockRatio: boolean
): Frame {
  let result = { ...frame }

  // Apply position changes
  if (transform.x !== undefined) {
    result.x = transform.x
  }
  if (transform.y !== undefined) {
    result.y = transform.y
  }

  // Apply rotation
  if (transform.rotation !== undefined) {
    result.rotation = normalizeRotation(transform.rotation)
  }

  // Apply size changes
  if (lockRatio) {
    // If both width and height are provided, width takes precedence
    if (transform.width !== undefined || transform.height !== undefined) {
      result = lockAspectRatio(result, transform.width, transform.height)
    }
  } else {
    // Apply size changes independently
    if (transform.width !== undefined) {
      result.width = Math.max(1, transform.width) // Minimum 1px
    }
    if (transform.height !== undefined) {
      result.height = Math.max(1, transform.height) // Minimum 1px
    }
  }

  return result
}

/**
 * Constrain frame to canvas bounds.
 * Ensures the frame stays within the canvas area.
 */
export function constrainToCanvas(
  frame: Frame,
  canvasBounds: BBox
): Frame {
  const result = { ...frame }

  // Ensure minimum size
  const minWidth = 1
  const minHeight = 1

  // Constrain width and height to fit in canvas
  result.width = Math.max(minWidth, Math.min(frame.width, canvasBounds.width))
  result.height = Math.max(minHeight, Math.min(frame.height, canvasBounds.height))

  // Constrain position to keep frame in bounds
  result.x = Math.max(
    canvasBounds.x,
    Math.min(canvasBounds.x + canvasBounds.width - result.width, frame.x)
  )
  result.y = Math.max(
    canvasBounds.y,
    Math.min(canvasBounds.y + canvasBounds.height - result.height, frame.y)
  )

  return result
}

/**
 * Normalize rotation to [-180, 180] range.
 */
export function normalizeRotation(rotation: number): number {
  // Reduce to [0, 360) range first
  let normalized = rotation % 360

  // Convert to [-180, 180] range
  if (normalized > 180) {
    normalized -= 360
  } else if (normalized < -180) {
    normalized += 360
  }

  return normalized
}

/**
 * Snap value to grid.
 */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) {
    return value
  }
  return Math.round(value / gridSize) * gridSize
}

/**
 * Snap frame position to grid.
 */
export function snapFrameToGrid(frame: Frame, gridSize: number): Frame {
  if (gridSize <= 0) {
    return frame
  }

  return {
    ...frame,
    x: snapToGrid(frame.x, gridSize),
    y: snapToGrid(frame.y, gridSize),
    width: Math.max(gridSize, snapToGrid(frame.width, gridSize)),
    height: Math.max(gridSize, snapToGrid(frame.height, gridSize))
  }
}

/**
 * Clamp value to min/max range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Round value to specified decimal places.
 */
export function roundTo(value: number, decimals: number = 0): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Round all frame values to specified decimal places.
 */
export function roundFrame(frame: Frame, decimals: number = 2): Frame {
  return {
    x: roundTo(frame.x, decimals),
    y: roundTo(frame.y, decimals),
    width: roundTo(frame.width, decimals),
    height: roundTo(frame.height, decimals),
    rotation: frame.rotation !== undefined ? roundTo(frame.rotation, decimals) : undefined
  }
}
