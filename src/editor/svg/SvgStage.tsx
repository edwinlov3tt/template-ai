import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { Template, Page } from '../../schema/types'
import { applyLayoutForSize } from '../../layout/layoutEngine'
import { SlotRenderer } from './SlotRenderer'
import { NativeSelectionOverlay } from './NativeSelectionOverlay'
import type { SmartSnapOptions } from '../utils/smartSnapping'
import { useEditorStore } from '../../state/editorStore'

export interface SvgStageProps {
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
 * Main SVG editing stage
 * Renders template slots as native SVG elements with viewBox coordinate system
 */
export const SvgStage = React.forwardRef<SVGSVGElement, SvgStageProps>(({
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
  const [svgReady, setSvgReady] = useState(false)
  const [pendingAutoDrag, setPendingAutoDrag] = useState<{
    slotName: string
    clientX: number
    clientY: number
  } | null>(null)
  const dragCandidateRef = useRef<{ slotName: string; startX: number; startY: number } | null>(null)
  const pendingDragCleanupRef = useRef<(() => void) | null>(null)
  const suppressBackgroundClickRef = useRef(false)

  // Get editing state and actions from store
  const { editingSlot, startEditing } = useEditorStore()
  const hoveredSlot = useEditorStore(state => state.hoveredSlot)
  const setHoveredSlot = useEditorStore(state => state.setHoveredSlot)
  const setCanvasSelected = useEditorStore(state => state.setCanvasSelected)

  // Keyboard shortcuts for text editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab or Enter to start editing selected text slot
      if ((e.key === 'Tab' || e.key === 'Enter') && !editingSlot && selectedSlots.length === 1) {
        const allSlots = page ? page.slots : (template?.slots || [])
        const selectedSlot = allSlots.find(s => s.name === selectedSlots[0])
        if (selectedSlot && (selectedSlot.type === 'text' || selectedSlot.type === 'button') && !selectedSlot.locked) {
          e.preventDefault()
          startEditing(selectedSlots[0])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, editingSlot, page, template, startEditing])

  // Support both object refs and callback refs from parents
  useEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(internalRef.current)
      return () => ref(null)
    }

    (ref as React.MutableRefObject<SVGSVGElement | null>).current = internalRef.current
  }, [ref])

  // Force re-render when SVG ref is attached
  useEffect(() => {
    if (internalRef.current && !svgReady) {
      setSvgReady(true)
    }
  }, [svgReady])

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

  // All hooks must be called before any conditional returns
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

  const handleSlotPointerDown = useCallback((slotName: string, event: React.MouseEvent<SVGGElement>) => {
    if (event.button !== 0) return

    event.stopPropagation()
    event.preventDefault()

    pendingDragCleanupRef.current?.()
    suppressBackgroundClickRef.current = true
    setHoveredSlot(null)
    setCanvasSelected(false)

    if (page?.id) {
      onRequestPageFocus?.(page.id)
    }

    if (event.shiftKey) {
      if (selectedSlots.includes(slotName)) {
        const newSelection = selectedSlots.filter(s => s !== slotName)
        onSelectionChange(newSelection)
      } else {
        const newSelection = [...selectedSlots, slotName]
        onSelectionChange(newSelection)
      }
      return
    }

    if (!(selectedSlots.length === 1 && selectedSlots[0] === slotName)) {
      onSelectionChange([slotName])
    }

    const candidate = {
      slotName,
      startX: event.clientX,
      startY: event.clientY
    }

    dragCandidateRef.current = candidate

    const threshold = 3

    function cleanup() {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      pendingDragCleanupRef.current = null
      dragCandidateRef.current = null
    }

    function handleMove(moveEvent: MouseEvent) {
      if (!dragCandidateRef.current) return

      const dx = moveEvent.clientX - candidate.startX
      const dy = moveEvent.clientY - candidate.startY

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
        return
      }

      cleanup()
      setPendingAutoDrag({
        slotName: candidate.slotName,
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY
      })
    }

    function handleUp() {
      cleanup()
    }

    pendingDragCleanupRef.current = cleanup

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    // Allow the next distinct background click to clear selection
    // after the current click cycle finishes propagating.
    requestAnimationFrame(() => {
      suppressBackgroundClickRef.current = false
    })
  }, [selectedSlots, onSelectionChange, page?.id, onRequestPageFocus, setHoveredSlot])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedSlots.length > 0) {
          e.preventDefault()
          // TODO: Implement delete via store
        }
      }

      // Escape key to deselect
      if (e.key === 'Escape') {
        onSelectionChange([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, onSelectionChange])

  // Early return after all hooks
  if (!template) {
    return (
      <svg
        width={width}
        height={height}
        style={{ background: '#ffffff' }}
      />
    )
  }

  const viewBox = template.canvas.baseViewBox
  const currentRatio = ratioId || `${width}x${height}`

  // Get slots and frames from page if provided, otherwise fallback to template (legacy)
  const slots = page ? page.slots : (template.slots || [])
  const frames = page ? (page.frames[currentRatio] || {}) : applyLayoutForSize(template, width, height, currentRatio)

  // Sort slots by z-index (backgrounds first, overlays last)
  const sortedSlots = [...slots].sort((a, b) => a.z - b.z)

  const hoverScale = internalRef.current?.getScreenCTM()?.a || 1
  const hoverStrokeWidth = 2 / hoverScale
  const multiSelectionBounds = React.useMemo(() => {
    if (!selectedSlots || selectedSlots.length <= 1) return null
    const framesForSelection = selectedSlots
      .map(name => frames[name])
      .filter((f): f is { x: number; y: number; width: number; height: number } => !!f)
    if (framesForSelection.length === 0) return null

    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    framesForSelection.forEach(f => {
      minX = Math.min(minX, f.x)
      minY = Math.min(minY, f.y)
      maxX = Math.max(maxX, f.x + f.width)
      maxY = Math.max(maxY, f.y + f.height)
    })

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }, [selectedSlots, frames])

  return (
    <svg
      ref={internalRef}
      data-canvas-svg="true"
      data-page-id={page?.id}
      width={width}
      height={height}
      viewBox={`${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}`}
      style={{
        background: page?.backgroundColor || '#ffffff',
        userSelect: 'none',
        overflow: 'visible'
      }}
      onClick={handleBackgroundClick}
    >
      <defs>
        <marker
          id="arrow-end"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>

        {/* Canvas clip path - hides content outside canvas bounds */}
        <clipPath id="canvas-clip">
          <rect
            x={viewBox[0]}
            y={viewBox[1]}
            width={viewBox[2]}
            height={viewBox[3]}
          />
        </clipPath>

        {/* Preserve defs from imported SVG (gradients, clipPaths, masks, patterns) */}
        {template.defs && (
          <g dangerouslySetInnerHTML={{ __html: template.defs }} />
        )}
      </defs>

      {/* Clipped content group - all slots are clipped to canvas */}
      <g clipPath="url(#canvas-clip)">
        {/* Render all slots */}
        {sortedSlots.map(slot => {
          const frame = frames[slot.name]
          if (!frame) {
            return null
          }

          const isSelected = selectedSlots.includes(slot.name)

          return (
            <SlotRenderer
              key={slot.name}
              slot={slot}
              frame={frame}
              template={template}
              isSelected={isSelected}
              onPointerDown={(e: React.MouseEvent<SVGGElement>) => handleSlotPointerDown(slot.name, e)}
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

        {multiSelectionBounds && (
          <>
            <rect
              x={multiSelectionBounds.x}
              y={multiSelectionBounds.y}
              width={multiSelectionBounds.width}
              height={multiSelectionBounds.height}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={hoverStrokeWidth}
              pointerEvents="none"
            />
            <g
              transform={`translate(${multiSelectionBounds.x + multiSelectionBounds.width}, ${multiSelectionBounds.y})`}
              pointerEvents="none"
            >
              <circle
                cx="0"
                cy="0"
                r={10 / hoverScale}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={hoverStrokeWidth}
              />
              <text
                x="0"
                y={3 / hoverScale}
                fill="white"
                fontSize={10 / hoverScale}
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                {selectedSlots.length}
              </text>
            </g>
          </>
        )}
      </g>

      {/* Native SVG Selection Overlay - NOT clipped, always visible (hidden when editing) */}
      {selectedSlots.length > 0 && internalRef.current && !editingSlot && (
        <NativeSelectionOverlay
          svgElement={internalRef.current}
          selectedSlots={selectedSlots}
          frames={frames}
          slots={slots}
          onFrameChange={onSlotModified}
          onDuplicateSlot={onDuplicateSlot}
          onToggleLockSlot={onToggleLockSlot}
          onRemoveSlot={onRemoveSlot}
          snapToGrid={snapToGrid}
          snapGridSize={snapGridSize}
          smartSnapOptions={smartSnapOptions}
          viewBox={viewBox}
          pendingAutoDrag={pendingAutoDrag}
          onPendingAutoDragConsumed={() => setPendingAutoDrag(null)}
        />
      )}
    </svg>
  )
})
