import React, { useRef } from 'react'
import type { RadialGradientPaint } from '../../editor/color/types'
import { bboxToAbsolute, absoluteToBbox, distance, type BBox, type Point } from '../../editor/color/gradientMath'

interface RadialGradientHandlesProps {
  paint: RadialGradientPaint
  bbox: BBox
  slotId: string
  onUpdatePosition: (cx: number, cy: number, r: number) => void
  onUpdateStopOffset: (index: number, offset: number) => void
  onSelectStop: (index: number) => void
  selectedStopIndex: number
  zoom: number
}

/**
 * On-canvas handles for radial gradient editing
 *
 * Renders:
 * - Circle showing gradient radius
 * - Center handle (draggable to move gradient)
 * - Radius handle on edge (draggable to change size)
 * - Stop handles along radius (draggable to adjust offset)
 *
 * Uses Pointer Events + setPointerCapture for reliable dragging
 */
export const RadialGradientHandles: React.FC<RadialGradientHandlesProps> = ({
  paint,
  bbox,
  slotId,
  onUpdatePosition,
  onUpdateStopOffset,
  onSelectStop,
  selectedStopIndex,
  zoom
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragStateRef = useRef<{
    handle: 'center' | 'radius' | number // number = stop index
    startPoint: Point
    startCx: number
    startCy: number
    startR: number
  } | null>(null)

  // Convert relative (0-1) to absolute coordinates
  const { cx, cy, r } = bboxToAbsolute(bbox, paint.cx, paint.cy, paint.radius)

  // Handle size scales inversely with zoom to stay constant screen size
  const scale = zoom / 100
  const centerSize = 10 / scale
  const radiusSize = 10 / scale
  const stopSize = 8 / scale
  const lineWidth = 2 / scale

  // Get SVG element for coordinate conversions
  const getSvg = (): SVGSVGElement | null => {
    if (svgRef.current) return svgRef.current
    const element = document.querySelector(`#gradient-overlay-${slotId}`)
    const svg = element?.closest('svg')
    return svg ?? null
  }

  // Convert screen coordinates to SVG user coordinates
  const screenToSvg = (clientX: number, clientY: number): Point => {
    const svg = getSvg()
    if (!svg) return { x: clientX, y: clientY }

    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: clientX, y: clientY }

    const inverseCTM = ctm.inverse()
    const screenPoint = new DOMPoint(clientX, clientY)
    const svgPoint = screenPoint.matrixTransform(inverseCTM)

    return { x: svgPoint.x, y: svgPoint.y }
  }

  // Handle pointer down on center
  const handleCenterPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as Element
    target.setPointerCapture(e.pointerId)

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    dragStateRef.current = {
      handle: 'center',
      startPoint: svgPoint,
      startCx: cx,
      startCy: cy,
      startR: r
    }
  }

  // Handle pointer down on radius handle
  const handleRadiusPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as Element
    target.setPointerCapture(e.pointerId)

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    dragStateRef.current = {
      handle: 'radius',
      startPoint: svgPoint,
      startCx: cx,
      startCy: cy,
      startR: r
    }
  }

  // Handle pointer down on stop
  const handleStopPointerDown = (e: React.PointerEvent, stopIndex: number) => {
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as Element
    target.setPointerCapture(e.pointerId)

    onSelectStop(stopIndex)

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    dragStateRef.current = {
      handle: stopIndex,
      startPoint: svgPoint,
      startCx: cx,
      startCy: cy,
      startR: r
    }
  }

  // Handle pointer move during drag
  const handlePointerMove = (e: React.PointerEvent) => {
    const target = e.currentTarget as Element
    if (!target.hasPointerCapture(e.pointerId)) return
    if (!dragStateRef.current) return

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    const { handle, startPoint, startCx, startCy, startR } = dragStateRef.current

    if (handle === 'center') {
      // Dragging center - update cx, cy
      const dx = svgPoint.x - startPoint.x
      const dy = svgPoint.y - startPoint.y
      const newCx = startCx + dx
      const newCy = startCy + dy

      // Convert to relative coords
      const relative = absoluteToBbox(bbox, newCx, newCy, startR)
      onUpdatePosition(relative.cx, relative.cy, relative.r)
    } else if (handle === 'radius') {
      // Dragging radius handle - update r
      const newR = distance({ x: startCx, y: startCy }, svgPoint)

      // Convert to relative coords
      const relative = absoluteToBbox(bbox, startCx, startCy, newR)
      onUpdatePosition(relative.cx, relative.cy, relative.r)
    } else if (typeof handle === 'number') {
      // Dragging a stop - update offset
      const stopDistance = distance({ x: cx, y: cy }, svgPoint)
      const newOffset = r === 0 ? 0 : Math.max(0, Math.min(1, stopDistance / r))
      onUpdateStopOffset(handle, newOffset)
    }
  }

  // Handle pointer up (end drag)
  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as Element
    target.releasePointerCapture(e.pointerId)
    dragStateRef.current = null
  }

  // Calculate stop positions along the radius (from center to edge at 0°)
  const stopPositions = paint.stops.map((stop) => {
    // Position stops along a horizontal radius for simplicity
    const stopX = cx + r * stop.offset
    const stopY = cy
    return { x: stopX, y: stopY }
  })

  // Radius handle position (on the right edge)
  const radiusHandleX = cx + r
  const radiusHandleY = cy

  return (
    <g id={`gradient-overlay-${slotId}`}>
      {/* Gradient circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={lineWidth}
        strokeDasharray={`${4 / scale} ${4 / scale}`}
        pointerEvents="none"
      />

      {/* Radius line (from center to edge) */}
      <line
        x1={cx}
        y1={cy}
        x2={radiusHandleX}
        y2={radiusHandleY}
        stroke="#3b82f6"
        strokeWidth={lineWidth}
        pointerEvents="none"
      />

      {/* Center handle */}
      <circle
        cx={cx}
        cy={cy}
        r={centerSize / 2}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={lineWidth}
        cursor="move"
        style={{ touchAction: 'none' }}
        onPointerDown={handleCenterPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Radius handle */}
      <circle
        cx={radiusHandleX}
        cy={radiusHandleY}
        r={radiusSize / 2}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={lineWidth}
        cursor="ew-resize"
        style={{ touchAction: 'none' }}
        onPointerDown={handleRadiusPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Stop handles */}
      {stopPositions.map((pos, index) => (
        <circle
          key={`stop-${index}`}
          cx={pos.x}
          cy={pos.y}
          r={stopSize / 2}
          fill={paint.stops[index].color}
          stroke={index === selectedStopIndex ? '#3b82f6' : '#ffffff'}
          strokeWidth={lineWidth * (index === selectedStopIndex ? 1.5 : 1)}
          cursor="move"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => handleStopPointerDown(e, index)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ))}
    </g>
  )
}
