import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Slot } from '../../schema/types'
import type { CoordinateSystem } from '../core/CoordinateSystem'
import { RotateCw, Group, Ungroup, Lock, Unlock, Copy, Trash2 } from 'lucide-react'
import { calculateSmartSnap, type SmartSnapOptions, type SnapGuide, type SnapState, type Frame } from '../utils/smartSnapping'
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
  snapGridSize = 4,
  smartSnapOptions = {
    enabled: true,
    threshold: 4,
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

  const snapFrames = React.useMemo(() => {
    const filtered: Record<string, Frame> = {}
    Object.entries(frames).forEach(([name, frame]) => {
      if (!selectedSlots.includes(name)) {
        filtered[name] = frame
      }
    })
    return filtered
  }, [frames, selectedSlots])

  const [dragState, setDragState] = useState<{
    handle: DragHandle
    startX: number
    startY: number
    originalFrames: Record<string, { x: number; y: number; width: number; height: number }>
    originalFontSizes?: Record<string, number>
    originalBBox?: { x: number; y: number; width: number; height: number } | null
    lastMoveTime: number
    lastX: number
    lastY: number
    velocity: number
  } | null>(null)
  const [hoverHandle, setHoverHandle] = useState<DragHandle | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const [snapState, setSnapState] = useState<SnapState>({})
  const lastFontSizesRef = useRef<Record<string, number>>({})
  const [shiftPressed, setShiftPressed] = useState(false)

  const activeSlots = useMemo(() => {
    return selectedSlots
      .map(name => slots.find(s => s.name === name))
      .filter((slot): slot is Slot => Boolean(slot))
  }, [selectedSlots, slots])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setShiftPressed(true)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setShiftPressed(false)
      }
    }

    const handleBlur = () => {
      setShiftPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Get current zoom/scale from CTM to make handles viewport-relative
  const ctm = svgElement.getScreenCTM()
  const scale = ctm ? ctm.a : 1

  // Handle sizes in screen pixels (divided by scale for constant viewport size)
  const handleSize = 12 / scale
  const edgeHandleWidth = 20 / scale
  const edgeHandleHeight = 8 / scale
  const borderRadius = selectedSlots.length === 1 ? 8 / scale : 0
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
    const originalFontSizes: Record<string, number> = {}
    selectedSlots.forEach(slotName => {
      const frame = frames[slotName]
      if (frame) {
        originalFrames[slotName] = { x: frame.x, y: frame.y, width: frame.width, height: frame.height }
      }
      const slot = slots.find(s => s.name === slotName)
      if (slot && (slot.type === 'text' || slot.type === 'button')) {
        originalFontSizes[slotName] = slot.fontSize || 16
      }
    })

    lastFontSizesRef.current = { ...originalFontSizes }

    let originalBBox: { x: number; y: number; width: number; height: number } | null = null
    const originalFrameValues = Object.values(originalFrames)
    if (originalFrameValues.length > 0) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      originalFrameValues.forEach(frame => {
        minX = Math.min(minX, frame.x)
        minY = Math.min(minY, frame.y)
        maxX = Math.max(maxX, frame.x + frame.width)
        maxY = Math.max(maxY, frame.y + frame.height)
      })

      originalBBox = {
        x: minX,
        y: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY)
      }
    }

    setDragState({
      handle,
      startX: svgPos.x,
      startY: svgPos.y,
      originalFrames,
      originalFontSizes,
      originalBBox,
      lastMoveTime: Date.now(),
      lastX: svgPos.x,
      lastY: svgPos.y,
      velocity: 0
    })
  }, [screenToSVG, selectedSlots, frames, slots])

  const handleMouseDown = useCallback((handle: DragHandle, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // Double-click is now handled by native onDoubleClick on the main group
    // This handler only manages drag operations
    beginDrag(handle, e.clientX, e.clientY)
  }, [beginDrag])

  // Handle double-click to enter text editing mode
  const handleDoubleClick = useCallback(() => {
    if (selectedSlots.length !== 1) return

    const slotName = selectedSlots[0]
    const slot = slots.find(s => s.name === slotName)
    if (!slot || slot.locked) return

    if (slot.type === 'text' || slot.type === 'button') {
      startEditing(slotName)
    }
  }, [selectedSlots, slots, startEditing])

  // Group operations handlers
  const handleGroupToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    useEditorStore.getState().groupSlots(selectedSlots)
  }, [selectedSlots])

  const handleLockToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    useEditorStore.getState().lockSlots(selectedSlots)
  }, [selectedSlots])

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    useEditorStore.getState().duplicateSlots(selectedSlots)
  }, [selectedSlots])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    useEditorStore.getState().deleteSlots(selectedSlots)
  }, [selectedSlots])

  // Check if slots are grouped or locked
  const isGrouped = useMemo(() => {
    if (activeSlots.length <= 1) return false
    const firstSlot = activeSlots[0]
    return firstSlot?.groupId && activeSlots.every(s => s.groupId === firstSlot.groupId)
  }, [activeSlots])

  const isLocked = useMemo(() => {
    return activeSlots.some(s => s.locked)
  }, [activeSlots])

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
    const speedAdjustedOptions = {
      ...smartSnapOptions,
      threshold: smartSnapOptions.threshold * velocityFactor
    }
    const disableSmartSnap = !smartSnapOptions.enabled || e.metaKey || e.ctrlKey

    if (dragState.handle === 'move') {
      // Move all selected slots
      let snappedOffsetX: number | null = null
      let snappedOffsetY: number | null = null

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

        if (disableSmartSnap) {
          if (slotName === selectedSlots[0]) {
            setActiveGuides([])
            setSnapState({})
            snappedOffsetX = newX - originalFrame.x
            snappedOffsetY = newY - originalFrame.y
          } else if (snappedOffsetX !== null && snappedOffsetY !== null) {
            newX = originalFrame.x + snappedOffsetX
            newY = originalFrame.y + snappedOffsetY
          }
        } else if (slotName === selectedSlots[0]) {
          const snapResult = calculateSmartSnap(
            { x: newX, y: newY, width: originalFrame.width, height: originalFrame.height },
            snapFrames,
            viewBox,
            speedAdjustedOptions,
            'move',
            snapState,
            scale
          )

          setActiveGuides(snapResult.guides)

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
          snappedOffsetX = newX - originalFrame.x
          snappedOffsetY = newY - originalFrame.y
        } else if (snappedOffsetX !== null && snappedOffsetY !== null) {
          newX = originalFrame.x + snappedOffsetX
          newY = originalFrame.y + snappedOffsetY
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
      // Resize
      const isCornerHandle = ['nw', 'ne', 'sw', 'se'].includes(dragState.handle)

      if (selectedSlots.length === 1) {
        // Single selection resize
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

        if (disableSmartSnap) {
          setActiveGuides([])
          setSnapState({})

          if (newWidth > 10 && newHeight > 10) {
            onFrameChange(slotName, {
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            })
          }
        } else {
          const snapResult = calculateSmartSnap(
            { x: newX, y: newY, width: newWidth, height: newHeight },
            snapFrames,
            viewBox,
            speedAdjustedOptions,
            dragState.handle as 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
            snapState,
            scale
          )

          setActiveGuides(snapResult.guides)

          if ((snapResult.width || newWidth) > 10 && (snapResult.height || newHeight) > 10) {
            onFrameChange(slotName, {
              x: snapResult.x,
              y: snapResult.y,
              width: snapResult.width,
              height: snapResult.height
            })
          }
        }
      } else if (selectedSlots.length > 1 && isCornerHandle) {
        // Multi-selection resize - only on corner handles
        // Calculate original bounding box
        const originalBBox = dragState.originalBBox
        if (!originalBBox || originalBBox.width === 0 || originalBBox.height === 0) return

        let newBBoxX = originalBBox.x
        let newBBoxY = originalBBox.y
        let newBBoxWidth = originalBBox.width
        let newBBoxHeight = originalBBox.height

        // Calculate new bounding box dimensions based on drag
        if (dragState.handle.includes('w')) {
          newBBoxX = originalBBox.x + dx
          newBBoxWidth = originalBBox.width - dx
        }
        if (dragState.handle.includes('e')) {
          newBBoxWidth = originalBBox.width + dx
        }
        if (dragState.handle.includes('n')) {
          newBBoxY = originalBBox.y + dy
          newBBoxHeight = originalBBox.height - dy
        }
        if (dragState.handle.includes('s')) {
          newBBoxHeight = originalBBox.height + dy
        }

        // Prevent negative or tiny dimensions
        if (newBBoxWidth < 10 || newBBoxHeight < 10) return

        // Calculate scale factors
        const scaleX = newBBoxWidth / originalBBox.width
        const scaleY = newBBoxHeight / originalBBox.height

        // Apply transformations to all selected slots
        selectedSlots.forEach(slotName => {
          const originalFrame = dragState.originalFrames[slotName]
          if (!originalFrame) return

          // Calculate relative position within original bounding box
          const relX = (originalFrame.x - originalBBox.x) / originalBBox.width
          const relY = (originalFrame.y - originalBBox.y) / originalBBox.height
          const relWidth = originalFrame.width / originalBBox.width
          const relHeight = originalFrame.height / originalBBox.height

          // Calculate new position and size
          let scaledX = newBBoxX + relX * newBBoxWidth
          let scaledY = newBBoxY + relY * newBBoxHeight
          let scaledWidth = relWidth * newBBoxWidth
          let scaledHeight = relHeight * newBBoxHeight

          // Apply grid snapping if enabled
          if (snapToGrid) {
            scaledX = applySnap(scaledX)
            scaledY = applySnap(scaledY)
            scaledWidth = applySnap(scaledWidth)
            scaledHeight = applySnap(scaledHeight)
          }

          // Update frame
          onFrameChange(slotName, {
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight
          })

          // Scale font size for text/button slots
          const slot = slots.find(s => s.name === slotName)
          if (slot && (slot.type === 'text' || slot.type === 'button')) {
            const originalFontSize = dragState.originalFontSizes?.[slotName]
            if (originalFontSize) {
              const lastFontSize = lastFontSizesRef.current[slotName]
              const newFontSize = Math.max(6, Math.round(originalFontSize * scaleY))

              // Only update if font size changed (avoid unnecessary updates)
              if (lastFontSize !== newFontSize) {
                useEditorStore.getState().updateSlot(slotName, { fontSize: newFontSize })
                lastFontSizesRef.current[slotName] = newFontSize
              }
            }
          }
        })

        // Clear guides for multi-selection (snapping disabled for groups)
        setActiveGuides([])
      }
    }
  }, [dragState, screenToSVG, selectedSlots, onFrameChange, snapToGrid, applySnap, snapFrames, viewBox, smartSnapOptions, scale, snapState, slots])

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setActiveGuides([])
    setSnapState({})
    lastFontSizesRef.current = {}
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
    <g
      className="selection-overlay-v2"
      onDoubleClick={handleDoubleClick}
      style={shiftPressed ? { pointerEvents: 'none' } : undefined}
    >
      {/* Transparent drag area */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        pointerEvents={shiftPressed ? 'none' : 'all'}
        style={{ cursor: shiftPressed ? 'default' : 'move' }}
        onMouseDown={(e) => handleMouseDown('move', e)}
      />

      {/* Selection border */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#0066FF"
        strokeWidth={borderWidth}
        strokeDasharray={isSingleSelection ? 'none' : `${4 / scale} ${4 / scale}`}
        rx={borderRadius}
        style={{ pointerEvents: 'none' }}
      />

      {!isSingleSelection && selectedSlots.map(name => {
        const frame = frames[name]
        if (!frame) return null
        return (
          <rect
            key={`group-slot-${name}`}
            x={frame.x}
            y={frame.y}
            width={frame.width}
            height={frame.height}
            fill="none"
            stroke="#0066FF"
            strokeWidth={borderWidth}
            pointerEvents="none"
          />
        )
      })}

      {/* Corner handles - always shown */}
      {renderCornerHandle(x, y, 'nw')}
      {renderCornerHandle(x + width, y, 'ne')}
      {renderCornerHandle(x + width, y + height, 'se')}
      {renderCornerHandle(x, y + height, 'sw')}

      {/* Edge handles and rotation - only for single selection */}
      {isSingleSelection && (
        <>
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
            fill="#0066FF"
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

      {/* Group operations toolbar - only for multi-selection */}
      {!isSingleSelection && (
        <g transform={`translate(${x + width / 2}, ${y - 40 / scale})`}>
          {/* Toolbar background */}
          <rect
            x={-90 / scale}
            y={-16 / scale}
            width={180 / scale}
            height={32 / scale}
            fill="#1f2937"
            rx={6 / scale}
            stroke="white"
            strokeWidth={1 / scale}
          />

          {/* Group/Ungroup button */}
          <g transform={`translate(${-60 / scale}, 0)`}>
            <rect
              x={-10 / scale}
              y={-10 / scale}
              width={20 / scale}
              height={20 / scale}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseDown={handleGroupToggle}
            />
            <g transform={`scale(${1 / scale})`} style={{ pointerEvents: 'none' }}>
              <foreignObject x={-8} y={-8} width={16} height={16}>
                {isGrouped ? (
                  <Ungroup size={16} color="white" />
                ) : (
                  <Group size={16} color="white" />
                )}
              </foreignObject>
            </g>
          </g>

          {/* Lock/Unlock button */}
          <g transform={`translate(${-20 / scale}, 0)`}>
            <rect
              x={-10 / scale}
              y={-10 / scale}
              width={20 / scale}
              height={20 / scale}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseDown={handleLockToggle}
            />
            <g transform={`scale(${1 / scale})`} style={{ pointerEvents: 'none' }}>
              <foreignObject x={-8} y={-8} width={16} height={16}>
                {isLocked ? (
                  <Unlock size={16} color="white" />
                ) : (
                  <Lock size={16} color="white" />
                )}
              </foreignObject>
            </g>
          </g>

          {/* Duplicate button */}
          <g transform={`translate(${20 / scale}, 0)`}>
            <rect
              x={-10 / scale}
              y={-10 / scale}
              width={20 / scale}
              height={20 / scale}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseDown={handleDuplicate}
            />
            <g transform={`scale(${1 / scale})`} style={{ pointerEvents: 'none' }}>
              <foreignObject x={-8} y={-8} width={16} height={16}>
                <Copy size={16} color="white" />
              </foreignObject>
            </g>
          </g>

          {/* Delete button */}
          <g transform={`translate(${60 / scale}, 0)`}>
            <rect
              x={-10 / scale}
              y={-10 / scale}
              width={20 / scale}
              height={20 / scale}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseDown={handleDelete}
            />
            <g transform={`scale(${1 / scale})`} style={{ pointerEvents: 'none' }}>
              <foreignObject x={-8} y={-8} width={16} height={16}>
                <Trash2 size={16} color="#ef4444" />
              </foreignObject>
            </g>
          </g>
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
