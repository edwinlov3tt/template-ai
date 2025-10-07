/**
 * Gradient Math Utilities
 *
 * Coordinate conversions for linear and radial gradients:
 * - Angle ↔ vector conversions
 * - BBox ↔ absolute coordinate conversions
 * - Gradient stop management
 * - Color interpolation for new stops
 */

import type { GradientStop, LinearGradientPaint, RadialGradientPaint } from './types'
import { interpolate } from './colorMath'

export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Convert angle (degrees) to unit direction vector
 *
 * 0° = bottom to top (0, -1)
 * 90° = left to right (1, 0)
 * 180° = top to bottom (0, 1)
 * 270° = right to left (-1, 0)
 *
 * @param angle - Angle in degrees (0-360)
 * @returns Unit vector { dx, dy }
 */
export function angleToVector(angle: number): { dx: number; dy: number } {
  // Normalize angle to 0-360
  const normalized = ((angle % 360) + 360) % 360

  // Convert to radians (0° = up, clockwise)
  // CSS gradient: 0° = bottom-to-top, so we offset by 90°
  const radians = ((normalized - 90) * Math.PI) / 180

  return {
    dx: Math.cos(radians),
    dy: Math.sin(radians)
  }
}

/**
 * Convert direction vector to angle (degrees)
 *
 * Inverse of angleToVector()
 *
 * @param dx - X component of direction vector
 * @param dy - Y component of direction vector
 * @returns Angle in degrees (0-360)
 */
export function vectorToAngle(dx: number, dy: number): number {
  // Handle zero vector
  if (dx === 0 && dy === 0) return 0

  // Calculate angle in radians
  const radians = Math.atan2(dy, dx)

  // Convert to degrees and adjust for CSS gradient convention
  let degrees = (radians * 180) / Math.PI + 90

  // Normalize to 0-360
  if (degrees < 0) degrees += 360
  if (degrees >= 360) degrees -= 360

  return degrees
}

/**
 * Convert linear gradient angle to start/end points in viewBox coordinates
 *
 * Given a bbox and angle, returns the two points where the gradient vector
 * intersects the bbox edges. These become x1,y1 and x2,y2 for SVG linearGradient.
 *
 * @param bbox - Bounding box in viewBox units
 * @param angle - Gradient angle in degrees
 * @returns Start and end points { x1, y1, x2, y2 }
 */
export function gradientToPoints(
  bbox: BBox,
  angle: number
): { x1: number; y1: number; x2: number; y2: number } {
  const { dx, dy } = angleToVector(angle)

  // Center of bbox
  const cx = bbox.x + bbox.width / 2
  const cy = bbox.y + bbox.height / 2

  // Project vector onto bbox edges to find gradient extent
  // Scale vector to reach bbox boundaries
  const halfWidth = bbox.width / 2
  const halfHeight = bbox.height / 2

  // Calculate scale factor to reach bbox edge
  // Use maximum projection to ensure gradient covers full bbox
  const scaleX = dx !== 0 ? Math.abs(halfWidth / dx) : Infinity
  const scaleY = dy !== 0 ? Math.abs(halfHeight / dy) : Infinity
  const scale = Math.min(scaleX, scaleY)

  // Also account for diagonal: gradient must span corner-to-corner
  const diagonal = Math.sqrt(halfWidth ** 2 + halfHeight ** 2)
  const vectorLength = Math.sqrt(dx ** 2 + dy ** 2)
  const diagonalScale = diagonal / vectorLength

  // Use the larger scale to ensure full coverage
  const finalScale = Math.max(scale, diagonalScale)

  // Calculate start and end points
  const x1 = cx - dx * finalScale
  const y1 = cy - dy * finalScale
  const x2 = cx + dx * finalScale
  const y2 = cy + dy * finalScale

  return { x1, y1, x2, y2 }
}

/**
 * Convert radial gradient relative coords (0-1) to absolute viewBox coordinates
 *
 * cx, cy, r are stored as 0-1 ratios relative to bbox.
 * This converts them to absolute viewBox units for rendering.
 *
 * @param bbox - Bounding box in viewBox units
 * @param cx - Center X (0-1)
 * @param cy - Center Y (0-1)
 * @param r - Radius (0-1, relative to bbox diagonal)
 * @returns Absolute coordinates { cx, cy, r }
 */
export function bboxToAbsolute(
  bbox: BBox,
  cx: number,
  cy: number,
  r: number
): { cx: number; cy: number; r: number } {
  // Convert center from 0-1 to absolute
  const absCx = bbox.x + cx * bbox.width
  const absCy = bbox.y + cy * bbox.height

  // Radius is relative to bbox diagonal (so it can span full bbox)
  const diagonal = Math.sqrt(bbox.width ** 2 + bbox.height ** 2)
  const absR = r * diagonal

  return {
    cx: absCx,
    cy: absCy,
    r: absR
  }
}

/**
 * Convert radial gradient absolute coords to relative (0-1)
 *
 * Inverse of bboxToAbsolute()
 *
 * @param bbox - Bounding box in viewBox units
 * @param cx - Center X (absolute)
 * @param cy - Center Y (absolute)
 * @param r - Radius (absolute)
 * @returns Relative coordinates { cx, cy, r }
 */
export function absoluteToBbox(
  bbox: BBox,
  cx: number,
  cy: number,
  r: number
): { cx: number; cy: number; r: number } {
  // Convert center from absolute to 0-1
  const relCx = (cx - bbox.x) / bbox.width
  const relCy = (cy - bbox.y) / bbox.height

  // Radius relative to bbox diagonal
  const diagonal = Math.sqrt(bbox.width ** 2 + bbox.height ** 2)
  const relR = r / diagonal

  return {
    cx: relCx,
    cy: relCy,
    r: relR
  }
}

/**
 * Sort gradient stops by offset (ascending)
 *
 * Mutates the array in place.
 *
 * @param stops - Array of gradient stops
 * @returns Sorted array (same reference)
 */
export function sortStops(stops: GradientStop[]): GradientStop[] {
  return stops.sort((a, b) => a.offset - b.offset)
}

/**
 * Interpolate color for a new stop at the given offset
 *
 * Finds the two surrounding stops and interpolates the color.
 * If offset is before first stop, uses first stop color.
 * If offset is after last stop, uses last stop color.
 *
 * @param stops - Existing gradient stops (must be sorted)
 * @param offset - Position for new stop (0-1)
 * @returns Interpolated color (hex)
 */
export function interpolateStopColor(stops: GradientStop[], offset: number): string {
  // Clamp offset to 0-1
  const clampedOffset = Math.max(0, Math.min(1, offset))

  // Find surrounding stops
  let beforeStop: GradientStop | null = null
  let afterStop: GradientStop | null = null

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    if (stop.offset <= clampedOffset) {
      beforeStop = stop
    }
    if (stop.offset >= clampedOffset && !afterStop) {
      afterStop = stop
      break
    }
  }

  // Edge cases
  if (!beforeStop) return afterStop?.color ?? '#000000'
  if (!afterStop) return beforeStop.color
  if (beforeStop === afterStop) return beforeStop.color

  // Interpolate between beforeStop and afterStop
  const range = afterStop.offset - beforeStop.offset
  const t = range === 0 ? 0 : (clampedOffset - beforeStop.offset) / range

  return interpolate(beforeStop.color, afterStop.color, t)
}

/**
 * Project a point onto a line segment
 *
 * Used for dragging gradient stops along the gradient line.
 *
 * @param point - Point to project
 * @param lineStart - Start of line segment
 * @param lineEnd - End of line segment
 * @returns Projected point and offset (0-1) along line
 */
export function projectPointOnLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { point: Point; offset: number } {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lengthSquared = dx ** 2 + dy ** 2

  // Handle degenerate case (line is a point)
  if (lengthSquared === 0) {
    return {
      point: { ...lineStart },
      offset: 0
    }
  }

  // Calculate projection parameter t (0 = start, 1 = end)
  const t =
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared

  // Clamp t to [0, 1] to stay on line segment
  const clampedT = Math.max(0, Math.min(1, t))

  // Calculate projected point
  const projectedPoint = {
    x: lineStart.x + clampedT * dx,
    y: lineStart.y + clampedT * dy
  }

  return {
    point: projectedPoint,
    offset: clampedT
  }
}

/**
 * Calculate distance between two points
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Euclidean distance
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx ** 2 + dy ** 2)
}

/**
 * Clamp a value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
