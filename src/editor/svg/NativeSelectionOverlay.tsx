import React, { useState, useRef, useCallback } from 'react'
import type { Slot } from '../../schema/types'
import { RotateCw } from 'lucide-react'
import { calculateSmartSnap, type SmartSnapOptions, type SnapGuide, type SnapState } from '../utils/smartSnapping'
import { SmartGuides } from './SmartGuides'

export interface NativeSelectionOverlayProps {
  svgElement: SVGSVGElement
  selectedSlots: string[]
  frames: Record<string, { x: number; y: number; width: number; height: number; rotation?: number }>
  slots: Slot[]
  onFrameChange: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  snapToGrid?: boolean
  snapGridSize?: number
  smartSnapOptions?: SmartSnapOptions
  viewBox: [number, number, number, number]
  pendingAutoDrag?: { slotName: string; clientX: number; clientY: number } | null
  onPendingAutoDragConsumed?: () => void
}

type DragHandle = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

/**
 * Native SVG selection overlay with Templated.io-style handles
 * Renders handles as SVG elements in viewBox coordinate space
 */
export function NativeSelectionOverlay({
  svgElement,
  selectedSlots,
  frames,
  slots,
  onFrameChange,
  onDuplicateSlot,
  onToggleLockSlot,
  onRemoveSlot,
  snapToGrid = false,
  snapGridSize = 10,
  smartSnapOptions = {
    enabled: true,
    threshold: 10,
    snapToEdges: true,
    snapToCenter: true,
    snapToObjects: true,
    showDistances: false
  },
  viewBox,
  pendingAutoDrag,
  onPendingAutoDragConsumed
}: NativeSelectionOverlayProps) {
  // Only handle single selection for now
  const selectedSlot = selectedSlots[0]
  const frame = selectedSlot ? frames[selectedSlot] : null
  const slot = selectedSlot ? slots.find(s => s.name === selectedSlot) : null

  const [dragState, setDragState] = useState<{
    handle: DragHandle
    startX: number
    startY: number
    originalFrame: { x: number; y: number; width: number; height: number }
    lastMoveTime: number
    lastX: number
    lastY: number
    velocity: number
  } | null>(null)
  const [hoverHandle, setHoverHandle] = useState<DragHandle | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const [snapState, setSnapState] = useState<SnapState>({})

  const { x = 0, y = 0, width = 0, height = 0, rotation = 0 } = frame || {}

  // Get current zoom/scale from CTM to make handles viewport-relative
  const ctm = svgElement.getScreenCTM()
  const scale = ctm ? ctm.a : 1 // a is the x-scale

  // Handle sizes in screen pixels (divided by scale to convert to viewBox units)
  // This makes them viewport-relative - same visual size regardless of zoom
  const handleSize = 12 / scale
  const edgeHandleWidth = 20 / scale
  const edgeHandleHeight = 8 / scale
  const borderRadius = 8 / scale
  const borderWidth = 2 / scale
  const rotateHandleDistance = 40 / scale
  const rotateHandleRadius = 12 / scale

  // Convert screen mouse position to SVG viewBox coordinates
  const screenToSVG = useCallback((screenX: number, screenY: number) => {
    const ctm = svgElement.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }

    const point = svgElement.createSVGPoint()
    point.x = screenX
    point.y = screenY
    const svgPoint = point.matrixTransform(ctm.inverse())

    return { x: svgPoint.x, y: svgPoint.y }
  }, [svgElement])

  // Snap value to grid (only if enabled)
  const applySnap = useCallback((value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / snapGridSize) * snapGridSize
  }, [snapToGrid, snapGridSize])

  // Start dragging
  const beginDrag = useCallback((handle: DragHandle, clientX: number, clientY: number) => {
    const svgPos = screenToSVG(clientX, clientY)
    setDragState({
      handle,
      startX: svgPos.x,
      startY: svgPos.y,
      originalFrame: { x, y, width, height },
      lastMoveTime: Date.now(),
      lastX: svgPos.x,
      lastY: svgPos.y,
      velocity: 0
    })
  }, [screenToSVG, x, y, width, height])

  const handleMouseDown = useCallback((handle: DragHandle, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    beginDrag(handle, e.clientX, e.clientY)
  }, [beginDrag])

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return

    const now = Date.now()
    const svgPos = screenToSVG(e.clientX, e.clientY)
    const dx = svgPos.x - dragState.startX
    const dy = svgPos.y - dragState.startY

    // Calculate velocity (pixels per millisecond in screen space)
    const timeDelta = Math.max(1, now - dragState.lastMoveTime)
    const distX = (svgPos.x - dragState.lastX) * scale // Convert to screen pixels
    const distY = (svgPos.y - dragState.lastY) * scale
    const distance = Math.sqrt(distX * distX + distY * distY)
    const instantVelocity = distance / timeDelta // pixels per ms

    // Smooth velocity with exponential moving average (prevents jitter)
    const smoothingFactor = 0.3
    const velocity = dragState.velocity * (1 - smoothingFactor) + instantVelocity * smoothingFactor

    // Update drag state with new velocity
    setDragState({
      ...dragState,
      lastMoveTime: now,
      lastX: svgPos.x,
      lastY: svgPos.y,
      velocity
    })

    // Adjust snap threshold based on velocity
    // Slow (< 0.5 px/ms): full threshold
    // Medium (0.5-2 px/ms): reduced threshold
    // Fast (> 2 px/ms): nearly zero threshold (no snapping)
    const velocityFactor = Math.max(0, 1 - Math.min(1, velocity / 2))
    const adjustedSnapOptions = {
      ...smartSnapOptions,
      threshold: smartSnapOptions.threshold * velocityFactor
    }

    const { originalFrame } = dragState

    if (dragState.handle === 'move') {
      // Calculate new position
      let newX = originalFrame.x + dx
      let newY = originalFrame.y + dy

      // Apply grid snapping first (if enabled)
      if (snapToGrid) {
        newX = applySnap(newX)
        newY = applySnap(newY)
      }

      // Apply smart snapping with velocity-adjusted threshold
      const snapResult = calculateSmartSnap(
        { x: newX, y: newY, width: originalFrame.width, height: originalFrame.height },
        frames,
        viewBox,
        adjustedSnapOptions,
        'move',
        snapState,
        scale
      )

      // Update guides and snap state
      setActiveGuides(snapResult.guides)

      // Update snap state for hysteresis
      const newSnapState: SnapState = {}
      if (snapResult.guides.some(g => g.type === 'vertical')) {
        const vGuide = snapResult.guides.find(g => g.type === 'vertical')
        if (vGuide) {
          newSnapState.lastSnapX = {
            value: vGuide.position,
            line: { value: vGuide.position, type: 'edge' }
          }
        }
      }
      if (snapResult.guides.some(g => g.type === 'horizontal')) {
        const hGuide = snapResult.guides.find(g => g.type === 'horizontal')
        if (hGuide) {
          newSnapState.lastSnapY = {
            value: hGuide.position,
            line: { value: hGuide.position, type: 'edge' }
          }
        }
      }
      setSnapState(newSnapState)

      onFrameChange(selectedSlot, {
        x: snapResult.x,
        y: snapResult.y
      })
    } else if (dragState.handle.startsWith('n') || dragState.handle.startsWith('s') ||
               dragState.handle.startsWith('e') || dragState.handle.startsWith('w')) {
      // Resize
      let newX = originalFrame.x
      let newY = originalFrame.y
      let newWidth = originalFrame.width
      let newHeight = originalFrame.height

      // Handle contains direction (e.g., 'nw', 'se', 'n', 'e')
      if (dragState.handle.includes('w')) {
        newX = originalFrame.x + dx
        newWidth = originalFrame.width - dx
      }
      if (dragState.handle.includes('e')) {
        newWidth = originalFrame.width + dx
      }
      if (dragState.handle.includes('n')) {
        newY = originalFrame.y + dy
        newHeight = originalFrame.height - dy
      }
      if (dragState.handle.includes('s')) {
        newHeight = originalFrame.height + dy
      }

      // Apply grid snapping first (if enabled)
      if (snapToGrid) {
        newX = applySnap(newX)
        newY = applySnap(newY)
        newWidth = applySnap(newWidth)
        newHeight = applySnap(newHeight)
      }

      // Apply smart snapping with velocity-adjusted threshold
      const snapResult = calculateSmartSnap(
        { x: newX, y: newY, width: newWidth, height: newHeight },
        frames,
        viewBox,
        adjustedSnapOptions,
        dragState.handle as 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
        snapState,
        scale
      )

      // Update guides and snap state
      setActiveGuides(snapResult.guides)

      // Update snap state for hysteresis
      const newSnapState: SnapState = {}
      if (snapResult.guides.some(g => g.type === 'vertical')) {
        const vGuide = snapResult.guides.find(g => g.type === 'vertical')
        if (vGuide) {
          newSnapState.lastSnapX = {
            value: vGuide.position,
            line: { value: vGuide.position, type: 'edge' }
          }
        }
      }
      if (snapResult.guides.some(g => g.type === 'horizontal')) {
        const hGuide = snapResult.guides.find(g => g.type === 'horizontal')
        if (hGuide) {
          newSnapState.lastSnapY = {
            value: hGuide.position,
            line: { value: hGuide.position, type: 'edge' }
          }
        }
      }
      setSnapState(newSnapState)

      // Prevent negative dimensions
      if ((snapResult.width || newWidth) > 10 && (snapResult.height || newHeight) > 10) {
        onFrameChange(selectedSlot, {
          x: snapResult.x,
          y: snapResult.y,
          width: snapResult.width,
          height: snapResult.height
        })
      }
    } else if (dragState.handle === 'rotate') {
      // Rotation - no snapping
      const centerX = originalFrame.x + originalFrame.width / 2
      const centerY = originalFrame.y + originalFrame.height / 2
      const angle = Math.atan2(svgPos.y - centerY, svgPos.x - centerX) * (180 / Math.PI)

      setActiveGuides([]) // Clear guides during rotation

      onFrameChange(selectedSlot, {
        rotation: angle + 90 // Offset by 90° so 0° points up
      })
    }
  }, [dragState, screenToSVG, selectedSlot, onFrameChange, snapToGrid, applySnap, frames, viewBox, smartSnapOptions, scale, snapState])

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setActiveGuides([]) // Clear guides when done dragging
    setSnapState({}) // Clear snap state for next drag
  }, [])

  // Attach global mouse handlers while dragging
  React.useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  React.useEffect(() => {
    if (!pendingAutoDrag || dragState) return
    if (pendingAutoDrag.slotName !== selectedSlot) return

    beginDrag('move', pendingAutoDrag.clientX, pendingAutoDrag.clientY)
    onPendingAutoDragConsumed?.()
  }, [pendingAutoDrag, selectedSlot, beginDrag, onPendingAutoDragConsumed, dragState])

  // Early return after all hooks are declared
  console.log('[NativeSelectionOverlay] Render check:', {
    selectedSlot,
    hasFrame: !!frame,
    hasSlot: !!slot,
    locked: (slot as any)?.locked || false,
    willRender: !!(selectedSlot && frame && slot && !(slot as any).locked)
  })

  if (!selectedSlot || !frame || !slot || (slot as any).locked) return null

  // Render corner handle (viewport-relative with hover effect)
  const renderCornerHandle = (hx: number, hy: number, handle: DragHandle) => (
    <circle
      key={handle}
      cx={hx}
      cy={hy}
      r={handleSize / 2}
      fill={hoverHandle === handle ? '#0066FF' : 'white'}
      stroke="#0066FF"
      strokeWidth={borderWidth}
      style={{ cursor: `${handle}-resize`, transition: 'fill 0.15s' }}
      onMouseDown={(e) => handleMouseDown(handle, e)}
      onMouseEnter={() => setHoverHandle(handle)}
      onMouseLeave={() => setHoverHandle(null)}
    />
  )

  // Render edge handle (flattened tabs, viewport-relative with hover effect)
  const renderEdgeHandle = (hx: number, hy: number, handle: DragHandle, cursor: string, isHorizontal: boolean) => (
    <rect
      key={handle}
      x={hx - (isHorizontal ? edgeHandleWidth : edgeHandleHeight) / 2}
      y={hy - (isHorizontal ? edgeHandleHeight : edgeHandleWidth) / 2}
      width={isHorizontal ? edgeHandleWidth : edgeHandleHeight}
      height={isHorizontal ? edgeHandleHeight : edgeHandleWidth}
      fill={hoverHandle === handle ? '#0066FF' : 'white'}
      stroke="#0066FF"
      strokeWidth={borderWidth}
      rx={2 / scale}
      style={{ cursor, transition: 'fill 0.15s' }}
      onMouseDown={(e) => handleMouseDown(handle, e)}
      onMouseEnter={() => setHoverHandle(handle)}
      onMouseLeave={() => setHoverHandle(null)}
    />
  )

  return (
    <g className="selection-overlay">
      {/* Transparent drag area (fills entire bounds) */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        pointerEvents="all"
        style={{ cursor: 'move' }}
        onMouseDown={(e) => handleMouseDown('move', e)}
      />

      {/* Selection border (visual only) - rounded corners, viewport-relative thickness */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#0066FF"
        strokeWidth={borderWidth}
        rx={borderRadius}
        style={{ pointerEvents: 'none' }}
      />

      {/* Corner handles - circular */}
      {renderCornerHandle(x, y, 'nw')}
      {renderCornerHandle(x + width, y, 'ne')}
      {renderCornerHandle(x + width, y + height, 'se')}
      {renderCornerHandle(x, y + height, 'sw')}

      {/* Edge handles - flattened tabs */}
      {renderEdgeHandle(x + width / 2, y, 'n', 'n-resize', true)}
      {renderEdgeHandle(x + width, y + height / 2, 'e', 'e-resize', false)}
      {renderEdgeHandle(x + width / 2, y + height, 's', 's-resize', true)}
      {renderEdgeHandle(x, y + height / 2, 'w', 'w-resize', false)}

      {/* Rotation handle - viewport-relative */}
      <g transform={`translate(${x + width / 2}, ${y + height + rotateHandleDistance})`}>
        <circle
          cx="0"
          cy="0"
          r={rotateHandleRadius}
          fill={hoverHandle === 'rotate' ? '#0066FF' : 'white'}
          stroke="#0066FF"
          strokeWidth={borderWidth}
          style={{ cursor: 'grab', transition: 'fill 0.15s' }}
          onMouseDown={(e) => handleMouseDown('rotate', e)}
          onMouseEnter={() => setHoverHandle('rotate')}
          onMouseLeave={() => setHoverHandle(null)}
        />
        {/* Rotation icon - lucide-react icon */}
        <g transform={`scale(${1 / scale})`} style={{ pointerEvents: 'none' }}>
          <foreignObject
            x={-8}
            y={-8}
            width={16}
            height={16}
          >
            <RotateCw
              size={16}
              color={hoverHandle === 'rotate' ? 'white' : '#0066FF'}
              style={{ transition: 'color 0.15s' }}
            />
          </foreignObject>
        </g>
      </g>

      {/* Custom rotation cursor style */}
      <style>{`
        g[transform*="translate(${x + width / 2}, ${y + height + rotateHandleDistance})"] circle {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="none" stroke="%23000000" stroke-width="2.5" d="M16,8 A8,8 0 1,1 8,16"/><path fill="%23000000" d="M16,8 L14,6 L14,10 Z M8,16 L6,14 L10,14 Z"/></svg>') 16 16, grab;
        }
      `}</style>

      {/* Dimensions - only show when resizing or moving */}
      {dragState && (dragState.handle !== 'rotate') && (
        <g transform={`translate(${x + width / 2}, ${y + height + 30 / scale})`}>
          <rect
            x={-40 / scale}
            y={-11 / scale}
            width={80 / scale}
            height={22 / scale}
            fill="#1f2937"
            rx={4 / scale}
          />
          <text
            x="0"
            y={3 / scale}
            fill="white"
            fontSize={12 / scale}
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            textAnchor="middle"
          >
            {Math.round(width)} × {Math.round(height)}
          </text>
        </g>
      )}

      {/* Smart alignment guides */}
      <SmartGuides
        svgElement={svgElement}
        guides={activeGuides}
        viewBox={viewBox}
      />
    </g>
  )
}
