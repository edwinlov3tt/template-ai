import React from 'react'
import type { Paint } from '../../editor/color/types'
import { isSolidPaint, isLinearGradientPaint } from '../../editor/color/types'

interface ColorSwatchProps {
  paint: Paint
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  selected?: boolean
  size?: number
  ariaLabel?: string
}

/**
 * Reusable color swatch component
 * Displays solid colors or gradients as circular swatches
 */
export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  paint,
  onClick,
  onContextMenu,
  selected = false,
  size = 32,
  ariaLabel
}) => {
  // Generate background style based on paint type
  const getBackgroundStyle = (): React.CSSProperties => {
    if (isSolidPaint(paint)) {
      return { backgroundColor: paint.color }
    }

    if (isLinearGradientPaint(paint)) {
      const stops = paint.stops
        .map(stop => `${stop.color} ${stop.offset * 100}%`)
        .join(', ')
      return {
        backgroundImage: `linear-gradient(${paint.angle}deg, ${stops})`
      }
    }

    // Radial gradient
    const stops = paint.stops
      .map(stop => `${stop.color} ${stop.offset * 100}%`)
      .join(', ')
    return {
      backgroundImage: `radial-gradient(circle at ${paint.cx * 100}% ${paint.cy * 100}%, ${stops})`
    }
  }

  // Generate accessible label
  const getAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel

    if (isSolidPaint(paint)) {
      return `Solid color ${paint.color}`
    }

    if (isLinearGradientPaint(paint)) {
      return `Linear gradient ${paint.angle}° with ${paint.stops.length} stops`
    }

    return `Radial gradient with ${paint.stops.length} stops`
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      aria-label={getAriaLabel()}
      className="color-swatch"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: selected ? '2px solid #3b82f6' : '2px solid transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        ...getBackgroundStyle()
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = selected ? '#3b82f6' : 'transparent'
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid #60a5fa'
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none'
      }}
    />
  )
}
