import React, { useRef } from 'react'
import type { LinearGradientPaint } from '../../editor/color/types'
import { gradientToPoints, vectorToAngle, projectPointOnLine, type BBox, type Point } from '../../editor/color/gradientMath'

interface LinearGradientHandlesProps {
  paint: LinearGradientPaint
  bbox: BBox
  slotId: string
  onUpdateAngle: (angle: number) => void
  onUpdateStopOffset: (index: number, offset: number) => void
  onSelectStop: (index: number) => void
  selectedStopIndex: number
  zoom: number
}

/**
 * On-canvas handles for linear gradient editing
 *
 * Renders:
 * - Line connecting gradient endpoints
 * - Two endpoint handles (draggable to rotate)
 * - Stop handles along line (draggable to adjust offset)
 *
 * Uses Pointer Events + setPointerCapture for reliable dragging
 */
export const LinearGradientHandles: React.FC<LinearGradientHandlesProps> = ({
  paint,
  bbox,
  slotId,
  onUpdateAngle,
  onUpdateStopOffset,
  onSelectStop,
  selectedStopIndex,
  zoom
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragStateRef = useRef<{
    handle: 'start' | 'end' | number // number = stop index
    startPoint: Point
  } | null>(null)

  // Calculate gradient line endpoints
  const { x1, y1, x2, y2 } = gradientToPoints(bbox, paint.angle)
  const startPoint: Point = { x: x1, y: y1 }
  const endPoint: Point = { x: x2, y: y2 }

  // Handle size scales inversely with zoom to stay constant screen size
  const scale = zoom / 100
  const endpointSize = 10 / scale
  const stopSize = 8 / scale
  const lineWidth = 2 / scale

  // Get SVG element for coordinate conversions
  const getSvg = (): SVGSVGElement | null => {
    // Try to get SVG from ref, or find it in DOM
    if (svgRef.current) return svgRef.current

    // Find the parent SVG element
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

  // Handle pointer down on endpoint
  const handleEndpointPointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
    if (e.button !== 0) return

    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget as Element
    target.setPointerCapture(e.pointerId)

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    dragStateRef.current = {
      handle,
      startPoint: svgPoint
    }
  }

  // Handle pointer move during drag
  const handlePointerMove = (e: React.PointerEvent) => {
    const target = e.currentTarget as Element
    if (!target.hasPointerCapture(e.pointerId)) return
    if (!dragStateRef.current) return

    const svgPoint = screenToSvg(e.clientX, e.clientY)
    const { handle } = dragStateRef.current

    if (handle === 'start' || handle === 'end') {
      // Dragging an endpoint - update angle
      const center = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2
      }

      // Calculate new angle based on drag position
      const dx = svgPoint.x - center.x
      const dy = svgPoint.y - center.y
      const newAngle = vectorToAngle(dx, dy)

      onUpdateAngle(newAngle)
    } else if (typeof handle === 'number') {
      // Dragging a stop - update offset
      const projected = projectPointOnLine(svgPoint, startPoint, endPoint)
      onUpdateStopOffset(handle, projected.offset)
    }
  }

  // Handle pointer up (end drag)
  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as Element
    target.releasePointerCapture(e.pointerId)
    dragStateRef.current = null
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
      startPoint: svgPoint
    }
  }

  // Calculate stop positions along the line
  const stopPositions = paint.stops.map((stop) => {
    const x = startPoint.x + (endPoint.x - startPoint.x) * stop.offset
    const y = startPoint.y + (endPoint.y - startPoint.y) * stop.offset
    return { x, y }
  })

  return (
    <g id={`gradient-overlay-${slotId}`}>
      {/* Gradient line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#3b82f6"
        strokeWidth={lineWidth}
        strokeLinecap="round"
        pointerEvents="none"
      />

      {/* Start endpoint handle */}
      <circle
        cx={x1}
        cy={y1}
        r={endpointSize / 2}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={lineWidth}
        cursor="move"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => handleEndpointPointerDown(e, 'start')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* End endpoint handle */}
      <circle
        cx={x2}
        cy={y2}
        r={endpointSize / 2}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={lineWidth}
        cursor="move"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => handleEndpointPointerDown(e, 'end')}
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
