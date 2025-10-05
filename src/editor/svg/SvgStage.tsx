import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { Template, Page } from '../../schema/types'
import { applyLayoutForSize } from '../../layout/layoutEngine'
import { SlotRenderer } from './SlotRenderer'
import { NativeSelectionOverlay } from './NativeSelectionOverlay'
import type { SmartSnapOptions } from '../utils/smartSnapping'

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
      onSelectionChange([])
    }
  }, [onSelectionChange, onRequestPageFocus, page?.id])

  const handleSlotPointerDown = useCallback((slotName: string, event: React.MouseEvent<SVGGElement>) => {
    if (event.button !== 0) return

    event.stopPropagation()
    event.preventDefault()

    pendingDragCleanupRef.current?.()
    suppressBackgroundClickRef.current = true

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
  }, [selectedSlots, onSelectionChange, page?.id, onRequestPageFocus])

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

  return (
    <svg
      ref={internalRef}
      width={width}
      height={height}
      viewBox={`${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}`}
      style={{
        background: '#ffffff',
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
      </g>

      {/* Native SVG Selection Overlay - NOT clipped, always visible */}
      {selectedSlots.length > 0 && internalRef.current && (
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
