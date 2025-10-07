/**
 * aspectRatio.ts
 *
 * Aspect ratio locking utilities for maintaining proportions during resize.
 */

import type { Frame } from './bbox'

/**
 * Lock aspect ratio when resizing.
 * If both newWidth and newHeight are provided, width takes precedence.
 */
export function lockAspectRatio(
  frame: Frame,
  newWidth?: number,
  newHeight?: number
): Frame {
  const ratio = getAspectRatio(frame)

  if (newWidth !== undefined && newHeight === undefined) {
    // Width changed, calculate height
    return {
      ...frame,
      width: newWidth,
      height: newWidth / ratio
    }
  }

  if (newHeight !== undefined && newWidth === undefined) {
    // Height changed, calculate width
    return {
      ...frame,
      width: newHeight * ratio,
      height: newHeight
    }
  }

  if (newWidth !== undefined && newHeight !== undefined) {
    // Both provided, width takes precedence
    return {
      ...frame,
      width: newWidth,
      height: newWidth / ratio
    }
  }

  // Neither provided, return unchanged
  return frame
}

/**
 * Get aspect ratio (width / height).
 * Returns 1 if height is 0 to avoid division by zero.
 */
export function getAspectRatio(frame: Frame): number {
  if (frame.height === 0) {
    return 1
  }
  return frame.width / frame.height
}

/**
 * Resize frame to fit within maximum dimensions while maintaining aspect ratio.
 */
export function fitToMaxSize(
  frame: Frame,
  maxWidth: number,
  maxHeight: number
): Frame {
  const ratio = getAspectRatio(frame)

  if (frame.width <= maxWidth && frame.height <= maxHeight) {
    // Already fits
    return frame
  }

  // Scale to fit
  const widthScale = maxWidth / frame.width
  const heightScale = maxHeight / frame.height
  const scale = Math.min(widthScale, heightScale)

  return {
    ...frame,
    width: frame.width * scale,
    height: frame.height * scale
  }
}

/**
 * Resize frame to fill minimum dimensions while maintaining aspect ratio.
 */
export function fillMinSize(
  frame: Frame,
  minWidth: number,
  minHeight: number
): Frame {
  const ratio = getAspectRatio(frame)

  if (frame.width >= minWidth && frame.height >= minHeight) {
    // Already fills
    return frame
  }

  // Scale to fill
  const widthScale = minWidth / frame.width
  const heightScale = minHeight / frame.height
  const scale = Math.max(widthScale, heightScale)

  return {
    ...frame,
    width: frame.width * scale,
    height: frame.height * scale
  }
}

/**
 * Check if two frames have the same aspect ratio (within tolerance).
 */
export function hasSameAspectRatio(
  frameA: Frame,
  frameB: Frame,
  tolerance: number = 0.01
): boolean {
  const ratioA = getAspectRatio(frameA)
  const ratioB = getAspectRatio(frameB)
  return Math.abs(ratioA - ratioB) < tolerance
}
