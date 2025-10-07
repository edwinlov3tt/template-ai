import React, { useRef } from 'react'
import type { GradientStop, LinearGradientPaint, RadialGradientPaint } from '../../editor/color/types'
import { GradientStopHandle } from './GradientStopHandle'

interface GradientBarProps {
  paint: LinearGradientPaint | RadialGradientPaint
  selectedStopIndex: number
  onSelectStop: (index: number) => void
  onUpdateStop: (index: number, stop: GradientStop) => void
  onAddStop: (offset: number) => void
}

/**
 * Gradient preview bar with draggable stops
 *
 * Displays the gradient horizontally and allows:
 * - Dragging stops to change offset
 * - Clicking bar to add new stop
 * - Selecting stops
 */
export const GradientBar: React.FC<GradientBarProps> = ({
  paint,
  selectedStopIndex,
  onSelectStop,
  onUpdateStop,
  onAddStop
}) => {
  const barRef = useRef<HTMLDivElement>(null)

  // Handle click on bar to add stop
  const handleBarClick = (e: React.MouseEvent) => {
    // Don't add stop if clicked on a handle
    if ((e.target as HTMLElement).closest('.gradient-stop-handle')) {
      return
    }

    if (!barRef.current) return

    const rect = barRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offset = Math.max(0, Math.min(1, offsetX / rect.width))

    onAddStop(offset)
  }

  // Handle stop drag
  const handleStopDrag = (index: number, newOffset: number) => {
    const stop = paint.stops[index]
    onUpdateStop(index, { ...stop, offset: newOffset })
  }

  // Generate CSS gradient string for preview
  const gradientCSS = React.useMemo(() => {
    const stops = paint.stops
      .map((s) => `${s.color} ${s.offset * 100}%`)
      .join(', ')

    if (paint.kind === 'linear-gradient') {
      // Convert angle to CSS gradient angle (0° = top, clockwise)
      // Our angle: 0° = bottom-to-top, so we need to add 180°
      const cssAngle = paint.angle + 180
      return `linear-gradient(${cssAngle}deg, ${stops})`
    } else {
      // Radial gradient
      const cx = paint.cx * 100
      const cy = paint.cy * 100
      const r = paint.radius * 100
      return `radial-gradient(circle at ${cx}% ${cy}%, ${stops})`
    }
  }, [paint])

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#9ca3af',
          marginBottom: '8px'
        }}
      >
        Gradient
      </label>
      <div
        ref={barRef}
        onClick={handleBarClick}
        style={{
          position: 'relative',
          width: '100%',
          height: '40px',
          borderRadius: '8px',
          background: gradientCSS,
          cursor: 'crosshair',
          border: '1px solid #3a3a3a',
          overflow: 'visible' // Allow handles to extend beyond bar
        }}
      >
        {/* Render gradient stop handles */}
        {paint.stops.map((stop, index) => (
          <GradientStopHandle
            key={`${index}-${stop.offset}`}
            stop={stop}
            index={index}
            isSelected={index === selectedStopIndex}
            barWidth={barRef.current?.getBoundingClientRect().width ?? 300}
            onSelect={onSelectStop}
            onDrag={handleStopDrag}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#71717a',
          textAlign: 'center'
        }}
      >
        Click to add stop • Drag to reposition
      </div>
    </div>
  )
}
