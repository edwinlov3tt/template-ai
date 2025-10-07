import React, { useRef } from 'react'
import type { GradientStop } from '../../editor/color/types'

interface GradientStopHandleProps {
  stop: GradientStop
  index: number
  isSelected: boolean
  barWidth: number
  onSelect: (index: number) => void
  onDrag: (index: number, offset: number) => void
}

/**
 * Draggable gradient stop handle
 *
 * Rendered as a circle on the gradient bar.
 * Uses Pointer Events + setPointerCapture for smooth dragging.
 */
export const GradientStopHandle: React.FC<GradientStopHandleProps> = ({
  stop,
  index,
  isSelected,
  barWidth,
  onSelect,
  onDrag
}) => {
  const handleRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{
    isDragging: boolean
    startX: number
    startOffset: number
  } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle left button
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    // Select this stop
    onSelect(index)

    // Initialize drag state
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startOffset: stop.offset
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement
    if (!target.hasPointerCapture(e.pointerId)) return
    if (!dragStateRef.current?.isDragging) return

    const deltaX = e.clientX - dragStateRef.current.startX
    const deltaOffset = deltaX / barWidth

    const newOffset = dragStateRef.current.startOffset + deltaOffset

    // Clamp to 0-1 range
    const clampedOffset = Math.max(0, Math.min(1, newOffset))

    onDrag(index, clampedOffset)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement
    target.releasePointerCapture(e.pointerId)
    dragStateRef.current = null
  }

  // Position on bar (0-100%)
  const leftPercent = stop.offset * 100

  return (
    <div
      ref={handleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: stop.color,
        border: isSelected ? '2px solid #3b82f6' : '2px solid #ffffff',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
          : '0 2px 4px rgba(0, 0, 0, 0.3)',
        cursor: 'grab',
        touchAction: 'none',
        transition: isSelected ? 'none' : 'box-shadow 0.15s ease',
        zIndex: isSelected ? 10 : 5
      }}
      onMouseEnter={(e) => {
        if (!dragStateRef.current?.isDragging && !isSelected) {
          e.currentTarget.style.boxShadow =
            '0 0 0 2px rgba(59, 130, 246, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!dragStateRef.current?.isDragging && !isSelected) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)'
        }
      }}
    />
  )
}
