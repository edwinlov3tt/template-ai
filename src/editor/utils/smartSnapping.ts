/**
 * Smart snapping utilities for Canva-style alignment guides
 * Detects edge snapping, center alignment, and object-to-object snapping
 */

export interface Frame {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal'
  position: number
  label?: string
  color?: string
}

export interface SnapResult {
  x: number
  y: number
  width?: number
  height?: number
  guides: SnapGuide[]
}

export interface SnapTarget {
  value: number
  type: 'edge' | 'center' | 'object'
  label?: string
}

export interface SmartSnapOptions {
  enabled: boolean
  threshold: number // in screen pixels (not viewBox units)
  snapToEdges: boolean
  snapToCenter: boolean
  snapToObjects: boolean
  showDistances: boolean
}

export interface SnapState {
  lastSnapX?: { value: number; line: SnapTarget }
  lastSnapY?: { value: number; line: SnapTarget }
}

/**
 * Calculate smart snapping for a frame being moved or resized
 * Uses screen-space tolerance and hysteresis for smooth snapping
 */
export function calculateSmartSnap(
  frame: Frame,
  otherFrames: Record<string, Frame>,
  canvasViewBox: [number, number, number, number],
  options: SmartSnapOptions,
  handle?: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
  snapState?: SnapState,
  scale: number = 1 // SVG scale for screen-space conversion
): SnapResult {
  if (!options.enabled) {
    return { x: frame.x, y: frame.y, width: frame.width, height: frame.height, guides: [] }
  }

  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = canvasViewBox
  const guides: SnapGuide[] = []

  // Convert threshold from screen pixels to world units
  const worldThreshold = options.threshold / scale
  const hysteresisThreshold = worldThreshold * 1.5 // Keep snapped until 1.5x away

  // Calculate element edges and center
  const elementLeft = frame.x
  const elementRight = frame.x + frame.width
  const elementTop = frame.y
  const elementBottom = frame.y + frame.height
  const elementCenterX = frame.x + frame.width / 2
  const elementCenterY = frame.y + frame.height / 2

  // Build snap targets for X axis
  const xTargets: SnapTarget[] = []
  const yTargets: SnapTarget[] = []

  // Canvas edge targets
  if (options.snapToEdges) {
    xTargets.push({ value: viewBoxX, type: 'edge', label: 'Left edge' })
    xTargets.push({ value: viewBoxX + viewBoxWidth, type: 'edge', label: 'Right edge' })
    yTargets.push({ value: viewBoxY, type: 'edge', label: 'Top edge' })
    yTargets.push({ value: viewBoxY + viewBoxHeight, type: 'edge', label: 'Bottom edge' })
  }

  // Canvas center targets
  if (options.snapToCenter) {
    const canvasCenterX = viewBoxX + viewBoxWidth / 2
    const canvasCenterY = viewBoxY + viewBoxHeight / 2
    xTargets.push({ value: canvasCenterX, type: 'center', label: 'Center' })
    yTargets.push({ value: canvasCenterY, type: 'center', label: 'Center' })
  }

  // Object-to-object targets
  if (options.snapToObjects) {
    for (const otherFrame of Object.values(otherFrames)) {
      // Don't snap to self
      if (otherFrame.x === frame.x && otherFrame.y === frame.y &&
          otherFrame.width === frame.width && otherFrame.height === frame.height) {
        continue
      }

      const otherLeft = otherFrame.x
      const otherRight = otherFrame.x + otherFrame.width
      const otherTop = otherFrame.y
      const otherBottom = otherFrame.y + otherFrame.height
      const otherCenterX = otherFrame.x + otherFrame.width / 2
      const otherCenterY = otherFrame.y + otherFrame.height / 2

      // Add edge and center targets
      xTargets.push({ value: otherLeft, type: 'object' })
      xTargets.push({ value: otherRight, type: 'object' })
      xTargets.push({ value: otherCenterX, type: 'object' })
      yTargets.push({ value: otherTop, type: 'object' })
      yTargets.push({ value: otherBottom, type: 'object' })
      yTargets.push({ value: otherCenterY, type: 'object' })
    }
  }

  // Find snaps based on handle type
  let snappedX = frame.x
  let snappedY = frame.y
  let snappedWidth = frame.width
  let snappedHeight = frame.height

  if (handle === 'move') {
    // Moving: snap left, right, center, top, bottom, center
    const leftSnap = findClosestSnap(elementLeft, xTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapX)
    const rightSnap = findClosestSnap(elementRight, xTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapX)
    const centerXSnap = findClosestSnap(elementCenterX, xTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapX)
    const topSnap = findClosestSnap(elementTop, yTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapY)
    const bottomSnap = findClosestSnap(elementBottom, yTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapY)
    const centerYSnap = findClosestSnap(elementCenterY, yTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapY)

    // Prefer center snaps, then edge snaps
    if (centerXSnap.snapped) {
      snappedX = centerXSnap.value - frame.width / 2
      guides.push({
        type: 'vertical',
        position: centerXSnap.value,
        label: centerXSnap.target?.label,
        color: centerXSnap.target?.type === 'center' ? '#ef4444' : '#3b82f6'
      })
    } else if (leftSnap.snapped) {
      snappedX = leftSnap.value
      guides.push({
        type: 'vertical',
        position: leftSnap.value,
        color: '#3b82f6'
      })
    } else if (rightSnap.snapped) {
      snappedX = rightSnap.value - frame.width
      guides.push({
        type: 'vertical',
        position: rightSnap.value,
        color: '#3b82f6'
      })
    }

    if (centerYSnap.snapped) {
      snappedY = centerYSnap.value - frame.height / 2
      guides.push({
        type: 'horizontal',
        position: centerYSnap.value,
        label: centerYSnap.target?.label,
        color: centerYSnap.target?.type === 'center' ? '#ef4444' : '#3b82f6'
      })
    } else if (topSnap.snapped) {
      snappedY = topSnap.value
      guides.push({
        type: 'horizontal',
        position: topSnap.value,
        color: '#3b82f6'
      })
    } else if (bottomSnap.snapped) {
      snappedY = bottomSnap.value - frame.height
      guides.push({
        type: 'horizontal',
        position: bottomSnap.value,
        color: '#3b82f6'
      })
    }
  } else if (handle?.includes('e') || handle?.includes('w')) {
    // Resizing horizontally
    if (handle.includes('w')) {
      const leftSnap = findClosestSnap(elementLeft, xTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapX)
      if (leftSnap.snapped) {
        const deltaX = leftSnap.value - elementLeft
        snappedX = leftSnap.value
        snappedWidth = frame.width - deltaX
        guides.push({ type: 'vertical', position: leftSnap.value, color: '#3b82f6' })
      }
    }
    if (handle.includes('e')) {
      const rightSnap = findClosestSnap(elementRight, xTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapX)
      if (rightSnap.snapped) {
        snappedWidth = rightSnap.value - frame.x
        guides.push({ type: 'vertical', position: rightSnap.value, color: '#3b82f6' })
      }
    }
  }

  if (handle?.includes('n') || handle?.includes('s')) {
    // Resizing vertically
    if (handle.includes('n')) {
      const topSnap = findClosestSnap(elementTop, yTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapY)
      if (topSnap.snapped) {
        const deltaY = topSnap.value - elementTop
        snappedY = topSnap.value
        snappedHeight = frame.height - deltaY
        guides.push({ type: 'horizontal', position: topSnap.value, color: '#3b82f6' })
      }
    }
    if (handle.includes('s')) {
      const bottomSnap = findClosestSnap(elementBottom, yTargets, worldThreshold, hysteresisThreshold, snapState?.lastSnapY)
      if (bottomSnap.snapped) {
        snappedHeight = bottomSnap.value - frame.y
        guides.push({ type: 'horizontal', position: bottomSnap.value, color: '#3b82f6' })
      }
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    width: snappedWidth,
    height: snappedHeight,
    guides
  }
}

/**
 * Find closest snap target within threshold, with hysteresis support
 */
function findClosestSnap(
  value: number,
  targets: SnapTarget[],
  threshold: number,
  hysteresisThreshold: number,
  lastSnap?: { value: number; line: SnapTarget }
): { snapped: boolean; value: number; target?: SnapTarget } {
  // Check hysteresis first - if we were snapped last frame, keep snapping
  // unless we've moved more than hysteresisThreshold away
  if (lastSnap) {
    const distanceFromLast = Math.abs(value - lastSnap.value)
    if (distanceFromLast <= hysteresisThreshold) {
      // Still close to last snap point, keep it
      return { snapped: true, value: lastSnap.value, target: lastSnap.line }
    }
  }

  // Find new snap target
  let closestTarget: SnapTarget | undefined
  let closestDistance = threshold + 1

  for (const target of targets) {
    const distance = Math.abs(value - target.value)
    if (distance < closestDistance && distance <= threshold) {
      closestDistance = distance
      closestTarget = target
    }
  }

  if (closestTarget) {
    return { snapped: true, value: closestTarget.value, target: closestTarget }
  }

  return { snapped: false, value }
}
