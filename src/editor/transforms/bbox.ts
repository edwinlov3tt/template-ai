/**
 * bbox.ts
 *
 * Bounding box utilities for transform operations.
 * Handles union bboxes, rotated bboxes, and collision detection.
 */

export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Frame {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

/**
 * Calculate union bounding box for multiple frames.
 * Handles rotated frames correctly.
 */
export function getUnionBBox(frames: Frame[]): BBox {
  if (frames.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  if (frames.length === 1) {
    return getRotatedBBox(frames[0])
  }

  // Get all rotated bboxes
  const bboxes = frames.map(getRotatedBBox)

  // Find extremes
  const minX = Math.min(...bboxes.map(b => b.x))
  const minY = Math.min(...bboxes.map(b => b.y))
  const maxX = Math.max(...bboxes.map(b => b.x + b.width))
  const maxY = Math.max(...bboxes.map(b => b.y + b.height))

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Calculate bounding box after rotation.
 * Returns axis-aligned bounding box that contains the rotated frame.
 */
export function getRotatedBBox(frame: Frame): BBox {
  const { x, y, width, height, rotation = 0 } = frame

  // No rotation, return as-is
  if (rotation === 0 || rotation === 360 || rotation === -360) {
    return { x, y, width, height }
  }

  // Get corners of the frame
  const corners = getBBoxCorners({ x, y, width, height })

  // Rotate each corner around the center
  const cx = x + width / 2
  const cy = y + height / 2
  const rad = (rotation * Math.PI) / 180

  const rotatedCorners = corners.map(corner => {
    const dx = corner.x - cx
    const dy = corner.y - cy
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    }
  })

  // Find extremes
  const xs = rotatedCorners.map(c => c.x)
  const ys = rotatedCorners.map(c => c.y)

  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Check if point is inside bounding box.
 */
export function containsPoint(bbox: BBox, point: { x: number; y: number }): boolean {
  return (
    point.x >= bbox.x &&
    point.x <= bbox.x + bbox.width &&
    point.y >= bbox.y &&
    point.y <= bbox.y + bbox.height
  )
}

/**
 * Get corners of bounding box (for rotation).
 * Returns corners in clockwise order: top-left, top-right, bottom-right, bottom-left.
 */
export function getBBoxCorners(bbox: BBox): Array<{ x: number; y: number }> {
  const { x, y, width, height } = bbox

  return [
    { x, y },                      // top-left
    { x: x + width, y },           // top-right
    { x: x + width, y: y + height }, // bottom-right
    { x, y: y + height }           // bottom-left
  ]
}

/**
 * Check if two bounding boxes intersect.
 */
export function bboxesIntersect(a: BBox, b: BBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/**
 * Get center point of bounding box.
 */
export function getBBoxCenter(bbox: BBox): { x: number; y: number } {
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2
  }
}

/**
 * Expand bounding box by padding.
 */
export function expandBBox(bbox: BBox, padding: number): BBox {
  return {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2
  }
}

/**
 * Clamp bounding box to container bounds.
 */
export function clampBBox(bbox: BBox, container: BBox): BBox {
  const x = Math.max(container.x, Math.min(container.x + container.width - bbox.width, bbox.x))
  const y = Math.max(container.y, Math.min(container.y + container.height - bbox.height, bbox.y))

  return {
    x,
    y,
    width: Math.min(bbox.width, container.width),
    height: Math.min(bbox.height, container.height)
  }
}
