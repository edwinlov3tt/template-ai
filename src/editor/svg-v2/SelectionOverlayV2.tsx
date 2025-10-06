import React, { useState, useRef, useCallback } from 'react'
import type { Slot } from '../../schema/types'
import type { CoordinateSystem } from '../core/CoordinateSystem'
import { RotateCw } from 'lucide-react'
import { calculateSmartSnap, type SmartSnapOptions, type SnapGuide, type SnapState } from '../utils/smartSnapping'
import { SmartGuides } from '../svg/SmartGuides'
import { useEditorStore } from '../../state/editorStore'

export interface SelectionOverlayV2Props {
  svgElement: SVGSVGElement
  coordinateSystem: CoordinateSystem
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
 * V2 Selection overlay using CoordinateSystem and supporting multi-select
 */
export function SelectionOverlayV2({
  svgElement,
  coordinateSystem,
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
}: SelectionOverlayV2Props) {
  // Get startEditing action from store for double-click handling
  const startEditing = useEditorStore(state => state.startEditing)

  const [dragState, setDragState] = useState<{
    handle: DragHandle
    startX: number
    startY: number
    originalFrames: Record<string, { x: number; y: number; width: number; height: number }>
    lastMoveTime: number
    lastX: number
    lastY: number
    velocity: number
  } | null>(null)
  const [hoverHandle, setHoverHandle] = useState<DragHandle | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const [snapState, setSnapState] = useState<SnapState>({})

  // Get current zoom/scale from CTM to make handles viewport-relative
  const ctm = svgElement.getScreenCTM()
  const scale = ctm ? ctm.a : 1

  // Handle sizes in screen pixels (divided by scale for constant viewport size)
  const handleSize = 12 / scale
  const edgeHandleWidth = 20 / scale
  const edgeHandleHeight = 8 / scale
  const borderRadius = 8 / scale
  const borderWidth = 2 / scale
  const rotateHandleDistance = 40 / scale
  const rotateHandleRadius = 12 / scale

  // Calculate bounding box for multi-select or single slot
  const getBoundingBox = useCallback(() => {
    if (selectedSlots.length === 0) return null

    const activeFrames = selectedSlots
      .map(slotName => frames[slotName])
      .filter(Boolean)

    if (activeFrames.length === 0) return null

    // Calculate min/max bounds across all selected frames
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    activeFrames.forEach(frame => {
      minX = Math.min(minX, frame.x)
      minY = Math.min(minY, frame.y)
      maxX = Math.max(maxX, frame.x + frame.width)
      maxY = Math.max(maxY, frame.y + frame.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }, [selectedSlots, frames])

  // Convert screen mouse position to SVG viewBox coordinates using CoordinateSystem
  const screenToSVG = useCallback((screenX: number, screenY: number) => {
    return coordinateSystem.screenToUser({ x: screenX, y: screenY })
  }, [coordinateSystem])

  // Snap value to grid (only if enabled)
  const applySnap = useCallback((value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / snapGridSize) * snapGridSize
  }, [snapToGrid, snapGridSize])

  // Start dragging
  const beginDrag = useCallback((handle: DragHandle, clientX: number, clientY: number) => {
    const svgPos = screenToSVG(clientX, clientY)

    // Store original frames for all selected slots
    const originalFrames: Record<string, { x: number; y: number; width: number; height: number }> = {}
    selectedSlots.forEach(slotName => {
      const frame = frames[slotName]
      if (frame) {
        originalFrames[slotName] = { x: frame.x, y: frame.y, width: frame.width, height: frame.height }
      }
    })

    setDragState({
      handle,
      startX: svgPos.x,
      startY: svgPos.y,
      originalFrames,
      lastMoveTime: Date.now(),
      lastX: svgPos.x,
      lastY: svgPos.y,
      velocity: 0
    })
  }, [screenToSVG, selectedSlots, frames])

  const handleMouseDown = useCallback((handle: DragHandle, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // Double-click is now handled by native onDoubleClick on the main group
    // This handler only manages drag operations
    beginDrag(handle, e.clientX, e.clientY)
  }, [beginDrag])

  // Handle double-click to enter text editing mode
  const handleDoubleClick = useCallback(() => {
    // Check if there's exactly one selected slot and it's a text type
    if (selectedSlots.length === 1) {
      const slotName = selectedSlots[0]
      const slot = slots.find(s => s.name === slotName)

      if (slot && (slot.type === 'text' || slot.type === 'button') && !slot.locked) {
        startEditing(slotName)
      }
    }
  }, [selectedSlots, slots, startEditing])

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return

    const now = Date.now()
    const svgPos = screenToSVG(e.clientX, e.clientY)
    const dx = svgPos.x - dragState.startX
    const dy = svgPos.y - dragState.startY

    // Calculate velocity
    const timeDelta = Math.max(1, now - dragState.lastMoveTime)
    const distX = (svgPos.x - dragState.lastX) * scale
    const distY = (svgPos.y - dragState.lastY) * scale
    const distance = Math.sqrt(distX * distX + distY * distY)
    const instantVelocity = distance / timeDelta

    const smoothingFactor = 0.3
    const velocity = dragState.velocity * (1 - smoothingFactor) + instantVelocity * smoothingFactor

    setDragState({
      ...dragState,
      lastMoveTime: now,
      lastX: svgPos.x,
      lastY: svgPos.y,
      velocity
    })

    // Adjust snap threshold based on velocity
    const velocityFactor = Math.max(0, 1 - Math.min(1, velocity / 2))
    const adjustedSnapOptions = {
      ...smartSnapOptions,
      threshold: smartSnapOptions.threshold * velocityFactor
    }

    if (dragState.handle === 'move') {
      // Move all selected slots
      selectedSlots.forEach(slotName => {
        const originalFrame = dragState.originalFrames[slotName]
        if (!originalFrame) return

        let newX = originalFrame.x + dx
        let newY = originalFrame.y + dy

        // Apply grid snapping
        if (snapToGrid) {
          newX = applySnap(newX)
          newY = applySnap(newY)
        }

        // Apply smart snapping (only for primary slot)
        if (slotName === selectedSlots[0]) {
          const snapResult = calculateSmartSnap(
            { x: newX, y: newY, width: originalFrame.width, height: originalFrame.height },
            frames,
            viewBox,
            adjustedSnapOptions,
            'move',
            snapState,
            scale
          )

          setActiveGuides(snapResult.guides)

          // Update snap state
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

          newX = snapResult.x
          newY = snapResult.y
        }

        onFrameChange(slotName, { x: newX, y: newY })
      })
    } else if (dragState.handle === 'rotate') {
      // For single selection only
      if (selectedSlots.length === 1) {
        const slotName = selectedSlots[0]
        const originalFrame = dragState.originalFrames[slotName]
        if (!originalFrame) return

        const centerX = originalFrame.x + originalFrame.width / 2
        const centerY = originalFrame.y + originalFrame.height / 2
        const angle = Math.atan2(svgPos.y - centerY, svgPos.x - centerX) * (180 / Math.PI)

        setActiveGuides([])

        onFrameChange(slotName, {
          rotation: angle + 90
        })
      }
    } else {
      // Resize - only for single selection
      if (selectedSlots.length === 1) {
        const slotName = selectedSlots[0]
        const originalFrame = dragState.originalFrames[slotName]
        if (!originalFrame) return

        let newX = originalFrame.x
        let newY = originalFrame.y
        let newWidth = originalFrame.width
        let newHeight = originalFrame.height

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

        // Apply grid snapping
        if (snapToGrid) {
          newX = applySnap(newX)
          newY = applySnap(newY)
          newWidth = applySnap(newWidth)
          newHeight = applySnap(newHeight)
        }

        // Apply smart snapping
        const snapResult = calculateSmartSnap(
          { x: newX, y: newY, width: newWidth, height: newHeight },
          frames,
          viewBox,
          adjustedSnapOptions,
          dragState.handle as 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
          snapState,
          scale
        )

        setActiveGuides(snapResult.guides)

        // Prevent negative dimensions
        if ((snapResult.width || newWidth) > 10 && (snapResult.height || newHeight) > 10) {
          onFrameChange(slotName, {
            x: snapResult.x,
            y: snapResult.y,
            width: snapResult.width,
            height: snapResult.height
          })
        }
      }
    }
  }, [dragState, screenToSVG, selectedSlots, onFrameChange, snapToGrid, applySnap, frames, viewBox, smartSnapOptions, scale, snapState])

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setActiveGuides([])
    setSnapState({})
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

  // Handle pending auto-drag from slot click
  React.useEffect(() => {
    if (!pendingAutoDrag || dragState) return
    if (!selectedSlots.includes(pendingAutoDrag.slotName)) return

    beginDrag('move', pendingAutoDrag.clientX, pendingAutoDrag.clientY)
    onPendingAutoDragConsumed?.()
  }, [pendingAutoDrag, selectedSlots, beginDrag, onPendingAutoDragConsumed, dragState])

  // Don't render if no selection or all slots are locked
  const bbox = getBoundingBox()
  if (!bbox) return null

  const activeSlots = selectedSlots.map(name => slots.find(s => s.name === name)).filter(Boolean) as Slot[]
  const allLocked = activeSlots.every(s => (s as any).locked)
  if (allLocked) return null

  const { x, y, width, height } = bbox

  // Render corner handle
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

  // Render edge handle
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

  const isSingleSelection = selectedSlots.length === 1

  return (
    <g className="selection-overlay-v2" onDoubleClick={handleDoubleClick}>
      {/* Transparent drag area */}
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

      {/* Selection border */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={isSingleSelection ? '#0066FF' : '#FF6B00'}
        strokeWidth={borderWidth}
        strokeDasharray={isSingleSelection ? 'none' : `${4 / scale} ${4 / scale}`}
        rx={borderRadius}
        style={{ pointerEvents: 'none' }}
      />

      {/* Resize handles - only for single selection */}
      {isSingleSelection && (
        <>
          {/* Corner handles */}
          {renderCornerHandle(x, y, 'nw')}
          {renderCornerHandle(x + width, y, 'ne')}
          {renderCornerHandle(x + width, y + height, 'se')}
          {renderCornerHandle(x, y + height, 'sw')}

          {/* Edge handles */}
          {renderEdgeHandle(x + width / 2, y, 'n', 'n-resize', true)}
          {renderEdgeHandle(x + width, y + height / 2, 'e', 'e-resize', false)}
          {renderEdgeHandle(x + width / 2, y + height, 's', 's-resize', true)}
          {renderEdgeHandle(x, y + height / 2, 'w', 'w-resize', false)}

          {/* Rotation handle */}
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
        </>
      )}

      {/* Dimensions label */}
      {dragState && dragState.handle !== 'rotate' && (
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

      {/* Multi-select count badge */}
      {!isSingleSelection && (
        <g transform={`translate(${x + width}, ${y})`}>
          <circle
            cx="0"
            cy="0"
            r={10 / scale}
            fill="#FF6B00"
            stroke="white"
            strokeWidth={borderWidth}
          />
          <text
            x="0"
            y={3 / scale}
            fill="white"
            fontSize={10 / scale}
            fontFamily="Inter, sans-serif"
            fontWeight="700"
            textAnchor="middle"
          >
            {selectedSlots.length}
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
