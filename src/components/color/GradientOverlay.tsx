import React, { useEffect } from 'react'
import { useEditorStore } from '../../state/editorStore'
import { LinearGradientHandles } from './LinearGradientHandles'
import { RadialGradientHandles } from './RadialGradientHandles'
import type { BBox } from '../../editor/color/gradientMath'

interface GradientOverlayProps {
  /** Optional: Render inside specific SVG element */
  svgRef?: React.RefObject<SVGSVGElement>
}

/**
 * Gradient overlay coordinator
 *
 * Renders on-canvas gradient handles when a gradient is being edited.
 * Switches between LinearGradientHandles and RadialGradientHandles based on gradient type.
 *
 * Handles keyboard shortcuts:
 * - Delete: Remove selected stop
 * - Escape: Exit gradient editing mode
 */
export const GradientOverlay: React.FC<GradientOverlayProps> = ({ svgRef }) => {
  const editingGradient = useEditorStore((state) => state.editingGradient)
  const template = useEditorStore((state) => state.template)
  const currentPageId = useEditorStore((state) => state.currentPageId)
  const canvasSize = useEditorStore((state) => state.canvasSize)
  const zoom = useEditorStore((state) => state.zoom)

  const updateGradientAngle = useEditorStore((state) => state.updateGradientAngle)
  const updateGradientPosition = useEditorStore((state) => state.updateGradientPosition)
  const updateGradientStop = useEditorStore((state) => state.updateGradientStop)
  const selectGradientStop = useEditorStore((state) => state.selectGradientStop)
  const removeGradientStop = useEditorStore((state) => state.removeGradientStop)
  const stopEditingGradient = useEditorStore((state) => state.stopEditingGradient)

  // If not editing a gradient, don't render anything
  if (!editingGradient || !template || !currentPageId) {
    return null
  }

  const { slotId, paint, selectedStopIndex } = editingGradient

  // Find the current page and slot
  const currentPage = template.pages.find((p) => p.id === currentPageId)
  if (!currentPage) return null

  const slot = currentPage.slots.find((s) => s.name === slotId)
  if (!slot) return null

  // Get frame for this slot
  const frame = currentPage.frames[canvasSize.id]?.[slotId]
  if (!frame) return null

  // Create bbox from frame
  const bbox: BBox = {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key - remove selected stop
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (paint.stops.length > 2) {
          e.preventDefault()
          removeGradientStop(selectedStopIndex)
        }
      }

      // Escape key - exit gradient editing
      if (e.key === 'Escape') {
        e.preventDefault()
        stopEditingGradient()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [paint.stops.length, selectedStopIndex, removeGradientStop, stopEditingGradient])

  // Handle stop offset update
  const handleUpdateStopOffset = (index: number, offset: number) => {
    const stop = paint.stops[index]
    if (!stop) return

    updateGradientStop(index, {
      ...stop,
      offset
    })
  }

  return (
    <>
      {paint.kind === 'linear-gradient' && (
        <LinearGradientHandles
          paint={paint}
          bbox={bbox}
          slotId={slotId}
          onUpdateAngle={updateGradientAngle}
          onUpdateStopOffset={handleUpdateStopOffset}
          onSelectStop={selectGradientStop}
          selectedStopIndex={selectedStopIndex}
          zoom={zoom}
        />
      )}

      {paint.kind === 'radial-gradient' && (
        <RadialGradientHandles
          paint={paint}
          bbox={bbox}
          slotId={slotId}
          onUpdatePosition={updateGradientPosition}
          onUpdateStopOffset={handleUpdateStopOffset}
          onSelectStop={selectGradientStop}
          selectedStopIndex={selectedStopIndex}
          zoom={zoom}
        />
      )}
    </>
  )
}
