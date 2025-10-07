import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { Template, Page } from '../../schema/types'
import { applyLayoutForSize } from '../../layout/layoutEngine'
import { SlotRenderer } from '../svg/SlotRenderer'
import { SelectionOverlayV2 } from './SelectionOverlayV2'
import { CoordinateSystem } from '../core/CoordinateSystem'
import type { SmartSnapOptions } from '../utils/smartSnapping'
import { useEditorStore } from '../../state/editorStore'

export interface SvgStageV2Props {
  template: Template | null
  page?: Page
  width: number
  height: number
  ratioId?: string
  selectedSlots: string[]
  onSelectionChange: (slotNames: string[]) => void
  onSlotModified: (slotName: string, frame: { x?: number; y?: number; width?: number; height?: number; rotation?: number }) => void
  onDuplicateSlot?: (slotName: string) => void
  onToggleLockSlot?: (slotName: string) => void
  onRemoveSlot?: (slotName: string) => void
  snapToGrid?: boolean
  snapGridSize?: number
  smartSnapOptions?: SmartSnapOptions
  onRequestPageFocus?: (pageId: string) => void
}

/**
 * V2 SVG editing stage using CoordinateSystem and InteractionStateMachine
 * Feature-flagged parallel implementation behind VITE_USE_V2_CANVAS
 */
export const SvgStageV2 = React.forwardRef<SVGSVGElement, SvgStageV2Props>(({
  template,
  page,
  width,
  height,
  ratioId,
  selectedSlots,
  onSelectionChange,
  onSlotModified,
  onDuplicateSlot,
  onToggleLockSlot,
  onRemoveSlot,
  snapToGrid = false,
  snapGridSize = 10,
  smartSnapOptions,
  onRequestPageFocus
}, ref) => {
  const internalRef = useRef<SVGSVGElement>(null)
  const coordinateSystem = useRef(new CoordinateSystem())
  const [svgReady, setSvgReady] = useState(false)
  const [pendingAutoDrag, setPendingAutoDrag] = useState<{
    slotName: string
    clientX: number
    clientY: number
  } | null>(null)
  const dragCandidateRef = useRef<{ slotName: string; startX: number; startY: number } | null>(null)
  const pendingDragCleanupRef = useRef<(() => void) | null>(null)
  const suppressBackgroundClickRef = useRef(false)

  // Get editing state from store
  const editingSlot = useEditorStore(state => state.editingSlot)
  const startEditing = useEditorStore(state => state.startEditing)
  const setCanvasSelected = useEditorStore(state => state.setCanvasSelected)
  const hoveredSlot = useEditorStore(state => state.hoveredSlot)
  const setHoveredSlot = useEditorStore(state => state.setHoveredSlot)

  // Support both object refs and callback refs from parents
  useEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(internalRef.current)
      return () => ref(null)
    }

    (ref as React.MutableRefObject<SVGSVGElement | null>).current = internalRef.current
  }, [ref])

  // Initialize coordinate system when SVG is mounted
  useEffect(() => {
    if (internalRef.current) {
      coordinateSystem.current.setSvg(internalRef.current)
      setSvgReady(true)
    }
  }, [])

  // Invalidate coordinate system on zoom/pan/resize
  useEffect(() => {
    coordinateSystem.current.invalidate()
  }, [width, height])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingDragCleanupRef.current?.()
    }
  }, [])

  useEffect(() => {
    return () => {
      setHoveredSlot(null)
    }
  }, [setHoveredSlot])

  // Keyboard shortcuts for text editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab or Enter to start editing selected text slot
      if ((e.key === 'Tab' || e.key === 'Enter') && !editingSlot && selectedSlots.length === 1) {
        const selectedSlot = page?.slots.find(s => s.name === selectedSlots[0])
        if (selectedSlot && (selectedSlot.type === 'text' || selectedSlot.type === 'button') && !selectedSlot.locked) {
          e.preventDefault()
          const startEditingAction = useEditorStore.getState().startEditing
          startEditingAction(selectedSlots[0])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, editingSlot, page])

  // Passive wheel listeners with zoom interception
  // Uses passive by default for smooth scrolling, but switches to non-passive when Ctrl/Cmd is detected
  useEffect(() => {
    if (!internalRef.current) return

    const svgEl = internalRef.current

    // First, add a passive listener to detect Ctrl/Cmd key
    const passiveWheelHandler = (e: WheelEvent) => {
      // If Ctrl/Cmd is pressed, we need non-passive to preventDefault
      if (e.ctrlKey || e.metaKey) {
        // Remove passive listener and add non-passive
        svgEl.removeEventListener('wheel', passiveWheelHandler)
        svgEl.addEventListener('wheel', nonPassiveWheelHandler, { passive: false })

        // Call the non-passive handler for this event
        nonPassiveWheelHandler(e)
      }
    }

    // Non-passive listener for zoom interception
    const nonPassiveWheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Intercept zoom - prevent default browser behavior
        e.preventDefault()

        // Note: Actual zoom handling is done by CanvasStage's useGesture hook
        // This just prevents the browser's default zoom
      } else {
        // No longer zooming, switch back to passive
        svgEl.removeEventListener('wheel', nonPassiveWheelHandler)
        svgEl.addEventListener('wheel', passiveWheelHandler, { passive: true })
      }
    }

    // Start with passive listener
    svgEl.addEventListener('wheel', passiveWheelHandler, { passive: true })

    return () => {
      svgEl.removeEventListener('wheel', passiveWheelHandler)
      svgEl.removeEventListener('wheel', nonPassiveWheelHandler)
    }
  }, [svgReady])

  // Handle background click to deselect
  const handleBackgroundClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (suppressBackgroundClickRef.current) {
      suppressBackgroundClickRef.current = false
      return
    }

    if (e.target === e.currentTarget) {
      if (page?.id) {
        onRequestPageFocus?.(page.id)
      }
      setHoveredSlot(null)
      onSelectionChange([])
      setCanvasSelected(true)
    }
  }, [onSelectionChange, onRequestPageFocus, page?.id, setHoveredSlot, setCanvasSelected])

  // Handle slot click with drag threshold
  const handleSlotPointerDown = useCallback((slotName: string, event: React.MouseEvent<SVGGElement>) => {
    if (event.button !== 0) return

    const slot = page?.slots.find(s => s.name === slotName)
    const isTextSlot = slot && (slot.type === 'text' || slot.type === 'button')

    event.stopPropagation()

    // DON'T preventDefault for text slots - it blocks double-click events!
    if (!isTextSlot) {
      event.preventDefault()
    }

    // Suppress background click
    suppressBackgroundClickRef.current = true
    setHoveredSlot(null)
    setCanvasSelected(false)

    // Focus page if needed
    if (page?.id) {
      onRequestPageFocus?.(page.id)
    }

    // Update selection (with multi-select support via Shift)
    if (event.shiftKey && selectedSlots.length > 0) {
      // Multi-select: add to selection
      if (selectedSlots.includes(slotName)) {
        onSelectionChange(selectedSlots.filter(s => s !== slotName))
      } else {
        onSelectionChange([...selectedSlots, slotName])
      }
    } else {
      // Single select
      onSelectionChange([slotName])
    }

    // Set up drag candidate with threshold
    dragCandidateRef.current = {
      slotName,
      startX: event.clientX,
      startY: event.clientY
    }

    const handleMove = (e: MouseEvent) => {
      if (!dragCandidateRef.current) return

      const dx = e.clientX - dragCandidateRef.current.startX
      const dy = e.clientY - dragCandidateRef.current.startY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 3px threshold to distinguish click from drag
      if (distance > 3) {
        setPendingAutoDrag({
          slotName: dragCandidateRef.current.slotName,
          clientX: e.clientX,
          clientY: e.clientY
        })
        cleanup()
      }
    }

    const handleUp = () => {
      cleanup()
    }

    const cleanup = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      dragCandidateRef.current = null
      pendingDragCleanupRef.current = null
    }

    pendingDragCleanupRef.current = cleanup

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [selectedSlots, onSelectionChange, onRequestPageFocus, page, setHoveredSlot, setCanvasSelected])

  if (!template || !page) {
    return null
  }

  // Get viewBox from template
  const [vbX, vbY, vbWidth, vbHeight] = template.canvas.baseViewBox

  // Apply layout for current ratio
  const currentRatioId = ratioId || `${width}x${height}`
  const frames = page.frames[currentRatioId] || {}

  // Sort slots by z-index (lower z renders first, higher z on top)
  const sortedSlots = [...page.slots].sort((a, b) => (a.z || 0) - (b.z || 0))
  const hoverScale = internalRef.current?.getScreenCTM()?.a || 1
  const hoverStrokeWidth = 2 / hoverScale

  return (
    <svg
      ref={internalRef}
      data-canvas-svg="true"
      data-page-id={page.id}
      viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
      width={width}
      height={height}
      onClick={handleBackgroundClick}
      style={{
        width: '100%',
        height: '100%',
        userSelect: 'none',
        touchAction: 'none',
        overflow: 'visible',
        background: page.backgroundColor || '#ffffff'
      }}
      className="svg-stage-v2"
    >
      <defs>
        {/* Canvas clip path - hides slot content outside canvas bounds */}
        <clipPath id="canvas-clip-v2">
          <rect
            x={vbX}
            y={vbY}
            width={vbWidth}
            height={vbHeight}
          />
        </clipPath>

        {/* Arrow marker for connectors */}
        <marker
          id="arrow-end-v2"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#111827" />
        </marker>
      </defs>

      {/* Clipped content group */}
      <g clipPath="url(#canvas-clip-v2)">
        {sortedSlots.map(slot => {
          const frame = frames[slot.name]
          if (!frame) return null

          return (
            <SlotRenderer
              key={slot.name}
              slot={slot}
              frame={frame}
              template={template}
              isSelected={selectedSlots.includes(slot.name)}
              onPointerDown={(e) => handleSlotPointerDown(slot.name, e)}
            />
          )
        })}

        {hoveredSlot && !selectedSlots.includes(hoveredSlot) && frames[hoveredSlot] && (
          <rect
            x={frames[hoveredSlot].x}
            y={frames[hoveredSlot].y}
            width={frames[hoveredSlot].width}
            height={frames[hoveredSlot].height}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={hoverStrokeWidth}
            pointerEvents="none"
            opacity={0.9}
          />
        )}
      </g>

      {/* Selection overlay - rendered outside clipped area (hidden when editing) */}
      {svgReady && selectedSlots.length > 0 && !editingSlot && (
        <SelectionOverlayV2
          svgElement={internalRef.current!}
          coordinateSystem={coordinateSystem.current}
          selectedSlots={selectedSlots}
          frames={frames}
          slots={page.slots}
          onFrameChange={onSlotModified}
          onDuplicateSlot={onDuplicateSlot}
          onToggleLockSlot={onToggleLockSlot}
          onRemoveSlot={onRemoveSlot}
          snapToGrid={snapToGrid}
          snapGridSize={snapGridSize}
          smartSnapOptions={smartSnapOptions}
          viewBox={template.canvas.baseViewBox}
          pendingAutoDrag={pendingAutoDrag}
          onPendingAutoDragConsumed={() => setPendingAutoDrag(null)}
        />
      )}
    </svg>
  )
})

SvgStageV2.displayName = 'SvgStageV2'
